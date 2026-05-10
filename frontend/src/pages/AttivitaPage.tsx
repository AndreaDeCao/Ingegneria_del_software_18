import { useParams } from "react-router-dom";

/**
 * Pagina Attività con sezioni
 * @returns {JSX.Element} Pagina della sezione attività selezionata
 */
export default function AttivitaPage() {
  const { sezione } = useParams();
  return <h1>Attività - {sezione}</h1>;
}