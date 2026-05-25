export type Activity = {
  id: string;
  title: string;
  description: string;
  //activityDate: string;
  maxParticipants: number;
  status: string;
  favoriteTreks: string[]; // Array di ID dei trek salvati
};