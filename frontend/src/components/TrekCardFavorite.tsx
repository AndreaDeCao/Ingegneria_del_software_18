import styles from "./TrekCardFavorite.module.css";
import type { Trek } from "../types/Trek";
import { Link } from "react-router-dom";
import { FaTrash } from "react-icons/fa";
import { http } from "../auth/api";

const difficultyStyle: Record<Trek["difficulty"], string> = {
  Facile: styles.badgeEasy,
  Medio: styles.badgeMedium,
  Difficile: styles.badgeHard,
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className={styles.stars}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`${styles.star} ${
            rating >= star
              ? styles.starFull
              : rating >= star - 0.5
              ? styles.starHalf
              : styles.starEmpty
          }`}
        >
          ★
        </span>
      ))}

      <span className={styles.ratingNum}>
        {rating > 0 ? rating.toFixed(1) : "-"}
      </span>
    </div>
  );
}

interface TrekCardFavoriteProps {
  trek: Trek;

  // callback per aggiornare UI
  onRemove?: (trekId: string) => void;
}

function TrekCardFavorite({
  trek,
  onRemove,
}: TrekCardFavoriteProps) {

const handleRemoveFavorite = async (
  e: React.MouseEvent
) => {
  e.preventDefault();
  e.stopPropagation();

  try {

    await http(`/users/favorites/${trek.id}`, {
      method: "DELETE",
    });

    // aggiorna UI senza refresh
    if (onRemove) {
      onRemove(trek.id);
    }

  } catch (err) {

    console.error(err);

  }
};

  return (
    <Link
      to={`/treks/${trek.id}`}
      className={styles.cardLink}
    >
      <article className={styles.card}>

        {/* Bottone elimina */}
        <button
          className={styles.removeBtn}
          onClick={handleRemoveFavorite}
        >
          <FaTrash />
        </button>

        {/* Immagine */}
        <div className={styles.cardImg} />

        {/* Contenuto */}
        <div className={styles.cardBody}>

          <h3 className={styles.cardName}>
            {trek.name}
          </h3>

          <div className={styles.cardMeta}>

            <span
              className={`${styles.badge} ${
                difficultyStyle[trek.difficulty]
              }`}
            >
              {trek.difficulty}
            </span>

            {trek.duration && (
              <span
                className={`${styles.badge} ${styles.badgeInfo}`}
              >
                {trek.duration}
              </span>
            )}

            {trek.lengthKm && (
              <span
                className={`${styles.badge} ${styles.badgeInfo}`}
              >
                {trek.lengthKm} km
              </span>
            )}

            {trek.elevationGain && (
              <span
                className={`${styles.badge} ${styles.badgeInfo}`}
              >
                {trek.elevationGain} m
              </span>
            )}

          </div>

          <StarRating rating={0} />

        </div>
      </article>
    </Link>
  );
}

export default TrekCardFavorite;