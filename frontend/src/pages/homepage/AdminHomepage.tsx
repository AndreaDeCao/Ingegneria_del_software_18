import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import ReportCard from "../../components/ReportCard";
import styles from "../../App.module.css";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
const MAX_PENDING_REPORTS = 5;

type PopulatedUser = {
  _id: string;
  nickname: string;
  email: string;
  nome?: string;
  cognome?: string;
};

type PopulatedReport = {
  _id: string;
  reportStatus: string;
  reason: string;
  reportedBy: PopulatedUser | string;
  reportedAt: string;
};

type ActivityWithReports = {
  _id: string;
  title: string;
  organizerID?: PopulatedUser | string;
  reports?: PopulatedReport[];
};

type PendingReportCard = {
  type: "activity";
  id: string;
  title: string;
  reason: string;
  organizerName: string;
  reportedBy: string;
  reportedByName: string;
  reportCount: number;
  targetLink: string;
};

export default function AdminHomepage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);

  const [pendingActivitiesCount, setPendingActivitiesCount] = useState(0);
  const [totalPendingCount, setTotalPendingCount] = useState(0);
  const [pendingReports, setPendingReports] = useState<PendingReportCard[]>([]);

  const fetchActivities = useCallback(async () => {
    if (user?.role !== "admin") return;

    try {
      const res = await fetch(`${API_BASE}/activities`);

      if (!res.ok) return;

      const activities: ActivityWithReports[] = await res.json();

      const reports: PendingReportCard[] = [];
      let totalPending = 0;
      let activitiesWithPending = 0;

      for (const activity of activities) {
        const pending = (activity.reports ?? []).filter(
          (r) => r.reportStatus === "pending"
        );

        if (!pending.length) continue;

        activitiesWithPending++;
        totalPending += pending.length;

        const organizerName =
          typeof activity.organizerID === "object"
            ? activity.organizerID.nickname
            : "Organizzatore sconosciuto";

        for (const report of pending) {
          const reporter =
            typeof report.reportedBy === "object"
              ? report.reportedBy
              : null;

          reports.push({
            type: "activity",
            id: activity._id,
            title: activity.title,
            reason: report.reason || "Nessun motivo specificato",
            organizerName,
            reportedBy: reporter?._id ?? "",
            reportedByName:
              reporter?.nickname ?? "Utente sconosciuto",
            reportCount: pending.length,
            targetLink: `/admin/attivita/${activity._id}`,
          });
        }
      }

      reports.sort((a, b) => b.reportCount - a.reportCount);

      setPendingReports(reports);
      setPendingActivitiesCount(activitiesWithPending);
      setTotalPendingCount(totalPending);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const visibleReports = pendingReports.slice(0, MAX_PENDING_REPORTS);

  return (
    <main className={styles.main}>
      <div className={styles.contentLayout}>

        <section className={styles.leftColumn}>

          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>
              Benvenuto, Admin!
            </h2>
            <p className={styles.sectionSubtitle}>
              Qui puoi gestire percorsi, attività e segnalazioni.
            </p>
          </div>

          <div className={styles.sectionHead}>
            <Link to="/admin/segnalazioni">
              <h2 className={styles.sectionTitle}>
                Segnalazioni in attesa
              </h2>
            </Link>
          </div>

          <p className={styles.sectionSubtitle}>
            Attività con segnalazioni ancora da esaminare.
          </p>

          {loading ? (
            <p className={styles.adminMessage}>
              Caricamento...
            </p>
          ) : pendingReports.length === 0 ? (
            <p className={styles.adminMessage}>
              Nessuna segnalazione in attesa.
            </p>
          ) : (
            <>
              <div className={styles.pendingReportList}>
                {visibleReports.map((report, index) => (
                  <ReportCard
                    key={`${report.id}-${index}`}
                    {...report}
                    status="pending"
                  />
                ))}
              </div>

              {pendingReports.length > MAX_PENDING_REPORTS && (
                <Link
                  to="/admin/segnalazioni"
                  className={styles.viewAllReports}
                >
                  Vedi tutte le segnalazioni ({totalPendingCount} in attesa)
                </Link>
              )}
            </>
          )}

          <p className={styles.sectionSubtitle}>
            User con segnalazioni ancora da esaminare.
          </p>

          <p className={styles.adminMessage}>
            Nessuna segnalazione utente in attesa.
          </p>

        </section>

        <section className={styles.rightColumn}>

          <div
            className={styles.sectionHead}
            style={{ marginTop: "28px" }}
          >
            <h2 className={styles.sectionTitle}>Riepilogo</h2>
          </div>

          <div className={styles.statsGrid}>

            <Link
              to="/admin/segnalazioni"
              className={styles.statCard}
              style={{ textDecoration: "none" }}
            >
              <span className={styles.statLabel}>
                Segnalazioni in attesa
              </span>
              <span className={styles.statValue}>
                {totalPendingCount}
              </span>
            </Link>

            <Link
              to="/admin/segnalazioni?filter=activity"
              className={styles.statCard}
              style={{ textDecoration: "none" }}
            >
              <span className={styles.statLabel}>
                Attività con segnalazioni
              </span>
              <span className={styles.statValue}>
                {pendingActivitiesCount}
              </span>
            </Link>

            <Link
              to="/admin/segnalazioni?filter=user"
              className={styles.statCard}
              style={{ textDecoration: "none" }}
            >
              <span className={styles.statLabel}>
                Utenti segnalati
              </span>
              <span className={styles.statValue}>0</span>
            </Link>

          </div>

        </section>

      </div>
    </main>
  );
}