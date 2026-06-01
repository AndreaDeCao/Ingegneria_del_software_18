import { memo } from "react";
import styles from "./attivitaPage.module.css";
import appStyles from "../App.module.css";

export const ActivityActions = memo(function ActivityActions({
  activity,
  isOrganizer,
  isParticipant,
  actions,
  openModal
}: any) {

  return (
    <div className={styles.detailActions}>

      {isOrganizer && (
        <button className={styles.dangerButton} onClick={() => openModal("cancel")}>
          Annulla attività
        </button>
      )}

      {!isParticipant && !isOrganizer && (
        <button className={appStyles.primaryButton} onClick={() => openModal("join")}>
          Partecipa
        </button>
      )}

      {isParticipant && (
        <button className={styles.leaveButton} onClick={() => openModal("leave")}>
          Lascia attività
        </button>
      )}

    </div>
  );
});