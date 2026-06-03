import type { PopulatedUser } from "./User";
// ── Tipi specifici per le segnalazioni ───────────────────────────────────

export type ReportStatus = "pending" | "accepted" | "dismissed";

/**
 * Utente minimo usato nei campi popolati delle segnalazioni.
 * Allineato a Organizer.ts (stessi campi opzionali).
 */

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
  reports?: Report[];
  suspended?: boolean;
};

/** Coppia piatta report ↔ attività, usata per il rendering della lista. */
export type FlatReport = {
  activity: ActivityWithReports;
  report: Report;
};

export type PopulatedReport = {
  _id: string;
  reportStatus: string;
  reason: string;
  reportedBy: PopulatedUser | string;
  reportedAt: string;
};

export interface ReportCardProps {
  type: "activity" | "trek" | "user";
  id: string;
  title: string;
  reason: string;
  organizerName?: string;
  reportedBy: string;
  reportedByName?: string;
  reportCount?: number;
  status?: "pending" | "accepted" | "dismissed";
  targetLink: string;
}

