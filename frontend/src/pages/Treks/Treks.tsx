import { useEffect, useState } from "react";
import TrekCard from "../../components/TrekCard";
import type { Trek } from "../../types/Trek";
import styles from "./Treks.module.css";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

/**
 * Pagina Esplora — mostra tutti i percorsi con barra di ricerca e filtri.
 * I filtri vengono applicati lato frontend sui dati già scaricati dal backend.
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

  //Filtra percorsi personalizzato
  const filtered = treks.filter((trek) => {
    if(search && !trek.name.toLowerCase().includes(search.toLowerCase())) return false;
    if(difficulty && trek.difficulty !== difficulty) return false;
    if(maxLength && trek.lengthKm && trek.lengthKm > Number(maxLength)) return false;
    return true;
  });

  return (
      <main className={styles.page}>

        {/*Barra ricerca + Filtri*/}
        <div className={styles.searchBar}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Cerca un percorso..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className={styles.filters}>
          <select
            className={styles.filterSelect}
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}
          >
            <option value="">Tutte le difficoltà</option>
            <option value="Facile">Facile</option>
            <option value="Medio">Medio</option>
            <option value="Difficile">Difficile</option>
          </select>

          <input
            className={styles.filterInput}
            type="number"
            placeholder="Max km"
            value={maxLength}
            onChange={(e) => setMaxLength(e.target.value)}
            min={0}
          />
        </div>
      </div> 

        {/*Risultati*/}
        <div className={styles.results}>
          {loading && <p className={styles.message}>Caricamento percorsi...</p>}
          {error && <p className={styles.messageError}>Impossibile caricare i percorsi: {error}</p>}
          {!loading && !error && filtered.length === 0 && (
          <p className={styles.message}>Nessun percorso trovato.</p>
          )}
          {!loading && !error && (
          <p className={styles.count}>{filtered.length} percorsi trovati</p>
          )}
          {!loading && !error && filtered.map((trek) => (
          <TrekCard key={trek.id} trek={trek} />
          ))}
        </div>
    
      </main>
  );
}
