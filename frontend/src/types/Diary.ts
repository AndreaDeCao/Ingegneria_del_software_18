export type DiaryEntry = {
  _id: string;
  userId: string;
  trekId?: string;
  titolo: string;
  data: string; // ISO date string
  note?: string;
  foto?: string; // URL o base64
  valutazione?: number; // 1-5
  completato?: boolean;
  trekInfo?: { // opzionale, se popolato con i dati del trek
    name: string;
    difficulty: "Facile" | "Medio" | "Difficile";
    duration: string;
    lengthKm?: number;
  };
};