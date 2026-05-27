import { useEffect, useRef, useState } from "react";
import TrekCardEsplora from "../../components/TrekCardEsplora";
import type { Trek } from "../../types/Trek";
import styles from "./Treks.module.css";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

/**
 * Converte stringa durata nel formato "X ore Y min" in minuti totali.
 * @param {string} duration - Stringa durata es. "2 ore 30 min"
 * @returns {number} Durata totale in minuti
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

function parseElevation(elevation?: string): number {
  if (!elevation) return 0;

  const cleaned = elevation.replace(/[^\d]/g, "");
  return Number(cleaned) || 0;
}

/**
 * Pagina Esplora — mostra tutti i percorsi con barra di ricerca e filtri.
 * I filtri vengono applicati lato frontend sui dati già scaricati dal backend.
 * 
 * @returns {JSX.Element} Pagina con lista percorsi, ricerca e filtri
 */
export default function Treks() {
  /** Elenco completo percorsi (backend) */
  const filtersRef = useRef<HTMLDivElement | null>(null);

  const [treks, setTreks] = useState<Trek[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Testo nella barra di ricerca */
  const [search, setSearch] = useState("");
  /** Difficoltà selezionata */
  const [difficulty, setDifficulty] = useState<"" | "Facile" | "Medio" | "Difficile">("");
  /** Limite max durata */
  const [maxDuration, setMaxDuration] = useState("");
  /** Limite max lunghgezza */
  const [maxLength, setMaxLength] = useState("");
  /** Limite max dislivello */
  const [maxElevation, setMaxElevation] = useState("");

  /** Pannello filtri aperto/chiuso */
  const [filtersOpen, setFiltersOpen] = useState(false);

  /** Ordina risultati + direzione ordinamento*/
  const [sortBy, setSortBy] = useState<"name" | "difficulty" | "lengthKm" | "elevationGain" | "duration">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [sortOpen, setSortOpen] = useState(false);

  /** Pagina corrente */
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  useEffect(() => {
    fetch(`${API_BASE}/treks`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Errore percorsi: " + res.status);
        return res.json();
      })
      .then((data) => setTreks(data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

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
 * Cambia criterio di ordinamento o inverte la direzione se già selezionato.
 * @param {string} criterion - Criterio di ordinamento selezionato
 */
function handleSort(criterion: typeof sortBy) {
  if (sortBy == criterion) {
    setSortDir(d => d === "asc" ? "desc" : "asc");
  } else {
    setSortBy(criterion);
    setSortDir("asc");
  }
  setPage(1);
}


  /**
 * Filtra i percorsi in base ai filtri attivi.
 * @param {Trek} trek - Il percorso da valutare
 * @returns {boolean} true se il percorso soddisfa tutti i filtri attivi
 */
  const filtered = treks.filter((trek) => {
    if(search && !trek.name.toLowerCase().includes(search.toLowerCase())) return false;
    if(difficulty && trek.difficulty !== difficulty) return false;
    if(maxLength && trek.lengthKm && trek.lengthKm > Number(maxLength)) return false;
    if(maxElevation && trek.elevationGain && parseElevation(trek.elevationGain) > Number(maxElevation)) return false;
    if (maxDuration && parseDuration(trek.duration) > Number(maxDuration)) return false;
    return true;
  });

  /**
 * Ordina i percorsi filtrati in base al criterio e alla direzione.
 * @param {Trek} a - Primo percorso da confrontare
 * @param {Trek} b - Secondo percorso da confrontare
 * @returns {number} Valore negativo, zero o positivo per determinare l'ordine
 */
  const sorted = [...filtered].sort((a, b) => {
    let result = 0;
    if(sortBy === "name") result = a.name.localeCompare(b.name);
    else if(sortBy === "difficulty") {
      const order = {"Facile": 1, "Medio": 2, "Difficile": 3 };
      result = order[a.difficulty] - order[b.difficulty];
    }
    else if(sortBy === "lengthKm") result = (a.lengthKm ?? 0) - (b.lengthKm ?? 0);
    else if(sortBy === "elevationGain") result = parseElevation(a.elevationGain) - parseElevation(b.elevationGain);
    else if (sortBy === "duration") result = parseDuration(a.duration) - parseDuration(b.duration);
    return sortDir === "asc" ? result : -result;
  });

  /** Numero totale di pagine in base ai risultati filtrati */
  const totalPages = Math.ceil(sorted.length / PER_PAGE);
  /** Sottoinsieme di percorsi da mostrare nella pagina corrente */
  const paginated = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  /**
 * Tag dei filtri attivi mostrati sotto la barra di ricerca.
 * Ogni tag include etichetta e funzione per rimuovere il filtro.
 */
  const activeTags: { label: string; onRemove: () => void}[] = [
    ...(difficulty ? [{ label: difficulty, onRemove: () => setDifficulty("")}] : []),
    ...(maxLength ? [{ label: `Max ${maxLength} km`, onRemove: () => setMaxLength("")}] : []),
    ...(maxElevation ? [{ label: `Max ${maxElevation} m`, onRemove: () => setMaxElevation("")}] : []),
    ...(maxDuration ? [{ label: `Max ${Number(maxDuration) / 60} ore`, onRemove: () => setMaxDuration("") }] : []),
  ];

return (
  <main className={styles.page}>

    <div className={styles.searchRow} ref={filtersRef}>
       <div className={styles.leftGroup}>

      {/*Gruppo sx: Bottone filtro + Barra di ricerca + pannello sotto*/}
      <div className={styles.leftGroupRow}>
        <button 
          className={`${styles.filterBtn} ${filtersOpen ? styles.filterBtnActive : ""}`}
          onClick={() => setFiltersOpen(!filtersOpen)}
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <line x1="4" y1="6" x2="20" y2="6"/>
            <line x1="7" y1="12" x2="17" y2="12"/>
            <line x1="10" y1="18" x2="14" y2="18"/>
          </svg>
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

      {/*Pannello filtri*/}
      {filtersOpen && (
        <div className={styles.filtersPanel}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Difficoltà</label> 
            <div className={styles.filterOptions}>
              {["", "Facile", "Medio", "Difficile"].map((d) => (
                <button
                  key={d}
                  className={`${styles.filterOption} ${difficulty === d ? (
                        d === "" ? styles.filterOptionAll :
                        d === "Facile" ? styles.filterOptionEasy :
                        d === "Medio" ? styles.filterOptionMedium :
                        styles.filterOptionHard
                  ) : ""}`}
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
            <input 
              className={styles.slider}
              type="range" min={0} max={25} step={1}
              value={maxLength || 25}
              onChange={(e) => { setMaxLength(e.target.value === "0" ? "" : e.target.value); setPage(1); }}
            /> 
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              Max dislivello {maxElevation && <span className={styles.sliderValue}>{maxElevation} m</span>}
            </label>
            <input 
              className={styles.slider}
              type="range" min={0} max={3000} step={50}
              value={maxElevation || 3000}
              onChange={(e) => { setMaxElevation(e.target.value === "0" ? "" : e.target.value); setPage(1); }}
            /> 
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              Max durata {maxDuration && <span className={styles.sliderValue}>{Number(maxDuration) / 60} ore</span>}
            </label>
            <input
              className={styles.slider}
              type="range" min={60} max={600} step={60}
              value={maxDuration || 600}
              onChange={(e) => { setMaxDuration(e.target.value === "0" ? "" : e.target.value); setPage(1); }}
            />
          </div>
        </div> 
      )} 
      </div>

     

      {/* Gruppo dx: Bottone ordina per + Pannello ordina per */}
      <div className={styles.rightGroup}>
        <button
          className={`${styles.filterBtn} ${sortOpen ? styles.filterBtnActive : ""}`}
          onClick={() => setSortOpen(!sortOpen)}
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <line x1="4" y1="6" x2="20" y2="6"/>
            <line x1="16" y1="12" x2="20" y2="12"/>
            <line x1="4" y1="12" x2="10" y2="12"/>
            <line x1="4" y1="18" x2="20" y2="18"/>
          </svg>
          Ordina per
        </button> 

        {/* Pannello ordina per */}
        {sortOpen && (
          <div className={styles.sortPanel}> 
            {([
              {key: "name", label: "Nome"},
              {key: "difficulty", label: "Difficoltà"},
              {key: "lengthKm", label: "Lunghezza"},
              {key: "elevationGain", label: "Dislivello"},
              { key: "duration", label: "Durata" },
            ] as {key: typeof sortBy; label: string }[]).map(({ key, label }) => (
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
  
      {/* Tag filtri attivi */}
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
          <button className={styles.clearAll} onClick={() => {
            setDifficulty(""); setMaxLength(""); setMaxElevation(""); setMaxDuration(""); setPage(1);
          }}>
            Rimuovi tutti
          </button>
        </div>
      )}


      {/* Risultati */}
      <div className={styles.results}>
        {loading && <p className={styles.message}>Caricamento percorsi...</p>}
        {error && <p className={styles.messageError}>Impossibile caricare i percorsi: {error}</p>}
        {!loading && !error && <p className={styles.count}>{filtered.length} Percorsi trovati</p>}
        {!loading && !error && filtered.length === 0 && <p className={styles.message}>Nessun percorso trovato</p>}
        {!loading && !error && paginated.map((trek) => (
          <TrekCardEsplora key={trek.id} trek={trek} />
        ))}
      </div>

      {/* Paginazione */}
      {!loading && !error && totalPages > 1 && (
        <div className={styles.pagination}>
          <button 
            className={styles.pageBtn} 
            onClick={() => {setPage(p => p - 1); window.scrollTo(0, 0);} }
            disabled={page === 1}
          >
            ←
          </button>
          <span className={styles.pageInfo}>{page} / {totalPages}</span>
          <button 
            className={styles.pageBtn} 
            onClick={() => {setPage(p => p + 1); window.scrollTo(0, 0);} }
            disabled={page === totalPages}
          >
            →
          </button>
            
        </div>

      )}


  </main>

);
}