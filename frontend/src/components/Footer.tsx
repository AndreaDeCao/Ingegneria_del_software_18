import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      
      {/* Parte sinistra: testo */}
      <div className={styles.footerLeft}>
        © {new Date().getFullYear()} DoloMate — Tutti i diritti riservati
      </div>

      {/* Parte destra: link */}
      <div className={styles.footerRight}>
        <a href="#" className={styles.footerLink}>Privacy</a>
        <a href="#" className={styles.footerLink}>Termini</a>
        <a href="#" className={styles.footerLink}>Contatti</a>
      </div>

    </footer>
  );
}