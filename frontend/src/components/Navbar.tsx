import {useState} from "react";

import styles from "./Navbar.module.css";


interface NavbarProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

const LogoIcon = () => ( <img src="/logo_ing_sw.svg" alt="logo" width={40} height={40} /> );
const LogoIconInverted = () => ( <img src="/logo_ing_sw.svg" alt="logo inverted" width={40} height={40} style={{ filter: "invert(1)" }} /> );

const SunIcon = () => ( <img src="/sun.svg" alt="Light mode" width="16" height="16" /> );

const MoonIcon = () => ( <img src="/moon.svg" alt="Dark mode" width="16" height="16" /> );

function DropdownItem({label, items, isOpen, onToggle}: {
  label: string; 
  items: string[];
  isOpen: boolean;
  onToggle: () => void;
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
            <button key={item} className={styles.subMenuItem}>{item}</button>
          ))}
        </div>
     )}
    </div>
  );
}

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
      <DropdownItem label="Account" items={["Profilo", "Sicurezza", "Policy/Cookies"]} 
        isOpen={openItem === "Account"} onToggle={() => setOpenItem(openItem === "Account" ? null : "Account")}/>
      <DropdownItem label="Diario" items={["1", "2", "3"]} 
        isOpen={openItem === "Diario"} onToggle={() => setOpenItem(openItem === "Diario" ? null : "Diario")}/>
      <DropdownItem label="Attività" items={["1", "2", "3"]} 
        isOpen={openItem === "Attività"} onToggle={() => setOpenItem(openItem === "Attività" ? null : "Attività")}/>
      <DropdownItem label="Versione" items={["1", "2", "3"]} 
        isOpen={openItem === "Versione"} onToggle={() => setOpenItem(openItem === "Versione" ? null : "Versione")}/>
     </nav>
    )}
  </div>
  );
}
