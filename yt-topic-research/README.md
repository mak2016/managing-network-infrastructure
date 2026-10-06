# YouTube Topic Researcher

This takes the single-video podcast summarizer and makes it **research one topic across many
YouTube videos, in many languages**. It then writes a report that grades the evidence.

One summary only tells you what one person said. When you have a real decision to make, you
need to know more:

- What do most creators **agree** on, and is that agreement based on studies or just opinion?
- Where do they **contradict** each other?
- Which popular claims have **no real evidence** behind them?
- Who is **selling something** related to what they say?
- What do creators in **other countries or languages** say that English YouTube doesn't?

## Just want the simple version?

Open **`topic_researcher_simple.ipynb`** in Colab. It is about 100 lines, written in the same
style as the original summarizer notebook, and uses the same `OPENAI_TOKEN` Colab secret.
Run the cells top to bottom and call `research_topic("your topic")`. The rest of this README
describes the full CLI version (`yt_topic_research.py`).

## How it works

```
topic ──► LLM translates the query ──► yt-dlp search (no API key) ──► transcripts in any language
                                                                            │
     report.md ◄── cross-video synthesis ◄── per-video JSON: claims, evidence type,
     report.json                             strength, timestamp, sponsors, red flags
```

1. **Search.** It searches YouTube for the topic in English and in any extra languages you name.
   The LLM writes each query the way a native speaker would type it.
2. **Transcripts.** It uses human-made captions when a video has them, otherwise auto captions,
   in whatever language exists. Lines are stamped about every 30 seconds.
3. **Extraction (one LLM call per video).** For each video it pulls out the claims. Each claim
   records its evidence type (RCT, observational study, anecdote, …), how strong the evidence is,
   and the timestamp where it was said. It also records the speaker's credentials, advice,
   warnings, sponsors and red flags. Videos that turn out to be off-topic are dropped.
4. **Synthesis.** All the notes are compared in one report: bottom line, agreement,
   disagreement, weakly supported claims, "follow the money", differences between regions,
   and practical takeaways. Every citation links to the exact moment in the video
   (`[V3 @12:05]`).

Results are cached in `.cache/`, so re-running a topic doesn't pay for the same videos again.

## Usage

```bash
pip install -r requirements.txt
export OPENAI_API_KEY=sk-...

# English + German + Spanish + Hindi, 5 videos each
python yt_topic_research.py "creatine for brain health" --languages de es hi

# Add specific videos (for example the podcast from the notebook)
python yt_topic_research.py "creatine for brain health" \
    --url https://www.youtube.com/watch?v=JCTb3QSrGMQ

# Report written in German
python yt_topic_research.py "Kreatin und Gehirn" --out-lang German
```

In Colab:

```python
!pip install -q openai youtube-transcript-api yt-dlp
import os
from google.colab import userdata
os.environ["OPENAI_API_KEY"] = userdata.get("OPENAI_TOKEN")

from yt_topic_research import research
from IPython.display import Markdown
Markdown(research("intermittent fasting for women over 40", languages=["es", "de"]))
```

The output goes to `reports/<topic>.md` (the readable report) and `reports/<topic>.json`
(every extracted claim, so you can load it into a spreadsheet or pandas).

## Problems this can actually help with

| Who | Example topic | Why many videos + many languages helps |
|---|---|---|
| Someone newly diagnosed | `"PCOS diet"`, `"managing type 2 diabetes without insulin"` | Sorts real evidence from influencer folklore and flags supplement sellers. Gives a list of questions to bring to a doctor. |
| Parents | `"speech delay toddler"`, `"screen time effects on kids"` | Doctors, therapists and parents disagree. The report shows where they do and why. |
| Migrants and students | `"Germany Chancenkarte experience"`, `"studying in Canada 2026 costs"` | Videos in the local language (`--languages de`) often have newer, practical details that English videos miss. |
| Farmers and small businesses | `"drip irrigation for small farms"`, `"start a bakery from home"` | Practices that work in India, Brazil or Kenya (`--languages hi pt sw`) are rarely in English videos. |
| Buyers | `"best heat pump cold climate"` | The "follow the money" section separates sponsored reviews from independent ones. |
| Students and journalists | `"microplastics health effects"` | A quick map of claims, with timestamps to check and leads to the original studies. |
| Personal finance | `"index funds vs real estate"` | Separates arguments backed by data from survivorship-bias anecdotes. |

## Tips and limits

- **Use it as a map, not as the truth.** The tool reports what the videos claim and what
  evidence they mention. It does not check the studies themselves. Use the `[V# @time]` links
  and the "Open questions" section to see what to verify. For medical, legal or financial
  topics, confirm with a professional.
- **Speaker separation.** YouTube transcripts don't say who is speaking. In a podcast the host's
  view and the guest's view can blur together. The prompt asks for the speaker's credentials,
  but treat attribution with care.
- **Missing transcripts.** Some videos have captions turned off. The script skips them and tells
  you.
- **Cost.** `gpt-4o-mini` costs about $0.01–0.03 per hour-long video. Set `YT_RESEARCH_MODEL`
  to use a different model.
- **YouTube blocks.** Fetching many transcripts from a cloud IP (including Colab) can get rate
  limited. Lower `--per-query` or run it from your own machine.

## Changes from the original notebook

- `get_video_id` now also handles `youtu.be`, `shorts/` and `embed/` links. The old regex could
  match the wrong 11 characters.
- The old streaming code ran `.replace("markdown", "")`, which deleted the word "markdown" from
  real content. That is gone.
- Transcripts are no longer English-only. Any language works, and the LLM reads the original
  directly, so there is no lossy machine translation.
- Long transcripts are split into chunks instead of overflowing the model's context.
