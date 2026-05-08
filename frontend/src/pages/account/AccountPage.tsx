import { useParams } from "react-router-dom";

export default function AccountPage() {
  const { sezione } = useParams();
  return <h1>Account - {sezione}</h1>;
}
