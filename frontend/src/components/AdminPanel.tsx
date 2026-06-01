import { memo, useMemo } from "react";
import styles from "./attivitaPage.module.css";

export const AdminPanel = memo(function AdminPanel({
  activity,
  actionLoading,
  handleReportAction
}: any) {

  const reports = activity.reports ?? [];

  const pendingReports = useMemo(
    () => reports.filter((r: any) => r.reportStatus === "pending"),
    [reports]
  );

  const acceptedReports = useMemo(
    () => reports.filter((r: any) => r.reportStatus === "accepted"),
    [reports]
  );

  return (
    <div className={styles.adminPanel}>
      <span className={styles.adminPanelTitle}>Pannello amministratore</span>

      {/* PENDING */}
      {pendingReports.length > 0 && (
        <div className={styles.adminReportsSection}>
          <span className={styles.adminReportsSectionTitle}>
            Segnalazioni in attesa ({pendingReports.length})
          </span>

          {pendingReports.map((r: any) => (
            <div key={r._id} className={styles.adminReportItem}>
              <p>{r.reason}</p>

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

      {/* ACCEPTED */}
      {acceptedReports.length > 0 && (
        <div className={styles.adminReportsSection}>
          <span className={styles.adminReportsSectionTitle}>
            Segnalazioni accettate
          </span>

          {acceptedReports.map((r: any) => (
            <div key={r._id} className={styles.adminReportItem}>
              <p>{r.reason}</p>

              <button
                className={styles.dismissReportButton}
                onClick={() => handleReportAction(r._id, "dismiss")}
              >
                Rimuovi segnalazione
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});