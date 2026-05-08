import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  //TODO: aggiungere validazione dei campi 
  //FIXME: migliorare il display degli errori se le credenziali non sono valide può comunque segnare sessione scaduta invece che credenziali errate
  //FIXME: migliorare il design della pagina di login
  return (
    <div style={{ padding: 24, maxWidth: 420 }}>
      <h2>Login</h2>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setSubmitting(true);
          try {
            await login({ email, password });
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

        {error && <p style={{ color: "#c0392b" }}>{error}</p>}

        <button type="submit" disabled={submitting} style={{ marginTop: 16 }}>
          {submitting ? "Accesso..." : "Accedi"}
        </button>
      </form>

      <p style={{ marginTop: 16 }}>
        Non hai un account? <Link to="/register">Registrati</Link>
      </p>
    </div>
  );
}

