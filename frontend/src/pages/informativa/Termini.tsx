import styles from "./TerminiPrivacyContatti.module.css";

export default function Termini() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        
        <h1 className={styles.pageTitle}>
          Termini e Condizioni d’Uso
        </h1>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>1. Introduzione</h2>

          <p>
            I presenti Termini e Condizioni disciplinano l’utilizzo
            dell’applicazione software dedicata alla pianificazione di attività
            sportive in ambiente montano, con particolare attenzione
            all’escursionismo in Trentino-Alto Adige.
          </p>

          <p>
            Utilizzando l’Applicazione, l’utente accetta integralmente i
            presenti termini. Qualora non si intendano accettare le condizioni
            indicate, è necessario interrompere l’utilizzo del servizio.
          </p>
        </section>

        <div className={styles.divider}></div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            2. Descrizione del Servizio
          </h2>

          <p>L’Applicazione consente agli utenti di:</p>

          <ul>
            <li>consultare percorsi escursionistici e informazioni correlate;</li>
            <li>ricevere suggerimenti personalizzati sui percorsi;</li>
            <li>
              visualizzare dati meteo e geografici provenienti da servizi
              esterni;
            </li>
            <li>scaricare mappe e tracciati GPX per utilizzo offline;</li>
            <li>creare e partecipare ad attività di gruppo;</li>
            <li>
              utilizzare funzionalità social e diario escursionistico;
            </li>
            <li>
              contribuire con segnalazioni e contenuti relativi ai sentieri.
            </li>
          </ul>
        </section>

        <div className={styles.divider}></div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            3. Registrazione e Account
          </h2>

          <p>
            Per accedere ad alcune funzionalità è richiesta la registrazione di
            un account personale.
          </p>

          <p>L’utente si impegna a:</p>

          <ul>
            <li>fornire informazioni veritiere e aggiornate;</li>
            <li>mantenere riservate le proprie credenziali di accesso;</li>
            <li>non condividere l’account con terzi;</li>
            <li>notificare eventuali accessi non autorizzati.</li>
          </ul>

          <p>
            Il gestore dell’Applicazione non è responsabile per utilizzi
            impropri derivanti dalla mancata protezione delle credenziali da
            parte dell’utente.
          </p>
        </section>

        <div className={styles.divider}></div>

        <section className={styles.section}>
          <h2 className={styles.sectionSubTitle}>
            3.1 Requisito di Maggiore Età
          </h2>

          <p>
            L’utilizzo dell’Applicazione è consentito esclusivamente agli
              utenti maggiorenni.
          </p>

          <p>
            Registrandosi alla piattaforma, l’utente dichiara sotto la propria
            responsabilità di essere maggiorenne e di possedere la capacità
            legale necessaria per accettare i presenti Termini e Condizioni.
          </p>

          <p>
            Il gestore dell’Applicazione si riserva il diritto di sospendere o
            eliminare account qualora venga accertato l’utilizzo del servizio da
            parte di utenti minorenni o in violazione delle presenti
            disposizioni.
          </p>
        </section>

        <div className={styles.divider}></div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>4. Utilizzo Consentito</h2>

          <p>
            L’utente si impegna a utilizzare l’Applicazione nel rispetto della
            legge e dei presenti Termini e Condizioni.
          </p>

          <p>È vietato:</p>

          <ul>
            <li>pubblicare contenuti offensivi, discriminatori o illegali;</li>
            <li>utilizzare l’Applicazione per attività fraudolente;</li>
            <li>compromettere il funzionamento del sistema;</li>
            <li>caricare malware o software dannoso;</li>
            <li>impersonare altri utenti.</li>
          </ul>

          <p>
            Il gestore si riserva il diritto di sospendere o eliminare account
            che violino tali disposizioni.
          </p>
        </section>

        <div className={styles.divider}></div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            5. Funzionalità Social e Contenuti Utente
          </h2>

          <p>
            Gli utenti possono creare attività, pubblicare segnalazioni,
            caricare fotografie e condividere contenuti.
          </p>

          <p>
            L’utente mantiene la proprietà dei contenuti caricati, ma concede al
            gestore dell’Applicazione una licenza non esclusiva per
            l’utilizzo, la visualizzazione e la gestione tecnica dei contenuti
            all’interno della piattaforma.
          </p>

          <p>
            L’utente è l’unico responsabile dei contenuti pubblicati.
          </p>
        </section>

        <div className={styles.divider}></div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            6. Sicurezza delle Attività Outdoor
          </h2>

          <p>
            L’Applicazione fornisce informazioni a scopo informativo e di
            supporto alla pianificazione.
          </p>

          <p>L’utente riconosce che:</p>

          <ul>
            <li>le attività in montagna comportano rischi;</li>
            <li>
              le condizioni meteorologiche e ambientali possono cambiare
              rapidamente;
            </li>
            <li>
              le informazioni fornite potrebbero non essere sempre aggiornate o
              complete.
            </li>
          </ul>

          <p>
            Il gestore non garantisce l’assoluta accuratezza dei dati e non è
            responsabile per incidenti, danni o perdite derivanti
            dall’utilizzo delle informazioni presenti nell’Applicazione.
          </p>

          <p>
            L’utente è responsabile della propria sicurezza e deve valutare
            autonomamente le condizioni dei percorsi.
          </p>
        </section>

        <div className={styles.divider}></div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            7. Servizi di Terze Parti
          </h2>

          <p>
            L’Applicazione utilizza API e servizi esterni, tra cui:
          </p>

          <ul>
            <li>servizi meteo;</li>
            <li>mappe e geolocalizzazione;</li>
            <li>sistemi di autenticazione.</li>
          </ul>

          <p>
            Il funzionamento di alcune funzionalità può dipendere dalla
            disponibilità di tali servizi esterni. Il gestore non è responsabile
            di eventuali interruzioni o errori causati da terze parti.
          </p>
        </section>

        <div className={styles.divider}></div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            8. Privacy e Protezione dei Dati
          </h2>

          <p>
            Il trattamento dei dati personali avviene nel rispetto del
            Regolamento UE 2016/679 (GDPR).
          </p>

          <p>I dati raccolti possono includere:</p>

          <ul>
            <li>dati identificativi;</li>
            <li>informazioni di accesso;</li>
            <li>dati relativi ai percorsi e alle attività svolte;</li>
            <li>posizione geografica, previo consenso dell’utente.</li>
          </ul>

          <p>L’utente può:</p>

          <ul>
            <li>richiedere copia dei propri dati;</li>
            <li>modificare i consensi privacy;</li>
            <li>richiedere la cancellazione dell’account.</li>
          </ul>
        </section>

        <div className={styles.divider}></div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            9. Disponibilità del Servizio
          </h2>

          <p>
            Il gestore si impegna a mantenere il servizio disponibile e
            funzionante, ma non garantisce l’assenza di interruzioni, errori o
            malfunzionamenti.
          </p>

          <p>
            Potranno essere effettuati aggiornamenti, manutenzioni o modifiche
            senza preavviso.
          </p>
        </section>

        <div className={styles.divider}></div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            10. Proprietà Intellettuale
          </h2>

          <p>
            L’Applicazione, il logo, il design, il codice sorgente e i contenuti
            originali sono protetti dalle normative sul diritto d’autore e sulla
            proprietà intellettuale.
          </p>

          <p>
            È vietata la copia, distribuzione o modifica non autorizzata del
            software o dei contenuti della piattaforma.
          </p>
        </section>

        <div className={styles.divider}></div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            11. Limitazione di Responsabilità
          </h2>

          <p>
            Nei limiti consentiti dalla legge, il gestore dell’Applicazione non
            sarà responsabile per:
          </p>

          <ul>
            <li>danni diretti o indiretti derivanti dall’utilizzo del servizio;</li>
            <li>perdita di dati;</li>
            <li>interruzioni del servizio;</li>
            <li>informazioni errate provenienti da servizi esterni;</li>
            <li>comportamenti degli utenti della piattaforma.</li>
          </ul>
        </section>

        <div className={styles.divider}></div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            12. Sospensione e Chiusura dell’Account
          </h2>

          <p>Il gestore può sospendere o eliminare account che:</p>

          <ul>
            <li>violano i presenti termini;</li>
            <li>pubblicano contenuti inappropriati;</li>
            <li>compromettono la sicurezza della piattaforma.</li>
          </ul>

          <p>
            L’utente può eliminare il proprio account in qualsiasi momento
            tramite le funzionalità disponibili nell’Applicazione.
          </p>
        </section>

        <div className={styles.divider}></div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            13. Modifiche ai Termini e Condizioni
          </h2>

          <p>
            Il gestore si riserva il diritto di modificare i presenti Termini e
            Condizioni.
          </p>

          <p>
            Le modifiche entreranno in vigore dalla data di pubblicazione
            sull’Applicazione.
          </p>
        </section>

        <div className={styles.divider}></div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>14. Legge Applicabile</h2>

          <p>
            I presenti Termini e Condizioni sono regolati dalla normativa
            italiana e dal diritto dell’Unione Europea applicabile.
          </p>

          <p>
            Per eventuali controversie sarà competente il foro previsto dalla
            normativa vigente.
          </p>
        </section>
      </div>
    </main>
  );
}