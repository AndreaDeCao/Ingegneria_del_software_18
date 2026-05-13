import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

import GoogleSignInButton from "../components/GoogleSignInButton";
import TurnstileWidget from "../components/TurnstileWidget";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [turnstileToken, setTurnstileToken] = useState("");

  //TODO: aggiungere validazione dei campi 
  //FIXME: migliorare il display degli errori se le credenziali non sono valide può comunque segnare sessione scaduta invece che credenziali errate
  //FIXME: migliorare il design della pagina di login
  return (
    <div style={{ padding: 24, maxWidth: 520, left: "50%", transform: "translateX(-50%)", position: "relative", marginTop: 50}}>
     {/* <div style={{ padding: 24, position: "relative", marginTop: 40, maxWidth: 400, marginLeft: "auto", marginRight: "auto" }}> */}
      <h2>Form di login</h2>
      <br />

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setSubmitting(true);
          try {
            await login({ email, password, turnstileToken }); // Passiamo anche il token del captcha alla funzione di login
            const to = location.state?.from ?? "/home";
            navigate(to, { replace: true });
          } catch (err) {
            setError(err instanceof Error ? err.message : "Errore login");
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <label style={{ display: "block", marginTop: 12 }}>
          Email
          <input
            style={{ width: "100%", padding: 8 }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            required
          />
        </label>

        <label style={{ display: "block", marginTop: 12 }}>
          Password
          <input
            style={{ width: "100%", padding: 8 }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
            required
          />
        </label>

        <TurnstileWidget onVerify={(token) => setTurnstileToken(token)} />

        {error && (
          <div
            role="alert"
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 8,
              border: "1px solid #f5c6cb",
              background: "#fdecea",
              color: "#7a1f1f",
            }}
          >
            {error}
          </div>
        )}

        

        <button type="submit" disabled={submitting} style={{ marginTop: 16, width: "100%", padding: 10, cursor: "pointer" , background: "#ececec", color: "#000000", border: `1px solid`, borderRadius: 6 }}>
          {submitting ? "Accesso..." : "Accedi"}
        </button>
      </form>

      {/* Separatore */}
      <div style={{display: "flex", alignItems: "center", gap: 8, margin: "16px 0"}}>
        <hr style={{ flex: 1}}/>
        <span style={{ color: "#888", fontSize: 13}}>oppure</span>
        <hr style={{ flex: 1}}/>
      </div>
      
      <button
        onClick={() => window.location.href = "http://localhost:3000/api/auth/github"}
        style={{ width: "100%", padding: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", background: "#fff", color: "#000", border: "1px solid #000", borderRadius: 6 }}>
        <img src="./GitHub_Lockup_Black.svg" width={100} height={18} alt="GitHub" />
      </button>

      {/* Login con Google */}
      {/* <button
        onClick={() => window.location.href = "http://localhost:3000/api/auth/google"}
        style={{ width: "100%", padding: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer"}}>

        <img src="https://www.google.com/favicon.ico" width={16} height={16} alt="Google" />
        Accedi con Google
      </button> */}
      <br />
      <GoogleSignInButton label="Accedi con Google" />

      <p style={{ marginTop: 16 }}>
        Non hai un account? <Link to="/register" style={{ color: 'blue' }}>Registrati</Link>
      </p>
    </div>
  );
}

