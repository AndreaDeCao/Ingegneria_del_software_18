export type DiaryEntry = {
  _id: string;
  userId: string;
  titolo: string;
  data: string; // ISO date string
  note?: string;
  foto?: string[];          // array, coerente con il model
  valutazione?: number;     // 1-5

  completato?: boolean;

  percorsoPersonalizzato?: string;
  gpxData?: string;
  amici?: string[];
  segnalazione?: {
    tipo: "Sentiero danneggiato" | "Neve/ghiaccio" | "Sentiero chiuso" | "Fauna pericolosa" | "Altro";
    descrizione?: string;
    gestitaDaAdmin?: boolean;
  };

  trekId?: {                // popolato via .populate() dal backend
    _id: string;
    name: string;
    difficulty: string;
    duration: string;
    lengthKm: number;

    coordinates?: { lat: number; lon: number };       
    endCoordinates?: { lat: number; lon: number };   
    id?: number; 
  };
  createdAt?: string;
};

// Tipo separato per il form di creazione (solo i campi che manda il frontend)
export type CreateDiaryEntryPayload = {
  titolo: string;
  data: string;
  note?: string;
  foto?: string[];
  valutazione?: number;
  completato?: boolean;
  trekId?: string;      // manda solo l'_id, non l'oggetto

  percorsoPersonalizzato?: string;
  gpxData?: string;
  amici?: string[];
  segnalazione?: {
    tipo: string;
    descrizione?: string;
  };
};