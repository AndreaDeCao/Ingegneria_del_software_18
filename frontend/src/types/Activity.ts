export type Activity = {
  _id: string;

  title: string;
  description?: string;

  activityDate: Date;

  maxParticipants: number;
  partecipantList: string[];

  status: "Aperto" | "Chiuso" | "Annullato" | "Sospeso";

  travelMode?: "walking" | "bicycling";

  visibility: "public" | "private";

  organizerID: string | { _id: string; nickname?: string; role?: string};
  // favoriteTreks: string[]; // Array di ID dei trek salvati

  trekID: string;

  invitedUsers: string[];

  suspended: boolean;

  createdAt?: Date;
  updatedAt?: Date;
};