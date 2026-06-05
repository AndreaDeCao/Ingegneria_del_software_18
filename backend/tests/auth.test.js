/**
 * DoloMate – Test Suite
 * Gruppo 18 | Sprint 1 + Sprint 2
 *
 * Il DB è un'istanza MongoDB in-memory: nessuna connessione al database Atlas reale
 * verifyTurnstile e requireCsrf disabilitati: nei test non esistono Cloudflare e cookie CSRF
 * emailService mockato: nessuna email viene spedita durante i test
 * Gli utenti creati per i test di login hanno emailVerified: true (bypass del flow email)
 */

"use strict";

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env.test") });

// Middleware disabilitati 
jest.mock("../middleware/verifyTurnstile", () => (_req, _res, next) => next());
jest.mock("../middleware/requireCsrf",     () => (_req, _res, next) => next());

// Servizio email mockato per evitare invii reali durante i test
jest.mock("../services/emailService", () => ({
  sendVerificationEmail:      jest.fn().mockResolvedValue(true),
  sendTemporaryPasswordEmail: jest.fn().mockResolvedValue(true),
}));

const request  = require("supertest");
const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const db = require("./helpers/db");
const { makeToken, makeAdminToken } = require("./helpers/tokens");

// app caricato dopo i mock, altrimenti i mock non vengono applicati
const app  = require("../index");
const User = require("../models/users");


beforeAll(async () => { await db.connect(); });
afterEach(async () => { await db.clearDatabase(); });
afterAll(async () => { await db.disconnect(); });

// Utente base con email già verificata, pronto per il login
async function createVerifiedUser(overrides = {}) {
  const hash = await bcrypt.hash("Pass123", 4);
  return User.create({
    nome: "Mario",
    cognome: "Rossi",
    email: "mario.rossi@example.com",
    nickname: "mario_r",
    passwordHash: hash,
    emailVerified: true,
    ...overrides,
  });
}

// Admin con email già verificata, pronto per il login
async function createAdminUser(overrides = {}) {
  const hash = await bcrypt.hash("Pass123", 4);
  return User.create({
    nome: "Admin",
    cognome: "DoloMate",
    email: "admin@example.com",
    nickname: "admin_dm",
    passwordHash: hash,
    emailVerified: true,
    role: "admin",
    ...overrides,
  });
}


// SPRINT 1 – REGISTRAZIONE

describe("TC01 – Registrazione con tutti i campi validi [EP - valida]", () => {
  test("risponde 201 con messaggio di conferma", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        nome: "Mario", cognome: "Rossi",
        email: "mario.rossi@example.com", nickname: "mario_r",
        password: "Pass123", confermaPassword: "Pass123",
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("message");
    expect(res.body.message).toMatch(/registrazione|email/i);
  });
});

describe("TC02 – Registrazione senza campo nome [EP - invalida]", () => {
  test("risponde 400 con 'Campi mancanti'", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        cognome: "Rossi", email: "mario.rossi@example.com",
        nickname: "mario_r", password: "Pass123", confermaPassword: "Pass123",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/campi mancanti/i);
  });
});

describe("TC03 – Registrazione senza campo cognome [EP - invalida]", () => {
  test("risponde 400 con 'Campi mancanti'", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        nome: "Mario", email: "mario.rossi@example.com",
        nickname: "mario_r", password: "Pass123", confermaPassword: "Pass123",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/campi mancanti/i);
  });
});

describe("TC04 – Email senza @ [EP - invalida]", () => {
  test("risponde 400 con 'Email non valida'", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        nome: "Mario", cognome: "Rossi",
        email: "mario.rossiexample.com", nickname: "mario_r",
        password: "Pass123", confermaPassword: "Pass123",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email non valida/i);
  });
});

describe("TC05 – Email > 60 caratteri [BVA - oltre limite superiore]", () => {
  test("risponde 400", async () => {
    // 55 'a' + '@a.com' = 61 caratteri, appena sopra il limite
    const longEmail = "a".repeat(55) + "@a.com";
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        nome: "Mario", cognome: "Rossi",
        email: longEmail, nickname: "mario_r",
        password: "Pass123", confermaPassword: "Pass123",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email non valida/i);
  });
});

describe("TC06 – Password < 6 caratteri [BVA - sotto limite inferiore]", () => {
  test("risponde 400", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        nome: "Mario", cognome: "Rossi",
        email: "mario@test.com", nickname: "mario_r",
        password: "Ab1", confermaPassword: "Ab1",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/password non valida/i);
  });
});

describe("TC07 – Password > 32 caratteri [BVA - oltre limite superiore]", () => {
  test("risponde 400", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        nome: "Mario", cognome: "Rossi",
        email: "mario@test.com", nickname: "mario_r",
        password: "Abcdefghijklmnopqrstuvwxyz1234567", // 33 caratteri
        confermaPassword: "Abcdefghijklmnopqrstuvwxyz1234567",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/password non valida/i);
  });
});

describe("TC08 – Password con spazi [EP - invalida]", () => {
  test("risponde 400", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        nome: "Mario", cognome: "Rossi",
        email: "mario@test.com", nickname: "mario_r",
        password: "Pass 123", confermaPassword: "Pass 123",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/password non valida/i);
  });
});

describe("TC09 – Password senza cifre [EP - invalida]", () => {
  test("risponde 400", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        nome: "Mario", cognome: "Rossi",
        email: "mario@test.com", nickname: "mario_r",
        password: "Passabcd", confermaPassword: "Passabcd",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/password non valida/i);
  });
});

describe("TC10 – Password senza lettere [EP - invalida]", () => {
  test("risponde 400", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        nome: "Mario", cognome: "Rossi",
        email: "mario@test.com", nickname: "mario_r",
        password: "123456", confermaPassword: "123456",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/password non valida/i);
  });
});

describe("TC11 – confermaPassword diversa dalla password [EG]", () => {
  test("risponde 400 con 'Le password non coincidono'", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        nome: "Mario", cognome: "Rossi",
        email: "mario@test.com", nickname: "mario_r",
        password: "Pass123", confermaPassword: "Pass999",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/password non coincidono/i);
  });
});

describe("TC12 – Email già registrata [EG]", () => {
  test("risponde 409", async () => {
    // Prima creiamo un utente con quella email
    await createVerifiedUser();

    const res = await request(app)
      .post("/api/auth/register")
      .send({
        nome: "Luigi", cognome: "Verdi",
        email: "mario.rossi@example.com", // stessa email di prima
        nickname: "luigi_v",
        password: "Pass123", confermaPassword: "Pass123",
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/email già registrata|email/i);
  });
});

describe("TC13 – Nickname già in uso [EG]", () => {
  test("risponde 409 con 'Nickname già in uso'", async () => {
    await createVerifiedUser();

    const res = await request(app)
      .post("/api/auth/register")
      .send({
        nome: "Luigi", cognome: "Verdi",
        email: "luigi.verdi@example.com",
        nickname: "mario_r", // stesso nickname di prima
        password: "Pass123", confermaPassword: "Pass123",
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/nickname già in uso/i);
  });
});

describe("TC14 – Password salvata come bcrypt hash [EP - sicurezza]", () => {
  test("nel DB il campo passwordHash inizia con $2b$ e non contiene la password in chiaro", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({
        nome: "Mario", cognome: "Rossi",
        email: "mario@test.com", nickname: "mario_x",
        password: "Pass123", confermaPassword: "Pass123",
      });

    // Leggiamo direttamente dal DB per verificare
    const user = await User.findOne({ email: "mario@test.com" }).select("+passwordHash");
    expect(user).not.toBeNull();
    expect(user.passwordHash).toMatch(/^\$2b\$/);
    expect(user.passwordHash).not.toContain("Pass123");
  });
});


// SPRINT 1 – LOGIN

describe("TC20 – Login con credenziali corrette [EP - valida]", () => {
  test("risponde 200 con accessToken e dati utente (senza passwordHash)", async () => {
    await createVerifiedUser();

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "mario.rossi@example.com", password: "Pass123" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body.user).toBeDefined();
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.body.user.email).toBe("mario.rossi@example.com");
  });
});

describe("TC21 – Login con password errata [EG]", () => {
  test("risponde 401 senza accessToken", async () => {
    await createVerifiedUser();

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "mario.rossi@example.com", password: "WrongPwd1" });

    expect(res.status).toBe(401);
    expect(res.body.accessToken).toBeUndefined();
  });
});

describe("TC22 – Login con email non registrata [EP - invalida]", () => {
  test("risponde 401", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nonexist@example.com", password: "Pass123" });

    expect(res.status).toBe(401);
  });
});

describe("TC23 – Login senza campo email [EP - invalida]", () => {
  test("risponde 400", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ password: "Pass123" });

    expect(res.status).toBe(400);
  });
});


// SPRINT 1 – SESSIONE E LOGOUT

describe("TC26 – GET /api/auth/me con token valido", () => {
  test("risponde 200 con i dati dell'utente", async () => {
    const user = await createVerifiedUser();
    const token = makeToken(user._id, "user");

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe("mario.rossi@example.com");
  });
});

describe("TC27 – GET /api/auth/me senza token [EP - invalida]", () => {
  test("il middleware blocca la richiesta con 401", async () => {
    const res = await request(app).get("/api/auth/me");

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/token mancante/i);
  });
});

describe("TC31 – Logout [EP - valida]", () => {
  test("risponde 200 con { ok: true }", async () => {
    const res = await request(app).post("/api/auth/logout");

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});


// SPRINT 1 – SICUREZZA

describe("TC33 – XSS nel campo nome [EG]", () => {
  test("il tag script viene salvato come stringa normale, non eseguito", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        nome: "<script>alert('xss')</script>",
        cognome: "Rossi",
        email: "xss@test.com",
        nickname: "xss_user",
        password: "Pass123",
        confermaPassword: "Pass123",
      });

    expect(res.status).toBe(201);

    const user = await User.findOne({ email: "xss@test.com" });
    expect(typeof user.nome).toBe("string");
    expect(user.nome).toContain("<script>");
  });
});

describe("TC34 – NoSQL Injection nel campo email [EG]", () => {
  // MongoDB non è vulnerabile a SQL injection.
  // Il test verifica che payload sospetti non espongano dati sensibili nella risposta.
  test("la registrazione non espone dati sensibili", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        nome: "Mario", cognome: "Rossi",
        email: "' OR '1'='1'--@test.com",
        nickname: "hacker1",
        password: "Pass123", confermaPassword: "Pass123",
      });

    expect(res.status).toBe(201);
    expect(res.body).not.toHaveProperty("passwordHash");
  });
});

describe("TC35 – Middleware blocca richiesta senza token [EP - invalida]", () => {
  test("risponde 401 su endpoint protetto", async () => {
    const res = await request(app).get("/api/auth/me");

    expect(res.status).toBe(401);
  });
});

describe("TC36 – passwordHash non esposto nella risposta di login [EP - sicurezza]", () => {
  test("il campo passwordHash è assente nel body della risposta", async () => {
    await createVerifiedUser();

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "mario.rossi@example.com", password: "Pass123" });

    expect(res.status).toBe(200);
    expect(res.body.user.passwordHash).toBeUndefined();
  });
});


// SPRINT 2 – TREK

const Trek = require("../models/treks");

describe("TC37 – GET /treks lista percorsi [EP - valida]", () => {
  test("risponde 200 con array di trek", async () => {
    const user = await createVerifiedUser();
    const token = makeToken(user._id);

    await Trek.create([
      { id: 1, name: "Monte Bondone", difficulty: "Facile", lengthKm: 5, duration: "2 ore", coordinates: { lat: 46.0, lng: 11.1 } },
      { id: 2, name: "Paganella",     difficulty: "Medio",  lengthKm: 8, duration: "3 ore", coordinates: { lat: 46.1, lng: 11.0 } },
    ]);

    const res = await request(app)
      .get("/treks")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
  });
});

describe("TC38 – GET /treks/99999 trek inesistente [EP - invalida]", () => {
  test("risponde 404 con 'Percorso non trovato'", async () => {
    const user = await createVerifiedUser();
    const token = makeToken(user._id);

    const res = await request(app)
      .get("/treks/99999")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/percorso non trovato/i);
  });
});

describe("TC39 – Votazione ai bordi: voto 1 e voto 5 [BVA]", () => {
  // Testiamo entrambi i valori limite in un colpo solo con test.each
  test.each([1, 5])("voto %i → risponde 200 con averageRating", async (vote) => {
    const user = await createVerifiedUser();
    const token = makeToken(user._id);

    await Trek.create({
      id: 1, name: "Monte Bondone", difficulty: "Facile",
      lengthKm: 5, duration: "2 ore",
      coordinates: { lat: 46.0, lng: 11.1 },
    });

    const res = await request(app)
      .put("/treks/1/rate")
      .set("Authorization", `Bearer ${token}`)
      .send({ vote });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("averageRating");
  });
});

describe("TC40 – Votazione fuori range: voto 0 e voto 6 [BVA - fuori bordi]", () => {
  test.each([0, 6])("voto %i → risponde 400", async (vote) => {
    const user = await createVerifiedUser();
    const token = makeToken(user._id);

    const res = await request(app)
      .put("/treks/1/rate")
      .set("Authorization", `Bearer ${token}`)
      .send({ vote });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/non valido/i);
  });
});

describe("TC41 – Admin non può votare un percorso [EG]", () => {
  test("risponde 403", async () => {
    const admin = await createAdminUser();
    const token = makeAdminToken(admin._id);

    await Trek.create({
      id: 1, name: "Monte Bondone", difficulty: "Facile",
      lengthKm: 5, duration: "2 ore",
      coordinates: { lat: 46.0, lng: 11.1 },
    });

    const res = await request(app)
      .put("/treks/1/rate")
      .set("Authorization", `Bearer ${token}`)
      .send({ vote: 4 });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/admin non possono votare/i);
  });
});


// SPRINT 2 – DIARIO

describe("TC42 – Creazione voce diario con campi validi [EP - valida]", () => {
  test("risponde 201 con la voce creata", async () => {
    const user = await createVerifiedUser();
    const token = makeToken(user._id);

    const res = await request(app)
      .post("/api/diary")
      .set("Authorization", `Bearer ${token}`)
      .send({ titolo: "Escursione Monte Bondone", data: "2025-06-01", completato: true });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("_id");
    expect(res.body.titolo).toBe("Escursione Monte Bondone");
  });
});

describe("TC43 – Creazione voce diario senza titolo [EP - invalida]", () => {
  test("risponde 400 per campo obbligatorio mancante", async () => {
    const user = await createVerifiedUser();
    const token = makeToken(user._id);

    const res = await request(app)
      .post("/api/diary")
      .set("Authorization", `Bearer ${token}`)
      .send({ data: "2025-06-01", completato: true });

    expect(res.status).toBe(400);
  });
});


// SPRINT 2 – AMICIZIE

describe("TC44 – Richiesta di amicizia a sé stessi [EG]", () => {
  test("risponde 400 con messaggio esplicativo", async () => {
    const user = await createVerifiedUser();
    const token = makeToken(user._id);

    const res = await request(app)
      .post(`/api/friendships/request/${user._id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/a te stesso/i);
  });
});

describe("TC45 – Accettazione richiesta da parte del sender (non del receiver) [EP - invalida]", () => {
  test("risponde 403 'Non autorizzato'", async () => {
    const sender   = await createVerifiedUser();
    const receiver = await createVerifiedUser({
      email: "receiver@example.com",
      nickname: "receiver_user",
    });

    const senderToken = makeToken(sender._id);

    // Il sender manda la richiesta al receiver
    const sendRes = await request(app)
      .post(`/api/friendships/request/${receiver._id}`)
      .set("Authorization", `Bearer ${senderToken}`);

    const friendshipId = sendRes.body.friendship?._id;
    expect(friendshipId).toBeDefined();

    // Il sender prova ad accettare la sua stessa richiesta — non dovrebbe poterlo fare
    const res = await request(app)
      .put(`/api/friendships/accept/${friendshipId}`)
      .set("Authorization", `Bearer ${senderToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/non autorizzato/i);
  });
});


// SPRINT 2 – ADMIN

describe("TC46 – Sospensione con giorni non validi: 0 e -5 [EG + BVA]", () => {
  test.each([0, -5])("days=%i → risponde 400", async (days) => {
    const admin  = await createAdminUser();
    const target = await createVerifiedUser();
    const token  = makeAdminToken(admin._id);

    const res = await request(app)
      .patch(`/api/admin/users/${target._id}/suspend`)
      .set("Authorization", `Bearer ${token}`)
      .send({ days });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/giorni non valido/i);
  });
});

describe("TC-extra – Sospensione di un utente già bannato [EG]", () => {
  test("risponde 400 'Utente già bannato'", async () => {
    const admin  = await createAdminUser();
    const target = await createVerifiedUser({ isBanned: true });
    const token  = makeAdminToken(admin._id);

    const res = await request(app)
      .patch(`/api/admin/users/${target._id}/suspend`)
      .set("Authorization", `Bearer ${token}`)
      .send({ days: 3 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/già bannato/i);
  });
});

describe("TC-search – Ricerca utenti con query di 1 carattere [BVA - sotto limite]", () => {
  test("risponde 400 perché servono almeno 2 caratteri", async () => {
    const user  = await createVerifiedUser();
    const token = makeToken(user._id);

    const res = await request(app)
      .get("/api/friendships/search?q=a")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/2 caratteri/i);
  });
});
