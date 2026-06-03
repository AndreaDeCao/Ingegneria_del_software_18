import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { http } from "../../auth/api";

import TrekCardFavorite from "../../components/TrekCardFavorite";
import { SkeletonTrekList } from "../../components/SkeletonLoader";

import type { Trek } from "../../types/Trek";
import styles from "./Treks.module.css";

function parseDuration(duration: string): number {
  const oreMin = duration.match(/(\d+)\s*or[ae]\s*(\d+)\s*min/);
  if (oreMin) return parseInt(oreMin[1]) * 60 + parseInt(oreMin[2]);
  const soloOre = duration.match(/(\d+)\s*or[ae]/);
  if (soloOre) return parseInt(soloOre[1]) * 60;
  const soloMin = duration.match(/(\d+)\s*min/);
  if (soloMin) return parseInt(soloMin[1]);
  return 0;
}

export default function FavoriteTreks() {
  const { user } = useAuth();
  const filtersRef = useRef<HTMLDivElement | null>(null);

  const [treks, setTreks]           = useState<Trek[]>([]);
  const [loadingTreks, setLoadingTreks] = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const [search, setSearch]             = useState("");
  const [difficulty, setDifficulty]     = useState<"" | "Facile" | "Medio" | "Difficile">("");
  const [maxDuration, setMaxDuration]   = useState("");
  const [maxLength, setMaxLength]       = useState("");
  const [maxElevation, setMaxElevation] = useState("");

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortBy, setSortBy]   = useState<"name" | "difficulty" | "lengthKm" | "elevationGain" | "duration">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [sortOpen, setSortOpen] = useState(false);

  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  useEffect(() => {
    if (!user) { setLoadingTreks(false); return; }
    http<Trek[]>("/users/favorites")
      .then((data) => setTreks(data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoadingTreks(false));
  }, [user]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") { setFiltersOpen(false); setSortOpen(false); }
    }
    function handleClickOutside(e: MouseEvent) {
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) {
        setFiltersOpen(false);
        setSortOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function handleSort(criterion: typeof sortBy) {
    if (sortBy === criterion) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(criterion); setSortDir("asc"); }
    setPage(1);
  }

  function clearAllFilters() {
    setDifficulty(""); setMaxLength(""); setMaxElevation(""); setMaxDuration(""); setPage(1);
  }

  const filtered = treks.filter((trek) => {
    if (trek.closed) return false;
    if (search && !trek.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (difficulty && trek.difficulty !== difficulty) return false;
    if (maxLength && trek.lengthKm && trek.lengthKm > Number(maxLength)) return false;
    if (maxElevation && trek.elevationGain && Number(trek.elevationGain) > Number(maxElevation)) return false;
    if (maxDuration && parseDuration(trek.duration) > Number(maxDuration)) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let r = 0;
    if (sortBy === "name") r = a.name.localeCompare(b.name);
    else if (sortBy === "difficulty") {
      const o = { Facile: 1, Medio: 2, Difficile: 3 };
      r = o[a.difficulty] - o[b.difficulty];
    }
    else if (sortBy === "lengthKm") r = (a.lengthKm ?? 0) - (b.lengthKm ?? 0);
    else if (sortBy === "elevationGain") r = Number(a.elevationGain ?? 0) - Number(b.elevationGain ?? 0);
    else if (sortBy === "duration") r = parseDuration(a.duration) - parseDuration(b.duration);
    return sortDir === "asc" ? r : -r;
  });

  const totalPages = Math.ceil(sorted.length / PER_PAGE);
  const paginated  = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const activeTags: { label: string; onRemove: () => void }[] = [
    ...(difficulty   ? [{ label: difficulty,              onRemove: () => setDifficulty("") }]   : []),
    ...(maxLength    ? [{ label: `Max ${maxLength} km`,   onRemove: () => setMaxLength("") }]     : []),
    ...(maxElevation ? [{ label: `Max ${maxElevation} m`, onRemove: () => setMaxElevation("") }]  : []),
    ...(maxDuration  ? [{ label: `Max ${Number(maxDuration) / 60} ore`, onRemove: () => setMaxDuration("") }] : []),
  ];

  return (
    <main className={styles.page}>
      <h2>I miei percorsi</h2>

      <div className={styles.searchRow} ref={filtersRef}>

        {/* Sinistra */}
        <div className={styles.leftGroup}>
          <div className={styles.leftGroupRow}>
            <button
              className={`${styles.filterBtn} ${filtersOpen ? styles.filterBtnActive : ""}`}
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <line x1="4" y1="6" x2="20" y2="6"/>
                <line x1="7" y1="12" x2="17" y2="12"/>
                <line x1="10" y1="18" x2="14" y2="18"/>
              </svg>
              Filtri
              {activeTags.length > 0 && (
                <span className={styles.filterCount}>{activeTags.length}</span>
              )}
            </button>

            <input
              className={styles.searchInput}
              type="text"
              placeholder="Cerca un percorso..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          {/* Pannello filtri */}
          {filtersOpen && (
            <div className={styles.filtersPanel}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Difficoltà</label>
                <div className={styles.filterOptions}>
                  {["", "Facile", "Medio", "Difficile"].map((d) => (
                    <button
                      key={d}
                      className={`${styles.filterOption} ${
                        difficulty === d
                          ? d === ""         ? styles.filterOptionAll
                          : d === "Facile"   ? styles.filterOptionEasy
                          : d === "Medio"    ? styles.filterOptionMedium
                          : styles.filterOptionHard
                          : ""
                      }`}
                      onClick={() => { setDifficulty(d as typeof difficulty); setPage(1); }}
                    >
                      {d === "" ? "Tutte" : d}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>
                  Max km {maxLength && <span className={styles.sliderValue}>{maxLength} km</span>}
                </label>
                <input className={styles.slider} type="range" min={0} max={25} step={1}
                  value={maxLength || 25}
                  onChange={(e) => { setMaxLength(e.target.value === "0" ? "" : e.target.value); setPage(1); }}
                />
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>
                  Max dislivello {maxElevation && <span className={styles.sliderValue}>{maxElevation} m</span>}
                </label>
                <input className={styles.slider} type="range" min={0} max={3000} step={50}
                  value={maxElevation || 3000}
                  onChange={(e) => { setMaxElevation(e.target.value === "0" ? "" : e.target.value); setPage(1); }}
                />
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>
                  Max durata {maxDuration && <span className={styles.sliderValue}>{Number(maxDuration) / 60} ore</span>}
                </label>
                <input className={styles.slider} type="range" min={60} max={600} step={60}
                  value={maxDuration || 600}
                  onChange={(e) => { setMaxDuration(e.target.value); setPage(1); }}
                />
              </div>
            </div>
          )}

          {/* Tag filtri attivi */}
          {activeTags.length > 0 && (
            <div className={styles.activeTags}>
              {activeTags.map((tag) => (
                <button key={tag.label} className={styles.activeTag} onClick={tag.onRemove}>
                  {tag.label} ✕
                </button>
              ))}
              <button className={styles.clearAll} onClick={clearAllFilters}>
                Rimuovi tutti ✕
              </button>
            </div>
          )}
        </div>

        {/* Destra: ordina */}
        <div className={styles.rightGroup}>
          <button
            className={`${styles.filterBtn} ${sortOpen ? styles.filterBtnActive : ""}`}
            onClick={() => setSortOpen(!sortOpen)}
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <line x1="4" y1="6" x2="20" y2="6"/>
              <line x1="16" y1="12" x2="20" y2="12"/>
              <line x1="4" y1="12" x2="10" y2="12"/>
              <line x1="4" y1="18" x2="20" y2="18"/>
            </svg>
            Ordina
          </button>

          {sortOpen && (
            <div className={styles.sortPanel}>
              {([
                { key: "name",          label: "Nome" },
                { key: "difficulty",    label: "Difficoltà" },
                { key: "lengthKm",      label: "Lunghezza" },
                { key: "elevationGain", label: "Dislivello" },
                { key: "duration",      label: "Durata" },
              ] as { key: typeof sortBy; label: string }[]).map(({ key, label }) => (
                <button
                  key={key}
                  className={`${styles.sortOption} ${sortBy === key ? styles.sortOptionActive : ""}`}
                  onClick={() => { handleSort(key); setSortOpen(false); }}
                >
                  {label} {sortBy === key ? (sortDir === "asc" ? "↑" : "↓") : ""}
                </button>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Risultati */}
      <div className={styles.results}>
        {loadingTreks ? (
          <SkeletonTrekList count={7} />
        ) : error ? (
          <p className={styles.messageError}>Impossibile caricare i percorsi: {error}</p>
        ) : (
          <>
            <p className={styles.count}>{filtered.length} percorsi trovati</p>
            {filtered.length === 0 ? (
              <p className={styles.message}>Nessun percorso trovato</p>
            ) : (
              paginated.map((trek) => (
                <TrekCardFavorite
                  key={trek.id}
                  trek={trek}
                  onRemove={(trekId) => setTreks((prev) => prev.filter((t) => t.id !== trekId))}
                />
              ))
            )}
          </>
        )}
      </div>

      {/* Paginazione */}
      {!loadingTreks && !error && totalPages > 1 && (
        <div className={styles.pagination}>
          <button className={styles.pageBtn} onClick={() => { setPage((p) => p - 1); window.scrollTo(0, 0); }} disabled={page === 1}>←</button>
          <span className={styles.pageInfo}>{page} / {totalPages}</span>
          <button className={styles.pageBtn} onClick={() => { setPage((p) => p + 1); window.scrollTo(0, 0); }} disabled={page === totalPages}>→</button>
        </div>
      )}
    </main>
  );
}
