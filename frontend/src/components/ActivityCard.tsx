import styles from "./ActivityCard.module.css";

import type { Activity } from "../types/Activity";
import { Link } from "react-router-dom";

interface ActivityCardProps {
  activity: Activity;
}

function ActivityCard({ activity }: ActivityCardProps) {
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
              👥 {activity.maxParticipants}
            </span>

            <span className={styles.badge}>
              📅 {new Date().toLocaleDateString()}
            </span>
          </div>

        </div>
      </article>
    </Link>
  );
}

export default ActivityCard;