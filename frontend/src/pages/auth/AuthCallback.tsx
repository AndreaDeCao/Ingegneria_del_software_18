import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { setAccessToken, authApi } from "../../auth/api";
import { useAuth } from "../../auth/AuthProvider";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("accessToken");
    
    (async () => {
      if (token) {
        setAccessToken(token);
        await refreshUser(); 
      }
      navigate("/", { replace: true });
    })();
  }, [navigate, refreshUser]);

  return <p>Accesso in corso...</p>;
}