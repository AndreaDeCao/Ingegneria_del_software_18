export type Trek = {
  id: string;
  name: string;
  difficulty: "Facile" | "Medio" | "Difficile";
  duration: string;
  description?: string;
  SatRouteNumber?: string;
  lenghtKm?: number;
  elevetionGain?: number;
  startPoint?: string;
  endPoint?: string;
  //currentCondition?: string;

  // friendCount?: number;
  // likes?: number;
};