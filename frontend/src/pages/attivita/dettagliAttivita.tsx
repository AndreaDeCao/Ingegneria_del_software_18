import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import styles from "./attivitaPage.module.css";
import type { Activity } from "../../types/Activity";
import type { Trek } from "../../types/Trek";

export default function DettagliAttivita() {
  const { id } = useParams();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await fetch(
          `http://localhost:3000/activities/${id}`
        );

        if (!res.ok) {
          throw new Error("Attività non trovata");
        }

        const data = await res.json();
        setActivity(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [id]);

  if (loading) {
    return <p className={styles.message}>Caricamento...</p>;
  }

  if (error || !activity) {
    return (
      <p className={styles.messageError}>
        {error || "Errore attività"}
      </p>
    );
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.pageTitle}>{activity.title}</h1>

      <div className={styles.formCard}>
        <p><strong>Descrizione:</strong> {activity.description}</p>

        <p>
          <strong>Data:</strong>{" "}
          {new Date(activity.activityDate).toLocaleDateString("it-IT")}
        </p>

        <p>
          <strong>Max partecipanti:</strong> {activity.maxParticipants}
        </p>

        <p>
          <strong>Status:</strong> {activity.status}
        </p>
      </div>
    </main>
  );
}