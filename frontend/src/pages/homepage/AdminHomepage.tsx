import styles from "../../App.module.css";

export default function AdminHomepage() {
 
  return (
    <main className={styles.main}>

      <div className={styles.contentLayout}>

        {/* COLONNA SINISTRA */}
        <section className={styles.leftColumn}>
            {/*  Messaggio di accesso  */}
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Benvenuto, Admin!</h2>
              <p className={styles.sectionSubtitle}>
                Qui puoi gestire i percorsi, le attività e il diario degli utenti.
              </p>
            </div>

        </section>

        {/* COLONNA DESTRA */}
        <section className={styles.rightColumn}>

             {/*  Messaggio di accesso  */}
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>Benvenuto, Admin!</h2>
              <p className={styles.sectionSubtitle}>
                Qui puoi gestire i percorsi, le attività e il diario degli utenti.
              </p>
            </div>          

        </section>

      </div>

    </main>
  );
}
