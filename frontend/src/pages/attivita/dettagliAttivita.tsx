import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

import styles from "./attivitaPage.module.css";
import appStyles from "../../App.module.css";

import { useAuth } from "../../auth/AuthProvider";
import { http } from "../../auth/api";

import type { Activity } from "../../types/Activity";
import type {Trek} from "../../types/Trek";
import type {Organizer} from "../../types/Organizer";
import type {Participant} from "../../types/Participant";

type ActivityPopulated = Omit<Activity, "partecipantList"> & {
  partecipantList: Participant[];
};

type ModalType = "join" | "leave" | "cancel" | "uncancel" | "delete" | "report" | null;

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

function Banner({
  msg,
  type,
  onClose,
}: {
  msg: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  return (
    <div className={`${styles.banner} ${type === "success" ? styles.bannerSuccess : styles.bannerError}`}>
      <span>{msg}</span>
      <button className={styles.bannerClose} onClick={onClose} aria-label="Chiudi">
        ✕
      </button>
    </div>
  );
}

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
  const [reportError, setReportError] = useState("");

  const [banner, setBanner] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Nuovi state per le segnalazioni
  const [reportReason, setReportReason] = useState("");
  const [reportSuccess, setReportSuccess] = useState(false);

  async function loadPageData() {
    try {
      setError(null);
      const resActivity = await fetch(`${API_BASE}/activities/${id}`);
      if (!resActivity.ok) {
        const err = await resActivity.json().catch(() => ({}));
        throw new Error(err.error || err.message || `Errore ${resActivity.status}`);
      }

      const activityData: ActivityPopulated = await resActivity.json();
      activityData.partecipantList = activityData.partecipantList ?? [];
      setActivity(activityData);

      if (activityData.trekID) {
        const resId = await fetch(`${API_BASE}/treks/by-mongo-id/${activityData.trekID}`);
        if (resId.ok) {
          const { id: trekNumericId } = await resId.json();
          const resTrek = await fetch(`${API_BASE}/treks/${trekNumericId}`);
          if (resTrek.ok) setTrek(await resTrek.json());
        }
      }

      if (activityData.organizerID) {
        const resOrg = await fetch(`${API_BASE}/users/${activityData.organizerID}`);
        if (resOrg.ok) setOrganizer(await resOrg.json());
      }

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Errore nel caricamento dei dati");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    void loadPageData();
  }, [id, user?._id]);

  function showBanner(msg: string, type: "success" | "error") {
    setBanner({ msg, type });
  }

  async function handleAction(endpoint: string, method: string) {
    setActionLoading(true);
    try {
      const updated = await http<ActivityPopulated>(`/activities/${id}/${endpoint}`, {
        method,
        body: JSON.stringify({ userID: user?._id }),
      });
      updated.partecipantList = updated.partecipantList ?? [];
      setActivity(updated);
    } catch (err: any) {
      showBanner(err.message || "Errore", "error");
    } finally {
      setActionLoading(false);
      setActiveModal(null);
    }
  }

  async function handleDelete() {
    setActionLoading(true);
    try {
      await http<{ message: string }>(`/activities/${id}`, {
        method: "DELETE",
        body: JSON.stringify({ userID: user?._id }),
      });
      navigate("/attivita/visualizza");
    } catch (err: any) {
      showBanner(err.message || "Errore", "error");
      setActiveModal(null);
    } finally {
      setActionLoading(false);
    }
  }

  // Funzione per gestire la segnalazione
  async function handleReport() {
    // Validazione: motivo obbligatorio
    if (!reportReason.trim()) {
      setReportError("Il motivo della segnalazione è obbligatorio");
      return;
    }

    setReportError(""); // Resetta l'errore
    setActionLoading(true);
    
    try {
      await http<{ message: string }>(`/activities/${id}/report`, {
        method: "POST",
        body: JSON.stringify({ userID: user?._id, reason: reportReason }),
      });
      
      // Opzionale: ricarica l'attività per ottenere dati aggiornati
      const updatedActivity = await http<ActivityPopulated>(`/activities/${id}`, {
        method: "GET",
      });
      updatedActivity.partecipantList = updatedActivity.partecipantList ?? [];
      setActivity(updatedActivity);
      
      setReportSuccess(true);
      setReportReason("");
      setActiveModal(null); // Chiudi il modal solo se successo
    } catch (err: any) {
      setReportError(err.message || "Errore nell'invio della segnalazione");
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

  const organizerName = organizer?.nickname || `${organizer?.nome ?? ""} ${organizer?.cognome ?? ""}`.trim() || organizer?.email || "—";

  // Nuove variabili per le segnalazioni
  const reports = (activity as any).reports ?? [];
  const myReport = currentUserID
    ? reports.find((r: any) => (r.reportedBy?._id ?? r.reportedBy)?.toString() === currentUserID)
    : undefined;
  const hasAlreadyReported = !!myReport;
  const acceptedReports = reports.filter((r: any) => r.reportStatus === "accepted");
  const hasAcceptedReport = acceptedReports.length > 0;
  const isSuspended = (activity as any).suspended === true;

  const effectiveStatus = (activity.status === "Aperto" && isExpired) ? "Chiuso" : activity.status;

  return (
    <main className={styles.page}>
      <div className={appStyles.contentLayout}>

        {/* ── SINISTRA ── */}
        <div className={appStyles.leftColumn}>

          {/* Banner sospensione (nuovo) */}
          {isSuspended && (
            <div className={styles.suspendedBanner}>
              <span className={styles.suspendedBannerTitle}>Attività sospesa dall'amministrazione</span>
              {(activity as any).suspendedReason ? (
                <span className={styles.suspendedBannerReason}>Motivo: {(activity as any).suspendedReason}</span>
              ) : (
                <span className={styles.suspendedBannerReason}>Nessun motivo specificato. Contatta l'amministrazione per maggiori informazioni.</span>
              )}
            </div>
          )}

          {/* Banner segnalazioni accettate (nuovo) */}
          {hasAcceptedReport && (
            <div className={styles.reportedBanner}>
              <span className={styles.reportedBannerTitle}>
                {isOrganizer ? "La tua attività è stata segnalata" : "Questa attività è stata segnalata"}
              </span>
              <span className={styles.reportedBannerReason}>
                {isOrganizer
                  ? `${acceptedReports.length} segnalazion${acceptedReports.length === 1 ? "e" : "i"} accettat${acceptedReports.length === 1 ? "a" : "e"} dall'amministrazione. Controlla il contenuto dell'attività e contatta l'amministrazione se ritieni sia un errore.`
                  : `${acceptedReports.length} segnalazion${acceptedReports.length === 1 ? "e" : "i"} accettat${acceptedReports.length === 1 ? "a" : "e"} dall'amministrazione. Procedi con cautela.`}
              </span>
            </div>
          )}

          <div style={{ paddingBottom: "20px" }}>
            {isOrganizer && !isSuspended && (
              <div className={styles.organizerBadge}>Sei l'organizzatore di questa attività</div>
            )}
            {isOrganizer && isSuspended && (
              <div className={styles.organizerBadge}>
                Sei l'organizzatore — la gestione è temporaneamente bloccata dall'amministrazione
              </div>
            )}
            {isParticipant && (
              <div className={styles.alreadyJoinedBadge}>Partecipi a questa attività</div>
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
                <span className={`${styles.statusBadge} ${getStatusClass(effectiveStatus ?? "")}`}>
                  {effectiveStatus ?? "—"}
                </span>
                {isSuspended && (
                  <span className={`${styles.statusBadge} ${styles.statusSuspended}`}>Sospesa</span>
                )}
                {hasAcceptedReport && (
                  <span className={`${styles.statusBadge} ${styles.statusReported}`}>Segnalata</span>
                )}
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
              {trek.name && <p className={styles.activityName}>{trek.name}</p>}
              <div className={styles.activityInfo}>
                {trek.difficulty && <div className={styles.infoItem}><span className={styles.infoLabel}>Difficoltà</span><span className={styles.infoValue}>{trek.difficulty}</span></div>}
                {trek.lengthKm && <div className={styles.infoItem}><span className={styles.infoLabel}>Distanza</span><span className={styles.infoValue}>{trek.lengthKm} km</span></div>}
                {trek.duration && <div className={styles.infoItem}><span className={styles.infoLabel}>Durata stimata</span><span className={styles.infoValue}>{trek.duration}</span></div>}
              </div>
            </Link>
          )}

          {/* ── AZIONI ── */}
          <div className={styles.detailActions}>

            {/* Organizzatore - con controllo sospensione */}
            {isOrganizer && (
              <>
                <div className={styles.buttonActions}>
                  {activity.status !== "Annullato" && (
                    <button 
                      className={styles.dangerButton} 
                      disabled={isExpired || isSuspended}
                      title={isSuspended ? "Attività sospesa — azione non disponibile" : undefined}
                      onClick={() => setActiveModal("cancel")}
                    >
                      Annulla attività
                    </button>
                  )}
                  {activity.status === "Annullato" && (
                    <button 
                      className={styles.dangerButton} 
                      disabled={isExpired || isSuspended}
                      title={isSuspended ? "Attività sospesa — azione non disponibile" : undefined}
                      onClick={() => setActiveModal("uncancel")}
                    >
                      Riattiva attività
                    </button>
                  )}
                  {activity.status !== "Annullato" && activity.status === "Chiuso" && participantCount < activity.maxParticipants && (
                    <button 
                      className={styles.dangerButton} 
                      disabled={isExpired || isSuspended}
                      title={isSuspended ? "Attività sospesa — azione non disponibile" : undefined}
                      onClick={() => handleAction("open", "PATCH")}
                    >
                      Apri attività
                    </button>
                  )}
                  {activity.status !== "Annullato" && activity.status === "Aperto" && (
                    <button 
                      className={styles.dangerButton} 
                      disabled={isExpired || isSuspended}
                      title={isSuspended ? "Attività sospesa — azione non disponibile" : undefined}
                      onClick={() => handleAction("close", "PATCH")}
                    >
                      Chiudi attività
                    </button>
                  )}
                  <button 
                    className={styles.dangerButton} 
                    disabled={isSuspended}
                    title={isSuspended ? "Attività sospesa — azione non disponibile" : undefined}
                    onClick={() => setActiveModal("delete")}
                  >
                    Elimina attività
                  </button>
                </div>
              </>
            )}

            {/* Può partecipare - con controllo sospensione */}
            {canJoin && !isSuspended && (
              <button className={appStyles.primaryButton} onClick={() => setActiveModal("join")}>
                Partecipa all'attività
              </button>
            )}

            {/* Non può partecipare */}
            {!isOrganizer && !isParticipant && !canJoin && (
              <button className={appStyles.primaryButton} disabled>
                {activity.status !== "Aperto"
                  ? `Iscrizione non disponibile (${activity.status ?? ""})`
                  : isExpired
                    ? "Attività scaduta"
                    : isSuspended
                      ? "Attività sospesa"
                      : "Attività al completo"}
              </button>
            )}

            {/* Già partecipante - con controllo sospensione */}
            {isParticipant && (
              <>
                <div className={styles.buttonActions}>
                  <button 
                    className={styles.leaveButton} 
                    disabled={isExpired || isSuspended}
                    onClick={() => setActiveModal("leave")}
                  >
                    Lascia attività
                  </button>
                </div>
              </>
            )}

            {/* Bottone segnalazione (nuovo) */}
            {!isOrganizer && currentUserID && (
              <div style={{ marginTop: "8px" }}>
                {reportSuccess && !hasAlreadyReported && (
                  <div className={styles.reportedConfirmBadge}>
                    Segnalazione inviata. L'amministrazione esaminerà la segnalazione.
                  </div>
                )}
                {hasAlreadyReported && (
                  <div className={styles.reportedConfirmBadge}>
                    {myReport.reportStatus === "pending" && (
                      <>
                        <strong>Hai segnalato questa attività.</strong>
                        <br />La segnalazione è in attesa di revisione da parte dell'amministrazione.
                        {myReport.reason && (<><br /><span style={{ opacity: 0.8 }}>Motivo: {myReport.reason}</span></>)}
                        <br />
                        <span style={{ opacity: 0.7, fontSize: "12px" }}>
                          Segnalata il {new Date(myReport.reportedAt).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })}
                        </span>
                      </>
                    )}
                    {myReport.reportStatus === "accepted" && (
                      <>
                        <strong>La tua segnalazione è stata accettata dall'amministrazione.</strong>
                        <br />Grazie per la segnalazione. L'attività è ora contrassegnata come segnalata.
                        {myReport.reason && (<><br /><span style={{ opacity: 0.8 }}>Motivo: {myReport.reason}</span></>)}
                      </>
                    )}
                    {myReport.reportStatus === "dismissed" && (
                      <>
                        <strong>La tua segnalazione è stata esaminata e rigettata dall'amministrazione.</strong>
                        {myReport.reason && (<><br /><span style={{ opacity: 0.8 }}>Motivo inviato: {myReport.reason}</span></>)}
                        {myReport.reviewNote && (<><br /><span style={{ opacity: 0.8 }}>Nota admin: {myReport.reviewNote}</span></>)}
                      </>
                    )}
                  </div>
                )}
                {!hasAlreadyReported && !reportSuccess && (
                  <button className={styles.reportButton} onClick={() => setActiveModal("report")}>
                    Segnala attività
                  </button>
                )}
              </div>
            )}

          </div>

        </div>

        {/* ── DESTRA ── */}
        <div className={appStyles.rightColumn}>
            {banner && (
              <Banner
                msg={banner.msg}
                type={banner.type}
                onClose={() => setBanner(null)}
              />
            )}
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

      {/* Delete */}
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

      {/* Report Modal (nuovo) */}
      {activeModal === "report" && (
        <div className={styles.modalOverlay} onClick={() => {
          setActiveModal(null);
          setReportError(""); // Resetta errore alla chiusura
        }}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Segnala attività</h2>
            <p className={styles.modalBody}>
              La tua segnalazione sarà esaminata dall'amministrazione. Puoi specificare il motivo qui sotto.
            </p>
            
            <div>
              <label className={styles.label} style={{ marginBottom: "6px", display: "block" }}>
                Motivo <span style={{ color: "red" }}>*</span> (obbligatorio)
              </label>
              <textarea
                className={`${styles.suspendReasonInput} ${reportError ? styles.inputError : ""}`}
                rows={3}
                placeholder="Es: contenuto inappropriato, informazioni false..."
                value={reportReason}
                onChange={(e) => {
                  setReportReason(e.target.value);
                  if (reportError) setReportError(""); // Resetta errore mentre digita
                }}
              />
            </div>

            {reportError && (
              <div className={styles.errorMessage}>
                {reportError}
              </div>
            )}
            
            <div className={styles.modalActions}>
              <button
                className={appStyles.secondaryButton}
                onClick={() => { 
                  setActiveModal(null); 
                  setReportReason(""); 
                  setReportError(""); // Resetta tutto
                }}
                disabled={actionLoading}
              >
                Annulla
              </button>
              <button 
                className={styles.reportButton} 
                onClick={handleReport} 
                disabled={actionLoading}
              >
                {actionLoading ? "Invio in corso..." : "Invia segnalazione"}
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}