export type User = {
  _id: string;
  nome: string;
  cognome: string;
  email: string;
  nickname: string;
  role: "user" | "admin";
};