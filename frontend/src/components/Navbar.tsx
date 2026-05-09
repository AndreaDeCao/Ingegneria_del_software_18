import {useState} from "react";
import styles from "./Navbar.module.css";
import { Link } from "react-router-dom";


import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

/**
 * Il componente Navbar è responsabile di visualizzare la barra di navigazione dell'applicazione, che include il logo, i link di navigazione e un pulsante per cambiare tema.
 */
interface NavbarProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;// Questa prop è una funzione che viene chiamata quando l'utente clicca sul pulsante per cambiare tema. Il componente genitore (App) passerà una funzione che gestisce il cambio di tema.
}

const LogoIcon = () => ( <img src="/logo_ing_sw.svg" alt="logo" width={40} height={40} /> );
const LogoIconInverted = () => ( <img src="/logo_ing_sw.svg" alt="logo inverted" width={40} height={40} style={{ filter: "invert(1)" }} /> );
const SunIcon = () => ( <img src="/sun.svg" alt="Light mode" width="16" height="16" /> );
const MoonIcon = () => ( <img src="/moon.svg" alt="Dark mode" width="16" height="16" /> );

/**
 * Menu a tendina con sezioni
 * @param {string} label - Nome sezione
 * @param {{label: string, path: string}[]} items - Sottosezioni con path
 * @param {boolean} isOpen - Se la sezione è aperta
 * @param {function} onToggle - Funzione per aprire/chiudere sezione
 * @param {function} onNavigate - Funzione per navigare alla pagina selezionata
 */
function DropdownItem({label, items, isOpen, onToggle, onNavigate}: {
  label: string; 
  items: {label: string, path: string}[];
  isOpen: boolean;
  onToggle: () => void;
  onNavigate: (path: string) => void; 
}) {
  return (
    <div style={{width: "100%"}}>
     <button className={styles.menuItem} onClick={onToggle}>
      <span>{label}</span>
      <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`} />
     </button>
     {isOpen && (
      <div className={styles.subMenu}>
        {items.map((item) => (
            <button key={item.label} className={styles.subMenuItem} onClick={() => onNavigate(item.path)}>
              {item.label}
            </button>
          ))}
        </div>
     )}
    </div>
  );
}

/**
 * Barra di navigazione principale.
 * @param {string} theme - Tema corrente
 * @param {function} onToggleTheme - Funzione per cambiare tema
 */
export default function Navbar({ theme, onToggleTheme }: NavbarProps) {
  const { user, logout } = useAuth();
  // const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [openItem, setOpenItem] = useState<string | null>(null);
  const navigate = useNavigate();
  const handleNavigate = (path: string) => {
    navigate(path);
    setMenuOpen(false);
    setOpenItem(null);
  }
  return(
  <div style={{ position: "relative" }}>
    <header className={`${styles.header} ${menuOpen ? styles.menuOpenHeader : ""}`}>
      <button className={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)}> 
          {menuOpen ? "✕" : "☰"}
        </button>
      <div className={styles.logo} onClick={() => handleNavigate("/")} style={{ cursor: "pointer"}}>
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
        <button className={styles.avatar} onClick={() => handleNavigate("/account/profilo")}> OB </button>
      </nav>
    </header>

    {menuOpen && (
     <nav className={styles.dropdown}>
      <DropdownItem
        label="Account"
        items={[
          { label: "Profilo", path: "/account/profilo" },
          { label: "Sicurezza", path: "/account/sicurezza" },
          { label: "Policy/Cookies", path: "/account/policy" },
        ]}
        isOpen={openItem === "Account"}
        onToggle={() => setOpenItem(openItem === "Account" ? null : "Account")}
        onNavigate={handleNavigate}/>

        <DropdownItem
        label="Diario"
        items={[
          { label: "1", path: "/diario/1" },
          { label: "2", path: "/diario/2" },
          { label: "3", path: "/diario/3" },
        ]}
        isOpen={openItem === "Diario"}
        onToggle={() => setOpenItem(openItem === "Diario" ? null : "Diario")}
        onNavigate={handleNavigate}/>

        <DropdownItem
        label="Attività"
        items={[
          { label: "1", path: "/attivita/1" },
          { label: "2", path: "/attivita/2" },
          { label: "3", path: "/attivita/3" },
        ]}
        isOpen={openItem === "Attività"}
        onToggle={() => setOpenItem(openItem === "Attività" ? null : "Attività")}
        onNavigate={handleNavigate}/>

        <DropdownItem
        label="Versione"
        items={[
          { label: "1", path: "/vers/1" },
          { label: "2", path: "/vers/2" },
          { label: "3", path: "/vers/3" },
        ]}
        isOpen={openItem === "Versione"}
        onToggle={() => setOpenItem(openItem === "Versione" ? null : "Versione")}
        onNavigate={handleNavigate}/>
     </nav>
    )}
  </div>
  );
}
