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
  amici?: {
    _id: string;
    nome: string;
    cognome: string;
    nickname: string;
    avatarUrl: string;
  }[];
  segnalazione?: {
    tipo: "Utente" | "Sentiero danneggiato" | "Neve/ghiaccio" | "Sentiero chiuso" | "Fauna pericolosa" | "Altro";
    descrizione?: string;
    gestitaDaAdmin?: boolean;
    utenteId?: string;
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
    utenteId?: string;
  };
};

export type SegnalazioneEntry = {
  _id: string;
  titolo: string;
  createdAt: string;
  userId: { _id: string; nickname?: string; email?: string } | null;
  segnalazione: {
    tipo: string;
    descrizione?: string;
    stato: "pending" | "accepted" | "dismissed";
    gestitaDaAdmin: boolean;
  };
  utentePopulated?: {
    _id: string;
    nickname?: string;
    nome?: string;
    cognome?: string;
  } | null;
};