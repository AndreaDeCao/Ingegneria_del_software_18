import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { setAccessToken, refreshAccessToken, authApi } from "../../auth/api";
import { useAuth } from "../../auth/AuthProvider";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("accessToken");
      const error = params.get("error");

      if (error) {
        navigate(`/login?error=${error}`, { replace: true });
        return;
      }

      if (token) {
        // Token presente nell'URL — salvalo in memoria
        setAccessToken(token);
      } else {
        // Su mobile il token potrebbe non essere passato — prova via cookie di refresh
        await refreshAccessToken().catch(() => null);
      }

      // Popola user nel contesto AuthProvider
      try {
        await refreshUser();
        navigate("/home", { replace: true });
      } catch {
        navigate("/login", { replace: true });
      }
    })();
  }, []);

  return <p>Accesso in corso...</p>;
}