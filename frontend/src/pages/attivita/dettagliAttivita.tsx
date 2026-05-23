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
  duration?: number;
  distance?: number;
  description?: string;
};

type Organizer = {
  _id: string;
  nome?: string;
  cognome?: string;
  nickname?: string;
  email?: string;
};

type Participant = {
  _id: string;
  nickname: string;
  email: string;
  nome?: string;
  cognome?: string;
};

type ActivityPopulated = Omit<Activity, "partecipantList"> & {
  partecipantList: Participant[];
};

export default function DettagliAttivita() {
  const { id } = useParams();
  const { user } = useAuth();

  const [activity, setActivity] = useState<ActivityPopulated | null>(null);
  const [trek, setTrek] = useState<Trek | null>(null);
  const [organizer, setOrganizer] = useState<Organizer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinMessage, setJoinMessage] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const resActivity = await fetch(`http://localhost:3000/activities/${id}`);
        if (!resActivity.ok) {
          const err = await resActivity.json().catch(() => ({}));
          throw new Error(err.error || err.message || `Errore ${resActivity.status}`);
        }
        const activityData: ActivityPopulated = await resActivity.json();
        setActivity(activityData);

        if (activityData.trekID) {
          const resTrek = await fetch(`http://localhost:3000/treks/${activityData.trekID}`);
          if (resTrek.ok) setTrek(await resTrek.json());
        }

        if (activityData.organizerID) {
          const resOrg = await fetch(`http://localhost:3000/users/${activityData.organizerID}`);
          if (resOrg.ok) setOrganizer(await resOrg.json());
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [id]);

  async function confirmJoin() {
    setJoinLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/activities/${id}/join`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userID: user?._id }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || "Errore nella partecipazione");
      }

      const updated: ActivityPopulated = await res.json();
      setActivity(updated);
      setJoinMessage("Partecipazione confermata ✔");
      setTimeout(() => setJoinMessage(""), 4000);
    } catch (err: any) {
      setJoinMessage(err.message || "Errore");
      setTimeout(() => setJoinMessage(""), 4000);
    } finally {
      setJoinLoading(false);
      setShowConfirmModal(false);
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
      weekday: "long", day: "2-digit", month: "long", year: "numeric",
    });

  const formatTime = (date: string | Date) =>
    new Date(date).toLocaleTimeString("it-IT", {
      hour: "2-digit", minute: "2-digit",
    });

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

  const currentUserID = user?._id;
  const isOrganizer = !!currentUserID && activity.organizerID?.toString() === currentUserID;
  const isParticipant = !isOrganizer && activity.partecipantList.some((p) => p._id === currentUserID);
  const participantCount = activity.partecipantList.length;
  const spotsLeft = activity.maxParticipants - participantCount;
  const canJoin = !isOrganizer && !isParticipant && activity.status === "Aperto" && spotsLeft > 0;

  return (
    <main className={styles.page}>
      <div className={appStyles.contentLayout}>

        {/* ── SINISTRA ── */}
        <div className={appStyles.leftColumn}>

          {/* Hero */}
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

          {/* Info grid */}
          <div className={styles.detailGrid}>

            <div className={styles.detailCard}>
              <span className={styles.detailCardIcon}>📅</span>
              <div>
                <span className={styles.detailCardLabel}>Data</span>
                <span className={styles.detailCardValue}>{formatDate(activity.activityDate)}</span>
                <span className={styles.detailCardSub}>ore {formatTime(activity.activityDate)}</span>
              </div>
            </div>

            <div className={styles.detailCard}>
              <span className={styles.detailCardIcon}>🏃</span>
              <div>
                <span className={styles.detailCardLabel}>Modalità</span>
                <span className={styles.detailCardValue}>{formatTravelMode(activity.travelMode ?? "")}</span>
              </div>
            </div>

            <div className={styles.detailCard}>
              <span className={styles.detailCardIcon}>👥</span>
              <div>
                <span className={styles.detailCardLabel}>Partecipanti</span>
                <span className={styles.detailCardValue}>{participantCount} / {activity.maxParticipants}</span>
                <span className={styles.detailCardSub}>
                  {spotsLeft > 0
                    ? `${spotsLeft} post${spotsLeft === 1 ? "o" : "i"} disponibil${spotsLeft === 1 ? "e" : "i"}`
                    : "Attività al completo"}
                </span>
              </div>
            </div>

            <div className={styles.detailCard}>
              <span className={styles.detailCardIcon}>👤</span>
              <div>
                <span className={styles.detailCardLabel}>Organizzatore</span>
                <span className={styles.detailCardValue}>
                  {organizer
                    ? organizer.nickname || `${organizer.nome ?? ""} ${organizer.cognome ?? ""}`.trim() || organizer.email
                    : "—"}
                </span>
                {isOrganizer && (
                  <span className={styles.detailCardSub}>Sei tu l'organizzatore</span>
                )}
              </div>
            </div>

          </div>

          {/* Trek details */}
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

          {/* ── I 3 SCENARI ── */}
          <div className={styles.detailActions}>

            {/* 1. Organizzatore */}
            {isOrganizer && (
              <div className={styles.organizerBadge}>
                ✅ Sei l'organizzatore di questa attività
              </div>
            )}

            {/* 2. Può partecipare */}
            {canJoin && (
              <>
                <button className={styles.primaryButton} onClick={() => setShowConfirmModal(true)}>
                  Partecipa all'attività
                </button>
                {joinMessage && <p className={styles.message}>{joinMessage}</p>}
              </>
            )}

            {/* 2b. Non può partecipare (attività chiusa/annullata o al completo) */}
            {!isOrganizer && !isParticipant && !canJoin && (
              <button className={styles.primaryButton} disabled>
                {activity.status !== "Aperto"
                  ? `Iscrizione non disponibile (${activity.status ?? ""})`
                  : "Attività al completo"}
              </button>
            )}

            {/* 3. Già partecipante */}
            {isParticipant && (
              <>
                <div className={styles.alreadyJoinedBadge}>
                  ✅ Partecipi già a questa attività
                </div>
                {joinMessage && <p className={styles.message}>{joinMessage}</p>}
              </>
            )}

          </div>

        </div>

        {/* ── DESTRA: lista partecipanti ── */}
        <div className={appStyles.rightColumn}>
          <div className={styles.buttonBox}>
            <Link to="/attivita/visualizza" className={styles.primaryButton}>
              Lista attività
            </Link>
          </div>

          {!isOrganizer && !isParticipant && !canJoin && (
              <button className={styles.primaryButton} disabled>
                {activity.status !== "Aperto"
                  ? `Iscrizione non disponibile (${activity.status ?? ""})`
                  : "Attività al completo"}
              </button>
            )}

          <div className={styles.formCard}>
            <h2 className={styles.detailSectionTitle}>
              Partecipanti ({participantCount})
            </h2>

            {activity.partecipantList.length === 0 ? (
              <p className={styles.message}>Nessun partecipante ancora.</p>
            ) : (
              <ul className={styles.participantList}>
                {activity.partecipantList.map((p, i) => (
                  <li key={p._id} className={styles.participantItem}>
                    <div className={styles.participantAvatar}>
                      {(p.nickname?.[0] ?? p.email?.[0] ?? "?").toUpperCase()}
                    </div>
                    <div className={styles.participantInfo}>
                      <span className={styles.participantNickname}>
                        {p.nickname}
                        {i === 0 && (
                          <span className={styles.organizerTag}> 👑</span>
                        )}
                      </span>
                      {/* Email visibile solo all'organizzatore */}
                      {isOrganizer && (
                        <span className={styles.participantEmail}>{p.email}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      </div>

      {/* ── MODAL CONFERMA ── */}
      {showConfirmModal && (
        <div className={styles.modalOverlay} onClick={() => setShowConfirmModal(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Conferma partecipazione</h2>
            <p className={styles.modalBody}>
              Partecipando a questa attività il tuo <strong>nickname</strong> sarà visibile a tutti nella pagina dell'attività e la tua{" "}
              <strong>email</strong> sarà condivisa con l'organizzatore.
            </p>
            <p className={styles.modalBody}>
              Organizzatore:{" "}
              <strong>
                {organizer?.nickname ||
                  `${organizer?.nome ?? ""} ${organizer?.cognome ?? ""}`.trim() ||
                  "—"}
              </strong>
            </p>
            <div className={styles.modalActions}>
              <button
                className={styles.secondaryButton}
                onClick={() => setShowConfirmModal(false)}
                disabled={joinLoading}
              >
                Annulla
              </button>
              <button
                className={styles.primaryButton}
                onClick={confirmJoin}
                disabled={joinLoading}
              >
                {joinLoading ? "Iscrizione in corso..." : "Conferma"}
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
