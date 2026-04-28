import styles from "./TrekCard.module.css";

export type Trek = {
  id: number;
  name: string;
  difficulty: "Facile" | "Medio" | "Difficile";
  duration: string
  // friendCount?: number;
  // likes?: number;
};

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
 * Il componente TrekCard riceve un oggetto trek come prop e lo visualizza in una card.
 */
interface TrekCardProps { 
  trek: Trek;
}

// function TrekCard({ trek }: { trek: Trek }) {
//   return (
//     <div style={{
//       border: "1px solid gray",
//       borderRadius: "10px",
//       padding: "10px",
//       width: "200px"
//     }}>
//       <h3>{trek.name}</h3>
//       <p>Difficoltà: {trek.difficulty}</p>
//       <p>Durata: {trek.duration}</p>
//       {trek.friendCount !== undefined && <p>Amici: {trek.friendCount}</p>}
//       {trek.likes !== undefined && <p>Like: {trek.likes}</p>}
//     </div>
//   );
// }
function TrekCard({ trek }: TrekCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.cardImg} />

      <div className={styles.cardBody}>
        <h3 className={styles.cardName}>{trek.name}</h3>
        <div className={styles.cardMeta}>
          <span className={`${styles.badge} ${difficultyStyle[trek.difficulty]}`}>
            {trek.difficulty}
          </span>
          <span className={`${styles.badge} ${styles.badgeDuration}`}>
            {trek.duration}
          </span>
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
  );
}

export default TrekCard;