import styles from "./TrekCard.module.css";
// import type { Trek } from "../types/Trek";
import type { Trek } from "../types/Trek";
import { Link } from "react-router-dom";
// export type Trek = {
//   id: string;
//   name: string;
//   difficulty: "Facile" | "Medio" | "Difficile";
//   duration: string
//   // friendCount?: number;
//   // likes?: number;
// };

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

  if (lengthKm < 3.5)  return styles.badgeEasy;    // < 3 km       → verde
  if (lengthKm <= 8) return styles.badgeMedium; // da 3 km a 7,5 km   → giallo
  return styles.badgeHard;                     // > 7,5 km    → rosso
}

/**
 * funzione per applicare il badge corretto in base al dislivello
 * @param elevationGain contiene il dislivello in metri del percorso
 * @returns lo stile da applicare
 */
function getElevationGainStyle(elevationGain: string): string {
  // console.log(elevationGain);
  const elevation = parseInt(elevationGain);

  if (elevation < 300)  return styles.badgeEasy;    // < 300 m      → verde
  if (elevation <= 700) return styles.badgeMedium; // da 300 m a 700 m   → giallo
  return styles.badgeHard;                     // > 700 m    → rosso
}

/**
 * Props del componente TrekCard
 * @param {Trek} trek - Oggetto percorso da visualizzare
 */
interface TrekCardProps { 
  trek: Trek;
}

/**
 * Card percorso nella Home.
 * Immagine in cima, informazioni: difficoltà, durata, km, dislivello e rating.
 * @param {Trek} trek - Oggetto percorso da visualizzare
 */
function TrekCard({ trek }: TrekCardProps) {
  return (
    <Link to={`/treks/${trek._id}`} className={styles.cardLink}>
      <article className={styles.card}>

        {/*Immagine*/}
        <div className={styles.cardImg} />
          
          {/*Contenuto*/}
          <div className={styles.cardBody}>
            <div className={styles.cardTop}>
            <h3 className={styles.cardName}>{trek.name}</h3>
            <span className={styles.ratingBadge}>
              {trek.averageRating && trek.averageRating > 0 ? trek.averageRating.toFixed(1) : "-"} ★
            </span>
            </div>

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
                <span className={`${styles.badge} ${getElevationGainStyle(trek.elevationGain)}`}>
                  {trek.elevationGain} m
                </span>
              )}
          </div>
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

export default TrekCard;