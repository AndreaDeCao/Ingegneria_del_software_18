import { useParams } from "react-router-dom";

export default function AccountPage() {
  const { sezione } = useParams();
  return <main><h2>Account — {sezione}</h2></main>;
}
