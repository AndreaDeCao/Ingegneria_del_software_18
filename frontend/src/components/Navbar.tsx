import { useState } from "react";
import styles from "./Navbar.module.css";
import { NavLink, useNavigate, Link } from "react-router-dom";
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
  const isAdmin = user?.role === "admin";

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
        {/* Nav links diversi per admin e utente normale */}
        {isAdmin ? (
          <>
            <NavLink
              to="/admin/utenti"
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ""}`}
            >
              Utenti
            </NavLink>
            <NavLink
              to="/treks"
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ""}`}
            >
              Percorsi
            </NavLink>
            <NavLink
              to="/admin/attivita/visualizza"
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ""}`}
            >
              Attivita
            </NavLink>
            <NavLink
              to="/admin/segnalazioni"
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ""}`}
            >
              Segnalazioni
            </NavLink>
          </>
        ) : (
          <>
            <NavLink
              to="/treks"
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
          </>
        )}

        {!user ? (
          <NavLink to="/login" className={styles.navLink}>
            Login
          </NavLink>
        ) : (
          <NavLink
            to="/"
            className={styles.navLink}
            onClick={async () => {
              await logout();
              navigate("/", { replace: true });
            }}
          >
            Logout
          </NavLink>
        )}

        <button className={styles.themeBtn} onClick={onToggleTheme}
          title="Toggle theme" aria-label="Toggle dark/light mode">
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>
        <button className={styles.avatar} onClick={() => handleNavigate("/account/profile")}> 
          <svg width={20} height={20} viewBox="0 0 24 24" fill="white">
            <circle cx={12} cy={8} r={4}/>
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
        </button>
      </nav>
    </header>

    {menuOpen && (
     <nav className={styles.dropdown}>
      <DropdownItem
        label="Account"
        items={[
          { label: "Profilo", path: "/account/profile" },
        ]}
        isOpen={openItem === "Account"}
        onToggle={() => setOpenItem(openItem === "Account" ? null : "Account")}
        onNavigate={handleNavigate}/>

        {/* Menu hamburger personalizzato per admin */}
        {isAdmin ? (
          <>
            <DropdownItem
              label="Utenti"
              items={[
                { label: "Gestione Utenti", path: "/admin/utenti" },
              ]}
              isOpen={openItem === "Utenti"}
              onToggle={() => setOpenItem(openItem === "Utenti" ? null : "Utenti")}
              onNavigate={handleNavigate}
            />
            <DropdownItem
              label="Attivita"
              items={[
                { label: "Visualizza Lista Attivita", path: "/attivita/visualizza" },
                { label: "Crea Nuova Attivita", path: "/attivita/crea" },
              ]}
              isOpen={openItem === "AttivitaAdmin"}
              onToggle={() => setOpenItem(openItem === "AttivitaAdmin" ? null : "AttivitaAdmin")}
              onNavigate={handleNavigate}/>

            <DropdownItem
              label="Segnalazioni"
              items={[
                { label: "Gestione Segnalazioni", path: "/admin/segnalazioni" },
              ]}
              isOpen={openItem === "Segnalazioni"}
              onToggle={() => setOpenItem(openItem === "Segnalazioni" ? null : "Segnalazioni")}
              onNavigate={handleNavigate}/>
          </>
        ) : (
          <>
            <DropdownItem
              label="Diario"
              items={[
                { label: "Visualizza Diario", path: "/diario/visualizza" },
                { label: "Crea Nuova Voce Diario", path: "/diario/crea" },
              ]}
              isOpen={openItem === "Diario"}
              onToggle={() => setOpenItem(openItem === "Diario" ? null : "Diario")}
              onNavigate={handleNavigate}/>

            <DropdownItem
              label="Attivita"
              items={[
                { label: "Visualizza Lista Attivita", path: "/attivita/visualizza" },
                { label: "Crea Nuova Attivita", path: "/attivita/crea" },
              ]}
              isOpen={openItem === "Attivita"}
              onToggle={() => setOpenItem(openItem === "Attivita" ? null : "Attivita")}
              onNavigate={handleNavigate}/>
          </>
        )}

        <DropdownItem
        label="Versione"
        items={[
          { label: "Versione corrente", path: "/versione/corrente" }
        ]}
        isOpen={openItem === "Versione"}
        onToggle={() => setOpenItem(openItem === "Versione" ? null : "Versione")}
        onNavigate={handleNavigate}/>
        
     </nav>
    )}
  </div>
  );
}
