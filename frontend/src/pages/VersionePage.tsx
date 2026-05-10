import { useParams } from "react-router-dom";

/**
 * Pagina Versione con sezioni
 * @returns {JSX.Element} Pagina della sezione versione selezionata
 */
export default function VersionePage() {
  const { sezione } = useParams();
  return <h1>Versione - {sezione}</h1>;
}