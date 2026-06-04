export type Trek = {
  _id: string;
  id: number;
  name: string;
  difficulty: "Facile" | "Medio" | "Difficile";
  description?: string;
  SatRouteNumber?: string;
  // friendCount?: number;
  // likes?: number;

  closed: boolean;
  
  duration: string
  lengthKm?: number;
  elevationGain?: string;

  comuni?: string[];
  startPoint?: string;
  endPoint?: string;

  minAltitude?: number;
  maxAltitude?: number;
  
  coordinates: {
    lat: number;
    lon: number;
  };

  endCoordinates?: {
    lat: number;
    lon: number;
  };

  condizioniAttuali?: string;

  averageRating?: number;
  ratingCount?: number;
};