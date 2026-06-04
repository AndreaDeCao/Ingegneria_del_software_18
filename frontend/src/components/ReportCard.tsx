import styles from "./ReportCard.module.css";
import { Link } from "react-router-dom";
import type { ReportCardProps } from "../types/Reports";

const CATEGORY_LABEL: Record<ReportCardProps["type"], string> = {
  activity: "Attività",
  trek:     "Percorso",
  user:     "Utente",
};

function formatIdOrName(value: string): string {
  if (!value) return "Sconosciuto";
  if (value.match(/^[0-9a-fA-F]{24}$/)) return value.slice(0, 8) + "...";
  return value;
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
  const isObjectId = (v: string) => !!v?.match(/^[0-9a-fA-F]{24}$/);

  return (
    <Link to={targetLink} className={styles.reportCardLink}>
      <article className={styles.reportCard}>
        <div className={styles.reportCardBody}>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
            <span
              className={styles.reportCategoryBadge}
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "9999px",
                background: type === "activity" ? "var(--accent-soft, #e0edff)" : type === "trek" ? "#fef3c7" : "#f3e8ff",
                color: type === "activity" ? "var(--accent)" : type === "trek" ? "#92400e" : "#6b21a8",
                letterSpacing: "0.02em",
              }}
            >
              {CATEGORY_LABEL[type]}
            </span>
            {status === "pending" && (
              <span className={`${styles.reportBadge} ${styles.reportBadgePending}`}>
                In attesa
              </span>
            )}
          </div>

          <h3 className={styles.reportTitle}>{title}</h3>

          <p className={styles.reportReason}>
            <strong>Motivo:</strong> {reason || "Nessun motivo specificato"}
          </p>

          <div className={styles.reportMeta}>
            {type === "activity" && organizerName && (
              <div className={styles.reportMetaItem}>
                <span className={styles.reportMetaLabel}>Organizzatore:</span>
                <span className={styles.reportMetaValue}>
                  {!isObjectId(organizerName) && organizerName !== "Organizzatore sconosciuto"
                    ? `@${organizerName}`
                    : formatIdOrName(organizerName)}
                </span>
              </div>
            )}

            <div className={styles.reportMetaItem}>
              <span className={styles.reportMetaLabel}>Segnalato da:</span>
              <span className={styles.reportMetaValue}>
                {reportedByName && reportedByName !== "Utente sconosciuto" && !isObjectId(reportedByName)
                  ? `@${reportedByName}`
                  : formatIdOrName(reportedByName || reportedBy)}
              </span>
            </div>

            {reportCount && reportCount > 1 && (
              <div className={styles.reportMetaItem}>
                <span className={styles.reportMetaLabel}>Segnalazioni totali:</span>
                <span className={styles.reportMetaValue}>{reportCount}</span>
              </div>
            )}
          </div>

        </div>
      </article>
    </Link>
  );
}

export default ReportCard;
