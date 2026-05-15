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
    <Link to={`/treks/${trek.id}`} className={styles.cardLink}>
      <article className={styles.card}>

        {/*Immagine*/}
        <div className={styles.cardImg} />
          
          {/*Contenuto*/}
          <div className={styles.cardBody}>
            <div className={styles.cardTop}>
            <h3 className={styles.cardName}>{trek.name}</h3>
            <span className={styles.ratingBadge}>— ★</span>
            </div>

            <div className={styles.cardMeta}>
              <span className={`${styles.badge} ${difficultyStyle[trek.difficulty]}`}>
              {trek.difficulty}
              </span>

              {trek.duration && (
                <span className={`${styles.badge} ${styles.badgeInfo}`}>
                  {trek.duration}
                </span>
              )}

              {trek.lengthKm && (
                <span className={`${styles.badge} ${styles.badgeInfo}`}>
                  {trek.lengthKm} km
                </span>
              )}
              
              {trek.elevationGain && (
                <span className={`${styles.badge} ${styles.badgeInfo}`}>
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