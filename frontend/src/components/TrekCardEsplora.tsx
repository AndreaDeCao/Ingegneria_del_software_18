import styles from "./TrekCardEsplora.module.css";
import type { Trek } from "../types/Trek";
import { Link } from "react-router-dom";
import StarRatingDisplay from "./StarRating";

/**
 * In questo componente, definiamo un mapping tra i valori di difficoltà e le classi CSS corrispondenti.
 * Questo ci permette di applicare stili diversi a seconda della difficoltà del trek.
 * In futuro, potremmo voler aggiungere altre difficoltà o modificare gli stili, e questo approccio ci rende più flessibili.
 */
const difficultyStyle: Record<Trek["difficulty"], string> = { 
  Facile:   styles.badgeEasy,
  Medio: styles.badgeMedium,
  Difficile:   styles.badgeHard,
};

/**
 * funzione per applicare il badge corretto in base alla durata
 * @param duration contiene la durata del trek con formato 'hh ore mm min'
 * @returns lo stile da applicare
 */
function getDurationStyle(duration: string): string {
  const hours   = parseInt(duration.match(/(\d+)\s*or[ae]/)?.[1]  ?? "0");
  const minutes = parseInt(duration.match(/(\d+)\s*min/)?.[1]     ?? "0");
  const total   = hours * 60 + minutes;

  // console.log("ore:", hours, "minuti:", minutes, "totale:", total);

  if (total < 60)  return styles.badgeEasy;    // < 1 ora      → verde
  if (total <= 150) return styles.badgeMedium; // 1 ora a 2 ore 30 min   → giallo
  return styles.badgeHard;                     // > 2ora e 30 min    → rosso
}

/**
 * funzione per applicare il badge corretto in base alla lunghezza
 * @param lengthKm contiene la lunghezza in chilometri del percorso
 * @returns lo stile da applicare
 */
function getLengthStyle(lengthKm: number): string {

  if (lengthKm < 3)  return styles.badgeEasy;    // < 1 ora      → verde
  if (lengthKm <= 7.5) return styles.badgeMedium; // 1 ora a 2 ore 30 min   → giallo
  return styles.badgeHard;                     // > 2ora e 30 min    → rosso
}

/**
 * funzione per applicare il badge corretto in base al dislivello
 * @param elevationGain contiene il dislivello in metri del percorso
 * @returns lo stile da applicare
 */
function getElevationGainStyle(elevationGain: string): string {
  // console.log(elevationGain);
  const elevation = parseInt(elevationGain);

  if (elevation < 300)  return styles.badgeEasy;    // < 1 ora      → verde
  if (elevation <= 700) return styles.badgeMedium; // 1 ora a 2 ore 30 min   → giallo
  return styles.badgeHard;                     // > 2ora e 30 min    → rosso
}

/**
 * Rating percorso con stelle
 * @param {number} rating - Voto medio da 0 a 5
 */
function StarRating({rating}: {rating: number}) {
  return <StarRatingDisplay rating={rating} />;
  /*
  return (
    <div className={styles.stars}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`${styles.star} ${
            rating >= star ? styles.starFull :
            rating >= star - 0.5 ? styles.starHalf :
            styles.starEmpty
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
  */
}

/**
 * Il componente TrekCard riceve un oggetto trek come prop e lo visualizza in una card.
 */
interface TrekCardEsploraProps { 
  trek: Trek;
}

function TrekCardEsplora({ trek }: TrekCardEsploraProps) {
  return (
    <Link to={`/treks/${trek.id}`} className={styles.cardLink}>

      <article className={styles.card}>

        {/*Immagine*/}
        <div className={styles.cardImg} />
        
        {/*Contenuto*/}
        <div className={styles.cardBody}>
            <h3 className={styles.cardName}>{trek.name}</h3>
            <div className={styles.cardMeta}>
              <span className={`${styles.badge} ${difficultyStyle[trek.difficulty]}`}>
              {trek.difficulty}
            </span>

            {trek.duration && (
              // <span className={`${styles.badge} ${styles.badgeDuration}`}>
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
              <span className={`${styles.badge} ${getElevationGainStyle(trek.elevationGain)}`}>
                {trek.elevationGain} m
              </span>
            )}
          </div>

          <StarRating rating={trek.averageRating ?? 0}/>
        </div>

        {/* {(trek.friendCount || trek.likes) && (
          <div className={styles.cardFooter}>
            {trek.friendCount && (
              <span className={styles.friends}>
                {trek.friendCount} friends did this
              </span>
            )}
            {trek.likes && (
              <span className={styles.likes}>♥ {trek.likes}</span>
            )}
          </div>
        )} */}

      </article>
    </Link>
  );
}

export default TrekCardEsplora;
