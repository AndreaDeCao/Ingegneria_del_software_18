import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { setAccessToken, authApi } from "../../auth/api";
import { useAuth } from "../../auth/AuthProvider";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  console.log("AuthCallback renderizzato");
  
  useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("accessToken");
  
  (async () => {
    console.log("token dall'URL:", token);
    if (token) {
      setAccessToken(token);
      console.log("chiamo refreshUser...");
      await refreshUser();
      console.log("refreshUser completato");
    }
    navigate("/", { replace: true });
  })();
}, [navigate, refreshUser]);

  return <p>Accesso in corso...</p>;
}