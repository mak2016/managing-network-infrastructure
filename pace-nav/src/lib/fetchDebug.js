// Wraps window.fetch to record every request the app makes (tile requests
// included) so failures are visible from the phone itself, with no devtools
// needed. This is a temporary diagnostic aid for tracking down why map
// tiles aren't rendering even though MapLibre's own "error" event stays
// silent — it lets us see the actual URL/status/thrown-error for every
// network call MapLibre (and everything else) makes.

const MAX_ENTRIES = 60;
const entries = [];
const listeners = new Set();

function notify() {
  const snapshot = entries.slice();
  for (const fn of listeners) fn(snapshot);
}

export function subscribeFetchLog(fn) {
  listeners.add(fn);
  fn(entries.slice());
  return () => listeners.delete(fn);
}

function record(entry) {
  entries.unshift(entry);
  if (entries.length > MAX_ENTRIES) entries.length = MAX_ENTRIES;
  notify();
}

const originalFetch = window.fetch.bind(window);

window.fetch = async (...args) => {
  const url = typeof args[0] === "string" ? args[0] : args[0]?.url ?? String(args[0]);
  const startedAt = Date.now();
  try {
    const res = await originalFetch(...args);
    record({
      url,
      status: res.status,
      ok: res.ok,
      error: null,
      ms: Date.now() - startedAt,
      time: new Date(startedAt).toLocaleTimeString(),
    });
    return res;
  } catch (err) {
    record({
      url,
      status: null,
      ok: false,
      error: err?.message ?? String(err),
      ms: Date.now() - startedAt,
      time: new Date(startedAt).toLocaleTimeString(),
    });
    throw err;
  }
};
