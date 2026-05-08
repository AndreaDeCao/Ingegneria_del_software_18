import styles from "./Footer.module.css";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      
      {/* Parte sinistra: testo */}
      <div className={styles.footerLeft}>
        © {new Date().getFullYear()} DoloMate — Tutti i diritti riservati
      </div>

      {/* Parte destra: link */}
      <div className={styles.footerRight}>
        <Link to="/privacy" className={styles.footerLink}>Privacy</Link>
        <Link to="/termini" className={styles.footerLink}>Termini</Link>
        <Link to="/contatti" className={styles.footerLink}>Contatti</Link>
      </div>

    </footer>
  );
}