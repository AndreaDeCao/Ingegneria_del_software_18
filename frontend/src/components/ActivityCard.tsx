import styles from "./ActivityCard.module.css";

import type { Activity } from "../types/Activity";
import { Link } from "react-router-dom";

interface ActivityCardProps {
  activity: Activity;
}

  function ActivityCard({ activity }: ActivityCardProps) {

  const formatTravelMode = (mode: string) => {
    switch (mode) {
      case "walking":   return "A piedi";
      case "bicycling": return "In bicicletta";
      default:          return mode;
    }
  };

  return (
    <Link to={`/attivita/${activity._id}`} className={styles.cardLink}>
      <article className={styles.card}>
        <div className={styles.cardBody}>

          <h3 className={styles.cardTitle}>
            {activity.title}
          </h3>

          <p className={styles.cardDescription}>
            {activity.description}
          </p>

          <div className={styles.cardMeta}>
            <span className={styles.badge}>
              Partecipanti: {activity.partecipantList?.length}/{activity.maxParticipants}
            </span>

            <span className={styles.badge}>
              Modalità: {formatTravelMode(activity.travelMode ?? "")}
            </span>

            <span className={styles.badge}>
              Data:{" "}
              {new Date(activity.activityDate).toLocaleString("it-IT", {
                timeZone: "Europe/Rome",
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

        </div>
      </article>
    </Link>
  );
}

export default ActivityCard;