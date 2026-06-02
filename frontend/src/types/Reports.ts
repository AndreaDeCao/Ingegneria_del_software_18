// ── Tipi specifici per le segnalazioni ───────────────────────────────────

export type ReportStatus = "pending" | "accepted" | "dismissed";

/**
 * Utente minimo usato nei campi popolati delle segnalazioni.
 * Allineato a Organizer.ts (stessi campi opzionali).
 */
export type PopulatedUser = {
  _id: string;
  nickname?: string;
  nome?: string;
  cognome?: string;
  email?: string;
};

export type Report = {
  _id: string;
  reportedBy: PopulatedUser | string;
  reason: string;
  reportedAt: string;
  reportStatus: ReportStatus;
  reviewedBy?: PopulatedUser | string | null;
  reviewedAt?: string | null;
  reviewNote?: string;
};

/**
 * Attività arricchita con l'array di segnalazioni e i campi di sospensione.
 * Estende i campi core di Activity.ts con i popolamenti lato admin.
 */
export type ActivityWithReports = {
  _id: string;
  title: string;
  status: string;
  activityDate: string;
  organizerID: PopulatedUser | string;
  trekID: string;
  reports: Report[];
  suspended?: boolean;
};

/** Coppia piatta report ↔ attività, usata per il rendering della lista. */
export type FlatReport = {
  activity: ActivityWithReports;
  report: Report;
};