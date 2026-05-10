import { useParams } from "react-router-dom";

/**
 * Pagina Diario con sezioni
 * @returns {JSX.Element} Pagina della sezione diario selezionata
 */
export default function DiarioPage() {
  const { sezione } = useParams();
  return <h1>Diario - {sezione}</h1>;
}