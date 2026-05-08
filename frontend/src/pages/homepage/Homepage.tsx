import { useEffect, useState } from "react";
import TrekCard from "../../components/TrekCard";
import type { Trek } from "../../types/Trek";
// import TrekCard, { type Trek } from "./components/TrekCard";
import type { User } from "../../types/User";
// import type {Treks} from "./types/Trek";

import "../../index.css";
import styles from "../../App.module.css";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
// const API_BASE = import.meta.env.VITE_API_URL; // Se VITE_API_URL è definita, la useremo come base URL per le API. Altrimenti, se non è definita, problemi, pensare se mettere valore di default


export default function Homepage() {
  // const [treks, setTreks] = useState<Trek[]>([]);
  const [treks, setTreks] = useState<Trek[]>([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [users, setUsers] = useState<User[]>([]);

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
  //   fetch(`${API_BASE}/treks`)
  //   .then((res) => {
  //     if (!res.ok) throw new Error("Server error: " + res.status);
  //     return res.json();
  //   })
  //   .then((data) => setTreks(data))
  //     .catch((err: Error) => {
  //     console.error("Failed to fetch treks:", err);
  //     setError(err.message);
  //     })
  //     .finally(() => setLoading(false));
  // }, []);
    fetch(`${API_BASE}/treks`)
      .then((res) => {
        if (!res.ok) throw new Error("Errore percorsi: " + res.status);
        return res.json();
      })
      .then((data) => setTreks(data))
      .catch((err: Error) => {
        console.error("Errore fetch percorsi:", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
    }, []);
    

  useEffect(() => {
    fetch(`${API_BASE}/users`)
      .then((res) => {
        if (!res.ok) throw new Error("Errore utenti: " + res.status);
        return res.json();
      })
      .then((data) => setUsers(data))
      .catch((err: Error) => {
        console.error("Errore fetch utenti:", err);
      });
  }, []);

  return (
    <>
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

      <hr />

      <h2>Utenti registrati</h2>
 
      <div>
        {users.map((user) => (
          <div key={user._id} style={{ border: "1px solid gray", margin: "10px", padding: "10px" }}>
            <p><strong>Nome:</strong> {user.nome} {user.cognome}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Nickname:</strong> {user.nickname}</p>
          </div>
        ))}
      </div>
    </>
  );
}