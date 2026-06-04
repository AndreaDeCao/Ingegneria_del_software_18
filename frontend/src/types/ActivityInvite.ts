export type ActivityInvite = {
  _id: string;
  activity: string;
  sender: {
    _id: string;
    nome: string;
    cognome: string;
    nickname: string;
    avatarUrl?: string;
  };
  receiver: {
    _id: string;
    nome: string;
    cognome: string;
    nickname: string;
    avatarUrl?: string;
  };
  status: "pending" | "accepted" | "declined";
  createdAt: string;
  updatedAt: string;
  acceptedAt?: string;
  declinedAt?: string;
};
