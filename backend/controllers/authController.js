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



//Github OAuth2 login/registration handler

// Il flusso è simile a quello di Google, ma con alcune differenze specifiche di GitHub:
// 1. Il frontend reindirizza l'utente a /auth/github, che costruisce l'URL di autorizzazione di GitHub e reindirizza l'utente lì.
// 2. L'utente concede i permessi su GitHub e viene reindirizzato a /auth/github/callback con un "code" temporaneo.
// 3. Il backend scambia il "code" con GitHub per ottenere un access_token.
// 4. Con l'access_token, il backend recupera i dati dell'utente da GitHub (compresa l'email).
// 5. Il backend cerca un utente con quel githubId o email, lo crea se non esiste, e restituisce un token JWT al frontend.
exports.githubRedirect = (req, res) => {
  const state = Math.random().toString(36).slice(2);

  res.cookie("oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 5 * 60 * 1000, // 5 minuti
  });

  const url = new URL("https://github.com/login/oauth/authorize"); // URL di autorizzazione di GitHub
  url.searchParams.set("client_id", process.env.GITHUB_CLIENT_ID);
  url.searchParams.set("redirect_uri", process.env.GITHUB_REDIRECT_URI);
  url.searchParams.set("scope", "read:user user:email");            // scope minimo per leggere dati utente e email //TODO: si possono aggiungere altri scope se servono più permessi
  url.searchParams.set("state", state);                             // parametro anti-CSRF, deve essere lo stesso che salviamo nel cookie

  res.redirect(url.toString());                                     // reindirizza l'utente a GitHub per autorizzare l'applicazione
};

// Handler per il callback di GitHub dopo l'autorizzazione dell'utente
exports.githubCallback = async (req, res) => {
  try {
    const { code, state } = req.query;

    // Verifica anti-CSRF — stesso cookie usato da Google
    const savedState = req.cookies?.oauth_state;
    res.clearCookie("oauth_state"); //FIXME: controllare clearCookie, forse è clearAuth
    if (!state || state !== savedState) {
      return res.status(403).json({ error: "State non valido" });
    }

    // Scambia code con GitHub per ottenere access_token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",                         // senza questo GitHub risponde in plain text
      },
      body: new URLSearchParams({
        code,
        client_id:     process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        redirect_uri:  process.env.GITHUB_REDIRECT_URI,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      return res.status(400).json({ error: "Errore scambio token con GitHub: " + err });
    }

    const { access_token } = await tokenRes.json();

    // Recupera dati utente da GitHub con l'access_token
    const userRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const githubUser = await userRes.json();

    // GitHub non garantisce l'email nel profilo pubblico — va chiesta separatamente
    const emailsRes = await fetch("https://api.github.com/user/emails", {
      headers: { Authorization: `Bearer ${access_token}` }, // stessa autorizzazione del token di accesso, perché è lo stesso token
    });

    const emails = await emailsRes.json(); //ritorna un array di oggetti con le email dell'utente, ognuno con campi "email", "primary", "verified". Dobbiamo trovare quella primaria e verificata da usare come email dell'utente nel nostro sistema
    const primaryEmail = emails.find((e) => e.primary && e.verified)?.email; //se non c'è un'email primaria e verificata, non possiamo registrare l'utente, perché ci serve un'email unica per identificare l'utente nel nostro sistema

    if (!primaryEmail) {
      return res.status(400).json({ error: "Nessuna email verificata su GitHub" });
    }


    const githubId = githubUser.id.toString();  // GitHub ID unico dell'utente, usato per identificare l'utente se si è registrato con GitHub OAuth2
    const nome     = githubUser.name?.split(" ")[0] ?? githubUser.login; //se il nome completo è disponibile, prendo la prima parola come nome, altrimenti uso il login di GitHub (che è sempre disponibile) come nome
    const cognome  = githubUser.name?.split(" ").slice(1).join(" ") ?? ""; //se il nome completo è disponibile, prendo tutto tranne la prima parola come cognome, altrimenti lascio il cognome vuoto, perché non abbiamo altre informazioni sul nome dell'utente da GitHub

    
    // Trova o crea user — stesso pattern di Google
    let user = await User.findOne({ githubId });

    if (!user) {
      user = await User.findOne({ email: primaryEmail });

      if (user) {
        // Email già in uso — collega account GitHub
        user.githubId = githubId;
        await user.save();
      } else {
        // Nuovo utente
        const nickname = githubUser.login + Math.random().toString(36).slice(2, 6);
        user = await User.create({ nome, cognome, email: primaryEmail, nickname, githubId });
      }
    }

    const accessToken = setAuth(res, user._id);

    const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";
    res.redirect(`${frontendUrl}/auth/callback?accessToken=${accessToken}`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};