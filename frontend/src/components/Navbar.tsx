import {useState} from "react";
import styles from "./Navbar.module.css";
import {useNavigate} from "react-router-dom";

/** Props del Navbar - tema e funzione per cambiarlo */
interface NavbarProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
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
 */
function DropdownItem({label, items, isOpen, onToggle}: {
  label: string; 
  items: {label: string, path: string}[];
  isOpen: boolean;
  onToggle: () => void;
}) {
  const navigate = useNavigate();
  return (
    <div style={{width: "100%"}}>
     <button className={styles.menuItem} onClick={onToggle}>
      <span>{label}</span>
      <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`} />
     </button>
     {isOpen && (
      <div className={styles.subMenu}>
        {items.map((item) => (
            <button key={item.label} className={styles.subMenuItem} onClick={() => navigate(item.path)}>
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [openItem, setOpenItem] = useState<string | null>(null);
  return(
  <div style={{ position: "relative" }}>
    <header className={`${styles.header} ${menuOpen ? styles.menuOpenHeader : ""}`}>
      <button className={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)}> 
          {menuOpen ? "✕" : "☰"}
        </button>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          {theme === "dark" ? <LogoIcon /> : <LogoIconInverted />}
        </div>
        <span className={styles.logoName}>
          Dolo<span>Mate</span>
        </span>
      </div>

      <nav className={styles.nav}>
        <button className={styles.navLink}>Esplora</button>
        <button className={styles.navLink}>I miei Percorsi</button>
        <button className={styles.navLink}>Amici</button>
        <button className={styles.themeBtn} onClick={onToggleTheme}>
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>
        <button className={styles.avatar}> OB </button>
      </nav>
    </header>

    {menuOpen && (
     <nav className={styles.dropdown}>
      <DropdownItem
        label="Account"
        items={[
          { label: "Profilo", path: "/profilo" },
          { label: "Sicurezza", path: "/sicurezza" },
          { label: "Policy/Cookies", path: "/policy" },
        ]}
        isOpen={openItem === "Account"}
        onToggle={() => setOpenItem(openItem === "Account" ? null : "Account")}/>

        <DropdownItem
        label="Diario"
        items={[
          { label: "1", path: "/diario-1" },
          { label: "2", path: "/diario-2" },
          { label: "3", path: "/diario-3" },
        ]}
        isOpen={openItem === "Diario"}
        onToggle={() => setOpenItem(openItem === "Diario" ? null : "Diario")}/>

        <DropdownItem
        label="Attività"
        items={[
          { label: "1", path: "/attivita-1" },
          { label: "2", path: "/attivita-2" },
          { label: "3", path: "/attivita-3" },
        ]}
        isOpen={openItem === "Account"}
        onToggle={() => setOpenItem(openItem === "Account" ? null : "Account")}/>

        <DropdownItem
        label="Versione"
        items={[
          { label: "1", path: "/vers-1" },
          { label: "2", path: "/vers-2" },
          { label: "3", path: "/vers-3" },
        ]}
        isOpen={openItem === "Account"}
        onToggle={() => setOpenItem(openItem === "Account" ? null : "Account")}/>
     </nav>
    )}
  </div>
  );
}
