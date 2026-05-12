import { useState, useRef } from "react"; //useRef serve a tenere traccia del componente HCaptcha 
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

import HCaptcha from "@hcaptcha/react-hcaptcha";

// import { useTheme } from "../hooks/useTheme";
import GoogleSignInButton from "../components/GoogleSignInButton";
import TurnstileWidget from "../components/TurnstileWidget";

// import styles from "./Auth.module.css";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  // const { theme } = useTheme(); 

  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confermaPassword, setConfermaPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  

  const captchaRef = useRef<HCaptcha>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  //TODO: aggiungere validazione dei campi (es. email valida, password abbastanza complessa, ecc.)
  //TODO: aggiungi  pwd confirm e captcha per evitare registrazioni automatiche
  //FIXME: migliorare il display degli errori
  //FIXME: migliorare il design della pagina di registrazione
  return (
    // <div style={{ padding: 24, maxWidth: 520 }}>
    <div style={{ padding: 24, maxWidth: 520, left: "50%", transform: "translateX(-50%)", position: "relative"}}>
      <h2>Form di registrazione</h2>
      <br />
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setSubmitting(true);
          try {
            await register({ nome, cognome, email, nickname, password, confermaPassword, turnstileToken });
            navigate("/home", { replace: true });
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

        <label style={{ display: "block", marginTop: 12 }}>
          Conferma password
          <input
            style={{ width: "100%", padding: 8 }}
            value={confermaPassword}
            onChange={(e) => setConfermaPassword(e.target.value)}
            type="password"
            autoComplete="new-password"
            required
          />
        </label>


        {/* TODO: finire di implementare captcha, attualmente è solo un placeholder, non blocca la registrazione se non completato
        manca: 
                  - gestire il token del captcha e inviarlo al backend per la verifica (in authController.js)
        OPZIONALE - gestire il caso in cui il captcha scade o viene invalidato (es. se l'utente ci mette troppo tempo a compilare il form) 
                  - aggiungere captchaToken: string; al RegisterRequest in api.ts
                  - aggiungere segreti in .env per hcaptcha creati da https://www.hcaptcha.com (serve registrarsi e creare un nuovo sito per ottenere sitekey e secret) */}
        {/* <HCaptcha 
          sitekey={import.meta.env.VITE_HCAPTCHA_SITE_KEY}
          onVerify={(token) => setCaptchaToken(token)}
          onExpire={() => setCaptchaToken(null)}
          ref={captchaRef}
        /> */}

        <TurnstileWidget onVerify={(token) => setTurnstileToken(token)} />

        {error && <p style={{ color: "#c0392b" }}>{error}</p>}

        <button type="submit" disabled={submitting} style={{ marginTop: 16, width: "100%", padding: 10, cursor: "pointer" , background: "#ececec", color: "#000000", border: `1px solid`, borderRadius: 6 }}>
          {submitting ? "Creazione..." : "Crea account"}
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
        style={{ width: "100%", padding: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer"}}
      >
        <img src="https://www.google.com/favicon.ico" width={16} height={16} alt="Google" />
        Registrati con Google
      </button> */}
      <br />
      <GoogleSignInButton label="Registrati con Google" />


      <p style={{ marginTop: 16 }}>
        Hai già un account? <Link to="/login" style={{color: 'blue'}}>Accedi</Link>
      </p>
    </div>
  );
}
