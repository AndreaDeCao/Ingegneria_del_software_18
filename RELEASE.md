# DoloMate — Release Notes

## Release 2 · Sprint 1 & Sprint 2

**Data:** 07/06/2026  
**Repository:** https://github.com/AndreaDeCao/Ingegneria_del_software_18  
**Corso:** Ingegneria del Software — Università di Trento, A.A. 2025/2026

---

## Panoramica

Prima release stabile di **DoloMate**, piattaforma web per la gestione e condivisione di escursioni nelle Dolomiti.  
Il sistema consente la registrazione e autenticazione degli utenti, la consultazione e valutazione di percorsi di trekking, la gestione di un diario personale, la creazione di attività di gruppo e la moderazione tramite pannello amministrativo.

Il backend è un'API REST Node.js/Express con MongoDB. Il frontend è un'applicazione React/TypeScript. Entrambi sono deployati su Render.

---

## Funzionalità rilasciate

### Autenticazione e sicurezza

| ID | Funzionalità | Stato |
|----|--------------|-------|
| US-01 | Registrazione classica con validazione campi | ✅ Completata |
| US-02 | Verifica email tramite link (token 24h) | ✅ Completata |
| US-03 | Login con email e password | ✅ Completata |
| US-04 | Login OAuth2 con Google | ✅ Completata |
| US-05 | Login OAuth2 con GitHub | ✅ Completata |
| US-06 | Sessione ibrida: access token (15 min) + refresh token httpOnly (7 gg) | ✅ Completata |
| US-07 | Logout con invalidazione cookie refresh | ✅ Completata |
| US-08 | Protezione route tramite middleware JWT | ✅ Completata |
| US-09 | Protezione CSRF con double-submit cookie | ✅ Completata |
| US-10 | Protezione bot con Cloudflare Turnstile | ✅ Completata |
| US-11 | Richiesta password temporanea via email | ✅ Completata |

### Funzionalità principali

| ID | Funzionalità | Stato |
|----|--------------|-------|
| US-12 | Catalogo percorsi Trek con filtri | ✅ Completata |
| US-13 | Votazione percorsi (1–5 stelle, media dinamica) | ✅ Completata |
| US-14 | Percorsi preferiti per utente | ✅ Completata |
| US-15 | Diario escursioni personale (CRUD) | ✅ Completata |
| US-16 | Gestione amicizie (richiesta, accettazione, rifiuto) | ✅ Completata |
| US-17 | Creazione e gestione attività di gruppo | ✅ Completata |
| US-18 | Iscrizione/abbandono attività | ✅ Completata |
| US-19 | Inviti attività tra amici | ✅ Completata |
| US-20 | Segnalazione attività | ✅ Completata |
| US-21 | Notifiche in-app | ✅ Completata |
| US-22 | Gestione profilo utente (avatar, password, email) | ✅ Completata |
| US-23 | Ricerca utenti per nickname/nome | ✅ Completata |
| US-24 | Pannello admin: sospensione e ban utenti | ✅ Completata |
| US-25 | Pannello admin: revisione segnalazioni | ✅ Completata |
| US-26 | Pannello admin: gestione attività | ✅ Completata |
| US-27 | Meteo in tempo reale per percorso Trek | ✅ Completata |

---

## Test automatizzati

La suite di test automatizzati copre i **46 test case** definiti nel documento
*M4_18.pdf*, organizzati nelle seguenti sezioni.

### Strumenti

| Strumento | Versione | Ruolo |
|-----------|----------|-------|
| Jest | 30.4.2 | Test runner e coverage |
| Supertest | 7.2.2 | HTTP integration testing |
| mongodb-memory-server | 11.2.0 | MongoDB in-memory per i test |
| bcryptjs | 3.1.14 | Hash password nei fixture |
| jsonwebtoken | 9.0.2 | Generazione token di test |

### Esecuzione

```bash
cd backend
npm install
npm run test:coverage
```

### Risultati

```
Test Suites:  1 passed, 1 total
Tests:        46 passed, 0 failed
Coverage:     vedi tabella sotto
Time:         ~13 s
```

### Report di coverage

| File | Statements | Branches | Functions | Lines |
|------|-----------|----------|-----------|-------|
| `authController.js` | 34% | 35% | 47% | 34% |
| `treksController.js` | 35% | 24% | 40% | 37% |
| `friendshipController.js` | 32% | 21% | 33% | 32% |
| `diaryController.js` | 13% | 8% | 4% | 14% |
| `adminControllerAdmin.js` | 17% | 18% | 14% | 17% |
| `requireAuth.js` | 66% | 50% | 100% | 71% |
| **models/** | **100%** | **100%** | **100%** | **100%** |
| **routes/** | **100%** | **100%** | **100%** | **100%** |
| **helpers di test** | **100%** | **100%** | **100%** | **100%** |
| **Totale** | **27%** | **12%** | **18%** | **28%** |

> La coverage globale è al 27% perché i controller non inclusi nello scope
> dei 46 TC (activity, users, weather, route) non sono esercitati dalla suite.
> Models e routes raggiungono il 100% essendo caricati da tutti i test.

### Distribuzione dei test case per sezione

| Sezione | TC | Tecnica principale |
|---------|----|--------------------|
| Registrazione classica | TC01–TC14 | EP, BVA, EG |
| Registrazione OAuth (Google/GitHub) | TC15–TC19 | EP, EG |
| Login classico | TC20–TC23 | EP, EG |
| Login OAuth | TC24–TC25 | EP |
| Sessione JWT | TC26–TC30 | EP, BVA |
| Logout | TC31–TC32 | EP, BVA |
| Sicurezza (XSS, injection, hash) | TC33–TC36 | EG |
| Percorsi Trek | TC37–TC41 | EP, BVA, EG |
| Diario escursioni | TC42–TC43 | EP |
| Gestione amicizie | TC44–TC45 | EP, EG |
| Pannello admin | TC46 | EP, BVA, EG |

### Legenda tecniche

| Sigla | Tecnica |
|-------|---------|
| EP | Equivalence Partitioning — classi valide e invalide |
| BVA | Boundary Value Analysis — valori ai limiti |
| EG | Error Guessing — casi anomali tipici |

### Note sui test case OAuth (TC15–TC19)

I flussi OAuth completi (scambio codice con Google/GitHub, verifica `id_token`)
non sono testabili in ambiente automatizzato senza account reali.
I TC15–TC19 coprono la parte testabile:

- **TC15, TC18** — verificano che il redirect iniziale avvenga verso il provider
  corretto con i parametri OAuth obbligatori (`client_id`, `redirect_uri`, `state`)
- **TC16, TC17, TC19** — verificano la protezione anti-CSRF: uno `state`
  non corrispondente al cookie `oauth_state` produce 403

### Note sul TC01 — registrazione valida

Il controller, al termine della registrazione, invia un'email di verifica
e risponde con `{ message: "Registrazione completata!..." }` anziché
`{ user, accessToken }`. L'access token viene emesso solo dopo che l'utente
clicca il link di verifica (flusso `verifyEmail`).
Il TC01 verifica: HTTP 201, presenza del campo `message`, persistenza
dell'utente nel DB e assenza del token nella risposta.

### Note sul TC29 — refresh senza cookie

Il controller risponde `{ accessToken: null }` con HTTP 200 quando il cookie
`refresh_token` è assente (comportamento intenzionale per il polling del
frontend). Il TC29 è diviso in:

- **TC29a** — refresh token scaduto → 401 (errore effettivo)
- **TC29b** — cookie assente → 200 `{ accessToken: null }` (comportamento atteso)

---

## Architettura e deployment

### Scelte architetturali

- Autenticazione stateless con JWT + refresh token httpOnly
- Protezione CSRF con double-submit cookie
- Separazione controller/service per logica business
- Uso di MongoDB per flessibilità sui dati

### Stack tecnologico

| Layer | Tecnologia |
|-------|-----------|
| Runtime | Node.js + Express |
| Database | MongoDB + Mongoose |
| Autenticazione | JWT (`jsonwebtoken`) + bcrypt |
| OAuth2 | Google Auth Library + GitHub REST API |
| Email | Nodemailer / Resend |
| Frontend | React + TypeScript + Vite |
| Hosting | Render (backend + frontend statico) |
| Database cloud | MongoDB Atlas |

### Variabili d'ambiente richieste

```env
# JWT
JWT_ACCESS_SECRET=<segreto_access>
JWT_REFRESH_SECRET=<segreto_refresh>

# MongoDB
MONGODB_URI=mongodb+srv://...

# bcrypt
SALT_ROUNDS=15

# OAuth Google
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://<dominio>/api/auth/google/callback

# OAuth GitHub
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_REDIRECT_URI=https://<dominio>/api/auth/github/callback

# URL
FRONTEND_URL=https://<dominio-frontend>
CLIENT_URL=https://<dominio-frontend>

# Ambiente
NODE_ENV=production

# Cloudflare Turnstile
TURNSTILE_SECRET_KEY=...

#chiavi per l'invio di email tramite Gmail SMTP
GMAIL_USER=...
GMAIL_PASS=...

# chiave OpenStreetMap
ORS_API_KEY=...

# URL usato per recuperare eventi pubblici del comune di Trento
COMUNE_TRENTO_API_URL=https://eventi.comune.trento.it/api/opendata/v2/content/search?classes=event&limit=2000
```

### Avvio in locale

```bash
# Clona il repository
git clone https://github.com/[org]/Ingegneria_del_software_18
cd Ingegneria_del_software_18

# Backend
cd backend
cp .env.example .env   
npm install
npm run dev            # avvia su http://localhost:3000

# Frontend (altro terminale)
cd frontend
npm install
npm run dev            # avvia su http://localhost:5173
```

### Avvio con Docker

```bash
docker-compose up --build
```
### ⚠️ Nota sul deployment con Docker

Il `docker-compose.yml` e i `Dockerfile` presenti nel repository sono
attualmente configurati per un ambiente di sviluppo locale e **non sono
allineati con la configurazione di produzione su Render**.

In particolare:

- Le variabili d'ambiente sono gestite tramite il dashboard di Render
  e non tramite file `.env` inclusi nell'immagine
- Il frontend è buildato e servito staticamente da Express in produzione,
  mentre Docker si aspetta un processo separato
- La connessione a MongoDB Atlas richiede il flag `{ family: 4 }` (IPv4)
  che potrebbe non funzionare correttamente in alcuni ambienti Docker

> **Il metodo di deployment supportato e testato è esclusivamente Render.**
> Docker è presente nel repository come punto di partenza per sviluppi futuri
> ma non è stato validato in questa release.

---

## Come testare la release

1. Registrare un nuovo utente
2. Verificare email (link simulato o reale)
3. Effettuare login
4. Creare un'attività
5. Invitare un amico
6. Inserire una voce nel diario
7. Testare logout e refresh token

---

## Limitazioni note

| # | Limitazione | Impatto |
|---|-------------|---------|
| L1 | Il flusso OAuth completo non è coperto da test automatizzati | Basso — testato manualmente |
| L2 | `activityController` usa `req.user._id` in alcune funzioni e `req.userId` in altre | Medio — inconsistenza interna |
| L3 | `weatherController` dipende da un servizio meteo esterno senza fallback | Basso — gestito con try/catch |
| L4 | La verifica email non ha un meccanismo di re-invio con rate limiting | Basso |
| L5 | I token JWT non sono revocabili lato server (stateless) — il logout invalida solo il refresh cookie | Noto e documentato |
| L6 | Coverage controller ancora bassa | Miglioramento previsto nella prossima release |

---

*DoloMate — Ingegneria del Software, Università di Trento, A.A. 2025/2026*

## Demo

DoloMate: https://ingegneria-del-software-18.onrender.com

## Versione

Current version: **v3.15.0**

Semantic versioning adottato (MAJOR.MINOR.PATCH)

**Full Changelog**: https://github.com/AndreaDeCao/Ingegneria_del_software_18/compare/v3.0.0...v3.15.0
