import type { Activity } from "./Activity";
import type {Participant} from "./Participant";

export type ActivityPopulated = Omit<Activity, "partecipantList"> & {
  partecipantList: Participant[];
  suspended?: boolean;
  suspendedReason?: string;
  suspendedBy?: { _id: string; nickname: string; email: string } | null;
  suspendedAt?: string | null;
};