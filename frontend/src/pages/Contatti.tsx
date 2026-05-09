import styles from "./TerminiPrivacyContatti.module.css";

export default function Contatti() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>

        <h1 className={styles.pageTitle}>
          Contatti
        </h1>

        <p className={styles.pageDescription}>
          Per domande, supporto, segnalazioni o richieste riguardanti
          l’Applicazione, puoi contattarci tramite i riferimenti qui sotto.
        </p>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Supporto Generale
          </h2>

          <div className={styles.contactCard}>
            <p className={styles.contactLabel}>
              Email supporto
            </p>

            <a
              href="mailto:support@dolomate.com"
              className={styles.contactValue}
            >
              support@dolomate.com
            </a>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Privacy e Dati Personali
          </h2>

          <div className={styles.contactCard}>
            <p className={styles.contactLabel}>
              Email privacy
            </p>

            <a
              href="mailto:privacy@dolomate.com"
              className={styles.contactValue}
            >
              privacy@dolomate.com
            </a>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Segnalazioni e Moderazione
          </h2>

          <div className={styles.contactCard}>
            <p className={styles.contactLabel}>
              Email segnalazioni
            </p>

            <a
              href="mailto:report@dolomate.com"
              className={styles.contactValue}
            >
              report@dolomate.com
            </a>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Tempi di Risposta
          </h2>

          <p className={styles.text}>
            Cerchiamo di rispondere a tutte le richieste il prima possibile.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Informazioni Legali
          </h2>

          <p className={styles.text}>
            Alcune richieste relative a privacy, dati personali o contenuti
            segnalati potrebbero richiedere verifiche aggiuntive prima
            dell’elaborazione.
          </p>
        </section>

      </div>
    </main>
  );
}