/** Evento pubblico del comune di Trento */

export type Event = {
  _id: string;
  title: string;
  abstract: string;
  topics: string[];
  typology: string[];
  startDate: string | null;
  endDate: string | null;
  address: string;
  isFree: boolean;
  imageUrl: string | null;
  sourceUrl: string | null;
};