import { useEffect, useState } from "react";
import TrekCard from "../components/TrekCard";
import type { Trek } from "../types/Trek";
import styles from "../App.module.css";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export default function Treks() {
  const [treks, setTreks] = useState<Trek[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <>
      <main className={styles.main}>
        <h2 className={styles.sectionTitle}>Di tendenza nelle vicinanze</h2>

        {!loading && !error && <span className={styles.sectionCount}>{treks.length} percorsi</span>}

        {loading && <p className={styles.message}>Caricamento percorsi...</p>}
        {error && <p className={styles.messageError}>Impossibile caricare i percorsi: {error}</p>}
        {!loading && !error && treks.length === 0 && (
          <p className={styles.message}>Nessun percorso trovato nelle vicinanze.</p>
        )}

        {!loading && !error && (
          <div className={styles.cardsRow}>
            {treks.map((trek) => (
              <TrekCard key={trek.id} trek={trek} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
