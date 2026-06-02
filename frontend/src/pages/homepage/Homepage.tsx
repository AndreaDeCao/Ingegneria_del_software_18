import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import TrekCard from "../../components/TrekCard";
import ActivityCard from "../../components/ActivityCard";
import EventCard from "../../components/EventCard";
import DiaryCard from "../../components/DiaryCard";

import type { Trek } from "../../types/Trek";
import type { DiaryEntry } from "../../types/Diary";
import type { Activity } from "../../types/Activity";
import type { Event } from "../../types/Events";
import type { DiaryStats } from "../../types/DiaryStats";

import styles from "../../App.module.css";
import { SkeletonCardRow, SkeletonStatRow, SkeletonActivityList  } from "../../components/SkeletonLoader";

// Helper per fare fetch autenticata (riusa il token in memoria tramite http di api.ts)
export async function fetchAuth<T>(path: string): Promise<T> {
  const { http } = await import("../../auth/api"); // riusa http interno
  return (http as (p: string) => Promise<T>)(path);
}

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export default function Homepage() {
  const [treks, setTreks] = useState<Trek[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  const [events, setEvents] = useState<Event[]>([]);

  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [diaryStats, setDiaryStats] = useState<DiaryStats | null>(null);

  // const [loading, setLoading] = useState(true);
  const [loadingTreks, setLoadingTreks] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [loadingDiary, setLoadingDiary] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const MAX_TREK_CARDS = 11;
  const MAX_ACTIVITY_CARDS = 7;
  const MAX_DIARY_CARDS = 5;
  const MAX_EVENT_CARDS = 11;
  const topRatedTreks = [...treks]
    .sort((a, b) => {
      const ratingDiff = (b.averageRating ?? 0) - (a.averageRating ?? 0);
      if (ratingDiff !== 0) return ratingDiff;
      return (b.ratingCount ?? 0) - (a.ratingCount ?? 0);
    })
    .slice(0, MAX_TREK_CARDS);

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
      .finally(() => setLoadingTreks(false));
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
      })
      .finally(() => setLoadingActivities(false));
  }, []);

  // Carica voci diario, con token (se l'utente è loggato)
  useEffect(() => {
    fetchAuth<DiaryEntry[]>(`/api/diary`)
      .then((data) => setDiaryEntries(data.slice(0, 3)))   //limito a 3 risultati per maggiore pulizia
      .catch((err: Error) => console.error("Errore diary:", err))
      .finally(() => setLoadingDiary(false));
  }, []);

  //caricamente eventi comune
  useEffect(() => {
      fetch(`${API_BASE}/api/trento-events`).then((res) => {
        if(!res.ok) {
          throw new Error("Errore eventi: " + res.status);
        }
        return res.json();
      })
      .then((data) => setEvents(data)).catch((err: Error) => {
        console.error("Errore fetch eventi:", err);
      })
      .finally(() => setLoadingEvents(false));
  }, []);

  // CArica diary stats
  useEffect(() => {
    fetchAuth<DiaryStats>(`/api/diary/stats`)
      .then((data) => {
        setDiaryStats(data)
        // console.log(data) 
      })

      .catch((err: Error) => console.error("Errore stats:", err))
      .finally(() => setLoadingStats(false));
  }, []);

  return (
    <main className={styles.main}>

      <div className={styles.contentLayout}>

        {/* COLONNA SINISTRA */}
        <section className={styles.leftColumn}>

         {/* TREKS */}
          <div className={styles.sectionTreks}>
            <div className={styles.sectionHead}>
              <Link to="/treks" className={styles.sectionTitle}>
                Di tendenza
              </Link>
              {!loadingTreks && !error && (
                <span className={styles.sectionCount}>{MAX_TREK_CARDS} percorsi</span>
              )}
            </div>
 
            {loadingTreks ? (
              <SkeletonCardRow count={5} />
            ) : error ? (
              <p className={styles.messageError}>Impossibile caricare i percorsi: {error}</p>
            ) : treks.length === 0 ? (
              <p className={styles.message}>Nessun percorso trovato nelle vicinanze.</p>
            ) : (
              <div className={styles.cardsRow}>
                {topRatedTreks.map((trek) => (
                  <TrekCard key={trek.id} trek={trek} />
                ))}
              </div>
            )}
          </div>
 
          {/* DIARY */}
          <div className={styles.sectionDiary}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>
                <a href="../diario/visualizza">Le tue ultime passeggiate</a>
              </h2>
              {!loadingDiary && (
                <span className={styles.sectionCount}>
                  {diaryEntries.length} {diaryEntries.length === 1 ? "voce" : "voci"}
                </span>
              )}
            </div>
 
            {loadingDiary ? (
              <SkeletonCardRow count={3} />
            ) : diaryEntries.length === 0 ? (
              <p className={styles.message}>Nessuna voce nel diario ancora.</p>
            ) : (
              <div className={styles.diaryCardsRow}>
                {diaryEntries.slice(0, MAX_DIARY_CARDS).map((entry) => (
                  <DiaryCard key={entry._id} entry={entry} />
                ))}
              </div>
            )}
          </div>
 
          {/* STATISTICHE DIARIO */}
          {loadingStats ? (
            <div className={styles.sectionStats}>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}>Le tue statistiche</h2>
              </div>
              <SkeletonStatRow />
            </div>
          ) : diaryStats && diaryStats.totaleUscite > 0 ? (
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
                  <span className={styles.statLabel}>Tempo impiegato</span>
                  <span className={styles.statValue}>
                    {diaryStats.totaleOre}h{" "}
                    {diaryStats.totaleMinutiExtra >= 0 ? `${diaryStats.totaleMinutiExtra}min` : ""}
                  </span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Chilometri percorsi</span>
                  <span className={styles.statValue}>{diaryStats.totaleKm} km</span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Tipologie di percorsi affrontati</span>
                  <div className={styles.diffBar}>
                    {diaryStats.percFacile > 0 && (
                      <div className={styles.diffFacile} style={{ width: `${diaryStats.percFacile}%` }}>
                        {diaryStats.percFacile}%
                      </div>
                    )}
                    {diaryStats.percMedio > 0 && (
                      <div className={styles.diffMedio} style={{ width: `${diaryStats.percMedio}%` }}>
                        {diaryStats.percMedio}%
                      </div>
                    )}
                    {diaryStats.percDifficile > 0 && (
                      <div className={styles.diffDifficile} style={{ width: `${diaryStats.percDifficile}%` }}>
                        {diaryStats.percDifficile}%
                      </div>
                    )}
                  </div>
                  <span className={styles.statLabel}>
                    🟢 Facile - 🟠 Medio - 🔴 Difficile
                  </span>
                </div>
              </div>
            </div>
          ) : null}
 
          {/* EVENTI */}
          <div className={styles.sectionEvents}>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Eventi a Trento</h2>
              <a
                href="https://eventi.comune.trento.it"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.seeMore}
              >
                Scopri tutti gli eventi
              </a>
            </div>
 
            {loadingEvents ? (
              <SkeletonCardRow count={5} />
            ) : events.length === 0 ? (
              <p className={styles.message}>Nessun evento disponibile.</p>
            ) : (
              <div className={styles.cardsRow}>
                {events.slice(0, MAX_EVENT_CARDS).map((event) => (
                  <EventCard key={event._id} event={event} />
                ))}
              </div>
            )}
          </div>
 
        </section>
 
        {/* ── COLONNA DESTRA ── */}
        <section className={styles.rightColumn}>
          <div className={styles.sectionHead}>
            <Link to="/attivita/visualizza" className={styles.sectionTitle}>
              Attività in programma
            </Link>
            {!loadingActivities && (
              <span className={styles.sectionCount}>{MAX_ACTIVITY_CARDS} attività</span>
            )}
          </div>
 
          {loadingActivities ? (
            <SkeletonActivityList count={4} />
          ) : activities.length === 0 ? (
            <p className={styles.message}>Nessuna attività trovata.</p>
          ) : (
            <div className={styles.activitiesColumn}>
              {activities.slice(0, MAX_ACTIVITY_CARDS).map((activity) => (
                <ActivityCard key={activity._id} activity={activity} />
              ))}
            </div>
          )}
        </section>
 
      </div>
    </main>
  );
}