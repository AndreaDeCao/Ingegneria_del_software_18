import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { setAccessToken } from "../../auth/api";

/**
 * Pagina di callback OAuth — viene visitata dopo il login con Google.
 * Legge l'accessToken dall'URL, lo salva tramite setAccessToken,
 * Alla fine reindirizza l'utente alla homepage.
 */
export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("accessToken");
    if (token) {
      setAccessToken(token); 
    }
    navigate("/", { replace: true }); 
  }, [navigate]);

  return <p>Accesso in corso...</p>;
}