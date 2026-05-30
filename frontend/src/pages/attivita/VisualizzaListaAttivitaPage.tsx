import { useEffect, useState } from "react";
import styles from "./attivitaPage.module.css";
import appStyles from "../../App.module.css";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";

type Activity = {
  _id: string;
  id: number;
  title: string;
  description: string;
  activityDate: string;
  maxParticipants: number;
  partecipantList?: string[];
  status: string;
  travelMode: string;
  organizerID: string;
  trekID: string;
};

type Trek = {
  _id: string;
  name: string;
};

// modale inline per conferma partecipazione dalla lista
type JoinModal = { activity: Activity } | null;

export default function VisualizzaAttivitaPage() {
  const { user } = useAuth();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [treksMap, setTreksMap] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("Tutti");
  const [selectedDate, setSelectedDate] = useState("");
  const [travelModeFilter, setTravelModeFilter] = useState("Tutti");
  const [participationFilter, setParticipationFilter] = useState("Tutte");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [joinModal, setJoinModal] = useState<JoinModal>(null);
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinMessage, setJoinMessage] = useState<{ id: string; text: string } | null>(null);

  const currentUserID = user?._id;

  // Determina lo stato del bottone Partecipa per una singola attività
  function getJoinState(activity: Activity): "join" | "organizer" | "participant" | "closed" | "full" {
    if (activity.status !== "Aperto") return "closed";
    if (activity.organizerID === currentUserID) return "organizer";
    const list = activity.partecipantList ?? [];
    if (list.includes(currentUserID ?? "")) return "participant";
    if (list.length >= activity.maxParticipants) return "full";
    return "join";
  }

  const hasActiveFilters =
    search !== "" ||
    statusFilter !== "Tutti" ||
    travelModeFilter !== "Tutti" ||
    selectedDate !== "" ||
    participationFilter !== "Tutte";

  function resetFilters() {
    setSearch("");
    setStatusFilter("Tutti");
    setTravelModeFilter("Tutti");
    setSelectedDate("");
    setParticipationFilter("Tutte");
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Annullato": return styles.statusCancelled;
      case "Chiuso":    return styles.statusClosed;
      default:          return styles.statusAvailable;
    }
  };

  const filteredActivities = activities.filter((a) => {
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase()) || a.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "Tutti" || a.status === statusFilter;
    const matchesTravelMode = travelModeFilter === "Tutti" || a.travelMode === travelModeFilter;
    const matchesDate = !selectedDate || new Date(a.activityDate).toISOString().split("T")[0] === selectedDate;
    const isParticipant = (a.partecipantList ?? []).includes(currentUserID ?? "");
    const matchesParticipation =
      participationFilter === "Tutte" ||
      (participationFilter === "Partecipo" && isParticipant) ||
      (participationFilter === "Non partecipo" && !isParticipant);

    return matchesSearch && matchesStatus && matchesDate && matchesTravelMode && matchesParticipation;
  });

  const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

  useEffect(() => {
    const fetchData = async () => {
      try {
        // const resActivities = await fetch("http://localhost:3000/activities");
        const resActivities = await fetch(`${API_BASE}/activities/`);
        if (!resActivities.ok) throw new Error("Errore nel recupero attività");
        const activitiesData: Activity[] = await resActivities.json();
        setActivities(activitiesData);

        // const resTreks = await fetch("http://localhost:3000/treks");
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
    };
    fetchData();
  }, []);

  async function confirmJoin(activity: Activity) {
    setJoinLoading(true);
    try {
      // const res = await fetch(`http://localhost:3000/activities/${activity._id}/join`, {
      const res = await fetch(`${API_BASE}/activities/${activity._id}/join`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userID: currentUserID }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || "Errore");
      }
      const updated = await res.json();
      // aggiorna l'attività nella lista
      setActivities((prev) => prev.map((a) => a._id === activity._id ? { ...a, partecipantList: updated.partecipantList?.map((p: any) => p._id ?? p) ?? [] } : a));
      setJoinMessage({ id: activity._id, text: "Iscrizione confermata ✔" });
      setTimeout(() => setJoinMessage(null), 3000);
    } catch (err: any) {
      setJoinMessage({ id: activity._id, text: err.message || "Errore" });
      setTimeout(() => setJoinMessage(null), 3000);
    } finally {
      setJoinLoading(false);
      setJoinModal(null);
    }
  }

  if (loading) return <main className={styles.page}><p className={styles.message}>Caricamento attività...</p></main>;
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
          const isDisabled = joinState !== "join";
          const buttonLabel = {
            join: "Partecipa",
            organizer: "Organizzatore",
            participant: "Già iscritto",
            closed: "Non disponibile",
            full: "Al completo",
          }[joinState];

          return (
            <Link to={`/attivita/${activity._id}`}>

              <article key={activity._id} className={styles.activityCard}>
                <div className={styles.cardTop}>
                  <span className={`${styles.statusBadge} ${getStatusClass(activity.status)}`}>{activity.status}</span>
                  <span className={styles.activityId}>#{activity.id}</span>
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

                {joinMessage?.id === activity._id && (
                  <p className={styles.message}>{joinMessage.text}</p>
                )}

                <div className={styles.cardActions}>
                  <button
                    className={appStyles.primaryButtonSmall}
                    disabled={isDisabled}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();

                      if (!isDisabled) {
                        setJoinModal({ activity });
                      }
                    }}
                  >
                    {buttonLabel}
                  </button>
                </div>
              </article>
            </Link>
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
