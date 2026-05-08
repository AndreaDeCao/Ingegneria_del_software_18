import { useParams } from "react-router-dom";

export default function DiarioPage() {
  const { sezione } = useParams();
  return <h1>Diario - {sezione}</h1>;
}