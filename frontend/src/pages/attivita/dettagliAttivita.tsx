import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import styles from "./attivitaPage.module.css";
import appStyles from "../../App.module.css";
import { useAuth } from "../../auth/AuthProvider";
import type {Trek} from "../../types/Trek";
import type {Organizer} from "../../types/Organizer";
import type {ActivityPopulated} from "../../types/ActivityPopulated";


type ModalType = "join" | "leave" | "cancel" | "uncancel" | "delete" | "suspend" | "unsuspend" | "report" | null;

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

// Intervallo di polling in ms — aggiorna lo stato dell'attivita senza ricaricare la pagina
// In questo modo quando admin accetta una segnalazione, il banner appare automaticamente
const POLL_INTERVAL_MS = 15_000;

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

  // Motivo sospensione (campo opzionale nella modale suspend)
  const [suspendReason, setSuspendReason] = useState("");

  // Segnalazione
  const [reportReason, setReportReason] = useState("");
  const [reportSuccess, setReportSuccess] = useState(false);

  // Carica solo i dati dell'attivita (senza trek/organizer, gia caricati una volta sola)
  const refreshActivity = useCallback(async (silent = false) => {
    if (!id) return;
    try {
      const resActivity = await fetch(`${API_BASE}/activities/${id}`);
      if (!resActivity.ok) return;
      const activityData: ActivityPopulated = await resActivity.json();
      activityData.partecipantList = activityData.partecipantList ?? [];
      setActivity(activityData);
    } catch {
      // silenzioso — non blocca il render
    }
  }, [id]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
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
          if (!resId.ok) return;
          const { id } = await resId.json();
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

  // Polling automatico — aggiorna lo stato dell'attivita (segnalazioni, sospensione, partecipanti)
  // senza che l'utente debba ricaricare la pagina manualmente
  useEffect(() => {
    const interval = setInterval(() => {
      refreshActivity(true);
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
      setActivity(updated);
    } catch (err: any) {
      showMessage(err.message || "Errore");
    } finally {
      setActionLoading(false);
      setActiveModal(null);
    }
  }

  async function handleSuspend() {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/activities/${id}/suspend`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userID: user?._id, userRole: user?.role, reason: suspendReason }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || "Errore");
      }
      const updated: ActivityPopulated = await res.json();
      updated.partecipantList = updated.partecipantList ?? [];
      setActivity(updated);
      setSuspendReason("");
    } catch (err: any) {
      showMessage(err.message || "Errore");
    } finally {
      setActionLoading(false);
      setActiveModal(null);
    }
  }

  async function handleUnsuspend() {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/activities/${id}/unsuspend`, {
        method: "PATCH",
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
      setActivity(updated);
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
    } catch (err: any) {
      showMessage(err.message || "Errore nell'invio della segnalazione");
    } finally {
      setActionLoading(false);
      setActiveModal(null);
    }
  }

  async function handleReportAction(reportId: string, action: "accept" | "dismiss") {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/activities/${id}/reports/${reportId}/${action}`, {
        method: "PATCH",
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
      setActivity(updated);
    } catch (err: any) {
      showMessage(err.message || "Errore");
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

  if (loading) return <main className={styles.page}><p className={styles.message}>Caricamento attivita...</p></main>;
  if (error || !activity) return <main className={styles.page}><p className={styles.messageError}>{error || "Attivita non trovata"}</p></main>;

  const currentUserID = user?._id;
  const isAdmin = user?.role === "admin";
  const isOrganizer = !isAdmin && !!currentUserID && activity.organizerID?.toString() === currentUserID;
  const isParticipant = !isOrganizer && !isAdmin && activity.partecipantList.some((p) => p._id === currentUserID);
  const participantCount = activity.partecipantList.length;
  const spotsLeft = activity.maxParticipants - participantCount;
  const isExpired = new Date(activity.activityDate).getTime() < Date.now();
  const isSuspended = activity.suspended === true;
  const canJoin = !isOrganizer && !isAdmin && !isParticipant && activity.status === "Aperto" && spotsLeft > 0 && !isExpired;

  const organizerName = organizer?.nickname || `${organizer?.nome ?? ""} ${organizer?.cognome ?? ""}`.trim() || organizer?.email || "—";

  // Segnalazioni: l'utente ha gia segnalato questa attivita?
  const reports = (activity as any).reports ?? [];
  const hasAlreadyReported = !isAdmin && !isOrganizer && reports.some(
    (r: any) => (r.reportedBy?._id ?? r.reportedBy)?.toString() === currentUserID
  );
  // Segnalazioni accettate — visibili a tutti
  const acceptedReports = reports.filter((r: any) => r.reportStatus === "accepted");
  const hasAcceptedReport = acceptedReports.length > 0;
  // Segnalazioni in attesa — solo admin
  const pendingReports = reports.filter((r: any) => r.reportStatus === "pending");

  return (
    <main className={styles.page}>
      <div className={appStyles.contentLayout}>

        {/* ── SINISTRA ── */}
        <div className={appStyles.leftColumn}>

          {/* Banner sospensione */}
          {isSuspended && (
            <div className={styles.suspendedBanner}>
              <span className={styles.suspendedBannerTitle}>Attivita sospesa dall'amministrazione</span>
              {activity.suspendedReason && (
                <span className={styles.suspendedBannerReason}>Motivo: {activity.suspendedReason}</span>
              )}
              {!activity.suspendedReason && (
                <span className={styles.suspendedBannerReason}>Nessun motivo specificato. Contatta l'amministrazione per maggiori informazioni.</span>
              )}
            </div>
          )}

          {/* Banner segnalazione accettata — visibile a tutti (testo diverso per organizzatore) */}
          {hasAcceptedReport && (
            <div className={styles.reportedBanner}>
              <span className={styles.reportedBannerTitle}>
                {isOrganizer
                  ? "La tua attivita e stata segnalata"
                  : "Questa attivita e stata segnalata"}
              </span>
              <span className={styles.reportedBannerReason}>
                {isOrganizer
                  ? `${acceptedReports.length} segnalazion${acceptedReports.length === 1 ? "e" : "i"} accettat${acceptedReports.length === 1 ? "a" : "e"} dall'amministrazione. Controlla il contenuto dell'attivita e contatta l'amministrazione se ritieni sia un errore.`
                  : `${acceptedReports.length} segnalazion${acceptedReports.length === 1 ? "e" : "i"} accettat${acceptedReports.length === 1 ? "a" : "e"} dall'amministrazione. Procedi con cautela.`}
              </span>
            </div>
          )}

          <div style={{ paddingBottom: "20px" }}>
            {isAdmin && (
              <div className={styles.adminBadge}>Stai visualizzando questa attivita come amministratore</div>
            )}
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
                Questa attivita e scaduta — la data era il {new Date(activity.activityDate).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })}
              </div>
            )}
          </div>

          {/* Hero */}
          <div className={styles.detailHero}>
            <div className={styles.detailHeroTop}>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                {(() => {
                  const effectiveStatus = (activity.status === "Aperto" && isExpired) ? "Chiuso" : activity.status;
                  return <span className={`${styles.statusBadge} ${getStatusClass(effectiveStatus ?? "")}`}>{effectiveStatus ?? "—"}</span>;
                })()}
                {isSuspended && (
                  <span className={`${styles.statusBadge} ${styles.statusSuspended}`}>Sospesa</span>
                )}
                {hasAcceptedReport && (
                  <span className={`${styles.statusBadge} ${styles.statusReported}`}>Segnalata</span>
                )}
                {isAdmin && pendingReports.length > 0 && (
                  <span className={`${styles.statusBadge} ${styles.statusPendingReport}`}>
                    {pendingReports.length} segnalaz. in attesa
                  </span>
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

            {/* dal secondo file: Modalita */}
            <div className={styles.detailCard}>
              <div>
                <span className={styles.detailCardLabel}>Modalita</span>
                <span className={styles.detailCardValue}>{formatTravelMode(activity.travelMode ?? "")}</span>
              </div>
            </div>

            <div className={styles.detailCard}>
              <div>
                <span className={styles.detailCardLabel}>Partecipanti</span>
                <span className={styles.detailCardValue}>{participantCount} / {activity.maxParticipants}</span>
                <span className={styles.detailCardSub}>
                  {spotsLeft > 0 ? `${spotsLeft} post${spotsLeft === 1 ? "o" : "i"} disponibil${spotsLeft === 1 ? "e" : "i"}` : "Attivita al completo"}
                </span>
              </div>
            </div>

            {/* dal secondo file: Organizzatore */}
            <div className={styles.detailCard}>
              <div>
                <span className={styles.detailCardLabel}>Organizzatore</span>
                <span className={styles.detailCardValue}>{organizerName}</span>
                {isOrganizer && <span className={styles.detailCardSub}>Sei tu l'organizzatore</span>}
              </div>
            </div>
          </div>

          {/* Trek details - dal secondo file, piu completo */}
          {trek && (trek.lengthKm || trek.duration || trek.difficulty || trek.description) && (
            <Link to={`/treks/${trek.id}`} className={styles.formCard}>
              <h2 className={styles.detailSectionTitle}>Dettagli del trek</h2>
              {trek.name && <p className={styles.activityName}>{trek.name}</p>}
              <div className={styles.activityInfo}>
                {trek.difficulty && <div className={styles.infoItem}><span className={styles.infoLabel}>Difficolta</span><span className={styles.infoValue}>{trek.difficulty}</span></div>}
                {trek.lengthKm && <div className={styles.infoItem}><span className={styles.infoLabel}>Distanza</span><span className={styles.infoValue}>{trek.lengthKm} km</span></div>}
                {trek.duration && <div className={styles.infoItem}><span className={styles.infoLabel}>Durata stimata</span><span className={styles.infoValue}>{trek.duration}</span></div>}
              </div>
            </Link>
          )}

          {/* ── AZIONI ── */}
          <div className={styles.detailActions}>

            {/* ── PANNELLO ADMIN ── */}
            {isAdmin && (
              <div className={styles.adminPanel}>
                <span className={styles.adminPanelTitle}>Pannello amministratore</span>

                <div className={styles.buttonActions}>
                  {!isSuspended ? (
                    <button className={styles.suspendButton} onClick={() => setActiveModal("suspend")}>
                      Sospendi attivita
                    </button>
                  ) : (
                    <button className={appStyles.primaryButton} onClick={handleUnsuspend} disabled={actionLoading}>
                      {actionLoading ? "Attendere..." : "Rimuovi sospensione"}
                    </button>
                  )}
                  <button className={styles.dangerButton} onClick={() => setActiveModal("delete")}>
                    Elimina attivita
                  </button>
                </div>

                {/* Segnalazioni in attesa — solo admin */}
                {pendingReports.length > 0 && (
                  <div className={styles.adminReportsSection}>
                    <span className={styles.adminReportsSectionTitle}>
                      Segnalazioni in attesa ({pendingReports.length})
                    </span>
                    {pendingReports.map((r: any) => (
                      <div key={r._id} className={styles.adminReportItem}>
                        <div className={styles.adminReportMeta}>
                          <span className={styles.adminReportUser}>
                            {r.reportedBy?.nickname ?? r.reportedBy?.email ?? "Utente"}
                          </span>
                          <span className={styles.adminReportDate}>
                            {new Date(r.reportedAt).toLocaleDateString("it-IT")}
                          </span>
                        </div>
                        {r.reason && <p className={styles.adminReportReason}>{r.reason}</p>}
                        <div className={styles.adminReportActions}>
                          <button
                            className={styles.acceptReportButton}
                            onClick={() => handleReportAction(r._id, "accept")}
                            disabled={actionLoading}
                          >
                            Accetta
                          </button>
                          <button
                            className={styles.dismissReportButton}
                            onClick={() => handleReportAction(r._id, "dismiss")}
                            disabled={actionLoading}
                          >
                            Rigetta
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Segnalazioni gia revisionate — solo admin */}
                {reports.filter((r: any) => r.reportStatus !== "pending").length > 0 && (
                  <div className={styles.adminReportsSection}>
                    <span className={styles.adminReportsSectionTitle}>
                      Segnalazioni revisionate
                    </span>
                    {reports.filter((r: any) => r.reportStatus !== "pending").map((r: any) => (
                      <div key={r._id} className={styles.adminReportItem}>
                        <div className={styles.adminReportMeta}>
                          <span className={styles.adminReportUser}>
                            {r.reportedBy?.nickname ?? r.reportedBy?.email ?? "Utente"}
                          </span>
                          <span className={`${styles.statusBadge} ${r.reportStatus === "accepted" ? styles.statusReported : styles.statusClosed}`} style={{ fontSize: "11px", padding: "3px 8px" }}>
                            {r.reportStatus === "accepted" ? "Accettata" : "Rigettata"}
                          </span>
                        </div>
                        {r.reason && <p className={styles.adminReportReason}>{r.reason}</p>}
                        {/* Admin puo rimuovere il banner rigettando una segnalazione accettata */}
                        {r.reportStatus === "accepted" && (
                          <div className={styles.adminReportActions}>
                            <button
                              className={styles.dismissReportButton}
                              onClick={() => handleReportAction(r._id, "dismiss")}
                              disabled={actionLoading}
                              title="Rimuove il banner 'Segnalata' dall'attivita"
                            >
                              Rimuovi segnalazione
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── ORGANIZZATORE ──── */}
            {isOrganizer && (
              <>
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
              </>
            )}

            {/* Puo partecipare */}
            {canJoin && (
              <button className={appStyles.primaryButton} onClick={() => setActiveModal("join")}>
                Partecipa all'attivita
              </button>
            )}

            {/* Non puo partecipare (utente normale, non organizzatore) */}
            {!isOrganizer && !isAdmin && !isParticipant && !canJoin && (
              <button className={appStyles.primaryButton} disabled>
                {activity.status !== "Aperto" ? `Iscrizione non disponibile (${activity.status ?? ""})` : "Attivita al completo"}
              </button>
            )}

            {/* Gia partecipante */}
            {isParticipant && (
              <div className={styles.buttonActions}>
                <button className={styles.leaveButton} disabled={isExpired || isSuspended} onClick={() => setActiveModal("leave")}>
                  Lascia attivita
                </button>
              </div>
            )}

            {/* Segnala attivita — visibile agli utenti non organizzatori, non admin FIXME: se segnalazione non accettata si puo segnare di nuovo*/}
            {!isOrganizer && !isAdmin && currentUserID && (
              <div style={{ marginTop: "8px" }}>
                {reportSuccess || hasAlreadyReported ? (
                  <div className={styles.reportedConfirmBadge}>
                    Hai segnalato questa attivita. L'amministrazione esaminerà la segnalazione.
                  </div>
                ) : (
                  <button
                    className={styles.reportButton}
                    onClick={() => setActiveModal("report")}
                  >
                    Segnala attivita
                  </button>
                )}
              </div>
            )}

            {actionMessage && <p className={styles.message}>{actionMessage}</p>}
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
                      {(isOrganizer || isAdmin) && <span className={styles.participantEmail}>{p.email}</span>}
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

      {/* Leave */}
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

      {/* Cancel */}
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

      {/* Uncancel */}
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

      {/* Delete */}
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

      {/* Suspend */}
      {activeModal === "suspend" && (
        <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Sospendi attivita</h2>
            <p className={styles.modalBody}>
              Stai per sospendere <strong>{activity.title}</strong>.<br /><br />
              L'organizzatore non potra modificare lo stato dell'attivita finche la sospensione e attiva.
              Un banner di avviso sara visibile a tutti.
            </p>
            <div>
              <label className={styles.label} style={{ marginBottom: "6px", display: "block" }}>
                Motivo (opzionale — visibile all'organizzatore)
              </label>
              <textarea
                className={styles.suspendReasonInput}
                rows={3}
                placeholder="Es: contenuto non conforme alle linee guida..."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
              />
            </div>
            <div className={styles.modalActions}>
              <button className={appStyles.secondaryButton} onClick={() => { setActiveModal(null); setSuspendReason(""); }} disabled={actionLoading}>
                Annulla
              </button>
              <button className={styles.suspendButton} onClick={handleSuspend} disabled={actionLoading}>
                {actionLoading ? "Attendere..." : "Sospendi attivita"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unsuspend */}
      {activeModal === "unsuspend" && (
        <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Rimuovi sospensione</h2>
            <p className={styles.modalBody}>
              Stai per rimuovere la sospensione da <strong>{activity.title}</strong>.<br /><br />
              L'organizzatore riacquistera il controllo completo sull'attivita.
            </p>
            <div className={styles.modalActions}>
              <button className={appStyles.secondaryButton} onClick={() => setActiveModal(null)} disabled={actionLoading}>Annulla</button>
              <button className={appStyles.primaryButton} onClick={handleUnsuspend} disabled={actionLoading}>
                {actionLoading ? "Attendere..." : "Rimuovi sospensione"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report */}
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
              <button className={appStyles.secondaryButton} onClick={() => { setActiveModal(null); setReportReason(""); }} disabled={actionLoading}>
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