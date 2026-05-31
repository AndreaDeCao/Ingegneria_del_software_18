import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import styles from "./attivitaPage.module.css";
import appStyles from "../../App.module.css";
import { useAuth } from "../../auth/AuthProvider";
import type { Activity } from "../../types/Activity";
import type {Trek} from "../../types/Trek";
import type {Organizer} from "../../types/Organizer";
import type {Participant} from "../../types/Participant";

type ActivityPopulated = Omit<Activity, "partecipantList"> & {
  partecipantList: Participant[];
};

type ModalType = "join" | "leave" | "cancel" | "uncancel" | "delete" | null;

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export default function DettagliAttivita() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activity, setActivity] = useState<ActivityPopulated | null>(null);
  const [trek, setTrek] = useState<Trek | null>(null);
  const [organizer, setOrganizer] = useState<Organizer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // const resActivity = await fetch(`http://localhost:3000/activities/${id}`);
        const resActivity = await fetch(`${API_BASE}/activities/${id}`);
        if (!resActivity.ok) {
          const err = await resActivity.json().catch(() => ({}));
          throw new Error(err.error || err.message || `Errore ${resActivity.status}`);
        }
        const activityData: ActivityPopulated = await resActivity.json();
        activityData.partecipantList = activityData.partecipantList ?? [];
        setActivity(activityData);

        if (activityData.trekID) {
          // 1. Recupera l'id numerico partendo dall'_id Mongo
          const resId = await fetch(
            `${API_BASE}/treks/by-mongo-id/${activityData.trekID}`
          );

          if (!resId.ok) return;

          const { id } = await resId.json();

          // 2. Recupera il trek usando l'id numerico
          const resTrek = await fetch(`${API_BASE}/treks/${id}`);

          if (resTrek.ok) setTrek(await resTrek.json());

        }

        if (activityData.organizerID) {
          const resOrg = await fetch(`${API_BASE}/users/${activityData.organizerID}`);
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

  function showMessage(msg: string) {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(""), 4000);
  }

  async function handleAction(endpoint: string, method: string) {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/activities/${id}/${endpoint}`, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userID: user?._id }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || "Errore");
      }
      const updated: ActivityPopulated = await res.json();
      updated.partecipantList = updated.partecipantList ?? [];
      setActivity(updated);
//      showMessage(
//        endpoint === "join" ? "Partecipazione confermata" :
//        endpoint === "leave" ? "Hai lasciato l'attività" :
//        endpoint === "cancel" ? "Attività annullata" :
//        endpoint === "uncancel" ? "Attività riattivata" :
//        endpoint === "open" ? "Attività raperta" :
//        endpoint === "close" ? "Attività chiusa" :
//        endpoint === "delete" ? "Attività eliminata" :
//        "N/A"
//      );
    } catch (err: any) {
      showMessage(err.message || "Errore");
    } finally {
      setActionLoading(false);
      setActiveModal(null);
    }
  }

  async function handleDelete() {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/activities/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userID: user?._id }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || "Errore durante l'eliminazione");
      }
      navigate("/attivita/visualizza");
    } catch (err: any) {
      showMessage(err.message || "Errore");
      setActiveModal(null);
    } finally {
      setActionLoading(false);
    }
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Annullato": return styles.statusCancelled;
      case "Chiuso":    return styles.statusClosed;
      case "Aperto":    return styles.statusAvailable;
      default:          return styles.statusAvailable;
    }
  };

  const formatTravelMode = (mode: string) => {
    switch (mode) {
      case "walking":   return "A piedi";
      case "bicycling": return "In bicicletta";
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

  if (loading) return <main className={styles.page}><p className={styles.message}>Caricamento attività...</p></main>;
  if (error || !activity) return <main className={styles.page}><p className={styles.messageError}>{error || "Attività non trovata"}</p></main>;

  const currentUserID = user?._id;
  const isOrganizer = !!currentUserID && activity.organizerID?.toString() === currentUserID;
  const isParticipant = !isOrganizer && activity.partecipantList.some((p) => p._id === currentUserID);
  const participantCount = activity.partecipantList.length;
  const spotsLeft = activity.maxParticipants - participantCount;
  const isExpired = new Date(activity.activityDate).getTime() < Date.now();
  const canJoin = !isOrganizer && !isParticipant && activity.status === "Aperto" && spotsLeft > 0 && !isExpired;

  const organizerName = organizer?.nickname ||
    `${organizer?.nome ?? ""} ${organizer?.cognome ?? ""}`.trim() ||
    organizer?.email || "—";

  return (
    <main className={styles.page}>
      <div className={appStyles.contentLayout}>

        {/* ── SINISTRA ── */}
        <div className={appStyles.leftColumn}>
          <div style={{ paddingBottom: "20px" }}>
            {isOrganizer && (
                <>
                  <div className={styles.organizerBadge}>Sei l'organizzatore di questa attività</div>
                </>
            )}
            {isParticipant && (
              <>
                <div className={styles.alreadyJoinedBadge}>Partecipi a questa attività</div>
                </>
            )}
            {isExpired && (
                <div className={styles.errorBox}>
                  Questa attività è scaduta — la data era il {new Date(activity.activityDate).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })}
                </div>
            )}
          </div>

          {/* Hero */}
          <div className={styles.detailHero}>
            <div className={styles.detailHeroTop}>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                {(() => { const effectiveStatus = (activity.status === "Aperto" && isExpired) ? "Chiuso" : activity.status; return <span className={`${styles.statusBadge} ${getStatusClass(effectiveStatus ?? "")}`}>{effectiveStatus ?? "—"}</span>; })()}
              </div>
              <span className={styles.activityId}>#{activity._id}</span>
            </div>
            <h1 className={styles.detailTitle}>{activity.title}</h1>
            {trek && <div className={styles.detailTrekName}>Trek: <strong>{trek.name}</strong></div>}
            {activity.description && <p className={styles.detailDescription}>{activity.description}</p>}
          </div>

          {/* Info grid */}
          <div className={styles.detailGrid}>
            <div className={styles.detailCard}>
              <div>
                <span className={styles.detailCardLabel}>Data</span>
                <span className={styles.detailCardValue}>{formatDate(activity.activityDate)}</span>
                <span className={styles.detailCardSub}>ore {formatTime(activity.activityDate)}</span>
              </div>
            </div>

            <div className={styles.detailCard}>
              <div>
                <span className={styles.detailCardLabel}>Modalità</span>
                <span className={styles.detailCardValue}>{formatTravelMode(activity.travelMode ?? "")}</span>
              </div>
            </div>

            <div className={styles.detailCard}>
              <div>
                <span className={styles.detailCardLabel}>Partecipanti</span>
                <span className={styles.detailCardValue}>{participantCount} / {activity.maxParticipants}</span>
                <span className={styles.detailCardSub}>
                  {spotsLeft > 0 ? `${spotsLeft} post${spotsLeft === 1 ? "o" : "i"} disponibil${spotsLeft === 1 ? "e" : "i"}` : "Attività al completo"}
                </span>
              </div>
            </div>

            <div className={styles.detailCard}>
              <div>
                <span className={styles.detailCardLabel}>Organizzatore</span>
                <span className={styles.detailCardValue}>{organizerName}</span>
                {isOrganizer && <span className={styles.detailCardSub}>Sei tu l'organizzatore</span>}
              </div>
            </div>
          </div>

          {/* Trek details */}
          {trek && (trek.lengthKm || trek.duration || trek.difficulty || trek.description) && (
            <Link to={`/treks/${trek.id}`} className={styles.formCard}>
              <h2 className={styles.detailSectionTitle}>Dettagli del trek</h2>
              {trek.description && <p className={styles.activityDescription}>{trek.description}</p>}
              <div className={styles.activityInfo}>
                {trek.difficulty && <div className={styles.infoItem}><span className={styles.infoLabel}>Difficoltà</span><span className={styles.infoValue}>{trek.difficulty}</span></div>}
                {trek.lengthKm && <div className={styles.infoItem}><span className={styles.infoLabel}>Distanza</span><span className={styles.infoValue}>{trek.lengthKm} km</span></div>}
                {trek.duration && <div className={styles.infoItem}><span className={styles.infoLabel}>Durata stimata</span><span className={styles.infoValue}>{trek.duration}</span></div>}
              </div>
            </Link>
          )}

          {/* ── AZIONI ── */}
          <div className={styles.detailActions}>

            {/* Organizzatore */}
            {isOrganizer && (
              <>
                <div className={styles.buttonActions}>
                  {activity.status !== "Annullato" && (
                    <button className={styles.dangerButton} disabled={isExpired} onClick={() => setActiveModal("cancel")}>
                      Annulla attività
                    </button>
                  )}
                  {activity.status === "Annullato" && (
                    <button className={styles.dangerButton} disabled={isExpired} onClick={() => setActiveModal("uncancel")}>
                      Riattiva attività
                    </button>
                  )}
                  {activity.status !== "Annullato" && activity.status === "Chiuso" && participantCount < activity.maxParticipants && (
                    <button className={styles.dangerButton} disabled={isExpired} onClick={() => handleAction("open", "PATCH")}>
                      Apri attività
                    </button>
                  )}
                  {activity.status !== "Annullato" && activity.status === "Aperto" && (
                    <button className={styles.dangerButton} disabled={isExpired} onClick={() => handleAction("close", "PATCH")}>
                      Chiudi attività
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Può partecipare */}
            {canJoin && (
              <button className={appStyles.primaryButton} onClick={() => setActiveModal("join")}>
                Partecipa all'attività
              </button>
            )}

            {/* Non può partecipare */}
            {!isOrganizer && !isParticipant && !canJoin && (
              <button className={appStyles.primaryButton} disabled>
                {activity.status !== "Aperto" ? `Iscrizione non disponibile (${activity.status ?? ""})` : "Attività al completo"}
              </button>
            )}

            {/* Già partecipante */}
            {isParticipant && (
              <>
                <div className={styles.buttonActions}>
                  <button className={styles.leaveButton} disabled={isExpired} onClick={() => setActiveModal("leave")}>
                    Lascia attività
                  </button>
                </div>
              </>
            )}

            {actionMessage && <p className={styles.message}>{actionMessage}</p>}
          </div>

        </div>

        {/* ── DESTRA ── */}
        <div className={appStyles.rightColumn}>
            <div className={appStyles.buttonBox}>
              <Link to="/attivita/visualizza" className={appStyles.primaryButton}>
                Lista attività
              </Link>
              <Link to="/attivita/crea" className={appStyles.primaryButton}>
                + Crea attività
              </Link>
            </div>

          <div className={styles.formCard}>
            <h2 className={styles.detailSectionTitle}>Partecipanti ({participantCount})</h2>

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
                        {i === 0 && <span className={styles.organizerTag}> (organizzatore) </span>}
                      </span>
                      {isOrganizer && <span className={styles.participantEmail}>{p.email}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      </div>

      {/* ── MODALI ── */}

      {/* Join */}
      {activeModal === "join" && (
        <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Conferma partecipazione</h2>
            <p className={styles.modalBody}>
              Il tuo <strong>nickname</strong> sarà visibile a tutti nella pagina dell'attività e la tua <strong>email</strong> sarà condivisa con l'organizzatore (<strong>{organizerName}</strong>).
            </p>
            <div className={styles.modalActions}>
              <button className={appStyles.secondaryButton} onClick={() => setActiveModal(null)} disabled={actionLoading}>Annulla</button>
              <button className={appStyles.primaryButton} onClick={() => handleAction("join", "POST")} disabled={actionLoading}>
                {actionLoading ? "Iscrizione in corso..." : "Conferma"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave */}
      {activeModal === "leave" && (
        <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Lascia attività</h2>
            <p className={styles.modalBody}>Sei sicuro di voler abbandonare questa attività? Potrai re-iscriverti finché ci sono posti disponibili.</p>
            <div className={styles.modalActions}>
              <button className={appStyles.secondaryButton} onClick={() => setActiveModal(null)} disabled={actionLoading}>Annulla</button>
              <button className={styles.dangerButton} onClick={() => handleAction("leave", "POST")} disabled={actionLoading}>
                {actionLoading ? "Attendere..." : "Lascia attività"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel */}
      {activeModal === "cancel" && (
        <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Annulla attività</h2>
            <p className={styles.modalBody}>Sei sicuro di voler annullare <strong>{activity.title}</strong>? Questa azione è reversibile.</p>
            <div className={styles.modalActions}>
              <button className={appStyles.secondaryButton} onClick={() => setActiveModal(null)} disabled={actionLoading}>Indietro</button>
              <button className={styles.dangerButton} onClick={() => handleAction("cancel", "PATCH")} disabled={actionLoading}>
                {actionLoading ? "Attendere..." : "Annulla attività"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Uncancel */}
      {activeModal === "uncancel" && (
        <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Riattiva attività</h2>
            <p className={styles.modalBody}>Sei sicuro di voler riattivare <strong>{activity.title}</strong>? Questa azione potrebbe riaprire l'attività a nuovi partecipanti.</p>
            <div className={styles.modalActions}>
              <button className={appStyles.secondaryButton} onClick={() => setActiveModal(null)} disabled={actionLoading}>Indietro</button>
              <button className={styles.dangerButton} onClick={() => handleAction("uncancel", "PATCH")} disabled={actionLoading}>
                {actionLoading ? "Attendere..." : "Riattiva attività"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === "delete" && (
        <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Elimina attività</h2>
            <p className={styles.modalBody}>
              Stai per eliminare definitivamente <strong>{activity.title}</strong> dal database.
              <br /><br />
              <strong>Questa operazione è irreversibile</strong> e non potrà essere annullata.
            </p>
            <div className={styles.modalActions}>
              <button className={appStyles.secondaryButton} onClick={() => setActiveModal(null)} disabled={actionLoading}>Annulla</button>
              <button className={styles.dangerButton} onClick={handleDelete} disabled={actionLoading}>
                {actionLoading ? "Eliminazione in corso..." : "Elimina definitivamente"}
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
