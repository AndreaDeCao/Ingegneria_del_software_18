import styles from "./EventCard.module.css";
import type {Event} from "../types/Events";


/**
 * Props del componente EventCard
 * @param {Event} event - Oggetto evento da visualizzare
 */
interface EventCardProps {
  event: Event;
}


/**
 * Card evento nella Home.
 * Mostra titolo, descrizione breve, data, luogo e se è gratuito.
 * @param {Event} event - Oggetto evento da visualizzare
 */
function EventCard({event} : EventCardProps) {
  return (
    <a href={event.sourceUrl ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.cardLink}
    >

    <article className={styles.card}>

      <div className={styles.cardImg} />
        <div className={styles.cardBody}>
          <div className={styles.cardTop}>
            <h3 className={styles.cardName}>{event.title}</h3>
          </div>

          {event.abstract && (
            <p className={styles.cardAbstract}>
              {event.abstract}
            </p>
          )}

          <div className={styles.cardMeta}>
            {event.startDate && (
              <span className={styles.badge}>
                {new Date(event.startDate).toLocaleDateString("it-IT")}
              </span>
            )}

            {event.address && (
              <span className={styles.badge}>
                {event.address}
              </span>
            )}

            {event.isFree && (
              <span className={`${styles.badge} ${styles.badgeFree}`}>
                Gratuito
              </span>
            )}
        </div>
      </div>
      
    </article>
  </a>
  );
}

export default EventCard;