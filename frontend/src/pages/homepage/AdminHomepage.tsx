import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import styles from "../../App.module.css";
import { useAuth } from "../../auth/AuthProvider";
import ActivityCard from "../../components/ActivityCard";
import type { Activity } from "../../types/Activity";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

// Numero massimo di attività con segnalazioni in attesa mostrate in homepage
const MAX_PENDING_REPORTS = 5;

// Intervallo di polling in ms — aggiorna automaticamente senza ricaricare la pagina
const POLL_INTERVAL_MS = 20_000;

type ActivityWithReports = Activity & {
  reports?: Array<{ reportStatus: string }>;
  suspended?: boolean;
};

export default function AdminHomepage() {
  const { user } = useAuth();

  const [pendingActivities, setPendingActivities] = useState<ActivityWithReports[]>([]);
  const [loading, setLoading] = useState(true);

  // Conta totale segnalazioni pending su tutte le attivita
  const [totalPendingCount, setTotalPendingCount] = useState(0);

  const fetchActivities = useCallback(async (silent = false) => {
    if (user?.role !== "admin") return;
    try {
      const res = await fetch(`${API_BASE}/activities/`);
      if (!res.ok) return;
      const data: ActivityWithReports[] = await res.json();

      // Attivita con segnalazioni pending — ordinate per numero di pending desc
      const withPending = data
        .filter((a) => (a.reports ?? []).some((r) => r.reportStatus === "pending"))
        .sort((a, b) => {
          const pa = (a.reports ?? []).filter((r) => r.reportStatus === "pending").length;
          const pb = (b.reports ?? []).filter((r) => r.reportStatus === "pending").length;
          return pb - pa;
        })
        .slice(0, MAX_PENDING_REPORTS);

      setPendingActivities(withPending);

      // Conta totale pending su tutte le attivita (non solo le prime MAX_PENDING_REPORTS)
      const total = data.reduce(
        (acc, a) => acc + (a.reports ?? []).filter((r) => r.reportStatus === "pending").length,
        0
      );
      setTotalPendingCount(total);

    } catch {
      // silenzioso — non blocca il render
    } finally {
      if (!silent) setLoading(false);
    }
  }, [user]);

  // Caricamento iniziale
  useEffect(() => {
    fetchActivities(false);
  }, [fetchActivities]);

  // Polling automatico — aggiorna in background senza mostrare spinner
  useEffect(() => {
    const interval = setInterval(() => {
      fetchActivities(true);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchActivities]);

  return (
    <main className={styles.main}>

      <div className={styles.contentLayout}>

        {/* COLONNA SINISTRA */}
        <section className={styles.leftColumn}>

          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Benvenuto, Admin!</h2>
            <p className={styles.sectionSubtitle}>
              Qui puoi gestire i percorsi, le attivita e le segnalazioni degli utenti.
            </p>
          </div>

          {/* SEGNALAZIONI ATTIVITA */}
          <div className={styles.sectionHead}>
            <Link to="/admin/segnalazioni" >
              <h2 className={styles.sectionTitle}>Segnalazioni in attesa</h2>
            </Link>
          </div>
          <p className={styles.sectionSubtitle}>
            Attivita con segnalazioni ancora da esaminare.
          </p>

          {loading && (
            <p className={styles.adminMessage}>
              Caricamento...
            </p>
          )}

          {!loading && pendingActivities.length === 0 && (
            <p className={styles.adminMessage}>
              Nessuna segnalazione in attesa.
            </p>
          )}

          {!loading && pendingActivities.length > 0 && (
            <div className={styles.pendingReportList}>
              {pendingActivities.map((activity) => {
                const pendingCount = (activity.reports ?? []).filter(
                  (r) => r.reportStatus === "pending"
                ).length;
                return (
                  <div key={activity._id} className={styles.pendingReportWrapper}>
                    <ActivityCard activity={activity} />
                    {/* Badge numero segnalazioni in attesa */}
                    <div className={styles.pendingBadge}>
                      {pendingCount} in attesa
                    </div>
                  </div>
                );
              })}

              {totalPendingCount > MAX_PENDING_REPORTS && (
                <Link to="/admin/segnalazioni" className={styles.viewAllReports}>
                  Vedi tutte le segnalazioni ({totalPendingCount} in attesa)
                </Link>
              )}
            </div>
          )}

          {/* SEGNALAZIONI USER FIXME*/}
          <p className={styles.sectionSubtitle}>
            User con segnalazioni ancora da esaminare.
          </p>
          

        </section>

        {/* COLONNA DESTRA */}
        <section className={styles.rightColumn}>
          {/* Statistiche rapide */}
          <div className={styles.sectionHead} style={{ marginTop: "28px" }}>
            <h2 className={styles.sectionTitle}>Riepilogo</h2>
          </div>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Segnalazioni in attesa</span>
              <span className={styles.statValue}>{totalPendingCount}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Attivita con segnalazioni</span>
              <span className={styles.statValue}>{pendingActivities.length}</span>
            </div>
          </div>
        </section>

      </div>

    </main>
  );
}
