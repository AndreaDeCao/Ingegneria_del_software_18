import { useEffect, useState } from "react";
import TrekCard from "../../components/TrekCard";
import ActivityCard from "../../components/ActivityCard";

import type { Trek } from "../../types/Trek";
import type { DiaryEntry } from "../../types/Diary";
import type { Activity } from "../../types/Activity";

import styles from "../../App.module.css";
import { Link } from "react-router-dom";

// Helper per fare fetch autenticata (riusa il token in memoria tramite http di api.ts)
export async function fetchAuth<T>(path: string): Promise<T> {
  const { http } = await import("../../auth/api"); // riusa http interno
  return (http as (p: string) => Promise<T>)(path);
}

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export default function Homepage() {
  const [treks, setTreks] = useState<Trek[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const MAX_TREK_CARDS = 11;
  const MAX_ACTIVITY_CARDS = 7;
  const MAX_DIARY_CARDS = 5;

  // Carica percorsi, senza token
  useEffect(() => {
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

  // Carica attività, senza token
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

  // Carica voci diario, con token (se l'utente è loggato)
  useEffect(() => {
    fetchAuth<DiaryEntry[]>(`/api/diary`)
      .then((data) => setDiaryEntries(data))
      .catch((err: Error) => console.error("Errore diary:", err));
  }, []);

  return (
    <main className={styles.main}>

      <div className={styles.contentLayout}>

        {/* COLONNA SINISTRA */}
        <section className={styles.leftColumn}>

          {/* TREKS */}
          <div className={styles.sectionTreks}>

            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>
                Di tendenza nelle vicinanze
              </h2>

              {!loading && !error && (
                <span className={styles.sectionCount}>
                  {MAX_TREK_CARDS} percorsi
                </span>
              )}
            </div>

            {loading && (
              <p className={styles.message}>Caricamento percorsi...</p>
            )}

            {error && (
              <p className={styles.messageError}>
                Impossibile caricare i percorsi: {error}
              </p>
            )}

            {!loading && !error && treks.length === 0 && (
              <p className={styles.message}>
                Nessun percorso trovato nelle vicinanze.
              </p>
            )}

            {!loading && !error && (
              <div className={styles.cardsRow}>
                {treks.slice(0, MAX_TREK_CARDS).map((trek) => (
                  <TrekCard key={trek._id} trek={trek} />
                ))}
              </div>
            )}
          </div>

          {/* DIARY */}
          <div className={styles.sectionDiary}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Il tuo diario</h2>
              <span className={styles.sectionCount}>
                {diaryEntries.length} {diaryEntries.length === 1 ? "voce" : "voci"}
              </span>
            </div>
            {diaryEntries.length === 0 && (
              <p className={styles.message}>Nessuna voce nel diario ancora.</p>
            )}
            {diaryEntries.slice(0, MAX_DIARY_CARDS).map((entry) => (
              <div key={entry._id}>
                <strong>{entry.titolo}</strong>
                <span> — {new Date(entry.data).toLocaleDateString("it-IT")}</span>
                {entry.trekId && <span> | {entry.trekId.name}</span>}
                {entry.valutazione && <span> ⭐ {entry.valutazione}/5</span>}
              </div>
            ))}
          </div>

        </section>

        {/* COLONNA DESTRA */}
        <section className={styles.rightColumn}>

          <div className={styles.sectionHead}>
            <Link to="/attivita/visualizza" className={styles.sectionTitle}>
              Attività in programma
            </Link>

            {!loading && !error && (
              <span className={styles.sectionCount}>
                {MAX_ACTIVITY_CARDS} attività
              </span>
            )}
          </div>

          {loading && (
            <p className={styles.message}>Caricamento attività...</p>
          )}

          {error && (
            <p className={styles.messageError}>
              Impossibile caricare le attività: {error}
            </p>
          )}

          {!loading && !error && activities.length === 0 && (
            <p className={styles.message}>
              Nessuna attività trovata nelle vicinanze.
            </p>
          )}

          {!loading && !error && (
            <div className={styles.activitiesColumn}>
              {activities.slice(0, MAX_ACTIVITY_CARDS).map((activity) => (
                <ActivityCard
                  key={activity._id}
                  activity={activity}
                />
              ))}
            </div>
          )}

        </section>

      </div>

    </main>
  );
}
