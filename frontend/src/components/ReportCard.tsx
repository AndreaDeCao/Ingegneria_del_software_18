import styles from "./ReportCard.module.css";
import { Link } from "react-router-dom";

// FIXME: Quando verranno implementate le segnalazioni per gli utenti,
// questo componente dovrà supportare anche il tipo "user" oltre ad "activity"
// Per le segnalazioni utente, i campi cambieranno:
// - title -> nome/cognome/nickname dell'utente segnalato
// - reportedBy -> chi ha effettuato la segnalazione
// - reason -> motivo della segnalazione
// - reporterInfo -> informazioni aggiuntive sul segnalatore

interface ReportCardProps {
  type: "activity" | "user"; // FIXME: tipo "user" da implementare
  id: string;
  title: string;
  reason: string;
  organizerName?: string; // Solo per activity
  reportedBy: string;
  reportedByName?: string;
  reportCount?: number;
  status?: "pending" | "accepted" | "dismissed";
  targetLink: string;
}

function ReportCard({
  type,
  id,
  title,
  reason,
  organizerName,
  reportedBy,
  reportedByName,
  reportCount,
  status = "pending",
  targetLink,
}: ReportCardProps) {
  return (
    <Link to={targetLink} className={styles.reportCardLink}>
      <article className={styles.reportCard}>
        <div className={styles.reportCardBody}>
          <h3 className={styles.reportTitle}>{title}</h3>

          <p className={styles.reportReason}>
            <strong>Motivo:</strong> {reason || "Nessun motivo specificato"}
          </p>

          <div className={styles.reportMeta}>
            {/* FIXME: Per segnalazioni utente, "organizerName" diventa "Segnalato" */}
            {type === "activity" && organizerName && (
              <div className={styles.reportMetaItem}>
                <span className={styles.reportMetaLabel}>Organizzatore:</span>
                <span className={styles.reportMetaValue}>
                  {organizerName !== "Organizzatore sconosciuto" ? `@${organizerName}` : organizerName}
                </span>
              </div>
            )}

            <div className={styles.reportMetaItem}>
              <span className={styles.reportMetaLabel}>Segnalato da:</span>
              <span className={styles.reportMetaValue}>
                {reportedByName && reportedByName !== "Utente sconosciuto"
                  ? `@${reportedByName}`
                  : reportedBy || "Utente sconosciuto"}
              </span>
            </div>

            {reportCount && reportCount > 1 && (
              <div className={styles.reportMetaItem}>
                <span className={styles.reportMetaLabel}>Segnalazioni totali:</span>
                <span className={styles.reportMetaValue}>{reportCount}</span>
              </div>
            )}
          </div>

          {status === "pending" && (
            <span className={`${styles.reportBadge} ${styles.reportBadgePending}`}>
              In attesa
            </span>
          )}
        </div>
      </article>
    </Link>
  );
}

export default ReportCard;