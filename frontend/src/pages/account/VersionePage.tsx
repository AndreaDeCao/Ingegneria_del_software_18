import { useParams } from "react-router-dom";

export default function VersionePage() {
  const { sezione } = useParams();
  return <h1>Versione - {sezione}</h1>;
}