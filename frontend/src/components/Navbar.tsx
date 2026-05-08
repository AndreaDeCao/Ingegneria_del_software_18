import styles from "./Navbar.module.css";
import { Link } from "react-router-dom";


import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

/**
 * Il componente Navbar è responsabile di visualizzare la barra di navigazione dell'applicazione, che include il logo, i link di navigazione e un pulsante per cambiare tema.
 */
interface NavbarProps {
  theme: "light" | "dark";
  onToggleTheme: () => void; // Questa prop è una funzione che viene chiamata quando l'utente clicca sul pulsante per cambiare tema. Il componente genitore (App) passerà una funzione che gestisce il cambio di tema.
}

const LogoIcon = () => ( <img src="/logo_ing_sw.svg" alt="logo" width={40} height={40} /> );
const LogoIconInverted = () => ( <img src="/logo_ing_sw.svg" alt="logo inverted" width={40} height={40} style={{ filter: "invert(1)" }} /> );

const SunIcon = () => ( <img src="/sun.svg" alt="Light mode" width="16" height="16" /> );

const MoonIcon = () => ( <img src="/moon.svg" alt="Dark mode" width="16" height="16" /> );

export default function Navbar({ theme, onToggleTheme }: NavbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          {theme === "dark" ? <LogoIcon /> : <LogoIconInverted />}
        </div>
        
        <Link to="/" className={styles.logoName}>
          Dolo<span>Mate</span>
        </Link>
      </div>

      <nav className={styles.nav}>
        <NavLink
          to="/"
          className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ""}`}
        >
          Esplora
        </NavLink>
        <NavLink
          to="/my-treks"
          className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ""}`}
        >
          I miei Percorsi
        </NavLink>
        <NavLink
          to="/friends"
          className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ""}`}
        >
          Amici
        </NavLink>

        {!user ? (
          <NavLink to="/login" className={styles.navLink}>
            Login
          </NavLink>
        ) : (
          <button
            className={styles.navLink}
            onClick={async () => {
              await logout();
              navigate("/", { replace: true });
            }}
          >
            Logout
          </button>
        )}

        <button className={styles.themeBtn} onClick={onToggleTheme}
          title="Toggle theme" aria-label="Toggle dark/light mode">
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>
      </nav>
    </header>
  );
}
