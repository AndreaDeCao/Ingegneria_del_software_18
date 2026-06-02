import { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import styles from "../attivita/attivitaPage.module.css";
import reportStyles from "./GestioneSegnalazioni.module.css";
import appStyles from "../../App.module.css";
import { useAuth } from "../../auth/AuthProvider";

type ReportStatus = "pending" | "accepted" | "dismissed";

type PopulatedUser = {
  _id: string;
  nickname?: string;
  nome?: string;
  cognome?: string;
  email?: string;
};

type Report = {
  _id: string;
  reportedBy: PopulatedUser | string;
  reason: string;
  reportedAt: string;
  reportStatus: ReportStatus;
  reviewedBy?: PopulatedUser | string | null;
  reviewedAt?: string | null;
  reviewNote?: string;
};

type ActivityWithReports = {
  _id: string;
  title: string;
  status: string;
  activityDate: string;
  organizerID: PopulatedUser | string;
  trekID: string;
  reports: Report[];
  suspended?: boolean;
};

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export default function GestioneSegnalazioniPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const filterParam = searchParams.get("filter");

  const [activities, setActivities] = useState<ActivityWithReports[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filtri
  const [categoryFilter, setCategoryFilter] = useState(() => {
    if (filterParam === "activity") return "Attivita";
    if (filterParam === "user") return "Utenti";
    return "Tutti";
  });
  const [statusFilter, setStatusFilter] = useState("all");

  const isAdmin = user?.role === "admin";

  const fetchAll = useCallback(async (silent = false) => {
    if (!isAdmin) return;
    try {
      // Ora getActivities restituisce i dati già popolati
      const res = await fetch(`${API_BASE}/activities/`);
      if (!res.ok) throw new Error("Errore nel recupero attivita");
      const data: ActivityWithReports[] = await res.json();

      // Filtra solo attività con segnalazioni
      const withReports = data.filter((a) => (a.reports ?? []).length > 0);
      setActivities(withReports);
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

  async function handleReportAction(activityId: string, reportId: string, action: "accept" | "dismiss", e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
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

  // Helper per ottenere il nickname del segnalatore
  const getReporterName = (report: Report): string => {
    const reportedBy = report.reportedBy;
    if (reportedBy && typeof reportedBy === 'object' && !Array.isArray(reportedBy)) {
      return reportedBy.nickname || reportedBy.email || "Utente";
    }
    if (typeof reportedBy === "string") {
      return reportedBy;
    }
    return "Utente sconosciuto";
  };

  // Helper per ottenere il nickname dell'organizzatore
  const getOrganizerName = (activity: ActivityWithReports): string => {
    const organizer = activity.organizerID;
    if (organizer && typeof organizer === 'object' && !Array.isArray(organizer)) {
      return organizer.nickname || organizer.email || "Organizzatore";
    }
    return "Organizzatore sconosciuto";
  };

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
      // Applica filtro categoria
      if (categoryFilter !== "Tutti" && categoryFilter !== "Attivita") {
        return; // FIXME: Quando implementato filtro utenti
      }
      
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
            {/* FIXME: Quando implementate segnalazioni utenti, sbloccare questa opzione
            <option value="Utenti">Utenti</option>
            */}
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
          const reporterName = getReporterName(report);
          const organizerName = getOrganizerName(activity);
          
          // Controllo sicuro per reportedBy
          const reporterEmail = (report.reportedBy && typeof report.reportedBy === "object" && report.reportedBy !== null) 
            ? report.reportedBy.email 
            : null;
          const reporterFullName = (report.reportedBy && typeof report.reportedBy === "object" && report.reportedBy !== null)
            ? [report.reportedBy.nome, report.reportedBy.cognome].filter(Boolean).join(" ")
            : null;

          // Controllo sicuro per organizerID
          const organizerEmail = (activity.organizerID && typeof activity.organizerID === "object" && activity.organizerID !== null)
            ? activity.organizerID.email
            : null;
          const organizerFullName = (activity.organizerID && typeof activity.organizerID === "object" && activity.organizerID !== null)
            ? [activity.organizerID.nome, activity.organizerID.cognome]
                .filter(Boolean)
                .join(" ")
            : null;

          const isPending = report.reportStatus === "pending";
          const isAccepted = report.reportStatus === "accepted";

          return (
            <Link
              key={report._id}
              to={`/admin/attivita/${activity._id}`}
              className={reportStyles.reportCardLink}
            >
              <div
                className={`${reportStyles.reportCard} ${isPending ? reportStyles.reportCardPending : ""}`}
              >
                {/* Header card */}
                <div className={reportStyles.reportCardHeader}>
                  <div className={reportStyles.reportCardLeft}>
                    <span className={reportStyles.reportCategory}>Attivita</span>
                    <span className={reportStyles.reportActivityTitle}>
                      {activity.title}
                    </span>
                  </div>
                  <span className={`${styles.statusBadge} ${statusBadgeClass[report.reportStatus]}`}>
                    {statusLabel[report.reportStatus]}
                  </span>
                </div>

                {/* Meta */}
                {/* Segnalatore */}
                <div className={reportStyles.reportMeta}>
                  <span>
                    Segnalata da <strong>{reporterName}</strong>

                    {reporterEmail && reporterName !== reporterEmail && (
                      <>
                        <span style={{ opacity: 0.5, margin: "0 6px" }}>·</span>
                        <span style={{ opacity: 0.7 }}>{reporterEmail}</span>
                      </>
                    )}

                    {reporterFullName && (
                      <>
                        <span style={{ opacity: 0.5, margin: "0 6px" }}>·</span>
                        <span style={{ opacity: 0.7 }}>{reporterFullName}</span>
                      </>
                    )}
                  </span>

                  <span className={reportStyles.reportDate}>
                    {new Date(report.reportedAt).toLocaleDateString("it-IT", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {/* Organizzatore */}
                <div className={reportStyles.reportMeta}>
                  <span>
                    Organizzatore <strong>{organizerName}</strong>

                    {organizerEmail && organizerName !== organizerEmail && (
                      <>
                        <span style={{ opacity: 0.5, margin: "0 6px" }}>·</span>
                        <span style={{ opacity: 0.7 }}>{organizerEmail}</span>
                      </>
                    )}

                    {organizerFullName && (
                      <>
                        <span style={{ opacity: 0.5, margin: "0 6px" }}>·</span>
                        <span style={{ opacity: 0.7 }}>{organizerFullName}</span>
                      </>
                    )}
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
                      onClick={(e) => handleReportAction(activity._id, report._id, "accept", e)}
                      disabled={actionLoading === report._id}
                    >
                      {actionLoading === report._id ? "Attendere..." : "Accetta"}
                    </button>
                    <button
                      className={styles.dismissReportButton}
                      onClick={(e) => handleReportAction(activity._id, report._id, "dismiss", e)}
                      disabled={actionLoading === report._id}
                    >
                      {actionLoading === report._id ? "Attendere..." : "Rigetta"}
                    </button>
                  </div>
                )}

                {/* Segnalazione accettata — admin puo rimuovere il banner */}
                {isAccepted && (
                  <div className={reportStyles.reportActions}>
                    <button
                      className={styles.dismissReportButton}
                      onClick={(e) => handleReportAction(activity._id, report._id, "dismiss", e)}
                      disabled={actionLoading === report._id}
                      title="Rimuove il banner 'Segnalata' dall'attivita"
                    >
                      {actionLoading === report._id ? "Attendere..." : "Rimuovi segnalazione"}
                    </button>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}