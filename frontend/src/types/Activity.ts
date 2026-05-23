import type { ObjectId } from "mongoose";

export type Activity = {
  _id: string;

  title: string;
  description: string;
  
  activityDate: Date;
  status?: "Aperto" | "Chiuso" | "Annullato";

  travelMode?: "walking" | "bicycling";

  maxParticipants: number;
  partecipantList?: string[];

  organizerID?: ObjectId;

  trekID?: ObjectId;
};