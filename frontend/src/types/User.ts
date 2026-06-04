export type User = {
  _id: string;
  id: number;
  nome: string;
  cognome: string;
  email: string;
  nickname: string;
  role: "user" | "admin";
};

export type PopulatedUser = {
  _id: string;
  nickname?: string;
  nome?: string;
  cognome?: string;
  email?: string;
};