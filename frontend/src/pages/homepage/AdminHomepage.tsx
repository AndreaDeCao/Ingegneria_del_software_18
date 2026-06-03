import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { http } from "../../auth/api";
import ReportCard from "../../components/ReportCard";

import styles from "../../App.module.css";
import { SkeletonReportCard, SkeletonStat  } from "../../components/SkeletonLoader";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
const MAX_PENDING_REPORTS = 5;
const POLL_INTERVAL = 20_000;

import type { ActivityWithReports, ReportCardProps } from "../../types/Reports";
import type { SegnalazioneEntry } from "../../types/Diary";




export default function AdminHomepage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [pendingActivitiesCount, setPendingActivitiesCount] = useState(0);
  const [pendingTreksCount, setPendingTreksCount] = useState(0);
  const [totalPendingCount, setTotalPendingCount] = useState(0);
  const [pendingActivityReports, setPendingActivityReports] = useState<ReportCardProps[]>([]);
  const [pendingTrekReports, setPendingTrekReports] = useState<ReportCardProps[]>([]);
  const [pendingUserReports, setPendingUserReports] = useState<ReportCardProps[]>([]);
  const [pendingUsersCount, setPendingUsersCount] = useState(0);

  const fetchAll = useCallback(async () => {
    if (user?.role !== "admin") return;

    try {
      // ── Attività ──
      let activityCards: ReportCardProps[] = [];
      let activitiesWithPending = 0;
      let totalActivityPending = 0;

      const activitiesRes = await fetch(`${API_BASE}/activities`);
      if (activitiesRes.ok) {
        const activities: ActivityWithReports[] = await activitiesRes.json();
        for (const activity of activities) {
          const pending = (activity.reports ?? []).filter((r) => r.reportStatus === "pending");
          if (!pending.length) continue;
          activitiesWithPending++;
          totalActivityPending += pending.length;

          const organizerName =
            typeof activity.organizerID === "object"
              ? activity.organizerID.nickname
              : "Organizzatore sconosciuto";

          for (const report of pending) {
            const reporter = typeof report.reportedBy === "object" ? report.reportedBy : null;
            activityCards.push({
              type: "activity",
              id: activity._id,
              title: activity.title,
              reason: report.reason || "Nessun motivo specificato",
              organizerName,
              reportedBy: reporter?._id ?? "",
              reportedByName: reporter?.nickname ?? "Utente sconosciuto",
              reportCount: pending.length,
              targetLink: `/admin/attivita/${activity._id}`,
            });
          }
        }
        activityCards.sort((a, b) => (b.reportCount ?? 1) - (a.reportCount ?? 1));
      }

      // ── Percorsi — fan-out per trekId ──
      let trekCards: ReportCardProps[] = [];
      let userCards: ReportCardProps[] = [];
      let totalTrekPending = 0;
      let totalUserPending = 0;

      const treksRes = await fetch(`${API_BASE}/treks/`);
      if (treksRes.ok) {
        const allTreks: { id: number; _id: string; name: string }[] = await treksRes.json();
        const BATCH = 10;
        for (let i = 0; i < allTreks.length; i += BATCH) {
          const batch = allTreks.slice(i, i + BATCH);
          const settled = await Promise.allSettled(
            batch.map((t) => http<SegnalazioneEntry[]>(`/api/diary/segnalazioni?trekId=${t.id}`))
          );
          settled.forEach((res, idx) => {
            if (res.status !== "fulfilled") return;
            const pendingEntries = res.value.filter((s) => s.segnalazione.stato === "pending");
            if (!pendingEntries.length) return;
            for (const entry of pendingEntries) {
              const u = entry.userId;
              if (entry.segnalazione.tipo === "Utente") {
                // segnalazione su un utente: punta alla pagina utenti
                const reportedUser = (entry as any).reportedUser;
                totalUserPending++;
                userCards.push({
                  type: "user",
                  id: entry._id,
                  title: reportedUser?.nickname ? `@${reportedUser.nickname}` : "Utente segnalato",
                  reason: entry.segnalazione.descrizione || "Nessun motivo",
                  reportedBy: u?._id ?? "",
                  reportedByName: u?.nickname ?? u?.email ?? "Utente sconosciuto",
                  targetLink: reportedUser?._id ? `/admin/utenti?userId=${reportedUser._id}` : `/admin/utenti`,
                });
              } else {
                totalTrekPending++;
                trekCards.push({
                  type: "trek",
                  id: entry._id,
                  title: batch[idx].name,
                  reason: [entry.segnalazione.tipo, entry.segnalazione.descrizione].filter(Boolean).join(": ") || "Nessun motivo",
                  reportedBy: u?._id ?? "",
                  reportedByName: u?.nickname ?? u?.email ?? "Utente sconosciuto",
                  targetLink: `/admin/treks/${batch[idx].id}`,
                });
              }
            }
          });
        }
      }

      setPendingActivityReports(activityCards);
      setPendingTrekReports(trekCards);
      setPendingUserReports(userCards);
      setPendingActivitiesCount(activitiesWithPending);
      setPendingTreksCount(totalTrekPending);
      setPendingUsersCount(totalUserPending);
      setTotalPendingCount(totalActivityPending + totalTrekPending + totalUserPending);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => {
    const interval = setInterval(fetchAll, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const visibleActivityReports = pendingActivityReports.slice(0, MAX_PENDING_REPORTS);
  const visibleTrekReports = pendingTrekReports.slice(0, MAX_PENDING_REPORTS);
  const visibleUserReports = pendingUserReports.slice(0, MAX_PENDING_REPORTS);

  return (
    <main className={styles.main}>
      <div className={styles.contentLayout}>

        <section className={styles.leftColumn}>

          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Benvenuto, Admin!</h2>
            <p className={styles.sectionSubtitle}>Qui puoi gestire percorsi, attivit, utenti e segnalazioni.</p>
          </div>

          {/* ── Segnalazioni attività ── */}
          <div className={styles.sectionHead}>
            <Link to="/admin/segnalazioni?tab=attivita">
              <h2 className={styles.sectionTitle}>Segnalazioni Attività</h2>
            </Link>
          </div>
          <p className={styles.sectionSubtitle}>Attività con segnalazioni ancora da esaminare.</p>

          {loading ? (
            <>
              <SkeletonReportCard />
            </>
          ) : pendingActivityReports.length === 0 ? (
            <p className={styles.adminMessage}>Nessuna segnalazione attività in attesa.</p>
          ) : (
            <>
              <div className={styles.pendingReportList}>
                {visibleActivityReports.map((report, index) => (
                  <ReportCard key={`act-${report.id}-${index}`} {...report} status="pending" />
                ))}
              </div>
              {pendingActivityReports.length > MAX_PENDING_REPORTS && (
                <Link to="/admin/segnalazioni?tab=attivita" className={styles.viewAllReports}>
                  Vedi tutte ({pendingActivityReports.length} in attesa)
                </Link>
              )}
            </>
          )}

          {/* ── Segnalazioni percorsi ── */}
          <div className={styles.sectionHead} style={{ marginTop: "1.5rem" }}>
            <Link to="/admin/segnalazioni?tab=percorsi">
              <h2 className={styles.sectionTitle}>Segnalazioni Percorsi</h2>
            </Link>
          </div>
          <p className={styles.sectionSubtitle}>Percorsi con segnalazioni da parte degli utenti ancora da esaminare.</p>

          {loading ? (
            <>
              <SkeletonReportCard />
            </>
          ) : pendingActivityReports.length === 0 ? (
            <p className={styles.adminMessage}>Nessuna segnalazione percorso in attesa.</p>
          ) : (
            <>
              <div className={styles.pendingReportList}>
                {visibleTrekReports.map((report, index) => (
                  <ReportCard key={`trek-${report.id}-${index}`} {...report} status="pending" />
                ))}
              </div>
              {pendingTrekReports.length > MAX_PENDING_REPORTS && (
                <Link to="/admin/segnalazioni?tab=percorsi" className={styles.viewAllReports}>
                  Vedi tutte ({pendingTrekReports.length} in attesa)
                </Link>
              )}
            </>
          )}

          {/* ── Segnalazioni utenti ── */}
          <div className={styles.sectionHead} style={{ marginTop: "1.5rem" }}>
            <Link to="/admin/utenti?tab=utenti">
              <h2 className={styles.sectionTitle}>Segnalazioni Utenti</h2>
            </Link>
          </div>
          <p className={styles.sectionSubtitle}>Utenti con segnalazioni ancora da esaminare.</p>

          {loading ? (
            <p className={styles.adminMessage}>Caricamento...</p>
          ) : pendingUserReports.length === 0 ? (
            <p className={styles.adminMessage}>Nessuna segnalazione utente in attesa.</p>
          ) : (
            <>
              <div className={styles.pendingReportList}>
                {visibleUserReports.map((report, index) => (
                  <ReportCard key={`user-${report.id}-${index}`} {...report} status="pending" />
                ))}
              </div>
              {pendingUserReports.length > MAX_PENDING_REPORTS && (
                <Link to="/admin/utenti" className={styles.viewAllReports}>
                  Vedi tutti ({pendingUserReports.length} in attesa)
                </Link>
              )}
            </>
          )}

        </section>

        <section className={styles.rightColumn}>

          <div className={styles.sectionHead} style={{ marginTop: "28px" }}>
            <h2 className={styles.sectionTitle}>Riepilogo</h2>
          </div>

          <div className={styles.statsGrid}>
            {loading ? (
              <div style={{ display: "column", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <SkeletonStat />
                <SkeletonStat />
                <SkeletonStat />
                <SkeletonStat />
              </div>
            ) : (
              <>
                <Link to="/admin/segnalazioni" className={styles.statCard} style={{ textDecoration: "none" }}>
                  <span className={styles.statLabel}>Totale in attesa</span>
                  <span className={styles.statValue}>{totalPendingCount}</span>
                </Link>

            <Link to="/admin/segnalazioni?tab=attivita" className={styles.statCard} style={{ textDecoration: "none" }}>
              <span className={styles.statLabel}>Attività segnalate in attesa</span>
              <span className={styles.statValue}>{pendingActivitiesCount}</span>
            </Link>

            <Link to="/admin/segnalazioni?tab=percorsi" className={styles.statCard} style={{ textDecoration: "none" }}>
              <span className={styles.statLabel}>Percorsi segnalati in attesa</span>
              <span className={styles.statValue}>{pendingTreksCount}</span>
            </Link>

            <Link to="/admin/utenti?tab=utenti" className={styles.statCard} style={{ textDecoration: "none" }}>
              <span className={styles.statLabel}>Utenti segnalati in attesa</span>
              <span className={styles.statValue}>{pendingUsersCount}</span>
            </Link>

          </div>

        </section>

      </div>
    </main>
  );
}
