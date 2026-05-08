import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  //TODO: aggiungere validazione dei campi (es. email valida, password abbastanza complessa, ecc.)
  //FIXME: migliorare il display degli errori
  //FIXME: migliorare il design della pagina di registrazione
  return (
    <div style={{ padding: 24, maxWidth: 520 }}>
      <h2>Registrazione</h2>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setSubmitting(true);
          try {
            await register({ nome, cognome, email, nickname, password });
            navigate("/treks", { replace: true });
          } catch (err) {
            setError(err instanceof Error ? err.message : "Errore registrazione");
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label style={{ display: "block" }}>
            Nome
            <input style={{ width: "100%", padding: 8 }} value={nome} onChange={(e) => setNome(e.target.value)} required />
          </label>
          <label style={{ display: "block" }}>
            Cognome
            <input style={{ width: "100%", padding: 8 }} value={cognome} onChange={(e) => setCognome(e.target.value)} required />
          </label>
        </div>

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
          Nickname
          <input style={{ width: "100%", padding: 8 }} value={nickname} onChange={(e) => setNickname(e.target.value)} required />
        </label>

        <label style={{ display: "block", marginTop: 12 }}>
          Password
          <input
            style={{ width: "100%", padding: 8 }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="new-password"
            required
          />
        </label>

        {error && <p style={{ color: "#c0392b" }}>{error}</p>}

        <button type="submit" disabled={submitting} style={{ marginTop: 16 }}>
          {submitting ? "Creazione..." : "Crea account"}
        </button>
      </form>

      <p style={{ marginTop: 16 }}>
        Hai già un account? <Link to="/login">Accedi</Link>
      </p>
    </div>
  );
}
