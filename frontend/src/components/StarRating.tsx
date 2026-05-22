import styles from "./StarRating.module.css";

type Props = {
  rating: number;
  showNumber?: boolean;
};

export default function StarRating({ rating, showNumber = true }: Props) {
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
      {showNumber && (
        <span className={styles.ratingNum}>{rating > 0 ? rating.toFixed(1) : "-"}</span>
      )}
    </div>
  );
}

