export type User = {
  _id: string;
  id: number;
  nome: string;
  cognome: string;
  email: string;
  nickname: string;
  role: "user" | "admin";
};