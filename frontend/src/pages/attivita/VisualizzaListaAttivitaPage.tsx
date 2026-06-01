import { useEffect, useState, useCallback } from "react";
import styles from "./attivitaPage.module.css";
import appStyles from "../../App.module.css";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { http } from "../../auth/api";

import type { Activity } from "../../types/Activity";
import type { Trek } from "../../types/Trek";

// Intervallo di polling in ms — aggiorna la lista senza ricaricare la pagina
const POLL_INTERVAL_MS = 20_000;

type JoinModal = { activity: Activity } | null;

type ActivityWithAdmin = Activity & {
  suspended?: boolean;
  suspendedReason?: string;
  reports?: Array<{ reportStatus: string }>;
};

export default function VisualizzaAttivitaPage() {
  const { user } = useAuth();

  const [activities, setActivities] = useState<ActivityWithAdmin[]>([]);
  const [treksMap, setTreksMap] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("Tutti");
  const [selectedDate, setSelectedDate] = useState("");
  const [travelModeFilter, setTravelModeFilter] = useState("Tutti");
  const [participationFilter, setParticipationFilter] = useState("Tutte");
  const [visibilityFilter, setVisibilityFilter] = useState("Tutte");
  const [organizerFilter, setOrganizerFilter] = useState("Tutti");
  const [suspendedFilter, setSuspendedFilter] = useState("Tutte");
  const [reportFilter, setReportFilter] = useState("Tutte");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [joinModal, setJoinModal] = useState<JoinModal>(null);
  const [joinLoading, setJoinLoading] = useState(false);

  const currentUserID = user?._id;
  const isAdmin = user?.role === "admin";

  const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

  // ------------------------------------------------------------------ helpers

  function getJoinState(
    activity: ActivityWithAdmin
  ): "join" | "organizer" | "participant" | "closed" | "full" | "expired" | "private" | "admin" {
    if (isAdmin) return "admin";
    if (activity.organizerID === currentUserID) return "organizer";
    if (new Date(activity.activityDate).getTime() < Date.now()) return "expired";
    // visibilità privata: solo admin o organizzatore possono vedere il pulsante (già gestiti sopra)
    if ((activity as any).visibility === "private") return "private";
    if (activity.status !== "Aperto") return "closed";
    const list = activity.partecipantList ?? [];
    if (list.includes(currentUserID ?? "")) return "participant";
    if (list.length >= activity.maxParticipants) return "full";
    return "join";
  }

  function hasAcceptedReport(a: ActivityWithAdmin) {
    return (a.reports ?? []).some((r) => r.reportStatus === "accepted");
  }
  function hasPendingReport(a: ActivityWithAdmin) {
    return (a.reports ?? []).some((r) => r.reportStatus === "pending");
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Annullato": return styles.statusCancelled;
      case "Chiuso":    return styles.statusClosed;
      default:          return styles.statusAvailable;
    }
  };

  // ------------------------------------------------------------------ filtri

  const hasActiveFilters =
    search !== "" ||
    statusFilter !== "Tutti" ||
    travelModeFilter !== "Tutti" ||
    selectedDate !== "" ||
    participationFilter !== "Tutte" ||
    visibilityFilter !== "Tutte" ||
    organizerFilter !== "Tutti" ||
    suspendedFilter !== "Tutte" ||
    reportFilter !== "Tutte";

  function resetFilters() {
    setSearch("");
    setStatusFilter("Tutti");
    setTravelModeFilter("Tutti");
    setSelectedDate("");
    setParticipationFilter("Tutte");
    setVisibilityFilter("Tutte");
    setOrganizerFilter("Tutti");
    setSuspendedFilter("Tutte");
    setReportFilter("Tutte");
  }

  const filteredActivities = activities.filter((a) => {
    const description = a.description ?? "";
    const matchesSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "Tutti" || a.status === statusFilter;
    const matchesTravelMode = travelModeFilter === "Tutti" || a.travelMode === travelModeFilter;
    const matchesDate =
      !selectedDate ||
      new Date(a.activityDate).toISOString().split("T")[0] === selectedDate;

    const isParticipant = (a.partecipantList ?? []).includes(currentUserID ?? "");
    const isOrganizer = a.organizerID === currentUserID;

    const matchesParticipation =
      participationFilter === "Tutte" ||
      (participationFilter === "Partecipo" && isParticipant) ||
      (participationFilter === "Non partecipo" && !isParticipant);

    const matchesVisibility =
      visibilityFilter === "Tutte"
        ? true
        : visibilityFilter === "Pubblica"
          ? (a as any).visibility === "public"
          : (a as any).visibility === "private";

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
      (reportFilter === "In attesa" && isAdmin && hasPendingReport(a));

    return (
      matchesSearch &&
      matchesStatus &&
      matchesDate &&
      matchesTravelMode &&
      matchesParticipation &&
      matchesVisibility &&
      matchesOrganizer &&
      matchesSuspended &&
      matchesReport
    );
  });

  // ------------------------------------------------------------------ fetch / polling

  const fetchData = useCallback(
    async (silent = false) => {
      try {
        const resActivities = await fetch(`${API_BASE}/activities/`);
        if (!resActivities.ok) throw new Error("Errore nel recupero attività");
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
    },
    [API_BASE]
  );

  // Caricamento iniziale
  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  // Polling automatico — aggiorna badge segnalazioni/sospensione senza ricaricare la pagina
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(true);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ------------------------------------------------------------------ join

  async function confirmJoin(activity: Activity) {
    setJoinLoading(true);
    try {
      const updated = await http<Activity>(`/activities/${activity._id}/join`, {
        method: "POST",
        body: JSON.stringify({ userID: currentUserID }),
      });
      setActivities((prev) =>
        prev.map((a) =>
          a._id === activity._id
            ? {
                ...a,
                partecipantList:
                  updated.partecipantList?.map((p: any) => p._id ?? p) ?? [],
                status: updated.status ?? a.status,
              }
            : a
        )
      );
    } catch (err: any) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setJoinLoading(false);
      setJoinModal(null);
    }
  }

  // ------------------------------------------------------------------ render

  if (loading)
    return (
      <main className={styles.page}>
        <p className={styles.message}>Caricamento attività...</p>
      </main>
    );
  if (error)
    return (
      <main className={styles.page}>
        <p className={styles.messageError}>{error}</p>
      </main>
    );

  return (
    <main className={styles.page}>
      <h1 className={styles.pageTitle}>Attività in programma</h1>

      <div className={styles.listHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Lista attività</h2>
          <span className={styles.sectionCount}>{activities.length} attività</span>
        </div>
        <Link to="/attivita/crea" className={appStyles.primaryButton}>
          + Crea attività
        </Link>
      </div>

      {/* FILTRI */}
      <div className={styles.filtersBar}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Ricerca</label>
          <input
            type="text"
            placeholder="Cerca attività..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Data</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className={styles.dateInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.select}
          >
            <option value="Tutti">Tutti</option>
            <option value="Aperto">Aperto</option>
            <option value="Chiuso">Chiuso</option>
            <option value="Annullato">Annullato</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Modalità di viaggio</label>
          <select
            value={travelModeFilter}
            onChange={(e) => setTravelModeFilter(e.target.value)}
            className={styles.select}
          >
            <option value="Tutti">Tutti</option>
            <option value="walking">A piedi</option>
            <option value="bicycling">In bicicletta</option>
          </select>
        </div>

        {/* Partecipazione — nascosta per admin */}
        {!isAdmin && (
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Partecipazione</label>
            <select
              value={participationFilter}
              onChange={(e) => setParticipationFilter(e.target.value)}
              className={styles.select}
            >
              <option value="Tutte">Tutte</option>
              <option value="Partecipo">A cui partecipo</option>
              <option value="Non partecipo">A cui non partecipo</option>
            </select>
          </div>
        )}

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Visibilità</label>
          <select
            value={visibilityFilter}
            onChange={(e) => setVisibilityFilter(e.target.value)}
            className={styles.select}
          >
            <option value="Tutte">Tutte</option>
            <option value="Pubblica">Pubblica</option>
            <option value="Privata">Privata</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Organizzazione</label>
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
          <label className={styles.filterLabel}>Sospensione</label>
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
          <label className={styles.filterLabel}>Segnalazioni</label>
          <select
            value={reportFilter}
            onChange={(e) => setReportFilter(e.target.value)}
            className={styles.select}
          >
            <option value="Tutte">Tutte</option>
            <option value="Segnalate">Segnalate</option>
            <option value="Non segnalate">Non segnalate</option>
            {isAdmin && <option value="In attesa">In attesa di revisione</option>}
          </select>
        </div>

        {hasActiveFilters && (
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>&nbsp;</label>
            <button className={styles.resetFiltersButton} onClick={resetFilters}>
              ✕ Azzera filtri
            </button>
          </div>
        )}
      </div>

      {/* BOX ATTIVITA */}
      <section className={styles.activitiesGrid}>
        {filteredActivities.map((activity) => {
          const joinState = getJoinState(activity);
          const isExpired = joinState === "expired";
          const effectiveStatus =
            isExpired && activity.status === "Aperto" ? "Chiuso" : activity.status;
          const isSuspended = activity.suspended;
          const isReported = hasAcceptedReport(activity);
          const isPendingReport = isAdmin && hasPendingReport(activity);

          const buttonLabel: Record<string, string> = {
            join: "Partecipa",
            organizer: "Organizzatore",
            participant: "Già iscritto",
            closed: "Non disponibile",
            full: "Al completo",
            expired: "Scaduta",
            private: "Privata",
            admin: "Visualizza",
          };

          return (
            <article
              key={activity._id}
              className={`${styles.activityCard} ${isSuspended ? styles.activityCardSuspended : ""} ${isReported ? styles.activityCardReported : ""}`}
            >
              <Link to={`/attivita/${activity._id}`} className={styles.activityLink}>
                <div className={styles.cardTop}>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                    {isSuspended ? (
                      <span className={`${styles.statusBadge} ${styles.statusSuspended}`}>
                        Sospesa
                      </span>
                    ) : (
                      <span className={`${styles.statusBadge} ${getStatusClass(effectiveStatus)}`}>
                        {effectiveStatus}
                      </span>
                    )}
                    {isReported && (
                      <span className={`${styles.statusBadge} ${styles.statusReported}`}>
                        Segnalata
                      </span>
                    )}
                    {isPendingReport && (
                      <span className={`${styles.statusBadge} ${styles.statusPendingReport}`}>
                        In attesa
                      </span>
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
                    <span className={styles.infoValue}>
                      {new Date(activity.activityDate).toLocaleDateString("it-IT")}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Partecipanti</span>
                    <span className={styles.infoValue}>
                      {(activity.partecipantList ?? []).length} / {activity.maxParticipants}
                    </span>
                  </div>
                </div>
              </Link>

              <div className={styles.cardActions}>
                {isAdmin ? (
                  <span
                    className={`${styles.statusBadge} ${styles.statusSuspended}`}
                    style={{
                      background: "rgba(155,89,182,0.1)",
                      color: "#8e44ad",
                      border: "1px solid rgba(155,89,182,0.2)",
                    }}
                  >
                    Admin
                  </span>
                ) : joinState === "join" ? (
                  <button
                    type="button"
                    className={appStyles.primaryButtonSmall}
                    disabled={!!isSuspended}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setJoinModal({ activity });
                    }}
                  >
                    {buttonLabel[joinState]}
                  </button>
                ) : (
                  <span className={styles.activityStateBadge}>
                    {buttonLabel[joinState]}
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </section>

      {/* Modal conferma join dalla lista */}
      {joinModal && (
        <div className={styles.modalOverlay} onClick={() => setJoinModal(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Conferma partecipazione</h2>
            <p className={styles.modalBody}>
              Stai per iscriverti a <strong>{joinModal.activity.title}</strong>.<br />
              Il tuo <strong>nickname</strong> e la tua <strong>email</strong> saranno
              condivisi con l'organizzatore.
            </p>
            <div className={styles.modalActions}>
              <button
                className={appStyles.secondaryButton}
                onClick={() => setJoinModal(null)}
                disabled={joinLoading}
              >
                Annulla
              </button>
              <button
                className={appStyles.primaryButton}
                onClick={() => confirmJoin(joinModal.activity)}
                disabled={joinLoading}
              >
                {joinLoading ? "Iscrizione in corso..." : "Conferma"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
