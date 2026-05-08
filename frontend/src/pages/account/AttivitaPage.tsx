import { useParams } from "react-router-dom";

export default function AttivitaPage() {
  const { sezione } = useParams();
  return <h1>Attività - {sezione}</h1>;
}