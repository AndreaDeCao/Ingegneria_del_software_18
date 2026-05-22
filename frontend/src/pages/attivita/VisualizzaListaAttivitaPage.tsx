import { useEffect, useState } from "react";
import styles from "./attivitaPage.module.css";
import { Link } from "react-router-dom";

type Activity = {
  _id: string;
  id: number;
  title: string;
  description: string;
  activityDate: string;
  maxParticipants: number;
  status: string;
  organizerID: string;
  trekID: string;
};

type Trek = {
  _id: string;
  name: string;
};

export default function VisualizzaAttivitaPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [treksMap, setTreksMap] = useState<Record<string, string>>({});

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tutti");
  const [selectedDate, setSelectedDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Annullato":
        return styles.statusCancelled;

      case "Chiuso":
        return styles.statusClosed;

      case "Aperto":
      default:
        return styles.statusAvailable;
    }
  };

  const canJoinActivity = (status: string) => {
    return status === "Aperto";
  };

  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      activity.title.toLowerCase().includes(search.toLowerCase()) ||
      activity.description.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "Tutti" ||
      activity.status === statusFilter;
    
    const matchesDate =
      !selectedDate ||
      new Date(activity.activityDate).toISOString().split("T")[0] === selectedDate;

    return matchesSearch && matchesStatus && matchesDate;
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. activities
        const resActivities = await fetch("http://localhost:3000/activities");

        if (!resActivities.ok) {
          throw new Error("Errore nel recupero attività");
        }

        const activitiesData: Activity[] = await resActivities.json();

        setActivities(activitiesData);

        // 2. treks
        const resTreks = await fetch("http://localhost:3000/treks");

        if (!resTreks.ok) {
          throw new Error("Errore nel recupero trek");
        }

        const treksData: Trek[] = await resTreks.json();

        // creo mappa: id -> name
        const map: Record<string, string> = {};
        treksData.forEach((t) => {
          map[t._id] = t.name;
        });

        setTreksMap(map);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <main className={styles.page}>
        <p className={styles.message}>Caricamento attività...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.page}>
        <p className={styles.messageError}>{error}</p>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      {/* TITLE */}
      <h1 className={styles.pageTitle}>Attività in programma</h1>

      {/* HEADER */}
      <div className={styles.listHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Lista attività</h2>
          <span className={styles.sectionCount}>
            {activities.length} attività
          </span>
        </div>

        <Link to="/attivita/crea" className={styles.primaryButton}>
          + Crea attività
        </Link>
      </div>

      <div className={styles.filtersBar}>
        {/* SEARCH */}
        <input
          type="text"
          placeholder="Cerca attività..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />

        {/* STATUS FILTER */}
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className={styles.dateInput}
        />
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

      {/* GRID */}
      <section className={styles.activitiesGrid}>
        {filteredActivities.map((activity) => (
          <article key={activity._id} className={styles.activityCard}>
            
            {/* TOP */}
            <div className={styles.cardTop}>
              <span className={`${styles.statusBadge} ${getStatusClass(activity.status)}`}>
                {activity.status}
              </span>

              <span className={styles.activityId}>#{activity.id}</span>
            </div>

            

            {/* TITLE */}
            <h3 className={styles.activityTitle}>{activity.title}</h3>

            {/* TREK NAME */}
            <div className={styles.trekName}>
              <b >Trek:</b> {treksMap[activity.trekID] ?? "Trek sconosciuto"}
            </div>

            {/* DESCRIPTION */}
            <p className={styles.activityDescription}>
              {activity.description}
            </p>

            {/* INFO */}
            <div className={styles.activityInfo}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Data</span>
                <span className={styles.infoValue}>
                  {new Date(activity.activityDate).toLocaleDateString(
                    "it-IT"
                  )}
                </span>
              </div>

              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>
                  Max partecipanti
                </span>
                <span className={styles.infoValue}>
                  {activity.maxParticipants}
                </span>
              </div>
            </div>

            {/* ACTIONS */}
            <div className={styles.cardActions}>
              <Link to={`/attivita/${activity._id}`} className={styles.secondaryButton}>
                Dettagli
              </Link>

              <button 
                className={styles.primaryButtonSmall} 
                disabled={!canJoinActivity(activity.status)}
              > {/* FIXME: aggiungi funzionalità, acnhe il non permettere di partecipare se è attivita annullata o chiusa */}
                Partecipa
              </button> 
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}