import { useEffect, useState, useCallback, useMemo } from "react";

import styles from "./AdminattivitaPage.module.css";
import appStyles from "../../App.module.css";
import { PageLoader } from "../../components/SkeletonLoader";

import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";

import type { Activity } from "../../types/Activity";
import type { Trek } from "../../types/Trek";

type ActivityWithAdmin = Activity & {
  suspended?: boolean;
  suspendedReason?: string;
  reports?: Array<{ reportStatus: string }>;
};

const POLL_INTERVAL = 20_000; // ogni 20 secondi

export default function AdminVisualizzaListaAttivitaPage() {
  const { user } = useAuth();
  const currentUserID = user?._id;

  const [activities, setActivities] = useState<ActivityWithAdmin[]>([]);
  const [treksMap, setTreksMap] = useState<Record<string, string>>({});

  const [search, setSearch] = useState("");
  const [organizerFilter, setOrganizerFilter] = useState("Tutti");
  const [suspendedFilter, setSuspendedFilter] = useState("Tutte");
  const [reportFilter, setReportFilter] = useState("Tutte");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

  const hasActiveFilters =
    search !== "" ||
    organizerFilter !== "Tutti" ||
    suspendedFilter !== "Tutte" ||
    reportFilter !== "Tutte";

  const resetFilters = () => {
    setSearch("");
    setOrganizerFilter("Tutti");
    setSuspendedFilter("Tutte");
    setReportFilter("Tutte");
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Annullato":
        return styles.statusCancelled;
      case "Chiuso":
        return styles.statusClosed;
      default:
        return styles.statusAvailable;
    }
  };

  const fetchData = useCallback(async () => {
    try {
      setError(null);

      const [activitiesRes, treksRes] = await Promise.all([
        fetch(`${API_BASE}/activities`),
        fetch(`${API_BASE}/treks`)
      ]);

      if (!activitiesRes.ok) {
        throw new Error("Errore nel recupero attività");
      }

      if (!treksRes.ok) {
        throw new Error("Errore nel recupero trek");
      }

      const [activitiesData, treksData] = await Promise.all([
        activitiesRes.json(),
        treksRes.json()
      ]);

      setActivities(activitiesData);

      const trekMap: Record<string, string> = {};

      (treksData as Trek[]).forEach((trek) => {
        trekMap[trek._id] = trek.name;
      });

      setTreksMap(trekMap);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // aggiungi questo subito sotto
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  const filteredActivities = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return activities.filter((activity) => {
      const reports = activity.reports ?? [];

      const hasAcceptedReport = reports.some(
        (r) => r.reportStatus === "accepted"
      );

      const hasPendingReport = reports.some(
        (r) => r.reportStatus === "pending"
      );

      const matchesSearch =
      !searchTerm ||
      activity.title.toLowerCase().includes(searchTerm) ||
      (activity.description ?? "").toLowerCase().includes(searchTerm);

      const organizerId =
        typeof activity.organizerID === "object"
          ? String((activity.organizerID as any)?._id)
          : String(activity.organizerID);

      const matchesOrganizer =
        organizerFilter === "Tutti" ||
        (organizerFilter === "Organizzo" && organizerId === String(currentUserID)) ||
        (organizerFilter === "Non organizzo" && organizerId !== String(currentUserID));

      const matchesSuspended =
        suspendedFilter === "Tutte" ||
        (suspendedFilter === "Sospese" && activity.suspended) ||
        (suspendedFilter === "Non sospese" && !activity.suspended);

      const matchesReport =
        reportFilter === "Tutte" ||
        (reportFilter === "Segnalate" && hasAcceptedReport) ||
        (reportFilter === "Non segnalate" && !hasAcceptedReport) ||
        (reportFilter === "In attesa" && hasPendingReport);
      
      console.log("organizerId:", organizerId, "currentUserID:", currentUserID);

      return (
        matchesSearch &&
        matchesOrganizer &&
        matchesSuspended &&
        matchesReport
      );
    });
  }, [
    activities,
    search,
    organizerFilter,
    suspendedFilter,
    reportFilter,
    currentUserID,
  ]);

  if (loading) return <PageLoader />

  if (error) {
    return (
      <main className={styles.page}>
        <p className={styles.messageError}>{error}</p>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.pageTitle}>Attività in programma</h1>

      <div className={styles.listHeader}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Cerca per titolo o descrizione..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Link
          to="/admin/attivita/crea"
          className={appStyles.primaryButton}
        >
          + Crea attività
        </Link>
      </div>

      <div className={styles.filtersBar}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>
            Organizzazione
          </label>

          <select
            value={organizerFilter}
            onChange={(e) => setOrganizerFilter(e.target.value)}
            className={styles.select}
          >
            <option value="Tutti">Tutti</option>
            <option value="Organizzo">Solo che organizzo</option>
            <option value="Non organizzo">Non organizzo</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>
            Sospensione
          </label>

          <select
            value={suspendedFilter}
            onChange={(e) => setSuspendedFilter(e.target.value)}
            className={styles.select}
          >
            <option value="Tutte">Tutte</option>
            <option value="Sospese">Solo sospese</option>
            <option value="Non sospese">Non sospese</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>
            Segnalazioni
          </label>

          <select
            value={reportFilter}
            onChange={(e) => setReportFilter(e.target.value)}
            className={styles.select}
          >
            <option value="Tutte">Tutte</option>
            <option value="Segnalate">Segnalate</option>
            <option value="Non segnalate">Non segnalate</option>
            <option value="In attesa">In attesa di revisione</option>
          </select>
        </div>

        {hasActiveFilters && (
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              &nbsp;
            </label>

            <button
              className={styles.resetFiltersButton}
              onClick={resetFilters}
            >
              Azzera filtri
            </button>
          </div>
        )}
      </div>

      <section className={styles.activitiesGrid}>
        {filteredActivities.map((activity) => {
          const reports = activity.reports ?? [];

          const hasAcceptedReport = reports.some(
            (r) => r.reportStatus === "accepted"
          );

          const hasPendingReport = reports.some(
            (r) => r.reportStatus === "pending"
          );

          const isExpired =
            new Date(activity.activityDate).getTime() <
            Date.now();

          const effectiveStatus =
            isExpired && activity.status === "Aperto"
              ? "Chiuso"
              : activity.status;

          return (
            <Link
              key={activity._id}
              to={`/admin/attivita/${activity._id}`}
            >
              <article
                className={`
                  ${styles.activityCard}
                  ${
                    activity.suspended
                      ? styles.activityCardSuspended
                      : ""
                  }
                  ${
                    hasAcceptedReport
                      ? styles.activityCardReported
                      : ""
                  }
                `}
              >
                <div className={styles.cardTop}>
                  <div
                    style={{
                      display: "flex",
                      gap: "6px",
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    {activity.suspended ? (
                      <span
                        className={`${styles.statusBadge} ${styles.statusSuspended}`}
                      >
                        Sospesa
                      </span>
                    ) : (
                      <span
                        className={`${styles.statusBadge} ${getStatusClass(
                          effectiveStatus
                        )}`}
                      >
                        {effectiveStatus}
                      </span>
                    )}

                    {hasAcceptedReport && (
                      <span
                        className={`${styles.statusBadge} ${styles.statusReported}`}
                      >
                        Segnalata
                      </span>
                    )}

                    {hasPendingReport && (
                      <span
                        className={`${styles.statusBadge} ${styles.statusPendingReport}`}
                      >
                        In attesa
                      </span>
                    )}
                  </div>

                  <span className={styles.activityId}>
                    #{activity._id}
                  </span>
                </div>

                <h3 className={styles.activityTitle}>
                  {activity.title}
                </h3>

                <div className={styles.trekName}>
                  <b>Trek:</b>{" "}
                  {treksMap[activity.trekID] ??
                    "Trek sconosciuto"}
                </div>

                <p className={styles.activityDescription}>
                  {activity.description}
                </p>

                <div className={styles.activityInfo}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>
                      Data
                    </span>
                    <span className={styles.infoValue}>
                      {new Date(
                        activity.activityDate
                      ).toLocaleDateString("it-IT")}
                    </span>
                  </div>

                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>
                      Partecipanti
                    </span>
                    <span className={styles.infoValue}>
                      {(activity.partecipantList ?? []).length} /{" "}
                      {activity.maxParticipants}
                    </span>
                  </div>
                </div>

                <div className={styles.cardActions}>
                  <span
                    className={`${styles.statusBadge} ${styles.statusSuspended}`}
                    style={{
                      background:
                        "rgba(155,89,182,0.1)",
                      color: "#8e44ad",
                      border:
                        "1px solid rgba(155,89,182,0.2)",
                    }}
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