import { useEffect, useState } from "react";
import TrekCard from "./components/TrekCard";
import ActivityCard from "./components/ActivityCard"; //!!!

import type { Trek } from "./types/Trek";
// import TrekCard, { type Trek } from "./components/TrekCard";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer"; //!!!

import { useTheme } from "./hooks/useTheme";
import type { User } from "./types/User";
import type { Activity } from "./types/Activity";

// import type {Treks} from "./types/Trek";

import "./index.css";
import styles from "./App.module.css";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
// const API_BASE = import.meta.env.VITE_API_URL; // Se VITE_API_URL è definita, la useremo come base URL per le API. Altrimenti, se non è definita, problemi, pensare se mettere valore di default


function App() {

  const { theme, toggle } = useTheme();
  
  // const [treks, setTreks] = useState<Trek[]>([]);
  const [treks, setTreks] = useState<Trek[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [users, setUsers] = useState<User[]>([]);

  const MAX_TREK_CARDS = 11;

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

  useEffect(() => {
    fetch(`${API_BASE}/activities`)
      .then((res) => {
        if (!res.ok) throw new Error("Errore attività: " + res.status);
        return res.json();
      })
      .then((data) => setActivities(data))
      .catch((err: Error) => {
        console.error("Errore fetch attività:", err);
      });
  }, []);

  return (
    <>
      <div className={styles.app}>
        <Navbar theme={theme} onToggleTheme={toggle} />
        
          <main className={styles.main}>

            <div className={styles.contentLayout}> {/* Contenitore principale */}
              
              
              <section className={styles.leftColumn}> {/* COLONNA SINISTRA */}
                
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
                    {treks.slice(0, MAX_TREK_CARDS).map((trek) => ( /* mostra massimo N card */
                      <TrekCard key={trek.id} trek={trek} />
                    ))}
                  </div>
                )}

              </section>

              {/* COLONNA DESTRA */}
                <section className={styles.rightColumn}>
                  
                  <div className={styles.sectionHead}>
                    <h2 className={styles.sectionTitle}>Attività in programma </h2>
                    {!loading && !error && (
                      <span className={styles.sectionCount}>{activities.length} attività</span>
                    )}
                  </div>

                  {loading && <p className={styles.message}>Caricamento attività...</p>}
                  {error && <p className={styles.messageError}>Impossibile caricare le attività: {error}</p>}
                  {!loading && !error && treks.length === 0 && (
                    <p className={styles.message}>Nessuna attività trovata nelle vicinanze.</p>
                  )}

                  {!loading && !error && (
                    <div className={styles.activitiesColumn}>
                      {activities.map((activity) => (
                        <ActivityCard key={activity.id} activity={activity} />
                      ))}
                    </div>
                  )}

                </section>

            </div>
          </main>
        
        <hr />

        
        
        <Footer />
      </div>
    </>
  );
}
export default App;

//riga 120