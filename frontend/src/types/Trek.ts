export type Trek = {
  id: string;
  name: string;
  difficulty: "Facile" | "Medio" | "Difficile";
  duration: string;
  description?: string;
  SatRouteNumber?: string;
  lengthKm?: number;
  elevationGain?: number;
  startPoint?: string;
  endPoint?: string;
  //currentCondition?: string;

  // friendCount?: number;
  // likes?: number;
};