import { useEffect, useState } from "react";
import TrekCard from "../../components/TrekCard";
import ActivityCard from "../../components/ActivityCard";
import DiaryCard from "../../components/DiaryCard";

import type { Trek } from "../../types/Trek";
import type { DiaryEntry } from "../../types/Diary";
import type { Activity } from "../../types/Activity";
type DiaryStats = {
  totaleUscite: number;
  totaleOre: number;
  totaleMinutiExtra: number;
  totaleKm: number;
  mediaValutazione: number | null;
  percFacile: number;
  percMedio: number;
  percDifficile: number;
};

import styles from "../../App.module.css";

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
  const [diaryStats, setDiaryStats] = useState<DiaryStats | null>(null);

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
      .then((data) => setDiaryEntries(data.slice(0, 3)))   //limito a 3 risultati per maggiore pulizia
      .catch((err: Error) => console.error("Errore diary:", err));
  }, []);

  useEffect(() => {
    fetchAuth<DiaryStats>(`/api/diary/stats`)
      .then((data) => setDiaryStats(data))
      .catch((err: Error) => console.error("Errore stats:", err));
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
                  <TrekCard key={trek.id} trek={trek} />
                ))}
              </div>
            )}
          </div>

          {/* DIARY */}
          <div className={styles.sectionDiary}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}><a href="../diario/visualizza">Le tue ultime passeggiate</a></h2> {/* rimando a tutte le voci diario */}
              <span className={styles.sectionCount}>
                {diaryEntries.length} {diaryEntries.length === 1 ? "voce" : "voci"}
              </span>
            </div>
            {diaryEntries.length === 0 && (
              <p className={styles.message}>Nessuna voce nel diario ancora.</p>
            )}
            {diaryEntries.length > 0 && (
              <div className={styles.diaryCardsRow}>
                {diaryEntries.slice(0, MAX_DIARY_CARDS).map((entry) => (
                  <DiaryCard key={entry._id} entry={entry} />
                ))}
              </div>
            )}
          </div>

          {/* STATISTICHE DIARIO */}
          {diaryStats && diaryStats.totaleUscite > 0 && (
            <div className={styles.sectionStats}>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}>Le tue statistiche</h2>
              </div>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Uscite completate</span>
                  <span className={styles.statValue}>{diaryStats.totaleUscite}</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Tempo in montagna</span>
                  <span className={styles.statValue}>
                    {diaryStats.totaleOre}h {diaryStats.totaleMinutiExtra >= 0 ? `${diaryStats.totaleMinutiExtra}min` : ""}
                  </span>
                </div>
                
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Chilometri percorsi</span>
                  <span className={styles.statValue}>{diaryStats.totaleKm} km</span>
                </div>
                {/*
                {diaryStats.mediaValutazione !== null && (
                  <div className={styles.statCard}>
                    <span className={styles.statLabel}>Valutazione media</span>
                    <span className={styles.statValue}>{'★'.repeat(Math.round(diaryStats.mediaValutazione))} {diaryStats.mediaValutazione}/5</span>
                  </div>
                )}*/}
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Difficoltà affrontate</span>
                  <div className={styles.diffBar}>
                    {diaryStats.percFacile > 0 && (
                      <div className={styles.diffFacile} style={{ width: `${diaryStats.percFacile}%` }}>
                        {diaryStats.percFacile}% Facile
                      </div>
                    )}
                    {diaryStats.percMedio > 0 && (
                      <div className={styles.diffMedio} style={{ width: `${diaryStats.percMedio}%` }}>
                        {diaryStats.percMedio}% Medio
                      </div>
                    )}
                    {diaryStats.percDifficile > 0 && (
                      <div className={styles.diffDifficile} style={{ width: `${diaryStats.percDifficile}%` }}>
                        {diaryStats.percDifficile}% Difficile
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        </section>

        {/* COLONNA DESTRA */}
        <section className={styles.rightColumn}>

          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>
              Attività in programma
            </h2>

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
                  key={activity.id}
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
