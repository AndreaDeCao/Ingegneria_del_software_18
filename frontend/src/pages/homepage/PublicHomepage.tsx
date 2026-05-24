import { useEffect, useState } from "react";
import TrekCard from "../../components/TrekCard";
import ActivityCard from "../../components/ActivityCard";
import EventCard from "../../components/EventCard";

import type { Trek } from "../../types/Trek";
import type { Activity } from "../../types/Activity";
import type { Event } from "../../types/Events";

import styles from "../../App.module.css";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export default function PublicHomepage() {
  const [treks, setTreks] = useState<Trek[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const MAX_TREK_CARDS = 11;
  const MAX_ACTIVITY_CARDS = 7;
  const MAX_EVENT_CARDS = 11;

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

  useEffect(() => {
    fetch(`${API_BASE}/api/trento-events`).then((res) => {
      if(!res.ok) {
        throw new Error("Errore eventi: " + res.status);
      }
      return res.json();
    })
    .then((data) => setEvents(data)).catch((err: Error) => {
      console.error("Errore fetch eventi:", err);
    });
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

          { /* EVENTI */}
          <div className={styles.sectionTreks}>

            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>
                Eventi a Trento
              </h2>

              {/* Link sito eventi comune di Trento */}
              <a
              href="https://eventi.comune.trento.it"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.seeMore}
              >
                Scopri tutti gli eventi
              </a>
            </div>

            {events.length === 0 && (
              <p className={styles.message}>Nessun evento disponibile.</p>
            )}

            {events.length > 0 && (
              <div className={styles.cardsRow}>
                {events.slice(0, MAX_EVENT_CARDS).map((event) => (
                  <EventCard 
                    key={event._id}
                    event={event}
                  />
                ))}
              </div>
            )}
          </div>
      


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
