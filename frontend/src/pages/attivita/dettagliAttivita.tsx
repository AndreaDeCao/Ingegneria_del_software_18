import { useEffect, useState, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import type { ActivityPopulated } from "../../types/ActivityPopulated";

import styles from "./attivitaPage.module.css";
import appStyles from "../../App.module.css";

type ModalType = "join" | "leave" | "cancel" | "uncancel" | "delete" | "report" | null;

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

// Intervallo di polling in ms
const POLL_INTERVAL_MS = 15_000;

export default function DettagliAttivitaPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activity, setActivity] = useState<ActivityPopulated | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  const [reportReason, setReportReason] = useState("");
  const [reportSuccess, setReportSuccess] = useState(false);

  const currentUserID = user?._id;

  const refreshActivity = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`${API_BASE}/activities/${id}`);
      if (!res.ok) return;
      const data: ActivityPopulated = await res.json();
      data.partecipantList = data.partecipantList ?? [];
      setActivity(data);
    } catch {
      // silenzioso
    }
  }, [id]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await fetch(`${API_BASE}/activities/${id}`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || err.message || `Errore ${res.status}`);
        }
        const data: ActivityPopulated = await res.json();
        data.partecipantList = data.partecipantList ?? [];
        setActivity(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshActivity();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refreshActivity]);

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
        body: JSON.stringify({ userID: user?._id, userRole: user?.role }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || "Errore");
      }
      const updated: ActivityPopulated = await res.json();
      updated.partecipantList = updated.partecipantList ?? [];
      setActivity((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(updated)) return prev;
        return updated;
      });
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
        body: JSON.stringify({ userID: user?._id, userRole: user?.role }),
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

  async function handleReport() {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/activities/${id}/report`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userID: user?._id, reason: reportReason }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || "Errore");
      }
      setReportSuccess(true);
      setReportReason("");
      await refreshActivity();
    } catch (err: any) {
      showMessage(err.message || "Errore nell'invio della segnalazione");
    } finally {
      setActionLoading(false);
      setActiveModal(null);
    }
  }

  if (loading) return <main className={styles.page}><p className={styles.message}>Caricamento attivita...</p></main>;
  if (error || !activity) return <main className={styles.page}><p className={styles.messageError}>{error || "Attivita non trovata"}</p></main>;

  const isOrganizer = !!currentUserID && (activity as any).organizerID?.toString() === currentUserID;
  const isParticipant = !isOrganizer && activity.partecipantList.some((p) => p._id === currentUserID);

  const participantCount = activity.partecipantList.length;
  const spotsLeft = activity.maxParticipants - participantCount;
  const isExpired = new Date(activity.activityDate).getTime() < Date.now();
  const isSuspended = activity.suspended === true;

  const canJoin =
    !isOrganizer &&
    !isParticipant &&
    activity.status === "Aperto" &&
    spotsLeft > 0 &&
    !isExpired &&
    !isSuspended;

  const reports = (activity as any).reports ?? [];
  const myReport = currentUserID
    ? reports.find((r: any) => (r.reportedBy?._id ?? r.reportedBy)?.toString() === currentUserID)
    : undefined;
  const hasAlreadyReported = !!myReport;
  const acceptedReports = reports.filter((r: any) => r.reportStatus === "accepted");
  const hasAcceptedReport = acceptedReports.length > 0;

  const effectiveStatus = (activity.status === "Aperto" && isExpired) ? "Chiuso" : activity.status;

  const organizerName =
    (activity as any).organizerID?.nickname ||
    `${(activity as any).organizerID?.nome ?? ""} ${(activity as any).organizerID?.cognome ?? ""}`.trim() ||
    (activity as any).organizerID?.email ||
    "—";

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Annullato": return styles.statusCancelled;
      case "Chiuso":    return styles.statusClosed;
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
    new Date(date).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });

  return (
    <main className={styles.page}>
      <div className={appStyles.contentLayout}>

        {/* ── SINISTRA ── */}
        <div className={appStyles.leftColumn}>

          {isSuspended && (
            <div className={styles.suspendedBanner}>
              <span className={styles.suspendedBannerTitle}>Attivita sospesa dall'amministrazione</span>
              {activity.suspendedReason ? (
                <span className={styles.suspendedBannerReason}>Motivo: {activity.suspendedReason}</span>
              ) : (
                <span className={styles.suspendedBannerReason}>Nessun motivo specificato. Contatta l'amministrazione per maggiori informazioni.</span>
              )}
            </div>
          )}

          {hasAcceptedReport && (
            <div className={styles.reportedBanner}>
              <span className={styles.reportedBannerTitle}>
                {isOrganizer ? "La tua attivita e stata segnalata" : "Questa attivita e stata segnalata"}
              </span>
              <span className={styles.reportedBannerReason}>
                {isOrganizer
                  ? `${acceptedReports.length} segnalazion${acceptedReports.length === 1 ? "e" : "i"} accettat${acceptedReports.length === 1 ? "a" : "e"} dall'amministrazione. Controlla il contenuto dell'attivita e contatta l'amministrazione se ritieni sia un errore.`
                  : `${acceptedReports.length} segnalazion${acceptedReports.length === 1 ? "e" : "i"} accettat${acceptedReports.length === 1 ? "a" : "e"} dall'amministrazione. Procedi con cautela.`}
              </span>
            </div>
          )}

          <div style={{ paddingBottom: "20px" }}>
            {isOrganizer && !isSuspended && (
              <div className={styles.organizerBadge}>Sei l'organizzatore di questa attivita</div>
            )}
            {isOrganizer && isSuspended && (
              <div className={styles.organizerBadge}>
                Sei l'organizzatore — la gestione e temporaneamente bloccata dall'amministrazione
              </div>
            )}
            {isParticipant && (
              <div className={styles.alreadyJoinedBadge}>Partecipi a questa attivita</div>
            )}
            {isExpired && (
              <div className={styles.errorBox}>
                Questa attivita e scaduta — la data era il{" "}
                {new Date(activity.activityDate).toLocaleDateString("it-IT", {
                  day: "2-digit", month: "long", year: "numeric",
                })}
              </div>
            )}

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
              </div>
              <h1 className={styles.detailTitle}>{activity.title}</h1>
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

            <div className={styles.detailActions}>

              {isOrganizer && (
                <div className={styles.buttonActions}>
                  {activity.status !== "Annullato" && (
                    <button
                      className={styles.dangerButton}
                      disabled={isExpired || isSuspended}
                      title={isSuspended ? "Attivita sospesa — azione non disponibile" : undefined}
                      onClick={() => setActiveModal("cancel")}
                    >
                      Annulla attivita
                    </button>
                  )}
                  {activity.status === "Annullato" && (
                    <button
                      className={styles.dangerButton}
                      disabled={isExpired || isSuspended}
                      title={isSuspended ? "Attivita sospesa — azione non disponibile" : undefined}
                      onClick={() => setActiveModal("uncancel")}
                    >
                      Riattiva attivita
                    </button>
                  )}
                  {activity.status !== "Annullato" && activity.status === "Chiuso" && participantCount < activity.maxParticipants && (
                    <button
                      className={styles.dangerButton}
                      disabled={isExpired || isSuspended}
                      title={isSuspended ? "Attivita sospesa — azione non disponibile" : undefined}
                      onClick={() => handleAction("open", "PATCH")}
                    >
                      Apri attivita
                    </button>
                  )}
                  {activity.status !== "Annullato" && activity.status === "Aperto" && (
                    <button
                      className={styles.dangerButton}
                      disabled={isExpired || isSuspended}
                      title={isSuspended ? "Attivita sospesa — azione non disponibile" : undefined}
                      onClick={() => handleAction("close", "PATCH")}
                    >
                      Chiudi attivita
                    </button>
                  )}
                  <button
                    className={styles.dangerButton}
                    disabled={isSuspended}
                    title={isSuspended ? "Attivita sospesa — azione non disponibile" : undefined}
                    onClick={() => setActiveModal("delete")}
                  >
                    Elimina attivita
                  </button>
                </div>
              )}

              {canJoin && (
                <button className={appStyles.primaryButton} onClick={() => setActiveModal("join")}>
                  Partecipa all'attivita
                </button>
              )}

              {!isOrganizer && !isParticipant && !canJoin && (
                <button className={appStyles.primaryButton} disabled>
                  {activity.status !== "Aperto"
                    ? `Iscrizione non disponibile (${activity.status ?? ""})`
                    : isExpired
                      ? "Attivita scaduta"
                      : isSuspended
                        ? "Attivita sospesa"
                        : "Attivita al completo"}
                </button>
              )}

              {isParticipant && (
                <div className={styles.buttonActions}>
                  <button
                    className={styles.leaveButton}
                    disabled={isExpired || isSuspended}
                    onClick={() => setActiveModal("leave")}
                  >
                    Lascia attivita
                  </button>
                </div>
              )}

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
                          <strong>Hai segnalato questa attivita.</strong>
                          <br />La segnalazione e in attesa di revisione da parte dell'amministrazione.
                          {myReport.reason && (<><br /><span style={{ opacity: 0.8 }}>Motivo: {myReport.reason}</span></>)}
                          <br />
                          <span style={{ opacity: 0.7, fontSize: "12px" }}>
                            Segnalata il {new Date(myReport.reportedAt).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })}
                          </span>
                        </>
                      )}
                      {myReport.reportStatus === "accepted" && (
                        <>
                          <strong>La tua segnalazione e stata accettata dall'amministrazione.</strong>
                          <br />Grazie per la segnalazione. L'attivita e ora contrassegnata come segnalata.
                          {myReport.reason && (<><br /><span style={{ opacity: 0.8 }}>Motivo: {myReport.reason}</span></>)}
                        </>
                      )}
                      {myReport.reportStatus === "dismissed" && (
                        <>
                          <strong>La tua segnalazione e stata esaminata e rigettata dall'amministrazione.</strong>
                          {myReport.reason && (<><br /><span style={{ opacity: 0.8 }}>Motivo inviato: {myReport.reason}</span></>)}
                          {myReport.reviewNote && (<><br /><span style={{ opacity: 0.8 }}>Nota admin: {myReport.reviewNote}</span></>)}
                        </>
                      )}
                    </div>
                  )}
                  {!hasAlreadyReported && !reportSuccess && (
                    <button className={styles.reportButton} onClick={() => setActiveModal("report")}>
                      Segnala attivita
                    </button>
                  )}
                </div>
              )}

              {actionMessage && <p className={styles.message}>{actionMessage}</p>}
            </div>
          </div>
        </div>

        {/* ── DESTRA ── */}
        <div className={appStyles.rightColumn}>
          <div className={appStyles.buttonBox}>
            <Link to="/attivita/visualizza" className={appStyles.primaryButton}>
              Lista attivita
            </Link>
            <Link to="/attivita/crea" className={appStyles.primaryButton}>
              + Crea attivita
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

      {activeModal === "join" && (
        <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Conferma partecipazione</h2>
            <p className={styles.modalBody}>
              Il tuo <strong>nickname</strong> sara visibile a tutti nella pagina dell'attivita e la tua <strong>email</strong> sara condivisa con l'organizzatore (<strong>{organizerName}</strong>).
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

      {activeModal === "leave" && (
        <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Lascia attivita</h2>
            <p className={styles.modalBody}>Sei sicuro di voler abbandonare questa attivita? Potrai re-iscriverti finche ci sono posti disponibili.</p>
            <div className={styles.modalActions}>
              <button className={appStyles.secondaryButton} onClick={() => setActiveModal(null)} disabled={actionLoading}>Annulla</button>
              <button className={styles.dangerButton} onClick={() => handleAction("leave", "POST")} disabled={actionLoading}>
                {actionLoading ? "Attendere..." : "Lascia attivita"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === "cancel" && (
        <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Annulla attivita</h2>
            <p className={styles.modalBody}>Sei sicuro di voler annullare <strong>{activity.title}</strong>? Questa azione e reversibile.</p>
            <div className={styles.modalActions}>
              <button className={appStyles.secondaryButton} onClick={() => setActiveModal(null)} disabled={actionLoading}>Indietro</button>
              <button className={styles.dangerButton} onClick={() => handleAction("cancel", "PATCH")} disabled={actionLoading}>
                {actionLoading ? "Attendere..." : "Annulla attivita"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === "uncancel" && (
        <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Riattiva attivita</h2>
            <p className={styles.modalBody}>Sei sicuro di voler riattivare <strong>{activity.title}</strong>? Questa azione potrebbe riaprire l'attivita a nuovi partecipanti.</p>
            <div className={styles.modalActions}>
              <button className={appStyles.secondaryButton} onClick={() => setActiveModal(null)} disabled={actionLoading}>Indietro</button>
              <button className={styles.dangerButton} onClick={() => handleAction("uncancel", "PATCH")} disabled={actionLoading}>
                {actionLoading ? "Attendere..." : "Riattiva attivita"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === "delete" && (
        <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Elimina attivita</h2>
            <p className={styles.modalBody}>
              Stai per eliminare definitivamente <strong>{activity.title}</strong> dal database.
              <br /><br />
              <strong>Questa operazione e irreversibile</strong> e non potra essere annullata.
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

      {activeModal === "report" && (
        <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Segnala attivita</h2>
            <p className={styles.modalBody}>
              La tua segnalazione sara esaminata dall'amministrazione. Puoi specificare il motivo qui sotto.
            </p>
            <div>
              <label className={styles.label} style={{ marginBottom: "6px", display: "block" }}>
                Motivo (opzionale)
              </label>
              <textarea
                className={styles.suspendReasonInput}
                rows={3}
                placeholder="Es: contenuto inappropriato, informazioni false..."
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
              />
            </div>
            <div className={styles.modalActions}>
              <button
                className={appStyles.secondaryButton}
                onClick={() => { setActiveModal(null); setReportReason(""); }}
                disabled={actionLoading}
              >
                Annulla
              </button>
              <button className={styles.reportButton} onClick={handleReport} disabled={actionLoading}>
                {actionLoading ? "Invio in corso..." : "Invia segnalazione"}
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
