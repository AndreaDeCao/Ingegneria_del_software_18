import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import styles from "./attivitaPage.module.css";
import appStyles from "../../App.module.css";
import { useAuth } from "../../auth/AuthProvider";
import type { Activity } from "../../types/Activity";

type Trek = {
  _id: string;
  name: string;
  difficulty?: string;
  duration?: number;   // minuti
  distance?: number;   // km
  description?: string;
};

type Organizer = {
  _id: string;
  name?: string;
  username?: string;
  email?: string;
};

export default function DettagliAttivita() {
  const { id } = useParams();
  const { user } = useAuth();

  const [activity, setActivity] = useState<Activity | null>(null);
  const [trek, setTrek] = useState<Trek | null>(null);
  const [organizer, setOrganizer] = useState<Organizer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joinMessage, setJoinMessage] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // 1. Fetch activity
        const resActivity = await fetch(`http://localhost:3000/activities/${id}`);
        if (!resActivity.ok) {
          const err = await resActivity.json().catch(() => ({}));
          throw new Error(err.message || err.error || `Errore ${resActivity.status}`);
        }
        const activityData: Activity = await resActivity.json();
        setActivity(activityData);

        // 2. Fetch trek dal trekID dell'attività
        if (activityData.trekID) {
          const resTrek = await fetch(`http://localhost:3000/treks/${activityData.trekID}`);
          if (resTrek.ok) {
            const trekData: Trek = await resTrek.json();
            setTrek(trekData);
          }
        }

        // 3. Fetch organizer dal organizerID
        if (activityData.organizerID) {
          const resOrganizer = await fetch(`http://localhost:3000/users/${activityData.organizerID}`);
          if (resOrganizer.ok) {
            const organizerData: Organizer = await resOrganizer.json();
            setOrganizer(organizerData);
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [id]);

  function showJoinMessage(msg: string) {
    setJoinMessage(msg);
    setTimeout(() => setJoinMessage(""), 3000);
  }

  async function handleJoin() {
    try {
      const res = await fetch(`http://localhost:3000/activities/${id}/join`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || err.error || "Errore nella partecipazione");
      }
      showJoinMessage("Partecipazione confermata ✔");
    } catch (err: any) {
      showJoinMessage(err.message || "Errore");
    }
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Annullato": return styles.statusCancelled;
      case "Chiuso":    return styles.statusClosed;
      default:          return styles.statusAvailable;
    }
  };

  const formatTravelMode = (mode: string) => {
    switch (mode) {
      case "walking":   return "🚶 A piedi";
      case "bicycling": return "🚴 In bicicletta";
      default:          return mode;
    }
  };

  const formatDate = (date: string | Date) =>
    new Date(date).toLocaleDateString("it-IT", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  const formatTime = (date: string | Date) =>
    new Date(date).toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
    });

  // ── loading / error ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <main className={styles.page}>
        <p className={styles.message}>Caricamento attività...</p>
      </main>
    );
  }

  if (error || !activity) {
    return (
      <main className={styles.page}>
        <p className={styles.messageError}>{error || "Attività non trovata"}</p>
      </main>
    );
  }

  const canJoin = activity.status === "Aperto";
  const isOrganizer = user?._id === activity.organizerID;

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    <main className={styles.page}>
      <div className={appStyles.contentLayout}>
        <div className={appStyles.leftColumn}>
          {/* HEADER CARD */}
          <div className={styles.detailHero}>
            <div className={styles.detailHeroTop}>
              <span className={`${styles.statusBadge} ${getStatusClass(activity.status ?? "")}`}>
                {activity.status ?? "—"}
              </span>
              <span className={styles.activityId}>#{activity.id}</span>
            </div>

            <h1 className={styles.detailTitle}>{activity.title}</h1>

            {trek && (
              <div className={styles.detailTrekName}>
                🗺 Trek: <strong>{trek.name}</strong>
              </div>
            )}

            {activity.description && (
              <p className={styles.detailDescription}>{activity.description}</p>
            )}
          </div>

          {/* INFO GRID */}
          <div className={styles.detailGrid}>

            {/* Data e ora */}
            <div className={styles.detailCard}>
              <span className={styles.detailCardIcon}>📅</span>
              <div>
                <span className={styles.detailCardLabel}>Data</span>
                <span className={styles.detailCardValue}>
                  {formatDate(activity.activityDate)}
                </span>
                <span className={styles.detailCardSub}>
                  ore {formatTime(activity.activityDate)}
                </span>
              </div>
            </div>

            {/* Modalità */}
            <div className={styles.detailCard}>
              <span className={styles.detailCardIcon}></span>
              <div>
                <span className={styles.detailCardLabel}>Modalità</span>
                <span className={styles.detailCardValue}>
                  {formatTravelMode(activity.travelMode ?? "")}
                </span>
              </div>
            </div>

            {/* Partecipanti */}
            <div className={styles.detailCard}>
              <span className={styles.detailCardIcon}>👥</span>
              <div>
                <span className={styles.detailCardLabel}>Max partecipanti</span>
                <span className={styles.detailCardValue}>
                  {activity.maxParticipants} persone
                </span>
              </div>
            </div>

            {/* Organizzatore */}
            <div className={styles.detailCard}>
              <span className={styles.detailCardIcon}>👤</span>
              <div>
                <span className={styles.detailCardLabel}>Organizzatore</span>
                <span className={styles.detailCardValue}>
                  {organizer
                    ? organizer.name || organizer.username || organizer.email
                    : "—"}
                </span>
                {isOrganizer && (
                  <span className={styles.detailCardSub}>Sei tu l'organizzatore</span>
                )}
              </div>
            </div>

          </div>

          {/* TREK INFO (se disponibile) */}
          {trek && (trek.distance || trek.duration || trek.difficulty || trek.description) && (
            <div className={styles.formCard}>
              <h2 className={styles.detailSectionTitle}>Dettagli del trek</h2>

              {trek.description && (
                <p className={styles.activityDescription}>{trek.description}</p>
              )}

              <div className={styles.activityInfo}>
                {trek.difficulty && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Difficoltà</span>
                    <span className={styles.infoValue}>{trek.difficulty}</span>
                  </div>
                )}
                {trek.distance && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Distanza</span>
                    <span className={styles.infoValue}>{trek.distance} km</span>
                  </div>
                )}
                {trek.duration && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Durata stimata</span>
                    <span className={styles.infoValue}>{trek.duration} min</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ACTIONS */}
          {!isOrganizer && (
            <div className={styles.detailActions}>
              <button
                className={styles.primaryButton}
                onClick={handleJoin}
                disabled={!canJoin}
                title={!canJoin ? `Attività ${(activity.status ?? "").toLowerCase()}, iscrizione non disponibile` : ""}
              >
                {canJoin ? "Partecipa all'attività" : `Iscrizione non disponibile (${activity.status ?? ""})`}
              </button>

              {joinMessage && (
                <p className={styles.message}>{joinMessage}</p>
              )}
            </div>
          )}

        </div>

        <div className={appStyles.rightColumn}>
          <div className={styles.buttonBox}>
            <Link to="/attivita/visualizza" className={styles.primaryButton}>
              Lista attività
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
