import { memo } from "react";
import styles from "./attivitaPage.module.css";

export const ParticipantsList = memo(function ParticipantsList({ list, isAdmin, isOrganizer }: any) {
  return (
    <ul className={styles.participantList}>
      {list.map((p: any, i: number) => (
        <li key={p._id} className={styles.participantItem}>
          <div className={styles.participantAvatar}>
            {(p.nickname?.[0] ?? p.email?.[0] ?? "?").toUpperCase()}
          </div>

          <div className={styles.participantInfo}>
            <span className={styles.participantNickname}>
              {p.nickname}
              {i === 0 && <span className={styles.organizerTag}> (organizzatore)</span>}
            </span>

            {(isOrganizer || isAdmin) && (
              <span className={styles.participantEmail}>{p.email}</span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
});