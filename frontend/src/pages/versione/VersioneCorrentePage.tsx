import styles from './VersioneCorrentePage.module.css';

const VERSION = '4.0.0';
const RELEASE_DATE = '07/06/2026';
const DELIVERABLE = 'D4';

const releaseInfo = [
  { label: 'Versione', value: VERSION },
  { label: 'Data rilascio', value: RELEASE_DATE },
  { label: 'Deliverable', value: DELIVERABLE },
  { label: 'Corso', value: 'Ingegneria del Software' },
  { label: 'Anno accademico', value: '2025/2026' },
  { label: 'Gruppo', value: '18' },
];

const features = [
  'Registrazione e login utente con autenticazione classica (email e password)',
  'Autenticazione OAuth tramite Google e GitHub',
  'Gestione sessione tramite JWT con refresh token e logout automatico',
  'Verifica email e recupero password tramite link temporaneo',
  'Protezione CSRF, XSS, CORS e rate limiting sugli endpoint API',
  'Visualizzazione percorsi escursionistici con foto, difficoltà e informazioni tecniche',
  'Ricerca percorsi con filtri per difficoltà, durata, lunghezza e dislivello',
  'Pagina di dettaglio percorso con mappa interattiva e tracciato GPS',
  'Integrazione API meteo con previsioni aggiornate per ogni percorso',
  'Download del file GPX per navigazione offline',
  'Salvataggio percorsi preferiti',
  'Creazione e partecipazione ad attività escursionistiche di gruppo',
  'Gestione richieste di partecipazione da parte degli organizzatori',
  'Sistema di amicizie tra utenti',
  'Diario escursionistico personale con note, foto e statistiche',
  'Segnalazione condizioni sentiero e visualizzazione segnalazioni attive',
  'Pannello di amministrazione per moderazione segnalazioni e gestione utenti',
  'Modalità chiara e scura (light/dark theme)',
  'Interfaccia responsive per desktop e dispositivi mobili',
  'Documentazione API disponibile tramite Swagger UI / Apiary',
  'Deploy backend e frontend online',
];

const stack = [
  { layer: 'Frontend', tech: 'React + TypeScript (Vite)', note: 'CSS Modules, React Router' },
  { layer: 'Backend', tech: 'Node.js + Express', note: 'REST API, middleware JWT/CSRF' },
  { layer: 'Database', tech: 'MongoDB', note: 'Mongoose ODM' },
  { layer: 'Autenticazione', tech: 'JWT + OAuth 2.0', note: 'Google, GitHub, bcrypt' },
  { layer: 'Mappe', tech: 'API geografiche esterne', note: 'Leaflet / Mapbox' },
  { layer: 'Meteo', tech: 'API meteo Trentino', note: 'Previsioni in tempo reale' },
  { layer: 'Deploy', tech: 'Render / Vercel', note: 'Backend e frontend separati' },
  { layer: 'Containerizzazione', tech: 'Docker + Docker Compose', note: 'Ambiente riproducibile' },
];

const team = [
  { name: 'Andrea De Cao' },
  { name: 'Maya D\'Onofrio'},
  { name: 'Omar Balavac'},
];

const sprintHistory = [
  {
    label: 'D1',
    title: 'Analisi e progettazione',
    date: '27/03/2026',
    description: 'Definizione requisiti, user stories, casi d\'uso e architettura iniziale del sistema.',
  },
  {
    label: 'Pitch',
    title: 'Presentazione del progetto',
    date: '01/04/2026',
    description: 'Presentazione dell\'idea e dello stack tecnologico al docente.',
  },
  {
    label: 'D2',
    title: 'Progettazione dettagliata',
    date: '24/04/2026',
    description: 'Product backlog completo, definition of done, struttura API e modelli dati.',
  },
  {
    label: 'D3',
    title: 'Sprint 1',
    date: '17/05/2026',
    description: 'Prima versione funzionante: autenticazione, visualizzazione percorsi, mappe e meteo. 36 test case eseguiti.',
  },
  {
    label: 'D4',
    title: 'Sprint 2',
    date: '07/06/2026',
    description: 'Versione corrente. Funzionalità social, diario, attivita di gruppo, pannello admin, deploy online e test automatici.',
  },
];

const links = [
  { label: 'Repository GitHub', href: 'https://github.com/AndreaDeCao/Ingegneria_del_software_18' },
  { label: 'Documentazione API (Apiary)', href: 'https://app.apiary.io/test27056' },
];

export default function VersioneCorrentePage() {
  return (
    <div className={styles.page}>

      <div className={styles.header}>
        <h1 className={styles.title}>Versione corrente</h1>
        <p className={styles.subtitle}>DoloMate — Piattaforma per la pianificazione escursionistica in Trentino-Alto Adige</p>
      </div>

      <div className={styles.versionBadge}>
        <span className={styles.versionDot} />
        Versione {VERSION}
      </div>

      {/* Metadati release */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Informazioni sul rilascio</h2>
        <div className={styles.infoGrid}>
          {releaseInfo.map((item) => (
            <div key={item.label} className={styles.infoCard}>
              <div className={styles.infoLabel}>{item.label}</div>
              <div className={styles.infoValue}>{item.value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Funzionalita disponibili */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Funzionalita disponibili</h2>
        <ul className={styles.featureList}>
          {features.map((f) => (
            <li key={f} className={styles.featureItem}>
              <span className={styles.featureDot} />
              {f}
            </li>
          ))}
        </ul>
      </section>

      {/* Stack tecnologico */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Stack tecnologico</h2>
        <table className={styles.stackTable}>
          <thead>
            <tr>
              <th>Livello</th>
              <th>Tecnologia</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {stack.map((row) => (
              <tr key={row.layer}>
                <td>{row.layer}</td>
                <td>{row.tech}</td>
                <td>{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Storico sprint */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Storico deliverable</h2>
        <div className={styles.sprintList}>
          {sprintHistory.map((sprint) => (
            <div key={sprint.label} className={styles.sprintRow}>
              <span className={styles.sprintBadge}>{sprint.label}</span>
              <div className={styles.sprintInfo}>
                <span className={styles.sprintLabel}>{sprint.title}</span>
                <span className={styles.sprintMeta}>{sprint.date} — {sprint.description}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Team di sviluppo</h2>
            {team.map((member) => ( <p className={styles.teamMember}>{member.name}</p>))}
      </section>

      {/* Link utili */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Link utili</h2>
        <div className={styles.linkList}>
          {links.map((link) => (
            <div key={link.href}>
              <div className={styles.linkLabel}>{link.label}</div>
              <a
                className={styles.externalLink}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.href}
              </a>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
