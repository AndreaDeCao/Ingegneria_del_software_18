import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";

import GoogleSignInButton from "../../components/GoogleSignInButton";
import TurnstileWidget from "../../components/TurnstileWidget";
import styles from "./Auth.module.css";
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confermaPassword, setConfermaPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileKey, setTurnstileKey] = useState(0);

  const resetTurnstile = () => {
    setTurnstileToken("");
    setTurnstileKey((k) => k + 1);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Registrazione</h2>
      <p className={styles.intro}>
        Crea un account per salvare i tuoi percorsi e le esperienze sul diario.
      </p>

      <form className={styles.form}
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setSubmitting(true);
          try {
            if (!turnstileToken) {
              setError("Completa il CAPTCHA per continuare.");
              setSubmitting(false);
              return;
            }
            await register({ nome, cognome, email, nickname, password, confermaPassword, turnstileToken });
            navigate("/home", { replace: true });
          } catch (err) {
            const message = err instanceof Error ? err.message : "Errore registrazione";
            if (
              message.toLowerCase().includes("captcha") ||
              message.toLowerCase().includes("turnstile")
            ) {
              setError("CAPTCHA scaduto o non valido. Verifica di nuovo e riprova.");
            } else {
              setError(message);
            }
            resetTurnstile();
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <div className={styles.fieldGrid}>
          <label className={styles.label}>
            Nome
            <input className={styles.input} value={nome} onChange={(e) => setNome(e.target.value)} required />
          </label>
          <label className={styles.label}>
            Cognome
            <input className={styles.input} value={cognome} onChange={(e) => setCognome(e.target.value)} required />
          </label>
        </div>

        <label className={styles.label}>
          Email
          <input
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            required
          />
        </label>

        <label className={styles.label}>
          Nickname
          <input className={styles.input} value={nickname} onChange={(e) => setNickname(e.target.value)} required />
        </label>

        <label className={styles.label}>
          Password
          <input
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="new-password"
            required
          />
        </label>

        <label className={styles.label}>
          Conferma password
          <input
            className={styles.input}
            value={confermaPassword}
            onChange={(e) => setConfermaPassword(e.target.value)}
            type="password"
            autoComplete="new-password"
            required
          />
        </label>

        <TurnstileWidget
          key={turnstileKey}
          onVerify={(token) => setTurnstileToken(token)}
          onExpire={() => {
            setError("CAPTCHA scaduto. Verifica di nuovo per continuare.");
            resetTurnstile();
          }}
        />

        {error && <div role="alert" className={styles.errorBox}>{error}</div>}

        <button type="submit" disabled={submitting} className={styles.submitButton}>
          {submitting ? "Creazione..." : "Crea account"}
        </button>
      </form>

      <div className={styles.divider}>
        <hr className={styles.dividerLine} />
        <span className={styles.orText}>oppure</span>
        <hr className={styles.dividerLine} />
      </div>

      <div className={styles.socialGrid}>
        <button
          onClick={() => window.location.href = `${API_BASE}/api/auth/github`}
          className={styles.githubButton}
        >
          <img src="./GitHub_Lockup_Black.svg" width={100} height={18} alt="GitHub" />
        </button>

        <GoogleSignInButton label="Registrati con Google" />
      </div>

      <p className={styles.caption}>
        Hai già un account? <Link to="/login" className={styles.link}>Accedi</Link>
      </p>

      <p className={styles.caption}>
        Password dimenticata? <Link to="/temp" className={styles.link}>Richiedi password provvisoria</Link>
      </p>
    </div>
  );
}
