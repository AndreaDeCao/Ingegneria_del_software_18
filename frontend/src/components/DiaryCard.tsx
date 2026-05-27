import { useNavigate } from "react-router-dom";
import type { DiaryEntry } from "../types/Diary";
import styles from "./DiaryCard.module.css";

interface DiaryCardProps {
  entry: DiaryEntry;
}

function DiaryCard({ entry }: DiaryCardProps) {
  const navigate = useNavigate();

  const dateFormatted = new Date(entry.data).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const notesPreview =
    entry.note && entry.note.length > 80
      ? entry.note.substring(0, 80) + "..."
      : entry.note;

  const handleClick = () => {
    navigate(`/diario/${entry._id}`);
  };

  return (
    <article className={styles.card} onClick={handleClick}>
      {/* HEADER con Data e Rating */}
      <div className={styles.cardHeader}>
        <span className={styles.date}>{dateFormatted}</span>
        {entry.valutazione && (
          <span className={styles.rating}>
            {"★".repeat(entry.valutazione)}{"☆".repeat(5 - entry.valutazione)}
          </span>
        )}
      </div>

      {/* TITOLO */}
      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{entry.titolo}</h3>

        {/* PERCORSO E META */}
        {(entry.trekId || entry.percorsoPersonalizzato) && (
          <div className={styles.cardMeta}>
            {entry.trekId && (
              <>
                <span className={styles.metaItem}> {entry.trekId.name}</span>
                <span className={`${styles.badge} ${styles.difficultyBadge}`}>
                  {entry.trekId.difficulty}
                </span>
              </>
            )}
            {entry.percorsoPersonalizzato && !entry.trekId && (
              <span className={styles.metaItem}>
                 {entry.percorsoPersonalizzato}
              </span>
            )}
          </div>
        )}

        {/* NOTE PREVIEW */}
        {notesPreview && (
          <p className={styles.preview}>{notesPreview}</p>
        )}
      </div>

      {/* FOOTER con Badge */}
      <div className={styles.cardFooter}>
        {entry.completato !== false && (
          <span className={styles.badge}> Completato ✅</span>
        )}
        {entry.segnalazione?.tipo && (
          <span className={`${styles.badge} ${styles.badgeWarn}`}>
            ⚠ {entry.segnalazione.tipo}
          </span>
        )}
      </div>
    </article>
  );
}

export default DiaryCard;
