import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../../auth/api";
import TurnstileWidget from "../../components/TurnstileWidget";
import styles from "./Auth.module.css";

export default function RequestTemporaryPassword() {
  const [email, setEmail] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetTurnstile = () => {
    setTurnstileToken("");
    setTurnstileKey((k) => k + 1);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Richiedi password provvisoria</h2>
      <p className={styles.intro}>
        <br></br>
        Inserisci la tua email e completa il CAPTCHA. <br></br>
        Ti invieremo una password temporanea valida per l'accesso.
      </p>

      <form className={styles.form}
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setSuccess(false);
          setSubmitting(true);

          if (!turnstileToken) {
            setError("Completa il CAPTCHA per continuare.");
            setSubmitting(false);
            return;
          }

          try {
            await authApi.requestTemporaryPassword({ email, turnstileToken });
            setSuccess(true);
            setEmail("");
            resetTurnstile();
            setError(null);
          } catch (err) {
            const message = err instanceof Error ? err.message : "Errore nella richiesta";
            setError(message);
            setSuccess(false);
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
            type="email"
            placeholder="Inserisci la tua email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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

        <button className={styles.submitButton} type="submit" disabled={submitting}>
          {submitting ? "Invio in corso..." : "Richiedi password"}
        </button>
      </form>

      {success && (
        <div className={styles.successBox} role="status">
          <p>
            Richiesta eseguita con successo<br></br>
            Controlla la tua casella di posta: ti abbiamo appena inviato la password provvisoria.
          </p>
        </div>
      )}

      {error && (
        <div className={styles.errorBox} role="alert">
          {error}
        </div>
      )}

      <p className={styles.caption}>
        Torna a <Link to="/login" className={styles.link}>login</Link> oppure <Link to="/register" className={styles.link}>registrazione</Link>.
      </p>
    </div>
  );
}
