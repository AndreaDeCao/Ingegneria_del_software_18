import { useEffect, useState } from "react";
// import TrekCard from "./components/TrekCard";
import TrekCard, { type Trek } from "./components/TrekCard";
import Navbar from "./components/Navbar";
import { useTheme } from "./hooks/useTheme";
import "./index.css";
import styles from "./App.module.css";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
// const API_BASE = import.meta.env.VITE_API_URL; // Se VITE_API_URL è definita, la useremo come base URL per le API. Altrimenti, se non è definita, problemi, pensare se mettere valore di default


function App() {

  const { theme, toggle } = useTheme();

  const [treks, setTreks] = useState<Trek[]>([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  // useEffect(() => {
  //   //PER USO LOCALE (localhost:3000) -> fetch("http://localhost:3000/treks") 
  //   //PER USO CON DOCKER (backend:3000) -> fetch("http://backend:3000/treks")
  //   //va solo localhost

  //   // fetch("http://backend:3000/treks")
  //   fetch("http://localhost:3000/treks")
  //     .then((res) => res.json())
  //     .then((data) => setTreks(data));
  // }, []);
  useEffect(() => {
    // setLoading(true);
    fetch(`${API_BASE}/treks`)
    .then((res) => {
      if (!res.ok) throw new Error("Server error: " + res.status);
      return res.json();
    })
    .then((data) => setTreks(data))
      .catch((err: Error) => {
      console.error("Failed to fetch treks:", err);
      setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Navbar theme={theme} onToggleTheme={toggle} />

      <main className={styles.main}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Di tendenza nelle vicinanze</h2>
          {!loading && !error && (
            <span className={styles.sectionCount}>{treks.length} percorsi</span>
          )}
        </div>

        {loading && <p className={styles.message}>Caricamento percorsi...</p>}
        {error && <p className={styles.messageError}>Impossibile caricare i percorsi: {error}</p>}
        {!loading && !error && treks.length === 0 && (
          <p className={styles.message}>Nessun percorso trovato nelle vicinanze.</p>
        )}

        {!loading && !error && (
          <div className={styles.cardsRow}>
          {treks.map((trek) => (<TrekCard key={trek.id} trek={trek} />))}
          </div>
        )}
      </main>
    </>
  );
}
export default App;