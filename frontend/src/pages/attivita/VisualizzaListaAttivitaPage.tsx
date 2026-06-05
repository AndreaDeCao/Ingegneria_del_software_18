import { useEffect, useState, useCallback } from "react";
import styles from "./attivitaPage.module.css";
import appStyles from "../../App.module.css";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { http } from "../../auth/api";

import type {Activity} from "../../types/Activity";
import type {Trek} from "../../types/Trek";

import { PageLoader } from "../../components/SkeletonLoader";

// modale inline per conferma partecipazione dalla lista
type JoinModal = { activity: Activity } | null;

type ActivityWithUser = Activity & {
  suspended?: boolean;
  suspendedReason?: string;
  reports?: Array<{ reportStatus: string }>;
};

const POLL_INTERVAL = 20_000; // ogni 20 secondi

export default function VisualizzaAttivitaPage() {
  const { user } = useAuth();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [treksMap, setTreksMap] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("Tutti");
  const [selectedDate, setSelectedDate] = useState("");
  const [travelModeFilter, setTravelModeFilter] = useState("Tutti");
  const [participationFilter, setParticipationFilter] = useState("Tutte");
  const [visibilityFilter, setVisibilityFilter] = useState("Tutte");
  const [suspendedFilter, setSuspendedFilter] = useState("Tutte");
  const [organizerFilter, setOrganizerFilter] = useState("Tutti");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [joinModal, setJoinModal] = useState<JoinModal>(null);
  const [joinLoading, setJoinLoading] = useState(false);

  const currentUserID = user?._id;

  const isOrganizer = (activity: Activity) =>
    Boolean(
      currentUserID &&
      (activity.organizerID === currentUserID ||
        (typeof (activity.organizerID as any) === "object" &&
          (activity.organizerID as any)?._id === currentUserID))
    );

  // Determina lo stato del bottone Partecipa per una singola attività
  function getJoinState(activity: Activity): "join" | "organizer" | "participant" | "closed" | "full" | "expired" | "private" {
    if (isOrganizer(activity)) return "organizer";
    if (new Date(activity.activityDate).getTime() < Date.now()) return "expired";
    if (activity.visibility === "private") return "private";
    if (activity.status !== "Aperto") return "closed";
    const list = activity.partecipantList ?? [];
    if (list.includes(currentUserID ?? "")) return "participant";
    if (list.length >= activity.maxParticipants) return "full";
    return "join";
  }

  function hasAcceptedReport(a: ActivityWithUser) {
    return (a.reports ?? []).some((r) => r.reportStatus === "accepted");
  }

  const hasActiveFilters =
    search !== "" ||
    statusFilter !== "Tutti" ||
    travelModeFilter !== "Tutti" ||
    selectedDate !== "" ||
    participationFilter !== "Tutte" ||
    visibilityFilter !== "Tutte" ||
    suspendedFilter !== "Tutte" ||
    organizerFilter !== "Tutti";

  function resetFilters() {
    setSearch("");
    setStatusFilter("Tutti");
    setTravelModeFilter("Tutti");
    setSelectedDate("");
    setParticipationFilter("Tutte");
    setVisibilityFilter("Tutte");
    setSuspendedFilter("Tutte");
    setOrganizerFilter("Tutti");
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Annullato": return styles.statusCancelled;
      case "Chiuso":    return styles.statusClosed;
      default:          return styles.statusAvailable;
    }
  };

  const filteredActivities = activities.filter((a) => {
    const description = a.description ?? "";
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase()) || description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "Tutti" || a.status === statusFilter;
    const matchesTravelMode = travelModeFilter === "Tutti" || a.travelMode === travelModeFilter;
    const matchesDate = !selectedDate || new Date(a.activityDate).toISOString().split("T")[0] === selectedDate;
    const isParticipant = (a.partecipantList ?? []).includes(currentUserID ?? "");
    const matchesParticipation =
      participationFilter === "Tutte" ||
      (participationFilter === "Partecipo" && isParticipant) ||
      (participationFilter === "Non partecipo" && !isParticipant);
    const matchesVisibility =
      visibilityFilter === "Tutte"
        ? true
        : visibilityFilter === "Pubblica"
          ? a.visibility === "public"
          : a.visibility === "private";

    const matchesSuspended = suspendedFilter === "Tutte" || (suspendedFilter === "Sospese" && a.suspended) || (suspendedFilter === "Non sospese" && !a.suspended);
    const matchesOrganizer =
      organizerFilter === "Tutti" ||
      (organizerFilter === "Organizzo" && isOrganizer(a)) ||
      (organizerFilter === "Non organizzo" && !isOrganizer(a));

    return matchesSearch && matchesStatus && matchesDate && matchesTravelMode && matchesParticipation && matchesVisibility && matchesSuspended && matchesOrganizer;
  });

  const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

  const fetchData = useCallback(async () => {
    try {
      const resActivities = await fetch(`${API_BASE}/activities/`);
      if (!resActivities.ok) throw new Error("Errore nel recupero attività");
      const activitiesData: ActivityWithUser[] = await resActivities.json();
      setActivities(activitiesData);

      const resTreks = await fetch(`${API_BASE}/treks/`);
      if (!resTreks.ok) throw new Error("Errore nel recupero trek");
      const treksData: Trek[] = await resTreks.json();
      const map: Record<string, string> = {};
      treksData.forEach((t) => { map[t._id] = t.name; });
      setTreksMap(map);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

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
                partecipantList: updated.partecipantList?.map((p: any) => p._id ?? p) ?? [],
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
  if (loading) return <PageLoader />;
  if (error) return <main className={styles.page}><p className={styles.messageError}>{error}</p></main>;

  return (
    <main className={styles.page}>
      <h1 className={styles.pageTitle}>Attività in programma</h1>

      <div className={styles.listHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Lista attività</h2>
          <span className={styles.sectionCount}>{activities.length} attività</span>
        </div>
        <Link to="/attivita/crea" className={appStyles.primaryButton}>+ Crea attività</Link>
      </div>

      {/* FILTRI */}
      <div className={styles.filtersBar}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Ricerca</label>
          <input type="text" placeholder="Cerca attività..." value={search} onChange={(e) => setSearch(e.target.value)} className={styles.searchInput} />
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Data</label>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className={styles.dateInput} />
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={styles.select}>
            <option value="Tutti">Tutti</option>
            <option value="Aperto">Aperto</option>
            <option value="Chiuso">Chiuso</option>
            <option value="Annullato">Annullato</option>
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Modalità di viaggio</label>
          <select value={travelModeFilter} onChange={(e) => setTravelModeFilter(e.target.value)} className={styles.select}>
            <option value="Tutti">Tutti</option>
            <option value="walking">A piedi</option>
            <option value="bicycling">In bicicletta</option>
          </select>
        </div>
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
          const effectiveStatus = isExpired && activity.status === "Aperto" ? "Chiuso" : activity.status;
          const buttonLabel = {
            join: "Partecipa",
            organizer: "Organizzatore",
            participant: "Già iscritto",
            closed: "Non disponibile",
            full: "Al completo",
            expired: "Scaduta",
            private: "Privata",
          }[joinState];

          return (
            <article key={activity._id} className={styles.activityCard}>
              <Link to={`/attivita/${activity._id}`} className={styles.activityLink}>
                <div className={styles.cardTop}>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                    {(activity as ActivityWithUser).suspended ? (
                      <span className={`${styles.statusBadge} ${styles.statusSuspended}`}>Sospesa</span>
                    ) : (
                      <span className={`${styles.statusBadge} ${getStatusClass(effectiveStatus)}`}>{effectiveStatus}</span>
                    )}
                    {hasAcceptedReport(activity as ActivityWithUser) && (
                      <span className={`${styles.statusBadge} ${styles.statusReported}`}>Segnalata</span>
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
              </Link>

              <div className={styles.cardActions}>
                {joinState === "join" ? (
                  <button
                    type="button"
                    className={appStyles.primaryButtonSmall}
                    disabled={joinState !== "join" || (activity as ActivityWithUser).suspended}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (joinState === "join") setJoinModal({ activity });
                    }}
                  >
                    {buttonLabel}
                  </button>
                ) : (
                  <span className={styles.activityStateBadge}>{buttonLabel}</span>
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
              Il tuo <strong>nickname</strong> e la tua <strong>email</strong> saranno condivisi con l'organizzatore.
            </p>
            <div className={styles.modalActions}>
              <button className={appStyles.secondaryButton} onClick={() => setJoinModal(null)} disabled={joinLoading}>Annulla</button>
              <button className={appStyles.primaryButton} onClick={() => confirmJoin(joinModal.activity)} disabled={joinLoading}>
                {joinLoading ? "Iscrizione in corso..." : "Conferma"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

