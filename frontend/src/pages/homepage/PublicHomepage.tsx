import { useEffect, useState } from "react";
import TrekCard from "../../components/TrekCard";
import ActivityCard from "../../components/ActivityCard";
import EventCard from "../../components/EventCard";

import type { Trek } from "../../types/Trek";
import type { Activity } from "../../types/Activity";
import type { Event } from "../../types/Events";
import { Link } from "react-router-dom";

import styles from "../../App.module.css";
// import { PageLoader } from "../../components/SkeletonLoader";
import { SkeletonCardRow, SkeletonActivityList  } from "../../components/SkeletonLoader";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export default function PublicHomepage() {
  const [treks, setTreks] = useState<Trek[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  // const [loading, setLoading] = useState(true);
  const [loadingTreks, setLoadingTreks] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const MAX_TREK_CARDS = 7;
  const MAX_ACTIVITY_CARDS = 7;
  const MAX_EVENT_CARDS = 11;

  const topRatedTreks = [...treks]
    .sort((a, b) => {
      const ratingDiff = (b.averageRating ?? 0) - (a.averageRating ?? 0);
      if (ratingDiff !== 0) return ratingDiff;
      return (b.ratingCount ?? 0) - (a.ratingCount ?? 0);
    })
    .slice(0, MAX_TREK_CARDS);

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

          { /* EVENTI */}
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

        {/* COLONNA DESTRA */}
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
