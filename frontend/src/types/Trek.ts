export type Trek = {
  id: string;
  name: string;
  difficulty: "Facile" | "Medio" | "Difficile";
  description?: string;
  SatRouteNumber?: string;
  // friendCount?: number;
  // likes?: number;

  duration: string
  lengthKm?: number;
  elevationGain?: string;

  comuni?: string[];
  startPoint?: string;
  endPoint?: string;

  minAltitude?: number;
  maxAltitude?: number;
  
  coordinates?: {
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