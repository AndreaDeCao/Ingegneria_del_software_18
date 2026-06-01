import { useEffect, useState, useCallback } from "react";
import styles from "./attivitaPage.module.css";
import appStyles from "../../App.module.css";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";

import type { Activity } from "../../types/Activity";
import type { Trek } from "../../types/Trek";

// Intervallo di polling in ms — aggiorna la lista senza ricaricare la pagina
const POLL_INTERVAL_MS = 20_000;

type ActivityWithAdmin = Activity & {
  suspended?: boolean;
  suspendedReason?: string;
  reports?: Array<{ reportStatus: string }>;
};

export default function AdminVisualizzaAttivitaPage() {
  const { user } = useAuth();

  const [activities, setActivities] = useState<ActivityWithAdmin[]>([]);
  const [treksMap, setTreksMap] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");

  const [organizerFilter, setOrganizerFilter] = useState("Tutti");
  const [suspendedFilter, setSuspendedFilter] = useState("Tutte");
  const [reportFilter, setReportFilter] = useState("Tutte");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentUserID = user?._id;

  const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

  function hasAcceptedReport(a: ActivityWithAdmin) {
    return (a.reports ?? []).some((r) => r.reportStatus === "accepted");
  }
  function hasPendingReport(a: ActivityWithAdmin) {
    return (a.reports ?? []).some((r) => r.reportStatus === "pending");
  }

  const hasActiveFilters =
    search !== "" ||
    organizerFilter !== "Tutti" ||
    suspendedFilter !== "Tutte" ||
    reportFilter !== "Tutte";

  function resetFilters() {
    setSearch("");
    setOrganizerFilter("Tutti");
    setSuspendedFilter("Tutte");
    setReportFilter("Tutte");
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Annullato": return styles.statusCancelled;
      case "Chiuso":    return styles.statusClosed;
      default:          return styles.statusAvailable;
    }
  };

  const filteredActivities = activities.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase());
    const isOrganizer = a.organizerID === currentUserID;

    const matchesOrganizer =
      organizerFilter === "Tutti" ||
      (organizerFilter === "Organizzo" && isOrganizer) ||
      (organizerFilter === "Non organizzo" && !isOrganizer);

    const matchesSuspended =
      suspendedFilter === "Tutte" ||
      (suspendedFilter === "Sospese" && a.suspended) ||
      (suspendedFilter === "Non sospese" && !a.suspended);

    const matchesReport =
      reportFilter === "Tutte" ||
      (reportFilter === "Segnalate" && hasAcceptedReport(a)) ||
      (reportFilter === "Non segnalate" && !hasAcceptedReport(a)) ||
      (reportFilter === "In attesa" && hasPendingReport(a));

    return matchesSearch && matchesOrganizer && matchesSuspended && matchesReport;
  });

  const fetchData = useCallback(async (silent = false) => {
    try {
      const resActivities = await fetch(`${API_BASE}/activities/`);
      if (!resActivities.ok) throw new Error("Errore nel recupero attivita");
      const activitiesData: ActivityWithAdmin[] = await resActivities.json();
      setActivities(activitiesData);

      // I trek li carichiamo solo al primo fetch (non cambiano durante il polling)
      if (!silent) {
        const resTreks = await fetch(`${API_BASE}/treks/`);
        if (!resTreks.ok) throw new Error("Errore nel recupero trek");
        const treksData: Trek[] = await resTreks.json();
        const map: Record<string, string> = {};
        treksData.forEach((t) => { map[t._id] = t.name; });
        setTreksMap(map);
      }
    } catch (err: any) {
      if (!silent) setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [API_BASE]);

  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(true);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) return <main className={styles.page}><p className={styles.message}>Caricamento attivita...</p></main>;
  if (error) return <main className={styles.page}><p className={styles.messageError}>{error}</p></main>;

  return (
    <main className={styles.page}>
      <h1 className={styles.pageTitle}>Attivita in programma</h1>

      <div className={styles.listHeader}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Cerca per titolo o descrizione..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Link to="/attivita/crea" className={appStyles.primaryButton}>
          + Crea attivita
        </Link>
      </div>

      <div className={styles.filtersBar}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Organizzazione</label>
          <select value={organizerFilter} onChange={(e) => setOrganizerFilter(e.target.value)} className={styles.select}>
            <option value="Tutti">Tutti</option>
            <option value="Organizzo">Solo che organizzo</option>
            <option value="Non organizzo">Non organizzo</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Sospensione</label>
          <select value={suspendedFilter} onChange={(e) => setSuspendedFilter(e.target.value)} className={styles.select}>
            <option value="Tutte">Tutte</option>
            <option value="Sospese">Solo sospese</option>
            <option value="Non sospese">Non sospese</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Segnalazioni</label>
          <select value={reportFilter} onChange={(e) => setReportFilter(e.target.value)} className={styles.select}>
            <option value="Tutte">Tutte</option>
            <option value="Segnalate">Segnalate</option>
            <option value="Non segnalate">Non segnalate</option>
            <option value="In attesa">In attesa di revisione</option>
          </select>
        </div>

        {hasActiveFilters && (
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>&nbsp;</label>
            <button className={styles.resetFiltersButton} onClick={resetFilters}>
              Azzera filtri
            </button>
          </div>
        )}
      </div>

      {/* BOX ATTIVITA — vista admin */}
      <section className={styles.activitiesGrid}>
        {filteredActivities.map((activity) => {
          const isExpired = new Date(activity.activityDate).getTime() < Date.now();
          const effectiveStatus = isExpired && activity.status === "Aperto" ? "Chiuso" : activity.status;
          const isSuspended = activity.suspended;
          const isReported = hasAcceptedReport(activity);
          const isPendingReport = hasPendingReport(activity);

          return (
            <Link key={activity._id} to={`/admin/attivita/${activity._id}`}>
              <article
                className={`${styles.activityCard} ${isSuspended ? styles.activityCardSuspended : ""} ${isReported ? styles.activityCardReported : ""}`}
              >
                <div className={styles.cardTop}>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                    {isSuspended ? (
                      <span className={`${styles.statusBadge} ${styles.statusSuspended}`}>Sospesa</span>
                    ) : (
                      <span className={`${styles.statusBadge} ${getStatusClass(effectiveStatus)}`}>{effectiveStatus}</span>
                    )}
                    {isReported && (
                      <span className={`${styles.statusBadge} ${styles.statusReported}`}>Segnalata</span>
                    )}
                    {isPendingReport && (
                      <span className={`${styles.statusBadge} ${styles.statusPendingReport}`}>In attesa</span>
                    )}
                  </div>
                  <span className={styles.activityId}>#{activity._id}</span>
                </div>

                <h3 className={styles.activityTitle}>{activity.title}</h3>

                <div className={styles.trekName}>
                  <b>Trek:</b> {treksMap[activity.trekID] ?? "Trek sconosciuto"}
                </div>

                <p className={styles.activityDescription}>{activity.description}</p>

                <div className={styles.activityInfo}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Data</span>
                    <span className={styles.infoValue}>{new Date(activity.activityDate).toLocaleDateString("it-IT")}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Partecipanti</span>
                    <span className={styles.infoValue}>{(activity.partecipantList ?? []).length} / {activity.maxParticipants}</span>
                  </div>
                </div>

                <div className={styles.cardActions}>
                  <span
                    className={`${styles.statusBadge} ${styles.statusSuspended}`}
                    style={{ background: "rgba(155,89,182,0.1)", color: "#8e44ad", border: "1px solid rgba(155,89,182,0.2)" }}
                  >
                    Admin
                  </span>
                </div>
              </article>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
