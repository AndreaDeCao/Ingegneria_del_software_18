export type Activity = {
  _id: string;

  title: string;
  description: string;
  
  activityDate: Date;
  status: "Aperto" | "Chiuso" | "Annullato";

  travelMode?: "walking" | "bicycling";

  maxParticipants: number;
  partecipantList?: string[];

  organizerID: string;
  // favoriteTreks: string[]; // Array di ID dei trek salvati
  trekID: string;
};