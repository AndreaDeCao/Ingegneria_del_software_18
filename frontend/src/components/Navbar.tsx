import styles from "./Navbar.module.css";

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
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          {theme === "dark" ? <LogoIcon /> : <LogoIconInverted />}
        </div>
        <span className={styles.logoName}>
          Dolo<span>Mate</span>
        </span>
      </div>

      <nav className={styles.nav}>
        <button className={`${styles.navLink} ${styles.active}`}>Esplora</button>
        <button className={styles.navLink}>I miei Percorsi</button>
        <button className={styles.navLink}>Amici</button>

        <button className={styles.themeBtn} onClick={onToggleTheme}
          title="Toggle theme" aria-label="Toggle dark/light mode">
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>
      </nav>
    </header>
  );
}
