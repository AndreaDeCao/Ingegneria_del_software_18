import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import styles from "../attivita/attivitaPage.module.css";
import reportStyles from "./GestioneSegnalazioni.module.css";
import appStyles from "../../App.module.css";
import { useAuth } from "../../auth/AuthProvider";

// Intervallo di polling in ms — aggiorna in background senza ricaricare la pagina
const POLL_INTERVAL_MS = 20_000;

type ReportStatus = "pending" | "accepted" | "dismissed";

type Report = {
  _id: string;
  reportedBy: { _id: string; nickname?: string; email?: string } | string;
  reason: string;
  reportedAt: string;
  reportStatus: ReportStatus;
  reviewedBy?: { _id: string; nickname?: string; email?: string } | string | null;
  reviewedAt?: string | null;
  reviewNote?: string;
};

type ActivityWithReports = {
  _id: string;
  title: string;
  status: string;
  activityDate: string;
  organizerID: string;
  trekID: string;
  reports: Report[];
  suspended?: boolean;
};

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export default function GestioneSegnalazioniPage() {
  const { user } = useAuth();

  const [activities, setActivities] = useState<ActivityWithReports[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // reportId in azione

  // Filtri
  const [categoryFilter, setCategoryFilter] = useState("Tutti"); // "Tutti" | "Attivita" (per ora solo attivita)
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "pending" | "accepted" | "dismissed"

  const isAdmin = user?.role === "admin";

  const fetchAll = useCallback(async (silent = false) => {
    if (!isAdmin) return;
    try {
      const res = await fetch(`${API_BASE}/activities/`);
      if (!res.ok) throw new Error("Errore nel recupero attivita");
      const data: ActivityWithReports[] = await res.json();
      // Tieni solo quelle con almeno una segnalazione
      setActivities(data.filter((a) => (a.reports ?? []).length > 0));
    } catch (err: any) {
      if (!silent) setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [isAdmin]);

  // Caricamento iniziale
  useEffect(() => {
    fetchAll(false);
  }, [fetchAll]);

  // Polling automatico — aggiorna in background senza mostrare spinner
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAll(true);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchAll]);

  async function handleReportAction(activityId: string, reportId: string, action: "accept" | "dismiss") {
    setActionLoading(reportId);
    try {
      const res = await fetch(`${API_BASE}/activities/${activityId}/reports/${reportId}/${action}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userID: user?._id, userRole: user?.role }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || "Errore");
      }
      const updated: ActivityWithReports = await res.json();
      setActivities((prev) =>
        prev.map((a) => a._id === activityId ? { ...a, reports: updated.reports } : a)
          .filter((a) => (a.reports ?? []).length > 0)
      );
    } catch (err: any) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  }

  // Rimuove tutte le segnalazioni accettate dall'attivita (admin)
  // Usa dismiss su ogni segnalazione accettata per "pulire" il banner
  async function handleRemoveAcceptedReports(activityId: string, acceptedReportIds: string[]) {
    for (const reportId of acceptedReportIds) {
      await handleReportAction(activityId, reportId, "dismiss");
    }
  }

  if (!isAdmin) {
    return (
      <main className={styles.page}>
        <p className={styles.messageError}>Accesso riservato agli amministratori.</p>
      </main>
    );
  }

  if (loading) return <main className={styles.page}><p className={styles.message}>Caricamento segnalazioni...</p></main>;
  if (error) return <main className={styles.page}><p className={styles.messageError}>{error}</p></main>;

  type FlatReport = {
    activity: ActivityWithReports;
    report: Report;
  };

  const flatReports: FlatReport[] = [];
  activities.forEach((a) => {
    (a.reports ?? []).forEach((r) => {
      const matchesStatus =
        statusFilter === "all" ||
        r.reportStatus === statusFilter;
      if (matchesStatus) {
        flatReports.push({ activity: a, report: r });
      }
    });
  });

  // Ordina: pending prima, poi per data decrescente
  flatReports.sort((a, b) => {
    if (a.report.reportStatus === "pending" && b.report.reportStatus !== "pending") return -1;
    if (a.report.reportStatus !== "pending" && b.report.reportStatus === "pending") return 1;
    return new Date(b.report.reportedAt).getTime() - new Date(a.report.reportedAt).getTime();
  });

  const pendingCount = activities.reduce(
    (acc, a) => acc + (a.reports ?? []).filter((r) => r.reportStatus === "pending").length,
    0
  );

  const statusLabel: Record<ReportStatus, string> = {
    pending: "In attesa",
    accepted: "Accettata",
    dismissed: "Rigettata",
  };

  const statusBadgeClass: Record<ReportStatus, string> = {
    pending: styles.statusPendingReport,
    accepted: styles.statusReported,
    dismissed: styles.statusClosed,
  };

  return (
    <main className={styles.page}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 className={styles.pageTitle}>Gestione Segnalazioni</h1>
          {pendingCount > 0 && (
            <p className={styles.message}>
              {pendingCount} segnalazion{pendingCount === 1 ? "e" : "i"} in attesa di revisione
            </p>
          )}
          {pendingCount === 0 && (
            <p className={styles.message}>Nessuna segnalazione in attesa</p>
          )}
        </div>
      </div>

      {/* FILTRI */}
      <div className={styles.filtersBar}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Categoria</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={styles.select}
          >
            <option value="Tutti">Tutti</option>
            <option value="Attivita">Attivita</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Stato segnalazione</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.select}
          >
            <option value="all">Tutte</option>
            <option value="pending">In attesa</option>
            <option value="accepted">Accettate</option>
            <option value="dismissed">Rigettate</option>
          </select>
        </div>
      </div>

      {flatReports.length === 0 && (
        <p className={styles.message}>Nessuna segnalazione corrisponde ai filtri selezionati.</p>
      )}

      {/* LISTA SEGNALAZIONI */}
      <div className={reportStyles.reportList}>
        {flatReports.map(({ activity, report }) => {
          const reporter =
            typeof report.reportedBy === "object"
              ? report.reportedBy.nickname ?? report.reportedBy.email ?? "Utente"
              : "Utente";

          const isPending = report.reportStatus === "pending";
          const isAccepted = report.reportStatus === "accepted";

          return (
            <div
              key={report._id}
              className={`${reportStyles.reportCard} ${isPending ? reportStyles.reportCardPending : ""}`}
            >
              {/* Header card */}
              <div className={reportStyles.reportCardHeader}>
                <div className={reportStyles.reportCardLeft}>
                  <span className={reportStyles.reportCategory}>Attivita</span>
                  <Link to={`/attivita/${activity._id}`} className={reportStyles.reportActivityTitle}>
                    {activity.title}
                  </Link>
                </div>
                <span className={`${styles.statusBadge} ${statusBadgeClass[report.reportStatus]}`}>
                  {statusLabel[report.reportStatus]}
                </span>
              </div>

              {/* Meta */}
              <div className={reportStyles.reportMeta}>
                <span>Segnalata da <strong>{reporter}</strong></span>
                <span className={reportStyles.reportDate}>
                  {new Date(report.reportedAt).toLocaleDateString("it-IT", {
                    day: "2-digit", month: "long", year: "numeric",
                  })}
                </span>
              </div>

              {/* Motivo */}
              {report.reason ? (
                <p className={reportStyles.reportReason}>{report.reason}</p>
              ) : (
                <p className={reportStyles.reportReasonEmpty}>Nessun motivo specificato</p>
              )}

              {/* Nota di revisione se gia esaminata */}
              {!isPending && report.reviewNote && (
                <p className={reportStyles.reportReviewNote}>
                  Nota admin: {report.reviewNote}
                </p>
              )}

              {/* Azioni — solo se in attesa */}
              {isPending && (
                <div className={reportStyles.reportActions}>
                  <button
                    className={styles.acceptReportButton}
                    onClick={() => handleReportAction(activity._id, report._id, "accept")}
                    disabled={actionLoading === report._id}
                  >
                    {actionLoading === report._id ? "Attendere..." : "Accetta"}
                  </button>
                  <button
                    className={styles.dismissReportButton}
                    onClick={() => handleReportAction(activity._id, report._id, "dismiss")}
                    disabled={actionLoading === report._id}
                  >
                    {actionLoading === report._id ? "Attendere..." : "Rigetta"}
                  </button>
                  <Link to={`/attivita/${activity._id}`} className={appStyles.secondaryButton}>
                    Apri attivita
                  </Link>
                </div>
              )}

              {/* Segnalazione accettata — admin puo rimuovere il banner (rigettando la segnalazione) */}
              {isAccepted && (
                <div className={reportStyles.reportActions}>
                  <button
                    className={styles.dismissReportButton}
                    onClick={() => handleReportAction(activity._id, report._id, "dismiss")}
                    disabled={actionLoading === report._id}
                    title="Rimuove il banner 'Segnalata' dall'attivita"
                  >
                    {actionLoading === report._id ? "Attendere..." : "Rimuovi segnalazione"}
                  </button>
                  <Link to={`/attivita/${activity._id}`} className={appStyles.secondaryButton}>
                    Apri attivita
                  </Link>
                </div>
              )}

              {/* Segnalazione rigettata — solo link all'attivita */}
              {!isPending && !isAccepted && (
                <div className={reportStyles.reportActions}>
                  <Link to={`/attivita/${activity._id}`} className={appStyles.secondaryButton}>
                    Apri attivita
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
