import { useEffect, useState } from "react";
import TrekCardEsplora from "../../components/TrekCardEsplora";
import type { Trek } from "../../types/Trek";
import styles from "./Treks.module.css";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

/**
 * Pagina Esplora — mostra tutti i percorsi con barra di ricerca e filtri.
 * I filtri vengono applicati lato frontend sui dati già scaricati dal backend.
 * 
 * @returns {JSX.Element} Pagina con lista percorsi, ricerca e filtri
 */
export default function Treks() {
  const [treks, setTreks] = useState<Trek[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  //Stato filtri

  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<"" | "Facile" | "Medio" | "Difficile">("");
  //const [maxDuration, setMaxDuration] = useState("");
  const [maxLength, setMaxLength] = useState("");
  const[maxElevation, setMaxElevation] = useState("");

  //Pannello filtro aperto/chiuso
  const [filtersOpen, setFiltersOpen] = useState(false);

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

  /**
   * Filtra percorsi in base ai filtri attivi.
   * Ogni condizione restituisce false se il percorso non soddisfa il filtro.
   */
  const filtered = treks.filter((trek) => {
    if(search && !trek.name.toLowerCase().includes(search.toLowerCase())) return false;
    if(difficulty && trek.difficulty !== difficulty) return false;
    if(maxLength && trek.lengthKm && trek.lengthKm > Number(maxLength)) return false;
    if(maxElevation && trek.elevationGain && trek.elevationGain > Number(maxElevation)) return false;
    return true;
  });

  /**Tag filtri attivi - mostrati sotto barra di ricerca */
  const activeTags: { label: string; onRemove: () => void}[] = [
    ...(difficulty ? [{ label: difficulty, onRemove: () => setDifficulty("")}] : []),
    ...(maxLength ? [{ label: `Max ${maxLength} km`, onRemove: () => setMaxLength("")}] : []),
    ...(maxElevation ? [{ label: `Max ${maxElevation} m`, onRemove: () => setMaxElevation("")}] : []),
  ];

  return (
      <main className={styles.page}>

        {/*Barra di ricerca + Bottone filtri*/}
        <div className={styles.searchRow}>
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
            onChange={(e) => setSearch(e.target.value)}
            />
        </div>
          
        {/*Pannello filtri*/}
        {filtersOpen && (
          <div className={styles.filtersPanel}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Difficoltà</label>
              <div className={styles.filterOptions}>
                {["", "Facile", "Medio", "Difficile"].map((d) => {
                  return (
                  <button
                    key={d}
                    className={`${styles.filterOption} ${difficulty === d ? (
                      d === "" ? styles.filterOptionAll:
                      d === "Facile" ? styles.filterOptionEasy :
                      d === "Medio" ? styles.filterOptionMedium :
                      d === "Difficile" ? styles.filterOptionHard :
                    styles.filterOptionActive) : ""}`}
                    onClick={() => setDifficulty(d as typeof difficulty)}
                  >
                    {d === "" ? "Tutte" : d}
                  </button>
                  );
                  })}
              </div>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>
                Max km {maxLength && <span className={styles.sliderValue}>{maxLength} km</span>}
              </label>
              <input
                className={styles.slider}
                type="range"
                min={0}
                max={25}
                step={1}
                value={maxLength || 25}
                onChange={(e) => setMaxLength(e.target.value === "0" ? "" : e.target.value)}
              />
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>
                Max dislivello {maxElevation && <span className={styles.sliderValue}>{maxElevation} m</span>}
              </label>
              <input
                className={styles.slider}
                type="range"
                min={0}
                max={3000}
                step={50}
                value={maxElevation || 3000}
                onChange={(e) => setMaxElevation(e.target.value === "0" ? "" : e.target.value)}
              />
            </div>
          </div>
        )}

        {/*Tag filtri attivi*/}
        {activeTags.length > 0 && (
          <div className={styles.activeTags}>
            {activeTags.map((tag) => (
              <button key={tag.label} className={styles.activeTag} onClick={tag.onRemove}>
                {tag.label} ✕
              </button>
            ))}
            <button className={styles.clearAll} onClick={() => { 
              setDifficulty(""); 
              setMaxLength(""); 
              setMaxElevation("");}}>
              Rimuovi tutti
            </button>
          </div>
        )}


        {/*Risultati*/}
        <div className={styles.results}>
          {loading && <p className={styles.message}>Caricamento percorsi...</p>}
          {error && <p className={styles.messageError}>Impossibile caricare i percorsi: {error}</p>}
          {!loading && !error && (
          <p className={styles.count}>{filtered.length} Percorsi trovati</p>
          )}
           {!loading && !error && filtered.length == 0 && (
          <p className={styles.message}> Nessun percorso trovato</p>
          )}
          {!loading && !error && filtered.map((trek) => (
          <TrekCardEsplora key={trek.id} trek={trek} />
          ))}
        </div>
    
      </main>
  );
}
