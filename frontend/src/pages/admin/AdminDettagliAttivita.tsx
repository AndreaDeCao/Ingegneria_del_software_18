import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { http } from "../../auth/api"; // <-- AGGIUNGI QUESTA RIGA
import type { ActivityPopulated } from "../../types/ActivityPopulated";
import type { Organizer } from "../../types/Organizer";

import styles from "./AdminattivitaPage.module.css";
import appStyles from "../../App.module.css";

type ModalType = "delete" | "suspend" | "unsuspend" | null;

// Rimuovi API_BASE perché non serve più con http()
// const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
const POLL_INTERVAL = 20_000;

export default function AdminDettagliAttivita() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activity, setActivity] = useState<ActivityPopulated | null>(null);
  const [organizer, setOrganizer] = useState<Organizer | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  const [suspendReason, setSuspendReason] = useState("");

  const messageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch attività e organizzatore in parallelo usando http()
  const fetchActivity = useCallback(async () => {
    if (!id) return;
    try {
      // Usa http() invece di fetch()
      const data = await http<ActivityPopulated>(`/activities/${id}`);
      data.partecipantList = data.partecipantList ?? [];
      setActivity(data);

      if (data.organizerID) {
        try {
          const orgData = await http<Organizer>(`/users/${data.organizerID}`);
          setOrganizer(orgData);
        } catch {
          // Ignora errore organizzatore non trovato
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchActivity();
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchActivity]);

  const showMessage = useCallback((msg: string) => {
    setActionMessage(msg);
    if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    messageTimerRef.current = setTimeout(() => setActionMessage(""), 4000);
  }, []);

  const handleAction = useCallback(async (endpoint: string, method: string, body?: object) => {
    setActionLoading(true);
    try {
      const updated = await http<ActivityPopulated>(`/activities/${id}/${endpoint}`, {
        method,
        body: JSON.stringify({ userID: user?._id, userRole: user?.role, ...body }),
      });
      updated.partecipantList = updated.partecipantList ?? [];
      setActivity(updated);
    } catch (err: any) {
      showMessage(err.message || "Errore");
    } finally {
      setActionLoading(false);
      setActiveModal(null);
    }
  }, [id, user?._id, user?.role, showMessage]);

  const handleSuspend = useCallback(async () => {
    await handleAction("suspend", "PATCH", { reason: suspendReason });
    setSuspendReason("");
  }, [handleAction, suspendReason]);

  const handleUnsuspend = useCallback(() => handleAction("unsuspend", "PATCH"), [handleAction]);

  const handleDelete = useCallback(async () => {
    setActionLoading(true);
    try {
      await http(`/activities/${id}`, {
        method: "DELETE",
        body: JSON.stringify({ userID: user?._id, userRole: user?.role }),
      });
      navigate("/admin/attivita/visualizza");
    } catch (err: any) {
      showMessage(err.message || "Errore durante l'eliminazione");
      setActiveModal(null);
    } finally {
      setActionLoading(false);
    }
  }, [id, user?._id, user?.role, showMessage, navigate]);

  const handleReportAction = useCallback(async (reportId: string, action: "accept" | "dismiss") => {
    setActionLoading(true);
    try {
      const updated = await http<ActivityPopulated>(`/activities/${id}/reports/${reportId}/${action}`, {
        method: "PATCH",
        body: JSON.stringify({ userID: user?._id, userRole: user?.role }),
      });
      updated.partecipantList = updated.partecipantList ?? [];
      setActivity(updated);
    } catch (err: any) {
      showMessage(err.message || "Errore");
    } finally {
      setActionLoading(false);
    }
  }, [id, user?._id, user?.role, showMessage]);

  const getStatusClass = useCallback((status: string) => {
    switch (status) {
      case "Annullato": return styles.statusCancelled;
      case "Chiuso":    return styles.statusClosed;
      default:          return styles.statusAvailable;
    }
  }, []);

  const formatDate = useCallback((date: string | Date) =>
    new Date(date).toLocaleDateString("it-IT", {
      weekday: "long", day: "2-digit", month: "long", year: "numeric",
    }), []);

  const formatTime = useCallback((date: string | Date) =>
    new Date(date).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }), []);

  // Tutti i valori derivati memoizzati
  const derived = useMemo(() => {
    if (!activity) return null;
    const currentUserID = user?._id;
    const isOrganizer = !!currentUserID && activity.organizerID?.toString() === currentUserID;
    const isParticipant = !isOrganizer && activity.partecipantList.some((p) => p._id === currentUserID);
    const participantCount = activity.partecipantList.length;
    const spotsLeft = activity.maxParticipants - participantCount;
    const isExpired = new Date(activity.activityDate).getTime() < Date.now();
    const isSuspended = activity.suspended === true;
    const organizerName = organizer?.nickname || `${organizer?.nome ?? ""} ${organizer?.cognome ?? ""}`.trim() || organizer?.email || "—";
    const reports = (activity as any).reports ?? [];
    const pendingReports = reports.filter((r: any) => r.reportStatus === "pending");
    const acceptedReports = reports.filter((r: any) => r.reportStatus === "accepted");
    const hasAcceptedReport = acceptedReports.length > 0;
    const effectiveStatus = (activity.status === "Aperto" && isExpired) ? "Chiuso" : activity.status;
    return { isOrganizer, isParticipant, participantCount, spotsLeft, isSuspended, organizerName, pendingReports, acceptedReports, hasAcceptedReport, effectiveStatus };
  }, [activity, user?._id, organizer]);

  if (loading) return <main className={styles.page}><p className={styles.message}>Caricamento attivita...</p></main>;
  if (error || !activity || !derived) return <main className={styles.page}><p className={styles.messageError}>{error || "Attivita non trovata"}</p></main>;

  const { isOrganizer, participantCount, spotsLeft, isSuspended, organizerName, pendingReports, acceptedReports, hasAcceptedReport, effectiveStatus } = derived;




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
                <span className={styles.suspendedBannerReason}>Nessun motivo specificato.</span>
              )}
            </div>
          )}

          {hasAcceptedReport && (
            <div className={styles.reportedBanner}>
              <span className={styles.reportedBannerTitle}>Questa attivita e stata segnalata</span>
              <span className={styles.reportedBannerReason}>
                {acceptedReports.length} segnalazion{acceptedReports.length === 1 ? "e" : "i"} accettat{acceptedReports.length === 1 ? "a" : "e"} dall'amministrazione. Procedi con cautela.
              </span>
            </div>
          )}

          <div style={{ paddingBottom: "20px" }}>
            <div className={styles.adminBadge}>Stai visualizzando questa attivita come amministratore</div>

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
                  {pendingReports.length > 0 && (
                    <span className={`${styles.statusBadge} ${styles.statusPendingReport}`}>
                      {pendingReports.length} segnalaz. in attesa
                    </span>
                  )}
                </div>
                <span className={styles.activityId}>#{activity._id}</span>
              </div>
              <h1 className={styles.detailTitle}>{activity.title}</h1>
              {activity.description && <p className={styles.detailDescription}>{activity.description}</p>}
            </div>

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
                  <span className={styles.detailCardLabel}>Partecipanti</span>
                  <span className={styles.detailCardValue}>{participantCount} / {activity.maxParticipants}</span>
                  <span className={styles.detailCardSub}>
                    {spotsLeft > 0
                      ? `${spotsLeft} post${spotsLeft === 1 ? "o" : "i"} disponibil${spotsLeft === 1 ? "e" : "i"}`
                      : "Attivita al completo"}
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

            {/* ── PANNELLO ADMIN ── */}
            <div className={styles.detailActions}>
              <div className={styles.adminPanel}>
                <span className={styles.adminPanelTitle}>Pannello amministratore</span>

                <div className={styles.buttonActions}>
                  {!isSuspended ? (
                    <button className={styles.suspendButton} onClick={() => setActiveModal("suspend")}>
                      Sospendi attivita
                    </button>
                  ) : (
                    <button className={styles.unsuspendButton} onClick={handleUnsuspend} disabled={actionLoading}>
                      {actionLoading ? "Attendere..." : "Rimuovi sospensione"}
                    </button>
                  )}
                  <button className={styles.dangerButton} onClick={() => setActiveModal("delete")}>
                    Elimina attivita
                  </button>
                </div>

                {pendingReports.length > 0 && (
                  <div className={styles.adminReportsSection}>
                    <span className={styles.adminReportsSectionTitle}>
                      Segnalazioni in attesa ({pendingReports.length})
                    </span>
                    {pendingReports.map((r: any) => (
                      <div key={r._id} className={styles.adminReportItem}>
                        <div className={styles.adminReportMeta}>
                          <span className={styles.adminReportUser}>
                            {r.reportedBy?.nickname ? `@${r.reportedBy.nickname}` : r.reportedBy?.email ?? "Utente"}
                          </span>
                          <span className={styles.adminReportDate}>
                            {new Date(r.reportedAt).toLocaleDateString("it-IT")}
                          </span>
                        </div>
                        <div className={styles.adminReportContact}>
                          {r.reportedBy?.email && <span>Email: {r.reportedBy.email}</span>}
                          {(r.reportedBy?.nome || r.reportedBy?.cognome) && (
                            <span style={{ marginLeft: "12px" }}>Nome: {[r.reportedBy.nome, r.reportedBy.cognome].filter(Boolean).join(" ")}</span>
                          )}
                        </div>
                        {r.reason && <p className={styles.adminReportReason}>{r.reason}</p>}
                        <div className={styles.adminReportActions}>
                          <button className={styles.acceptReportButton} onClick={() => handleReportAction(r._id, "accept")} disabled={actionLoading}>
                            Accetta
                          </button>
                          <button className={styles.dismissReportButton} onClick={() => handleReportAction(r._id, "dismiss")} disabled={actionLoading}>
                            Rigetta
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {acceptedReports.length > 0 && (
                  <div className={styles.adminReportsSection}>
                    <span className={styles.adminReportsSectionTitle}>Segnalazioni accettate</span>
                    {acceptedReports.map((r: any) => (
                      <div key={r._id} className={styles.adminReportItem}>
                        <div className={styles.adminReportMeta}>
                          <span className={styles.adminReportUser}>
                            {r.reportedBy?.nickname ? `@${r.reportedBy.nickname}` : r.reportedBy?.email ?? "Utente"}
                          </span>
                          <span className={`${styles.statusBadge} ${styles.statusReported}`} style={{ fontSize: "11px", padding: "3px 8px" }}>
                            Accettata
                          </span>
                        </div>
                        {r.reason && <p className={styles.adminReportReason}>{r.reason}</p>}
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
                      </div>
                    ))}
                  </div>
                )}

                {actionMessage && <p className={styles.message}>{actionMessage}</p>}
              </div>
            </div>

          </div>
        </div>

        {/* ── DESTRA ── */}
        <div className={appStyles.rightColumn}>
          <div className={appStyles.buttonBox}>
            <Link to="/admin/attivita/visualizza" className={appStyles.primaryButton}>
              Lista attivita
            </Link>
            <Link to="/admin/attivita/crea" className={appStyles.primaryButton}>
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
                        {p._id === activity.organizerID && (
                          <span className={styles.organizerTag}> (organizzatore) </span>
                        )}
                      </span>
                      <span className={styles.participantEmail}>{p.email}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      </div>

      {/* ── MODALI ADMIN ── */}

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
              <button
                className={appStyles.secondaryButton}
                onClick={() => { setActiveModal(null); setSuspendReason(""); }}
                disabled={actionLoading}
              >
                Annulla
              </button>
              <button className={styles.suspendButton} onClick={handleSuspend} disabled={actionLoading}>
                {actionLoading ? "Attendere..." : "Sospendi attivita"}
              </button>
            </div>
          </div>
        </div>
      )}

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

    </main>
  );
}
