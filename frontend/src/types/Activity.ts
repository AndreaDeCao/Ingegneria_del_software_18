import type { ObjectId } from "mongoose";

export type Activity = {
  _id: ObjectId;
  id: Number,

  title: string;
  description: string;
  
  activityDate: Date;
  status?: "Aperto" | "Chiuso" | "Annullato";

  maxParticipants: number;

  organizerID?: ObjectId;

  trekID?: ObjectId;
};