"""
YouTube Topic Researcher
========================

Builds on the single-video podcast summarizer: instead of summarizing ONE
video, it researches a TOPIC across MANY videos (and many languages) and
produces an evidence-graded report:

  1. Search YouTube for the topic (optionally in several languages).
  2. Pull each video's transcript in whatever language it exists.
  3. Ask an LLM to extract every claim with its evidence type, evidence
     strength, timestamp and the creator's commercial interests (sponsors,
     products they sell).
  4. Cross-compare all videos: where creators agree, where they contradict
     each other, which popular claims have no real evidence, and what
     different language communities say.

Usage (CLI):
    export OPENAI_API_KEY=sk-...
    python yt_topic_research.py "creatine for brain health" \
        --languages de es hi --per-query 5

Usage (Colab / notebook):
    from yt_topic_research import research
    report = research("creatine for brain health", languages=["de", "es"])
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from pathlib import Path

from openai import OpenAI
from youtube_transcript_api import YouTubeTranscriptApi

MODEL = os.environ.get("YT_RESEARCH_MODEL", "gpt-4o-mini")
CACHE_DIR = Path(os.environ.get("YT_RESEARCH_CACHE", ".cache/yt-research"))
# gpt-4o-mini has a 128k-token context; ~4 chars/token leaves room for the prompt.
CHUNK_CHARS = 120_000
MIN_RELEVANCE = 4  # 0-10; videos the LLM scores below this are dropped

_client: OpenAI | None = None


def client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI()  # reads OPENAI_API_KEY
    return _client


# --------------------------------------------------------------------------
# 1. Finding videos
# --------------------------------------------------------------------------

@dataclass
class Video:
    id: str
    title: str
    channel: str = ""
    duration: int | None = None  # seconds
    query: str = ""
    language: str = ""            # transcript language actually used
    transcript: str = ""
    extraction: dict = field(default_factory=dict)

    @property
    def url(self) -> str:
        return f"https://www.youtube.com/watch?v={self.id}"

    def link_at(self, seconds: int | None) -> str:
        return f"{self.url}&t={int(seconds)}s" if seconds else self.url


def get_video_id(url: str) -> str:
    """Extracts the 11-char video ID from watch, youtu.be, shorts and embed URLs."""
    if re.fullmatch(r"[0-9A-Za-z_-]{11}", url):
        return url
    match = re.search(r"(?:v=|youtu\.be/|shorts/|embed/|live/)([0-9A-Za-z_-]{11})", url)
    if match:
        return match.group(1)
    raise ValueError(f"Invalid YouTube URL: {url}")


def translate_query(topic: str, languages: list[str]) -> dict[str, str]:
    """Ask the LLM how people would actually search for this topic in each language."""
    if not languages:
        return {}
    resp = client().chat.completions.create(
        model=MODEL,
        response_format={"type": "json_object"},
        messages=[{
            "role": "user",
            "content": (
                "Translate this YouTube search query into the natural phrasing a native "
                "speaker would type for each language code. Return JSON "
                '{"<code>": "<query>"}.\n'
                f"Query: {topic}\nLanguages: {', '.join(languages)}"
            ),
        }],
    )
    return json.loads(resp.choices[0].message.content)


def search_videos(query: str, limit: int = 5, min_minutes: int = 4,
                  max_minutes: int = 240) -> list[Video]:
    """Search YouTube without an API key (uses yt-dlp's ytsearch)."""
    import yt_dlp

    opts = {"quiet": True, "extract_flat": True, "skip_download": True}
    # Over-fetch so we still have `limit` results after dropping Shorts / 10h streams.
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(f"ytsearch{limit * 3}:{query}", download=False)

    videos = []
    for e in info.get("entries") or []:
        dur = e.get("duration")
        if dur and not (min_minutes * 60 <= dur <= max_minutes * 60):
            continue
        videos.append(Video(id=e["id"], title=e.get("title", ""),
                            channel=e.get("channel") or e.get("uploader") or "",
                            duration=dur, query=query))
        if len(videos) >= limit:
            break
    return videos


def _video_meta(video_id: str) -> tuple[str, str]:
    """Title and channel for a manually supplied URL (best effort)."""
    try:
        import yt_dlp
        with yt_dlp.YoutubeDL({"quiet": True, "skip_download": True}) as ydl:
            info = ydl.extract_info(video_id, download=False, process=False)
        return info.get("title") or video_id, info.get("channel") or ""
    except Exception:
        return video_id, ""


# --------------------------------------------------------------------------
# 2. Transcripts (any language)
# --------------------------------------------------------------------------

_ytt = YouTubeTranscriptApi()


def get_transcript(video_id: str, preferred: list[str] | None = None) -> tuple[str, str]:
    """
    Returns (language_code, transcript_with_timestamps).

    Picks a preferred language if available, otherwise prefers human-made
    captions over auto-generated ones, in any language. The LLM reads the
    original language directly, so no lossy machine translation is needed.
    Each line is prefixed with [seconds] so claims can be linked to the moment
    they were said.
    """
    tlist = _ytt.list(video_id)
    transcripts = list(tlist)
    if not transcripts:
        raise RuntimeError("no transcripts")

    chosen = None
    if preferred:
        try:
            chosen = tlist.find_transcript(preferred)
        except Exception:
            pass
    if chosen is None:
        chosen = sorted(transcripts, key=lambda t: t.is_generated)[0]

    fetched = chosen.fetch()
    lines, bucket, bucket_start = [], [], None
    for s in fetched.snippets:
        if bucket_start is None:
            bucket_start = int(s.start)
        bucket.append(s.text.replace("\n", " "))
        # one timestamp roughly every 30s keeps tokens down but stays linkable
        if s.start - bucket_start >= 30:
            lines.append(f"[{bucket_start}] " + " ".join(bucket))
            bucket, bucket_start = [], None
    if bucket:
        lines.append(f"[{bucket_start}] " + " ".join(bucket))
    return chosen.language_code, "\n".join(lines)


# --------------------------------------------------------------------------
# 3. Per-video extraction
# --------------------------------------------------------------------------

EXTRACT_PROMPT = """You are a careful research analyst. You receive a transcript (any language)
of a YouTube video, plus the research TOPIC. Each transcript line starts with [seconds].

Extract information relevant to the TOPIC only. Ignore ads, sponsor reads and small talk,
but DO record who the sponsors are and any product the speaker sells or promotes.

Return JSON in English, exactly this shape:
{
  "relevance": 0-10,                       // how much of the video is about the TOPIC
  "speaker": "who is speaking and their stated credentials, or 'unknown'",
  "video_type": "podcast | lecture | explainer | personal story | product review | news | other",
  "claims": [
    {
      "claim": "one-sentence factual claim, paraphrased neutrally",
      "evidence_type": "RCT/meta-analysis | observational study | mechanism/animal study | expert opinion | anecdote | none",
      "evidence_detail": "the specific study/statistic/source mentioned, or ''",
      "strength": "strong | moderate | weak | none",
      "timestamp": seconds_as_integer_or_null
    }
  ],
  "advice": ["concrete actionable recommendations given, with dose/amount/frequency if stated"],
  "warnings": ["risks, side effects, who should NOT do this"],
  "commercial_interests": ["sponsors, own products, affiliate links, or [] if none"],
  "red_flags": ["miracle cures, misquoted studies, absolute certainty, fear-selling, etc."]
}

Rate "strength" by what the speaker actually cites, not by whether you personally agree.
If a claim is a number or a study, keep the number exactly as stated."""


def _cache_path(kind: str, key: str) -> Path:
    return CACHE_DIR / kind / (hashlib.sha1(key.encode()).hexdigest()[:16] + ".json")


def _cached(kind: str, key: str, fn):
    path = _cache_path(kind, key)
    if path.exists():
        return json.loads(path.read_text())
    value = fn()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False))
    return value


def _merge(parts: list[dict]) -> dict:
    if len(parts) == 1:
        return parts[0]
    merged = dict(parts[0])
    merged["relevance"] = max(p.get("relevance", 0) for p in parts)
    for key in ("claims", "advice", "warnings", "commercial_interests", "red_flags"):
        merged[key] = [x for p in parts for x in p.get(key, [])]
    return merged


def extract_video(video: Video, topic: str) -> dict:
    def run():
        chunks = [video.transcript[i:i + CHUNK_CHARS]
                  for i in range(0, len(video.transcript), CHUNK_CHARS)]
        parts = []
        for n, chunk in enumerate(chunks, 1):
            resp = client().chat.completions.create(
                model=MODEL,
                temperature=0,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": EXTRACT_PROMPT},
                    {"role": "user", "content":
                        f"TOPIC: {topic}\nVIDEO TITLE: {video.title}\nCHANNEL: {video.channel}\n"
                        f"PART {n}/{len(chunks)}\n\nTRANSCRIPT:\n{chunk}"},
                ],
            )
            parts.append(json.loads(resp.choices[0].message.content))
        return _merge(parts)

    return _cached("extract", f"{MODEL}|{topic}|{video.id}", run)


# --------------------------------------------------------------------------
# 4. Cross-video synthesis
# --------------------------------------------------------------------------

SYNTH_PROMPT = """You are writing an evidence briefing for someone trying to make a real decision
about a TOPIC. You receive structured notes extracted from many YouTube videos, possibly from
different countries and languages. Each video has an id like V3.

Write a Markdown report in {out_lang} with these sections:

## Bottom line
3-5 sentences a non-expert can act on. Be honest about uncertainty.

## Where creators agree
Claims made independently by several videos. For each: the claim, how many videos / which
languages, the BEST evidence anyone cited, and citations like [V3 @12:05]. Say clearly when
"consensus" rests only on opinion or anecdote.

## Where they disagree
Contradicting claims side by side, with who says what and the evidence each side offers.
Suggest what would settle it.

## Popular but poorly supported
Claims repeated with weak or no evidence, plus red flags spotted.

## Follow the money
Sponsors / products promoted, and whether those creators' claims lean toward what they sell.

## Different regions, different perspectives
Only if non-{out_lang} or multi-language sources exist: what each language community emphasizes
that others don't (e.g. regulations, foods, cultural practices, cost).

## Practical takeaways
Concrete advice that is well supported, including warnings and who should be careful.
For health, legal or financial topics, say what to confirm with a qualified professional.

## Open questions
What none of the videos answered well.

Rules: cite every factual line with [V#] or [V# @mm:ss]. Never invent studies or numbers not
present in the notes. Prefer claims with stronger evidence. Be concise."""


def _fmt_ts(seconds) -> str:
    if seconds is None:
        return ""
    seconds = int(seconds)
    h, rem = divmod(seconds, 3600)
    m, s = divmod(rem, 60)
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m}:{s:02d}"


def synthesize(topic: str, videos: list[Video], out_lang: str = "English") -> str:
    notes = []
    for i, v in enumerate(videos, 1):
        e = v.extraction
        notes.append({
            "id": f"V{i}", "title": v.title, "channel": v.channel,
            "transcript_language": v.language, "speaker": e.get("speaker"),
            "video_type": e.get("video_type"),
            "claims": [{**c, "timestamp": _fmt_ts(c.get("timestamp"))}
                       for c in e.get("claims", [])],
            "advice": e.get("advice", []), "warnings": e.get("warnings", []),
            "commercial_interests": e.get("commercial_interests", []),
            "red_flags": e.get("red_flags", []),
        })
    resp = client().chat.completions.create(
        model=MODEL,
        temperature=0.2,
        messages=[
            {"role": "system", "content": SYNTH_PROMPT.format(out_lang=out_lang)},
            {"role": "user", "content":
                f"TOPIC: {topic}\n\nNOTES:\n{json.dumps(notes, ensure_ascii=False)}"},
        ],
    )
    return resp.choices[0].message.content


def _linkify(report: str, videos: list[Video]) -> str:
    """Turn [V3 @12:05] / [V3] citations into clickable timestamped links."""
    def repl(m):
        idx = int(m.group(1)) - 1
        if not 0 <= idx < len(videos):
            return m.group(0)
        secs = None
        if m.group(2):
            parts = [int(p) for p in m.group(2).split(":")]
            secs = sum(p * 60 ** i for i, p in enumerate(reversed(parts)))
        return f"[{m.group(0)[1:-1]}]({videos[idx].link_at(secs)})"
    return re.sub(r"\[V(\d+)(?:\s*@\s*([\d:]+))?\]", repl, report)


def _sources_table(videos: list[Video]) -> str:
    rows = ["| # | Video | Channel | Lang | Evidence mix | Sponsors / products |",
            "|---|---|---|---|---|---|"]
    for i, v in enumerate(videos, 1):
        claims = v.extraction.get("claims", [])
        counts = {s: sum(c.get("strength") == s for c in claims)
                  for s in ("strong", "moderate", "weak", "none")}
        mix = " / ".join(f"{n} {s}" for s, n in counts.items() if n) or "-"
        money = "; ".join(v.extraction.get("commercial_interests", [])) or "-"
        title = v.title.replace("|", "/")
        rows.append(f"| V{i} | [{title}]({v.url}) | {v.channel} | {v.language} | {mix} | {money} |")
    return "\n".join(rows)


# --------------------------------------------------------------------------
# Pipeline
# --------------------------------------------------------------------------

def _log(msg: str):
    print(msg, file=sys.stderr, flush=True)


def research(topic: str, languages: list[str] | None = None, per_query: int = 5,
             urls: list[str] | None = None, out_lang: str = "English",
             out_dir: str | Path = "reports", workers: int = 4) -> str:
    """
    Research `topic` across YouTube and return a Markdown report (also saved to out_dir).

    languages: extra language codes to search in, e.g. ["de", "es", "hi", "ar"].
    urls:      specific videos to include (searched videos are added on top
               unless per_query=0).
    """
    videos: dict[str, Video] = {}

    for url in urls or []:
        vid = get_video_id(url)
        videos[vid] = Video(id=vid, title=vid, query="(manual)")

    if per_query:
        queries = {"en": topic, **translate_query(topic, languages or [])}
        for lang, q in queries.items():
            _log(f"Searching [{lang}] {q!r}")
            try:
                for v in search_videos(q, per_query):
                    videos.setdefault(v.id, v)
            except Exception as exc:
                _log(f"  search failed: {exc}")

    def load(v: Video) -> Video | None:
        if v.query == "(manual)":
            v.title, v.channel = _video_meta(v.id)
        try:
            v.language, v.transcript = get_transcript(v.id)
        except Exception as exc:
            _log(f"  skip {v.id} ({v.title[:50]}): no transcript ({type(exc).__name__})")
            return None
        v.extraction = extract_video(v, topic)
        _log(f"  done {v.id} [{v.language}] relevance={v.extraction.get('relevance')} "
             f"claims={len(v.extraction.get('claims', []))}  {v.title[:60]}")
        return v

    _log(f"Analyzing {len(videos)} videos...")
    with ThreadPoolExecutor(max_workers=workers) as pool:
        analyzed = [v for v in pool.map(load, videos.values()) if v]

    relevant = [v for v in analyzed if (v.extraction.get("relevance") or 0) >= MIN_RELEVANCE]
    if not relevant:
        raise RuntimeError("No relevant videos with transcripts found. Try other queries or URLs.")
    relevant.sort(key=lambda v: -(v.extraction.get("relevance") or 0))

    _log(f"Synthesizing across {len(relevant)} relevant videos...")
    body = _linkify(synthesize(topic, relevant, out_lang), relevant)
    report = f"# Topic research: {topic}\n\n{body}\n\n## Sources\n\n{_sources_table(relevant)}\n"

    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    slug = re.sub(r"[^\w]+", "-", topic.lower()).strip("-")[:60] or "report"
    (out / f"{slug}.md").write_text(report)
    (out / f"{slug}.json").write_text(json.dumps(
        [{"id": v.id, "url": v.url, "title": v.title, "channel": v.channel,
          "language": v.language, **v.extraction} for v in relevant],
        ensure_ascii=False, indent=2))
    _log(f"Saved {out / (slug + '.md')} and raw claims to {slug}.json")
    return report


def main():
    p = argparse.ArgumentParser(description="Research a topic across many YouTube videos.")
    p.add_argument("topic", help='e.g. "intermittent fasting for women over 40"')
    p.add_argument("--languages", nargs="*", default=[],
                   help="extra languages to search in, e.g. de es hi ar ja")
    p.add_argument("--per-query", type=int, default=5, help="videos per language (0 = only --url)")
    p.add_argument("--url", action="append", default=[], help="include a specific video (repeatable)")
    p.add_argument("--out-lang", default="English", help="language of the final report")
    p.add_argument("--out-dir", default="reports")
    args = p.parse_args()
    print(research(args.topic, args.languages, args.per_query, args.url,
                   args.out_lang, args.out_dir))


if __name__ == "__main__":
    main()
