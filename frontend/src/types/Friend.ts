// Type dell'amico di un utente
export type Friend = {
  friendshipId: string;
  user: {
    _id: string;
    nome: string;
    cognome: string;
    nickname: string;
    avatarUrl?: string;
  };
};
