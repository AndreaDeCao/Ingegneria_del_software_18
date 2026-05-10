const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/users");

function getJwtSecret() {
  // const secret = process.env.JWT_SECRET; //obsoleto, non usato più, sostituito da JWT_ACCESS_SECRET e JWT_REFRESH_SECRET
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET non configurata in backend/.env");
  return secret;
}

function getJwtRefreshSecret() {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error("JWT_REFRESH_SECRET non configurata in backend/.env");
  return secret;
}

function safeUser(userDoc) {
  return {
    _id: userDoc._id,
    nome: userDoc.nome,
    cognome: userDoc.cognome,
    email: userDoc.email,
    nickname: userDoc.nickname,
  };
}

// Setta il refresh token in un cookie httpOnly e restituisce l'access token nel body
function setAuth(res, userId) {
  const accessToken = jwt.sign(
    { sub: userId.toString() },
    getJwtSecret(),
    { expiresIn: "15m" }
  );
 
  const refreshToken = jwt.sign(
    { sub: userId.toString() },
    getJwtRefreshSecret(),
    { expiresIn: "1h" }
  );
 
  // Refresh token → cookie httpOnly (invisibile a JS)
  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 1000, // 1 ora
    path: "/auth/refresh", // cookie inviato SOLO a questo endpoint
  });
 
  // Access token → restituito nel body, il frontend lo tiene in memoria
  return accessToken;
}

// Rimuove il refresh token dal cookie
function clearAuth(res) {
  res.clearCookie("refresh_token", {
    httpOnly: true,
    sameSite: "lax",
    path: "/auth/refresh",
  });
}

//vecchia versione con cookie, sostituida con setAuth e clearAuth che usano refresh token nei cookie e access token nell'header Authorization, ibrido
// function setAuthCookie(res, token) {
//   res.cookie("token", token, {
//     httpOnly: true,
//     sameSite: "lax",
//     secure: process.env.NODE_ENV === "production",
//     maxAge: 7 * 24 * 60 * 60 * 1000, 
//   });
// }

// // vecchia versione con token singolo, sostituito con refresh token e aggiunto eprcorso di refresh token
// function clearAuthCookie(res) {
//   res.clearCookie("token", { httpOnly: true, sameSite: "lax" });
// }

exports.register = async (req, res) => {
  try {
    //serve per configurare il numero di round di salatura per bcrypt, default 15
    const saltedRound = process.env.SALT_ROUNDS ? parseInt(process.env.SALT_ROUNDS) : 15; 

    const { nome, cognome, email, nickname, password } = req.body ?? {};

    if (!nome || !cognome || !nickname || !password || !email) {
      return res.status(400).json({ error: "Campi mancanti" });
    }
    if(typeof email !== "string" || !email.includes("@") || email.length > 60){
      return res.status(400).json({ error: "Email non valida" });
    }
    if (typeof password !== "string" || password.length < 6 || password.length > 32 || password.includes(" ") || !password.match(/[0-9]/) || !password.match(/[a-zA-Z]/) ) {
      return res.status(400).json({ error: "Password non valida, la password deve essere compresa tra 6 e 32 caratteri e contenere almeno un numero, una lettera maiuscola, una lettera minuscola. "});
    }

    const existsEmail = await User.findOne({  email });
    if (existsEmail) return res.status(409).json({ error: "Email già in uso" });
    // exists = await User.findOne({ $or: [{ email }, { nickname }] });
    // exists = false;
    const existsNickname = await User.findOne({ nickname });
    if (existsNickname) return res.status(409).json({ error: "Nickname già in uso" });

    const passwordHash = await bcrypt.hash(password, saltedRound);
    const user = await User.create({ nome, cognome, email, nickname, passwordHash });

    // const token = jwt.sign({ sub: user._id.toString() }, getJwtSecret(), { expiresIn: "1h" });
    // setAuthCookie(res, token); 
    const accessToken = setAuth(res, user._id);

    res.status(201).json({ user: safeUser(user), accessToken }); 


  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body ?? {}; //se email o password sono undefined, li sostituisce con stringa vuota per evitare errori di bcrypt.compare che si aspetta stringhe

    if (!email || !password) return res.status(400).json({ error: "Email/password mancanti" });

    
    //controllo se esiste un utente con quella mail e se ha una passwordhash associata (se non ce l'ha vuol dire che è stato creato con un metodo di registrazione diverso o che c'è sato un errore e quindi non si può loggare con questo metodo)
    const user = await User.findOne({ email }).select("+passwordHash");//seleziono anche passwordHash, che di default è select: false nello schema

    if (!user || !user.passwordHash) return res.status(401).json({ error: "Credenziali non valide" });

    const pwdcompare = await bcrypt.compare(password, user.passwordHash); //confronta la password in chiaro con l'hash salvato nel database, restituisce true se corrispondono, false altrimenti
    if (!pwdcompare) return res.status(401).json({ error: "Credenziali non valide" });

    //creo il token jwt con come payload l'id dell'utente (sotto la chiave "sub", che sta per "subject") 
    // const token = jwt.sign({ sub: user._id.toString() }, getJwtSecret(), { expiresIn: "7d" });

    //vecchia versione

    // const token = jwt.sign({ sub: user._id.toString(), name: user.nome }, getJwtSecret(), { expiresIn: "1h" });
    // setAuthCookie(res, token); //vecchuia versione con cookie
    // setAuth(res, token); 

    const accessToken = setAuth(res, user._id); //nuova versione con refresh token nei cookie e access token nell'header Authorization

    // c'era un return dopo res.json() — il codice dopo non veniva mai eseguito
    res.json({ user: safeUser(user), accessToken }); //manda i dati dell'utente (senza passwordHash) e il token di accesso al client, che lo salverà e lo userà per autenticarsi nelle richieste future

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.logout = async (req, res) => {
  // clearAuthCookie(res);
  clearAuth(res); 
  res.json({ ok: true });
};


exports.refresh = (req, res) => {
  const token = req.cookies?.refresh_token;
  if (!token) return res.status(401).json({ error: "Refresh token mancante" });

  try {
    const payload = jwt.verify(token, getJwtRefreshSecret());
    const accessToken = jwt.sign(
      { sub: payload.sub },
      getJwtSecret(),
      { expiresIn: "15m" }
    );
    res.json({ accessToken });
  } catch {
    res.status(401).json({ error: "Refresh token non valido o scaduto" });
  }
};

/**
 * FUNZIONE PER OTTENERE I DATI DELL'UTENTE LOGGATO
 * Aggiornata: legge userId dal middleware authenticate invece che dal cookie
 */
exports.me = async (req, res) => {
  try {
    //vecchia versione

    // const token = req.cookies?.token;
    // if (!token) return res.json({ user: null });
    // const payload = jwt.verify(token, getJwtSecret());
    // const userId = payload?.sub;

    const userId = req.userId; //req.userId è settato dal middleware authenticate (vedi authenticate.js)
    if (!userId) return res.json({ user: null });

    const user = await User.findById(userId);
    if (!user) return res.json({ user: null });

    res.json({ user: safeUser(user) });
  } catch {
    res.json({ user: null });
  }
};


const {OAuth2Client } = require("google-auth-library");

/**
 * Client OAuth2 di Google (per verificare id_token )
 * dopo il login. Viene inizializzato con il GOOGLE_CLIENT_ID dal file .env
 */
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Reindirizza il browser dell'utente verso la pagina di login di Google.
 * Genera un parametro `state` casuale e lo salva in un cookie httpOnly per prevenire attacchi CSRF sul callback.
 *
 * @route GET /api/auth/google
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.googleRedirect = (req, res) => {
  const state = Math.random().toString(36).slice(2);  //Token anti CSRF casuale

  //Salva state in un cookie per verificarlo nel callback
  res.cookie("oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 5 * 60 * 1000,                             //5 min
    path: "/"
  });


//URL autorizzazione Google coi parametri richiesti
const url= new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID);
  url.searchParams.set("redirect_uri", process.env.GOOGLE_REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile"); 
  url.searchParams.set("state", state);

  res.redirect(url.toString());
};

/**
 * Callback chiamato da Google dopo il login dell'utente.
 * Riceve l'autorizzazione, lo scambia con Google per ottenere
 * l'id_token, lo verifica e trova o crea l'utente nel database.
 * Alla fine reindirizza al frontend con l'accessToken nell'URL.
 *
 * @route GET /api/auth/google/callback
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
exports.googleCallback = async(req, res) => {
  try {
    const { code, state } = req.query;

    //Verifica anti-CSRF: devo avere state ricevuto = state nel cookie
    const savedState = req.cookies?.oauth_state;

    res.clearCookie("oauth_state");
    if(!state || state !== savedState) {
      return res.status(403).json({ error: "State non valido" });
    }

    //Scambia autorizzazione (code) con Google per ottenere i token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id:     process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri:  process.env.GOOGLE_REDIRECT_URI,
        grant_type:    "authorization_code",
      }),
    });

    if(!tokenRes.ok) {
      const err = await tokenRes.text();
      return res.status(400).json({ error: "Errore scambio token con Google: " + err });
    }

    const {id_token} = await tokenRes.json();

    //Verifica validità id_token
    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    //Estrae dati dello user dal payload dell'id_token
    const payload = ticket.getPayload();
    const googleId = payload.sub;
    const email    = payload.email;
    const nome     = payload.given_name  ?? payload.name ?? "Utente";
    const cognome  = payload.family_name ?? "";

    //Trova o crea user nel database
    let user = await User.findOne({ googleId });

    if(!user) {
      user = await User.findOne({ email });

      if(user) {
        //Email già usata
        user.googleId = googleId;
        await user.save();
      } else {
        //Nuovo user (nickanme partendo dall'email)
        const nickname = email.split("@")[0] + Math.random().toString(36).slice(2, 6);
        user = await User.create({ nome, cognome, email, nickname, googleId });
      }
    }

    //Crea access e refresh token
    const accessToken = setAuth(res, user._id);

    //Reinderizza al frontend
    const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";
    res.redirect(`${frontendUrl}/auth/callback?accessToken=${accessToken}`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


