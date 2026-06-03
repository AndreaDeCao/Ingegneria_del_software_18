import styles from "./TrekCardFavorite.module.css";
import type { Trek } from "../types/Trek";
import { Link } from "react-router-dom";
import { FaTrash } from "react-icons/fa";
import { http } from "../auth/api";
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
  if (lengthKm < 3.5) return styles.badgeEasy;
  if (lengthKm <= 8)  return styles.badgeMedium;
  return styles.badgeHard;
}

function getElevationStyle(elevationGain: string): string {
  const e = parseInt(elevationGain);
  if (e < 300)  return styles.badgeEasy;
  if (e <= 700) return styles.badgeMedium;
  return styles.badgeHard;
}

interface TrekCardFavoriteProps {
  trek: Trek;
  onRemove?: (trekId: number) => void;
}

function TrekCardFavorite({ trek, onRemove }: TrekCardFavoriteProps) {

  const handleRemoveFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await http(`/users/favorites/${trek.id}`, { method: "DELETE" });
      onRemove?.(trek.id);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Link to={`/treks/${trek.id}`} className={styles.cardLink}>
      <article className={styles.card}>

        {/* Bottone rimuovi */}
        <button className={styles.removeBtn} onClick={handleRemoveFavorite} title="Rimuovi dai preferiti">
          <FaTrash />
        </button>

        {/* Immagine */}
        <div className={styles.cardImg} />

        {/* Contenuto */}
        <div className={styles.cardBody}>
          <h3 className={styles.cardName}>{trek.name}</h3>

          <div className={styles.cardMeta}>
            <span className={`${styles.badge} ${difficultyStyle[trek.difficulty]}`}>
              {trek.difficulty}
            </span>

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

          {/* Rating reale invece di 0 hardcodato */}
          <StarRatingDisplay rating={trek.averageRating ?? 0} />
        </div>

      </article>
    </Link>
  );
}

export default TrekCardFavorite;
