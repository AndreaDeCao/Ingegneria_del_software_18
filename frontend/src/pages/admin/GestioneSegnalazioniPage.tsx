import { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import styles from "../attivita/attivitaPage.module.css";
import reportStyles from "./GestioneSegnalazioni.module.css";
import { useAuth } from "../../auth/AuthProvider";
import type {
  ActivityWithReports,
  FlatReport,
  PopulatedUser,
  Report,
  ReportStatus,
} from "../../types/Reports.ts";

// ── Costanti ──────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

const STATUS_LABEL: Record<ReportStatus, string> = {
  pending: "In attesa",
  accepted: "Accettata",
  dismissed: "Rigettata",
};

const STATUS_BADGE_CLASS: Record<ReportStatus, string> = {
  pending: styles.statusPendingReport,
  accepted: styles.statusReported,
  dismissed: styles.statusClosed,
};

const POLL_INTERVAL = 20_000; // ogni 20 secondi

// ── Helpers puri ──────────────────────────────────────────────────────────

function getDisplayName(user: PopulatedUser | string | null | undefined, fallback: string): string {
  if (!user) return fallback;
  if (typeof user === "object") return user.nickname || user.email || fallback;
  return user;
}

function getEmail(user: PopulatedUser | string | null | undefined): string | null {
  if (user && typeof user === "object") return user.email ?? null;
  return null;
}

function getFullName(user: PopulatedUser | string | null | undefined): string | null {
  if (user && typeof user === "object") {
    const full = [user.nome, user.cognome].filter(Boolean).join(" ");
    return full || null;
  }
  return null;
}

function buildFlatReports(
  activities: ActivityWithReports[],
  categoryFilter: string,
  statusFilter: string
): FlatReport[] {
  const flat: FlatReport[] = [];

  for (const activity of activities) {
    for (const report of activity.reports ?? []) {
      if (categoryFilter !== "Tutti" && categoryFilter !== "Attivita") continue;
      if (statusFilter !== "all" && report.reportStatus !== statusFilter) continue;
      flat.push({ activity, report });
    }
  }

  // Pending prima, poi per data decrescente
  flat.sort((a, b) => {
    const aPending = a.report.reportStatus === "pending";
    const bPending = b.report.reportStatus === "pending";
    if (aPending !== bPending) return aPending ? -1 : 1;
    return new Date(b.report.reportedAt).getTime() - new Date(a.report.reportedAt).getTime();
  });

  return flat;
}

function countPending(activities: ActivityWithReports[]): number {
  return activities.reduce(
    (acc, a) => acc + (a.reports ?? []).filter((r) => r.reportStatus === "pending").length,
    0
  );
}

// ── Componenti interni ────────────────────────────────────────────────────

function UserMeta({
  label,
  user,
  fallback,
}: {
  label: string;
  user: PopulatedUser | string | null | undefined;
  fallback: string;
}) {
  const displayName = getDisplayName(user, fallback);
  const email = getEmail(user);
  const fullName = getFullName(user);

  return (
    <div className={reportStyles.reportMeta}>
      <span>
        {label} <strong>{displayName}</strong>
        {email && email !== displayName && (
          <>
            <span style={{ opacity: 0.5, margin: "0 6px" }}>·</span>
            <span style={{ opacity: 0.7 }}>{email}</span>
          </>
        )}
        {fullName && (
          <>
            <span style={{ opacity: 0.5, margin: "0 6px" }}>·</span>
            <span style={{ opacity: 0.7 }}>{fullName}</span>
          </>
        )}
      </span>
    </div>
  );
}

function ReportActions({
  activityId,
  report,
  actionLoading,
  onAction,
}: {
  activityId: string;
  report: Report;
  actionLoading: string | null;
  onAction: (activityId: string, reportId: string, action: "accept" | "dismiss", e: React.MouseEvent) => void;
}) {
  const isLoading = actionLoading === report._id;
  const label = isLoading ? "Attendere..." : undefined;

  if (report.reportStatus === "pending") {
    return (
      <div className={reportStyles.reportActions}>
        <button
          className={styles.acceptReportButton}
          onClick={(e) => onAction(activityId, report._id, "accept", e)}
          disabled={isLoading}
        >
          {label ?? "Accetta"}
        </button>
        <button
          className={styles.dismissReportButton}
          onClick={(e) => onAction(activityId, report._id, "dismiss", e)}
          disabled={isLoading}
        >
          {label ?? "Rigetta"}
        </button>
      </div>
    );
  }

  if (report.reportStatus === "accepted") {
    return (
      <div className={reportStyles.reportActions}>
        <button
          className={styles.dismissReportButton}
          onClick={(e) => onAction(activityId, report._id, "dismiss", e)}
          disabled={isLoading}
          title="Rimuove il banner 'Segnalata' dall'attività"
        >
          {label ?? "Rimuovi segnalazione"}
        </button>
      </div>
    );
  }

  return null;
}

function ReportCard({
  activity,
  report,
  actionLoading,
  onAction,
}: {
  activity: ActivityWithReports;
  report: Report;
  actionLoading: string | null;
  onAction: (activityId: string, reportId: string, action: "accept" | "dismiss", e: React.MouseEvent) => void;
}) {
  const isPending = report.reportStatus === "pending";

  return (
    <Link
      key={report._id}
      to={`/admin/attivita/${activity._id}`}
      className={reportStyles.reportCardLink}
    >
      <div className={`${reportStyles.reportCard} ${isPending ? reportStyles.reportCardPending : ""}`}>
        {/* Header */}
        <div className={reportStyles.reportCardHeader}>
          <div className={reportStyles.reportCardLeft}>
            <span className={reportStyles.reportCategory}>Attività</span>
            <span className={reportStyles.reportActivityTitle}>{activity.title}</span>
          </div>
          <span className={`${styles.statusBadge} ${STATUS_BADGE_CLASS[report.reportStatus]}`}>
            {STATUS_LABEL[report.reportStatus]}
          </span>
        </div>

        {/* Segnalatore */}
        <UserMeta label="Segnalata da" user={report.reportedBy} fallback="Utente sconosciuto" />

        {/* Data segnalazione */}
        <div className={reportStyles.reportMeta}>
          <span className={reportStyles.reportDate}>
            {new Date(report.reportedAt).toLocaleDateString("it-IT", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>

        {/* Organizzatore */}
        <UserMeta label="Organizzatore" user={activity.organizerID} fallback="Organizzatore sconosciuto" />

        {/* Motivo */}
        {report.reason ? (
          <p className={reportStyles.reportReason}>{report.reason}</p>
        ) : (
          <p className={reportStyles.reportReasonEmpty}>Nessun motivo specificato</p>
        )}

        {/* Nota di revisione */}
        {!isPending && report.reviewNote && (
          <p className={reportStyles.reportReviewNote}>Nota admin: {report.reviewNote}</p>
        )}

        {/* Azioni */}
        <ReportActions
          activityId={activity._id}
          report={report}
          actionLoading={actionLoading}
          onAction={onAction}
        />
      </div>
    </Link>
  );
}

// ── Pagina principale ─────────────────────────────────────────────────────

export default function GestioneSegnalazioniPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const filterParam = searchParams.get("filter");

  const [activities, setActivities] = useState<ActivityWithReports[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [categoryFilter, setCategoryFilter] = useState(() => {
    if (filterParam === "activity") return "Attivita";
    if (filterParam === "user") return "Utenti";
    return "Tutti";
  });
  const [statusFilter, setStatusFilter] = useState("all");

  const isAdmin = user?.role === "admin";

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchAll = useCallback(
    async (silent = false) => {
      if (!isAdmin) return;
      try {
        const res = await fetch(`${API_BASE}/activities/`);
        if (!res.ok) throw new Error("Errore nel recupero attività");
        const data: ActivityWithReports[] = await res.json();
        setActivities(data.filter((a) => (a.reports ?? []).length > 0));
      } catch (err: any) {
        if (!silent) setError(err.message);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [isAdmin]
  );

  useEffect(() => {
    fetchAll(false);
  }, [fetchAll]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchAll(true); // silent=true: non mostra errori e non tocca il loading
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchAll]);

  // ── Azioni sulle segnalazioni ────────────────────────────────────────────

  async function handleReportAction(
    activityId: string,
    reportId: string,
    action: "accept" | "dismiss",
    e: React.MouseEvent
  ) {
    e.stopPropagation();
    e.preventDefault();
    setActionLoading(reportId);
    try {
      const res = await fetch(
        `${API_BASE}/activities/${activityId}/reports/${reportId}/${action}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userID: user?._id, userRole: user?.role }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || "Errore");
      }
      const updated: ActivityWithReports = await res.json();
      setActivities((prev) =>
        prev
          .map((a) => (a._id === activityId ? { ...a, reports: updated.reports } : a))
          .filter((a) => (a.reports ?? []).length > 0)
      );
    } catch (err: any) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  }

  // ── Guard ────────────────────────────────────────────────────────────────

  if (!isAdmin) {
    return (
      <main className={styles.page}>
        <p className={styles.messageError}>Accesso riservato agli amministratori.</p>
      </main>
    );
  }
  if (loading) {
    return (
      <main className={styles.page}>
        <p className={styles.message}>Caricamento segnalazioni...</p>
      </main>
    );
  }
  if (error) {
    return (
      <main className={styles.page}>
        <p className={styles.messageError}>{error}</p>
      </main>
    );
  }

  // ── Dati derivati ────────────────────────────────────────────────────────

  const flatReports = buildFlatReports(activities, categoryFilter, statusFilter);
  const pendingCount = countPending(activities);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <main className={styles.page}>
      {/* Intestazione */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 className={styles.pageTitle}>Gestione Segnalazioni</h1>
          <p className={styles.message}>
            {pendingCount > 0
              ? `${pendingCount} segnalazion${pendingCount === 1 ? "e" : "i"} in attesa di revisione`
              : "Nessuna segnalazione in attesa"}
          </p>
        </div>
      </div>

      {/* Filtri */}
      <div className={styles.filtersBar}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Categoria</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={styles.select}
          >
            <option value="Tutti">Tutti</option>
            <option value="Attivita">Attività</option>
            {/* FIXME: Sbloccare quando implementate segnalazioni utenti
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

      {/* Lista */}
      {flatReports.length === 0 ? (
        <p className={styles.message}>Nessuna segnalazione corrisponde ai filtri selezionati.</p>
      ) : (
        <div className={reportStyles.reportList}>
          {flatReports.map(({ activity, report }) => (
            <ReportCard
              key={report._id}
              activity={activity}
              report={report}
              actionLoading={actionLoading}
              onAction={handleReportAction}
            />
          ))}
        </div>
      )}
    </main>
  );
}
