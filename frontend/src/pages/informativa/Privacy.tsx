import styles from "./TerminiPrivacyContatti.module.css";

export default function Privacy() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>

        <h1 className={styles.pageTitle}>
          Privacy Policy
        </h1>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            1. Introduzione
          </h2>

          <p>
            La presente Privacy Policy descrive le modalità di raccolta,
            utilizzo, conservazione e protezione dei dati personali degli
            utenti dell’applicazione dedicata alla pianificazione di attività
            sportive in ambiente montano.
          </p>

          <p>
            Utilizzando l’Applicazione, l’utente accetta il trattamento dei
            dati personali secondo quanto descritto nella presente informativa.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            2. Titolare del Trattamento
          </h2>

          <p>
            Il titolare del trattamento dei dati è il gestore
            dell’Applicazione.
          </p>

          <p>
            Per richieste relative ai dati personali, l’utente può contattare
            il titolare tramite i canali indicati all’interno della piattaforma.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            3. Dati Raccolti
          </h2>

          <p>
            L’Applicazione può raccogliere le seguenti categorie di dati:
          </p>

          <ul>
            <li>dati identificativi (nome, email, username);</li>
            <li>dati di autenticazione e accesso;</li>
            <li>dati relativi ai percorsi e attività svolte;</li>
            <li>fotografie e contenuti caricati dall’utente;</li>
            <li>dati di posizione geografica;</li>
            <li>dati tecnici e di utilizzo dell’Applicazione.</li>
          </ul>

          <p>
            Completando la registrazione, l'utente dichiara di aver letto, compreso
            e accettato integralmente i presenti Termini e Condizioni e la Privacy Policy.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            4. Finalità del Trattamento
          </h2>

          <p>
            I dati personali vengono trattati per:
          </p>

          <ul>
            <li>fornire i servizi dell’Applicazione;</li>
            <li>gestire autenticazione e sicurezza;</li>
            <li>personalizzare i suggerimenti dei percorsi;</li>
            <li>consentire funzionalità social e attività condivise;</li>
            <li>gestire segnalazioni e moderazione contenuti;</li>
            <li>migliorare qualità e prestazioni del servizio;</li>
            <li>adempiere agli obblighi di legge.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            5. Base Giuridica del Trattamento
          </h2>

          <p>
            Il trattamento dei dati personali avviene sulla base:
          </p>

          <ul>
            <li>del consenso dell’utente;</li>
            <li>
              dell’esecuzione del servizio richiesto dall’utente;
            </li>
            <li>
              dell’adempimento di obblighi legali applicabili;
            </li>
            <li>
              del legittimo interesse del titolare per sicurezza e miglioramento
              del servizio.
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            6. Geolocalizzazione
          </h2>

          <p>
            L’Applicazione può utilizzare la posizione geografica dell’utente
            per mostrare percorsi vicini, generare tracciati e migliorare
            l’esperienza di navigazione.
          </p>

          <p>
            L’accesso alla posizione viene richiesto solo previo consenso
            dell’utente e può essere disattivato dalle impostazioni del
            dispositivo.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            7. Conservazione dei Dati
          </h2>

          <p>
            I dati personali vengono conservati per il tempo strettamente
            necessario alle finalità indicate nella presente Privacy Policy,
            salvo obblighi di legge differenti.
          </p>

          <p>
            L’utente può richiedere in qualsiasi momento la cancellazione del
            proprio account e dei relativi dati personali.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            8. Condivisione dei Dati
          </h2>

          <p>
            I dati personali non vengono venduti a terzi.
          </p>

          <p>
            Alcuni dati possono essere condivisi con:
          </p>

          <ul>
            <li>fornitori di servizi cloud e hosting;</li>
            <li>servizi API esterni (meteo, mappe, autenticazione);</li>
            <li>autorità competenti nei casi previsti dalla legge.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            9. Sicurezza dei Dati
          </h2>

          <p>
            Il sistema adotta misure tecniche e organizzative adeguate per
            proteggere i dati personali da accessi non autorizzati,
            perdita, divulgazione o alterazione.
          </p>

          <ul>
            <li>password cifrate con algoritmi sicuri;</li>
            <li>autenticazione tramite token sicuri;</li>
            <li>connessioni protette tramite HTTPS;</li>
            <li>monitoraggio degli accessi sospetti.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            10. Diritti dell’Utente
          </h2>

          <p>
            Ai sensi del GDPR, l’utente ha diritto di:
          </p>

          <ul>
            <li>accedere ai propri dati personali;</li>
            <li>richiedere rettifica o aggiornamento;</li>
            <li>richiedere cancellazione dei dati;</li>
            <li>limitare il trattamento;</li>
            <li>opporsi al trattamento;</li>
            <li>richiedere portabilità dei dati;</li>
            <li>revocare il consenso precedentemente fornito.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>11. Cookie e Tecnologie Simili</h2>
          <p>
            L'Applicazione utilizza esclusivamente cookie tecnici strettamente
            necessari al funzionamento del servizio:
          </p>
          <ul>
            <li>cookie di sessione e autenticazione, per mantenere l'utente connesso;</li>
            <li>cookie CSRF, per la protezione della sicurezza delle richieste.</li>
          </ul>
          <p>
            Non vengono utilizzati cookie di profilazione, marketing o analytics.
            Questi cookie non richiedono consenso in quanto strettamente necessari
            ai sensi della normativa ePrivacy.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            12. Modifiche alla Privacy Policy
          </h2>

          <p>
            Il gestore si riserva il diritto di aggiornare la presente Privacy
            Policy in qualsiasi momento.
          </p>

          <p>
            Le modifiche entreranno in vigore dalla pubblicazione
            sull’Applicazione.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            13. Contatti
          </h2>

          <p>
            Per domande o richieste riguardanti la presente Privacy Policy o il
            trattamento dei dati personali, l’utente può contattare il titolare
            tramite i canali ufficiali presenti nell’Applicazione.
          </p>
        </section>

      </div>
    </main>
  );
}