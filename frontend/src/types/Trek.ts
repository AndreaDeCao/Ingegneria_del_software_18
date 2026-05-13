export type Trek = {
  id: string;
  name: string;
  difficulty: "Facile" | "Medio" | "Difficile";
  duration: string
  // friendCount?: number;
  // likes?: number;
  description?: string;
  SatRouteNumber?: string;
  lengthKm?: number;
  elevationGain?: string;
  startPoint?: string;
  endPoint?: string;
  condizioniAttuali?: string;
};