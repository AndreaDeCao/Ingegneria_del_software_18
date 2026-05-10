import { useParams } from "react-router-dom";

/**
 * Pagina Account con sezioni
 * @returns {JSX.Element} Pagina della sezione account selezionata
 */
export default function AccountPage() {
  const { sezione } = useParams();
  return <h1>Account - {sezione}</h1>;
}
