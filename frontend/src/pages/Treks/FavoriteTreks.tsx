import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { http } from "../../auth/api";
import TrekCardFavorite from "../../components/TrekCardFavorite";
import type { Trek } from "../../types/Trek";
import styles from "./Treks.module.css";
import appStyles from "../../App.module.css";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

/**
 * Converte stringa durata nel formato "X ore Y min" in minuti totali.
 */
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

  /** Trek preferiti */
  const [treks, setTreks] = useState<Trek[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Ricerca */
  const [search, setSearch] = useState("");

  /** Filtri */
  const [difficulty, setDifficulty] = useState<
    "" | "Facile" | "Medio" | "Difficile"
  >("");

  const [maxDuration, setMaxDuration] = useState("");
  const [maxLength, setMaxLength] = useState("");
  const [maxElevation, setMaxElevation] = useState("");

  /** UI */
  const [filtersOpen, setFiltersOpen] = useState(false);

  /** Ordinamento */
  const [sortBy, setSortBy] = useState<
    "name" | "difficulty" | "lengthKm" | "elevationGain" | "duration"
  >("name");

  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [sortOpen, setSortOpen] = useState(false);

  

  /** Paginazione */
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    http<Trek[]>("/users/favorites")
      .then((data) => {
        setTreks(data);
      })
      .catch((err: Error) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
    }, [user]);

  //premere su esc o cluck su punto casuale pagina
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setFiltersOpen(false);
        setSortOpen(false);
      }
    }

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;

      if (
        filtersRef.current &&
        !filtersRef.current.contains(target)
      ) {
        setFiltersOpen(false);
        setSortOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );

      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);
  /**
   * Cambia ordinamento
   */
  function handleSort(criterion: typeof sortBy) {
    if (sortBy === criterion) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(criterion);
      setSortDir("asc");
    }

    setPage(1);
  }

  function clearAllFilters() {
    setDifficulty("");
    setMaxLength("");
    setMaxElevation("");
    setMaxDuration("");
    setPage(1);
  }

  /**
   * Filtri
   */
  const filtered = treks.filter((trek) => {
    if (
      search &&
      !trek.name.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }

    if (difficulty && trek.difficulty !== difficulty) {
      return false;
    }

    if (
      maxLength &&
      trek.lengthKm &&
      trek.lengthKm > Number(maxLength)
    ) {
      return false;
    }

    if (
      maxElevation &&
      trek.elevationGain &&
      Number(trek.elevationGain) > Number(maxElevation)
    ) {
      return false;
    }

    if (
      maxDuration &&
      parseDuration(trek.duration) > Number(maxDuration)
    ) {
      return false;
    }

    return true;
  });

  /**
   * Ordinamento
   */
  const sorted = [...filtered].sort((a, b) => {
    let result = 0;

    if (sortBy === "name") {
      result = a.name.localeCompare(b.name);
    }

    else if (sortBy === "difficulty") {
      const order = {
        Facile: 1,
        Medio: 2,
        Difficile: 3,
      };

      result = order[a.difficulty] - order[b.difficulty];
    }

    else if (sortBy === "lengthKm") {
      result = (a.lengthKm ?? 0) - (b.lengthKm ?? 0);
    }

    else if (sortBy === "elevationGain") {
      result =
        Number(a.elevationGain ?? 0) -
        Number(b.elevationGain ?? 0);
    }

    else if (sortBy === "duration") {
      result =
        parseDuration(a.duration) -
        parseDuration(b.duration);
    }

    return sortDir === "asc" ? result : -result;
  });

  /** Paginazione */
  const totalPages = Math.ceil(sorted.length / PER_PAGE);

  const paginated = sorted.slice(
    (page - 1) * PER_PAGE,
    page * PER_PAGE
  );

  /**
   * Tag filtri attivi
   */
  const activeTags: {
    label: string;
    onRemove: () => void;
  }[] = [
    ...(difficulty
      ? [
          {
            label: difficulty,
            onRemove: () => setDifficulty(""),
          },
        ]
      : []),

    ...(maxLength
      ? [
          {
            label: `Max ${maxLength} km`,
            onRemove: () => setMaxLength(""),
          },
        ]
      : []),

    ...(maxElevation
      ? [
          {
            label: `Max ${maxElevation} m`,
            onRemove: () => setMaxElevation(""),
          },
        ]
      : []),

    ...(maxDuration
      ? [
          {
            label: `Max ${Number(maxDuration) / 60} ore`,
            onRemove: () => setMaxDuration(""),
          },
        ]
      : []),
  ];

  return (
    <main className={styles.page}>
      <h2>I miei percorsi</h2>

      <div className={styles.searchRow} ref={filtersRef}>
        {/* SINISTRA */}
        <div className={styles.leftGroup}>
          <div className={styles.leftGroupRow}>
            <button
              className={`${styles.filterBtn} ${
                filtersOpen ? styles.filterBtnActive : ""
              }`}
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              Filtri

              {activeTags.length > 0 && (
                <span className={styles.filterCount}>
                  {activeTags.length}
                </span>
              )}
            </button>

            <input
              className={styles.searchInput}
              type="text"
              placeholder="Cerca un percorso..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* PANNELLO FILTRI */}
          {filtersOpen && (
            <div className={styles.filtersPanel}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>
                  Difficoltà
                </label>

                <div className={styles.filterOptions}>
                  {["", "Facile", "Medio", "Difficile"].map((d) => (
                    <button
                      key={d}
                      className={`${styles.filterOption} ${
                        difficulty === d
                          ? d === ""
                            ? styles.filterOptionAll
                            : d === "Facile"
                            ? styles.filterOptionEasy
                            : d === "Medio"
                            ? styles.filterOptionMedium
                            : styles.filterOptionHard
                          : ""
                      }`}
                      onClick={() => {
                        setDifficulty(d as typeof difficulty);
                        setPage(1);
                      }}
                    >
                      {d === "" ? "Tutte" : d}
                    </button>
                  ))}
                </div>
              </div>

              {/* KM */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>
                  Max km
                </label>

                <input
                  className={styles.slider}
                  type="range"
                  min={0}
                  max={25}
                  step={1}
                  value={maxLength || 25}
                  onChange={(e) => {
                    setMaxLength(
                      e.target.value === "0"
                        ? ""
                        : e.target.value
                    );

                    setPage(1);
                  }}
                />
              </div>

              {/* DISLIVELLO */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>
                  Max dislivello
                </label>

                <input
                  className={styles.slider}
                  type="range"
                  min={0}
                  max={3000}
                  step={50}
                  value={maxElevation || 3000}
                  onChange={(e) => {
                    setMaxElevation(
                      e.target.value === "0"
                        ? ""
                        : e.target.value
                    );

                    setPage(1);
                  }}
                />
              </div>

              {/* DURATA */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>
                  Max durata
                </label>

                <input
                  className={styles.slider}
                  type="range"
                  min={60}
                  max={600}
                  step={60}
                  value={maxDuration || 600}
                  onChange={(e) => {
                    setMaxDuration(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>
          )}
          
          {/* TAG ATTIVI */}
          {activeTags.length > 0 && (
            <div className={styles.activeTags}>
              {activeTags.map((tag) => (
                <button
                  key={tag.label}
                  className={styles.activeTag}
                  onClick={tag.onRemove}
                >
                  {tag.label} ✕
                </button>
              ))}
              
              <button className={styles.clearAll} onClick={clearAllFilters}>
                Rimuovi tutti ✕
              </button>
            </div>
          )}
        </div>

        {/* DESTRA */}
        <div className={styles.rightGroup}>
          <button
            className={`${styles.filterBtn} ${
              sortOpen ? styles.filterBtnActive : ""
            }`}
            onClick={() => setSortOpen(!sortOpen)}
          >
            Ordina per
          </button>

          {sortOpen && (
            <div className={styles.sortPanel}>
              {([
                { key: "name", label: "Nome" },
                { key: "difficulty", label: "Difficoltà" },
                { key: "lengthKm", label: "Lunghezza" },
                { key: "elevationGain", label: "Dislivello", },
                { key: "duration", label: "Durata" },
              ] as { key: typeof sortBy; label: string; }[]).map(({ key, label }) => (
                <button
                  key={key}
                  className={`${styles.sortOption} ${
                    sortBy === key
                      ? styles.sortOptionActive
                      : ""
                  }`}
                  onClick={() => {
                    handleSort(key);
                    setSortOpen(false);
                  }}
                >
                  {label} {sortBy === key ? (sortDir === "asc" ? "↑" : "↓") : ""}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>



      {/* RISULTATI */}
      <div className={styles.results}>
        {loading && (
          <p className={styles.message}>
            Caricamento percorsi...
          </p>
        )}

        {error && (
          <p className={styles.messageError}>
            {error}
          </p>
        )}

        {!loading && !error && (
          <p className={styles.count}>
            {filtered.length} Percorsi salvati
          </p>
        )}

        {!loading &&
          !error &&
          filtered.length === 0 && (
            <p className={styles.message}>
              Nessun percorso salvato
            </p>
          )}

        {!loading &&
          !error &&
          paginated.map((trek) => (
            <TrekCardFavorite
              key={trek.id}
              trek={trek}
              onRemove={(trekId) => {
                setTreks((prev) =>
                  prev.filter((t) => t.id !== trekId)
                );
              }}
            />
          ))}
      </div>

      {/* PAGINAZIONE */}
      {!loading &&
        !error &&
        totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              className={styles.pageBtn}
              onClick={() => {
                setPage((p) => p - 1);
                window.scrollTo(0, 0);
              }}
              disabled={page === 1}
            >
              ←
            </button>

            <span className={styles.pageInfo}>
              {page} / {totalPages}
            </span>

            <button
              className={styles.pageBtn}
              onClick={() => {
                setPage((p) => p + 1);
                window.scrollTo(0, 0);
              }}
              disabled={page === totalPages}
            >
              →
            </button>
          </div>
        )}
    </main>
  );
}