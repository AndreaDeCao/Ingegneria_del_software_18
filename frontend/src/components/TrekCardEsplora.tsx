import { useAuth } from "../auth/AuthProvider";
import styles from "./TrekCardEsplora.module.css";
import type { Trek } from "../types/Trek";
import { Link } from "react-router-dom";
import StarRatingDisplay from "./StarRating";

const difficultyStyle: Record<Trek["difficulty"], string> = {
  Facile:    styles.badgeEasy,
  Medio:     styles.badgeMedium,
  Difficile: styles.badgeHard,
};

function getDurationStyle(duration: string): string {
  const hours   = parseInt(duration.match(/(\d+)\s*or[ae]/)?.[1] ?? "0");
  const minutes = parseInt(duration.match(/(\d+)\s*min/)?.[1]    ?? "0");
  const total   = hours * 60 + minutes;
  if (total < 60)   return styles.badgeEasy;
  if (total <= 150) return styles.badgeMedium;
  return styles.badgeHard;
}

function getLengthStyle(lengthKm: number): string {
  if (lengthKm < 3.5)  return styles.badgeEasy;
  if (lengthKm <= 8)   return styles.badgeMedium;
  return styles.badgeHard;
}

function getElevationStyle(elevationGain: string): string {
  const e = parseInt(elevationGain);
  if (e < 300)   return styles.badgeEasy;
  if (e <= 700)  return styles.badgeMedium;
  return styles.badgeHard;
}

interface TrekCardEsploraProps {
  trek: Trek;
}

function TrekCardEsplora({ trek }: TrekCardEsploraProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <Link
      to={isAdmin ? `/admin/treks/${trek.id}` : `/treks/${trek.id}`}
      className={styles.cardLink}
    >
      <article className={styles.card}>

        {/* Immagine / placeholder */}
        <div className={styles.cardImg} />

        {/* Contenuto */}
        <div className={styles.cardBody}>
          <h3 className={styles.cardName}>{trek.name}</h3>

          <div className={styles.cardMeta}>
            <span className={`${styles.badge} ${difficultyStyle[trek.difficulty]}`}>
              {trek.difficulty}
            </span>

            {trek.closed && (
              <span className={`${styles.badge} ${styles.badgeClosed}`}>
                Chiuso
              </span>
            )}

            {trek.duration && (
              <span className={`${styles.badge} ${getDurationStyle(trek.duration)}`}>
                {trek.duration}
              </span>
            )}

            {trek.lengthKm && (
              <span className={`${styles.badge} ${getLengthStyle(trek.lengthKm)}`}>
                {trek.lengthKm} km
              </span>
            )}

            {trek.elevationGain && (
              <span className={`${styles.badge} ${getElevationStyle(trek.elevationGain)}`}>
                {trek.elevationGain} m
              </span>
            )}
          </div>

          <StarRatingDisplay rating={trek.averageRating ?? 0} />
        </div>

      </article>
    </Link>
  );
}

export default TrekCardEsplora;
