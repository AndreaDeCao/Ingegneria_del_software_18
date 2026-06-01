import styles from "./attivitaPage.module.css";
import appStyles from "../App.module.css";

export function ActivityModals({
  activeModal,
  setActiveModal,
  actionLoading,
  handleAction,
  handleDelete
}: any) {

  if (!activeModal) return null;

  return (
    <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>

        {activeModal === "join" && (
          <>
            <h2>Conferma partecipazione</h2>
            <button onClick={() => handleAction("join", "POST")}>
              Conferma
            </button>
          </>
        )}

        {activeModal === "leave" && (
          <>
            <h2>Lascia attività</h2>
            <button onClick={() => handleAction("leave", "POST")}>
              Conferma
            </button>
          </>
        )}

        {activeModal === "cancel" && (
          <>
            <h2>Annulla attività</h2>
            <button onClick={() => handleAction("cancel", "PATCH")}>
              Conferma
            </button>
          </>
        )}

        {activeModal === "delete" && (
          <>
            <h2>Elimina attività</h2>
            <button onClick={handleDelete}>
              Elimina definitivamente
            </button>
          </>
        )}

      </div>
    </div>
  );
}