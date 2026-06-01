import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import styles from "../../App.module.css";
import { useAuth } from "../../auth/AuthProvider";
import ReportCard from "../../components/ReportCard";
import type { Activity } from "../../types/Activity";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

// Numero massimo di attività con segnalazioni in attesa mostrate in homepage
const MAX_PENDING_REPORTS = 5;

// Intervallo di polling in ms — aggiorna automaticamente senza ricaricare la pagina
const POLL_INTERVAL_MS = 20_000;

// Tipo per l'organizerID popolato
type PopulatedUser = {
  _id: string;
  nickname: string;
  email: string;
  nome?: string;
  cognome?: string;
};

// Tipo per il report popolato
type PopulatedReport = {
  _id: string;
  reportStatus: string;
  reason: string;
  reportedBy: PopulatedUser | string;
  reportedAt: string;
  reviewedBy?: PopulatedUser | string | null;
  reviewedAt?: string | null;
  reviewNote?: string;
};

// Estendi Activity sovrascrivendo i tipi per organizerID e reports
interface ActivityWithReports extends Omit<Activity, 'organizerID' | 'reports'> {
  organizerID?: PopulatedUser | string;
  reports?: PopulatedReport[];
  suspended?: boolean;
}

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
        });

      setPendingActivities(withPending);

      // Conta totale pending su tutte le attivita
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

  // Helper per ottenere il nickname dell'organizzatore
  const getOrganizerName = (activity: ActivityWithReports): string => {
    const organizer = activity.organizerID;
    // Type guard corretta: verifica che sia un oggetto e che abbia la proprietà nickname
    if (organizer && typeof organizer === 'object' && !Array.isArray(organizer) && 'nickname' in organizer) {
      return (organizer as PopulatedUser).nickname;
    }
    return "Organizzatore sconosciuto";
  };

  // Helper per ottenere il nickname del segnalatore
  const getReporterName = (report: PopulatedReport): string => {
    const reportedBy = report.reportedBy;
    if (reportedBy && typeof reportedBy === 'object' && !Array.isArray(reportedBy) && 'nickname' in reportedBy) {
      return (reportedBy as PopulatedUser).nickname;
    }
    return "Utente sconosciuto";
  };

  // Helper per ottenere l'ID del segnalatore
  const getReporterId = (report: PopulatedReport): string => {
    const reportedBy = report.reportedBy;
    if (typeof reportedBy === "string") {
      return reportedBy;
    }
    if (reportedBy && typeof reportedBy === "object" && !Array.isArray(reportedBy) && "_id" in reportedBy) {
      return (reportedBy as PopulatedUser)._id;
    }
    return "";
  };

  // Prepara i report da mostrare (una card per ogni segnalazione pending)
  // FIXME: Quando verranno implementate le segnalazioni per gli utenti,
  // questa sezione dovrà includere anche i report sugli utenti.
  // Si potrà fare un array unico che combina activityReports e userReports
  const pendingReports = pendingActivities.flatMap((activity) => {
    const pendingReportsList = (activity.reports ?? []).filter(
      (r) => r.reportStatus === "pending"
    );
    return pendingReportsList.map((report) => ({
      type: "activity" as const,
      id: activity._id,
      title: activity.title,
      reason: report.reason || "Nessun motivo specificato",
      organizerName: getOrganizerName(activity),
      reportedBy: getReporterId(report),
      reportedByName: getReporterName(report),
      reportCount: (activity.reports ?? []).filter((r) => r.reportStatus === "pending").length,
      targetLink: `/admin/segnalazioni?activity=${activity._id}`,
    }));
  });

  // Limita il numero di report mostrati
  const limitedReports = pendingReports.slice(0, MAX_PENDING_REPORTS);
  const hasMoreReports = pendingReports.length > MAX_PENDING_REPORTS;

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
            <Link to="/admin/segnalazioni">
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

          {!loading && pendingReports.length === 0 && (
            <p className={styles.adminMessage}>
              Nessuna segnalazione in attesa.
            </p>
          )}

          {!loading && pendingReports.length > 0 && (
            <>
              <div className={styles.pendingReportList}>
                {limitedReports.map((report, idx) => (
                  <ReportCard
                    key={`${report.id}-${idx}`}
                    type={report.type}
                    id={report.id}
                    title={report.title}
                    reason={report.reason}
                    organizerName={report.organizerName}
                    reportedBy={report.reportedBy}
                    reportedByName={report.reportedByName}
                    reportCount={report.reportCount}
                    status="pending"
                    targetLink={report.targetLink}
                  />
                ))}
              </div>

              {hasMoreReports && (
                <Link to="/admin/segnalazioni" className={styles.viewAllReports}>
                  Vedi tutte le segnalazioni ({totalPendingCount} in attesa)
                </Link>
              )}
            </>
          )}

          {/* SEGNALAZIONI USER FIXME */}
          {/* FIXME: Quando verranno implementate le segnalazioni per gli utenti,
          aggiungere qui una sezione orizzontale con ReportCard di tipo "user"
          che mostra gli utenti con segnalazioni pending */}
          <p className={styles.sectionSubtitle}>
            User con segnalazioni ancora da esaminare.
          </p>
          <p className={styles.adminMessage}>
            {/* FIXME: Implementare la logica per mostrare gli utenti segnalati */}
            Nessuna segnalazione utente in attesa.
          </p>

        </section>

        {/* COLONNA DESTRA */}
        <section className={styles.rightColumn}>
          {/* Statistiche rapide */}
          <div className={styles.sectionHead} style={{ marginTop: "28px" }}>
            <h2 className={styles.sectionTitle}>Riepilogo</h2>
          </div>
          <div className={styles.statsGrid}>
            <Link to="/admin/segnalazioni" className={styles.statCard} style={{ textDecoration: "none" }}>
              <span className={styles.statLabel}>Segnalazioni in attesa</span>
              <span className={styles.statValue}>{totalPendingCount}</span>
            </Link>
            <Link to="/admin/segnalazioni?filter=activity" className={styles.statCard} style={{ textDecoration: "none" }}>
              <span className={styles.statLabel}>Attivita con segnalazioni</span>
              <span className={styles.statValue}>{pendingActivities.length}</span>
            </Link>
            {/* FIXME: Aggiungere stat per segnalazioni utenti quando implementate */}
            <Link to="/admin/segnalazioni?filter=user" className={styles.statCard} style={{ textDecoration: "none" }}>
              <span className={styles.statLabel}>Utenti segnalati</span>
              <span className={styles.statValue}>0</span>
            </Link>
          </div>
        </section>

      </div>

    </main>
  );
}