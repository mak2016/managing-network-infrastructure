import { useState } from "react";
import { searchPlaces } from "../lib/nominatim";

export default function SearchBar({ userPosition, onSelectDestination, onClear, hasRoute }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const places = await searchPlaces(query, userPosition);
      setResults(places);
      setOpen(true);
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function pick(place) {
    onSelectDestination(place.center, place.label);
    setQuery(place.label);
    setOpen(false);
  }

  function clear() {
    setQuery("");
    setResults([]);
    setOpen(false);
    onClear();
  }

  return (
    <div className="search-bar">
      <form onSubmit={handleSubmit} className="search-bar__form">
        <input
          type="text"
          placeholder="Search destination, or tap the map…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-bar__input"
        />
        {hasRoute ? (
          <button type="button" onClick={clear} className="search-bar__btn search-bar__btn--clear">
            ✕
          </button>
        ) : (
          <button type="submit" className="search-bar__btn" disabled={loading}>
            {loading ? "…" : "Go"}
          </button>
        )}
      </form>

      {open && results.length > 0 && (
        <ul className="search-bar__results">
          {results.map((r, i) => (
            <li key={i}>
              <button type="button" onClick={() => pick(r)}>
                {r.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
