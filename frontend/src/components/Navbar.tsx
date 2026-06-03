import { useState, useEffect, useRef } from "react";
import styles from "./Navbar.module.css";
import { NavLink, useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

interface NavbarProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

const LogoIcon = () => (<img src="/logo_ing_sw.svg" alt="logo" width={40} height={40} />);
const LogoIconInverted = () => (<img src="/logo_ing_sw.svg" alt="logo inverted" width={40} height={40} style={{ filter: "invert(1)" }} />);
const SunIcon = () => (<img src="/sun.svg" alt="Light mode" width="16" height="16" />);
const MoonIcon = () => (<img src="/moon.svg" alt="Dark mode" width="16" height="16" />);

function DropdownItem({ label, items, isOpen, onToggle, onNavigate }: {
  label: string;
  items: { label: string; path: string }[];
  isOpen: boolean;
  onToggle: () => void;
  onNavigate: (path: string) => void;
}) {
  return (
    <div style={{ width: "100%" }}>
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

export default function Navbar({ theme, onToggleTheme }: NavbarProps) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [hiddenLinks, setHiddenLinks] = useState<string[]>([]);

  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === "admin";

  const headerRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const leftMenuRef = useRef<HTMLDivElement>(null);
  const rightMenuRef = useRef<HTMLDivElement>(null);

  const adminLinks = [
    { label: "Utenti",       path: "/admin/utenti" },
    { label: "Esplora",      path: "/treks" },
    { label: "Attività",     path: "/admin/attivita/visualizza" },
    { label: "Segnalazioni", path: "/admin/segnalazioni" },
  ];
  const userLinks = [
    { label: "Esplora",         path: "/treks" },
    { label: "I miei Percorsi", path: "/my-treks" },
    { label: "Amici",           path: "/friends" },
  ];
  const navLinks = isAdmin ? adminLinks : userLinks;

  // chiude con Escape o click fuori
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setMenuOpen(false); setOverflowOpen(false); }
    };
    const onOut = (e: MouseEvent) => {
      if (leftMenuRef.current && !leftMenuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (rightMenuRef.current && !rightMenuRef.current.contains(e.target as Node)) setOverflowOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onOut);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onOut);
    };
  }, []);

  // ResizeObserver: calcola quali link escono e li traccia in hiddenLinks
  useEffect(() => {
    if (!navRef.current || !headerRef.current) return;
    const measure = () => {
      const nav = navRef.current!;
      const links = Array.from(nav.querySelectorAll<HTMLElement>("[data-navlink]"));
      if (!links.length) return;
      links.forEach(l => { l.style.display = ""; });
      const navRight = nav.getBoundingClientRect().right;
      const hidden: string[] = [];
      for (let i = links.length - 1; i >= 0; i--) {
        if (links[i].getBoundingClientRect().right > navRight + 2) {
          hidden.unshift(links[i].dataset.navlink!);
          links[i].style.display = "none";
        }
      }
      setHiddenLinks(hidden);
    };
    const ro = new ResizeObserver(measure);
    ro.observe(headerRef.current!);
    measure();
    return () => ro.disconnect();
  }, [user, isAdmin]);

  const handleNavigate = (path: string) => {
    navigate(path);
    setMenuOpen(false);
    setOverflowOpen(false);
    setOpenItem(null);
  };

  const isActive = (path: string) => location.pathname === path;

  // Helpers: un link è "hidden" se il ResizeObserver lo ha nascosto
  // oppure se siamo sotto 768px (nav intera nascosta via CSS)
  const navHidden = typeof window !== "undefined" && window.innerWidth <= 768;
  const isLinkHidden = (label: string) => hiddenLinks.includes(label) || navHidden;

  return (
    <div style={{ position: "relative" }}>
      <header ref={headerRef} className={styles.header}>

        {/* ── hamburger sx con dropdown ── */}
        <div ref={leftMenuRef} style={{ position: "relative", flexShrink: 0 }}>
          <button className={styles.hamburger} onClick={() => { setMenuOpen(o => !o); setOverflowOpen(false); }}>
            {menuOpen ? "✕" : "☰"}
          </button>

          {menuOpen && (
            <nav className={styles.dropdown}>
              {/* Account: sempre presente */}
              <DropdownItem
                label="Account"
                items={[
                  { label: "Profilo",        path: "/account/profile" },
                ]}
                isOpen={openItem === "Account"}
                onToggle={() => setOpenItem(openItem === "Account" ? null : "Account")}
                onNavigate={handleNavigate}
              />

              {/* Nav links: appaiono nel dropdown SOLO se nascosti dalla navbar */}
              {isAdmin ? (
                <>
                  {isLinkHidden("Utenti") && (
                    <DropdownItem label="Utenti"
                      items={[{ label: "Gestione Utenti", path: "/admin/utenti" }]}
                      isOpen={openItem === "Utenti"}
                      onToggle={() => setOpenItem(openItem === "Utenti" ? null : "Utenti")}
                      onNavigate={handleNavigate} />
                  )}
                  {isLinkHidden("Esplora") && (
                    <DropdownItem label="Esplora"
                      items={[{ label: "Esplora Percorsi", path: "/treks" }]}
                      isOpen={openItem === "Esplora"}
                      onToggle={() => setOpenItem(openItem === "Esplora" ? null : "Esplora")}
                      onNavigate={handleNavigate} />
                  )}
                  {isLinkHidden("Attività") && (
                    <DropdownItem label="Attività"
                      items={[
                        { label: "Visualizza Lista Attività", path: "/attivita/visualizza" },
                        { label: "Crea Nuova Attività",       path: "/attivita/crea" },
                      ]}
                      isOpen={openItem === "AttivitaAdmin"}
                      onToggle={() => setOpenItem(openItem === "AttivitaAdmin" ? null : "AttivitaAdmin")}
                      onNavigate={handleNavigate} />
                  )}
                  {isLinkHidden("Segnalazioni") && (
                    <DropdownItem label="Segnalazioni"
                      items={[{ label: "Gestione Segnalazioni", path: "/admin/segnalazioni" }]}
                      isOpen={openItem === "Segnalazioni"}
                      onToggle={() => setOpenItem(openItem === "Segnalazioni" ? null : "Segnalazioni")}
                      onNavigate={handleNavigate} />
                  )}
                </>
              ) : (
                <>
                  {isLinkHidden("Esplora") && (
                    <DropdownItem label="Esplora"
                      items={[{ label: "Esplora Percorsi", path: "/treks" }]}
                      isOpen={openItem === "Esplora"}
                      onToggle={() => setOpenItem(openItem === "Esplora" ? null : "Esplora")}
                      onNavigate={handleNavigate} />
                  )}
                  {isLinkHidden("I miei Percorsi") && (
                    <DropdownItem label="I miei Percorsi"
                      items={[{ label: "Percorsi Preferiti", path: "/my-treks" }]}
                      isOpen={openItem === "MieiPercorsi"}
                      onToggle={() => setOpenItem(openItem === "MieiPercorsi" ? null : "MieiPercorsi")}
                      onNavigate={handleNavigate} />
                  )}
                  {isLinkHidden("Amici") && (
                    <DropdownItem label="Amici"
                      items={[{ label: "I tuoi Amici", path: "/friends" }]}
                      isOpen={openItem === "Amici"}
                      onToggle={() => setOpenItem(openItem === "Amici" ? null : "Amici")}
                      onNavigate={handleNavigate} />
                  )}
                  {/* Sezioni sempre presenti nel hamburger */}
                  <DropdownItem label="Diario"
                    items={[
                      { label: "Visualizza Diario",      path: "/diario/visualizza" },
                      { label: "Crea Nuova Voce Diario", path: "/diario/crea" },
                    ]}
                    isOpen={openItem === "Diario"}
                    onToggle={() => setOpenItem(openItem === "Diario" ? null : "Diario")}
                    onNavigate={handleNavigate} />
                  <DropdownItem label="Attività"
                    items={[
                      { label: "Visualizza Lista Attività", path: "/attivita/visualizza" },
                      { label: "Crea Nuova Attività",       path: "/attivita/crea" },
                    ]}
                    isOpen={openItem === "Attivita"}
                    onToggle={() => setOpenItem(openItem === "Attivita" ? null : "Attivita")}
                    onNavigate={handleNavigate} />
                    {/* Login/Logout se nascosto */}
                  {isLinkHidden("Login") && !user && (
                    <DropdownItem label="Login"
                      items={[{ label: "Accedi", path: "/login" }]}
                      isOpen={openItem === "Login"}
                      onToggle={() => setOpenItem(openItem === "Login" ? null : "Login")}
                      onNavigate={handleNavigate} />
                  )}
                  {isLinkHidden("Logout") && user && (
                    <button className={styles.menuItem}
                      onClick={async () => { await logout(); navigate("/", { replace: true }); setMenuOpen(false); }}>
                      Logout
                    </button>
                  )}
                </>
                
              )}

              <DropdownItem label="Versione"
                items={[{ label: "Versione corrente", path: "/versione/corrente" }]}
                isOpen={openItem === "Versione"}
                onToggle={() => setOpenItem(openItem === "Versione" ? null : "Versione")}
                onNavigate={handleNavigate} />
            </nav>
          )}
        </div>

        {/* ── logo ── */}
        <div className={styles.logo} onClick={() => handleNavigate("/")} style={{ cursor: "pointer" }}>
          <div className={styles.logoIcon}>
            {theme === "dark" ? <LogoIcon /> : <LogoIconInverted />}
          </div>
          <Link to="/" className={styles.logoName}>Dolo<span>Mate</span></Link>
        </div>

        {/* ── link centrali: il ResizeObserver nasconde quelli che non ci stanno ── */}
        <nav ref={navRef} className={styles.nav}>
          {navLinks.map((link) => (
            <NavLink
              key={link.label}
              to={link.path}
              data-navlink={link.label}
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ""}`}
            >
              {link.label}
            </NavLink>
          ))}
          {!user ? (
            <NavLink to="/login" data-navlink="Login"
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ""}`}>
              Login
            </NavLink>
          ) : (
            <button data-navlink="Logout" className={styles.navLink}
              onClick={async () => { await logout(); navigate("/", { replace: true }); }}>
              Logout
            </button>
          )}
        </nav>

        {/* ── controlli fissi dx: SEMPRE visibili ── */}
        <div className={styles.rightControls}>

          {/* bottone ··· appare solo se ci sono link overflow su desktop */}
          {hiddenLinks.length > 0 && (
            <div ref={rightMenuRef} style={{ position: "relative" }}>
              <button className={styles.overflowBtn}
                onClick={() => { setOverflowOpen(o => !o); setMenuOpen(false); }}
                aria-label="Altri link">
                ···
                <span className={styles.overflowDot} />
              </button>
              {overflowOpen && (
                <div className={styles.overflowDropdown}>
                  {hiddenLinks.map((label) => {
                    if (label === "Logout") {
                      return (
                        <button key="Logout" className={styles.overflowDropdownItem}
                          onClick={async () => { await logout(); navigate("/", { replace: true }); setOverflowOpen(false); }}>
                          Logout
                        </button>
                      );
                    }
                    const link = navLinks.find(l => l.label === label)
                      ?? (label === "Login" ? { path: "/login" } : null);
                    if (!link) return null;
                    return (
                      <button key={label}
                        className={`${styles.overflowDropdownItem} ${isActive(link.path) ? styles.active : ""}`}
                        onClick={() => handleNavigate(link.path)}>
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <button className={styles.themeBtn} onClick={onToggleTheme} aria-label="Toggle dark/light mode">
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>

          <button className={styles.avatar} onClick={() => handleNavigate("/account/profile")}>
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar utente" className={styles.avatarImg} />
            ) : (
              <svg width={20} height={20} viewBox="0 0 24 24" fill="white">
                <circle cx={12} cy={8} r={4} />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            )}
          </button>
        </div>

      </header>
    </div>
  );
}