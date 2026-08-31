import { useEffect, useState } from "react";
import { subscribeFetchLog } from "../lib/fetchDebug";

function shortenUrl(url) {
  try {
    const u = new URL(url);
    return `${u.hostname}${u.pathname}${u.search}`.slice(0, 70);
  } catch {
    return String(url).slice(0, 70);
  }
}

export default function DebugPanel() {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState([]);

  useEffect(() => subscribeFetchLog(setEntries), []);

  return (
    <>
      <button
        type="button"
        className="debug-toggle"
        onClick={() => setOpen((o) => !o)}
        title="Network debug log"
      >
        🐛
      </button>
      {open && (
        <div className="debug-panel">
          <div className="debug-panel__header">
            <span>Network log ({entries.length})</span>
            <button type="button" onClick={() => setOpen(false)}>
              ✕
            </button>
          </div>
          <div className="debug-panel__list">
            {entries.length === 0 && <div className="debug-panel__empty">No requests yet…</div>}
            {entries.map((e, i) => (
              <div key={i} className={`debug-panel__row ${e.ok ? "debug-panel__row--ok" : "debug-panel__row--fail"}`}>
                <div className="debug-panel__row-top">
                  <span className="debug-panel__status">{e.status ?? "ERR"}</span>
                  <span className="debug-panel__time">
                    {e.time} · {e.ms}ms
                  </span>
                </div>
                <div className="debug-panel__url">{shortenUrl(e.url)}</div>
                {e.error && <div className="debug-panel__error">{e.error}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
