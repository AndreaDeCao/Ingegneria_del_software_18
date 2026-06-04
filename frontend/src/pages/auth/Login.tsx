import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import GoogleSignInButton from "../../components/GoogleSignInButton";
import TurnstileWidget from "../../components/TurnstileWidget";

import styles from "./Auth.module.css";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileKey, setTurnstileKey] = useState(0);

  const [searchParams, setSearchParams] = useSearchParams();

  const [error, setError] = useState<string | null>(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "banned") return "Il tuo account è stato bannato permanentemente.";
    if (errorParam === "suspended") return "Il tuo account è sospeso. Contatta il supporto per maggiori informazioni.";
    if (errorParam === "oauth_failed") return "Accesso social non riuscito. Riprova o usa email e password.";
    return null;
  });

  const resetTurnstile = () => {
    setTurnstileToken("");
    setTurnstileKey((k) => k + 1);
  };

  useEffect(() => {
    if (searchParams.get("error")) {
      setSearchParams({}, { replace: true });
    }
  }, []);

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Accedi</h2>
      {/* <p className={styles.intro}>
        Inserisci le tue credenziali e completa il CAPTCHA per accedere all'app.
      </p> */}

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
            await login({ email, password, turnstileToken });
            const to = location.state?.from ?? "/home";
            navigate(to, { replace: true });
          } catch (err) {
            const message = err instanceof Error ? err.message : "Errore login";
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
          Password
          <input
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
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
          {submitting ? "Accesso..." : "Accedi"}
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

        <GoogleSignInButton label="Accedi con Google" />
      </div>

      <p className={styles.caption}>
        Non hai un account? <Link to="/register" className={styles.link}>Registrati</Link>
      </p>

      <p className={styles.caption}>
        Password dimenticata? <Link to="/forgotten-password" className={styles.link}>Richiedi password provvisoria</Link>
      </p>
    </div>
  );
}

