export type SafeUser = {
  _id: string;
  nome: string;
  cognome: string;
  email: string;
  nickname: string;
  role: "user" | "admin";
  favoriteTreks: string[]; // Array di ID dei trek preferiti
  avatarUrl: string | null;
};

export type LoginRequest = {
  email: string;
  password: string;
  turnstileToken: string; // aggiunto campo per il token del captcha di Cloudflare Turnstile
};

export type RegisterRequest = {
  nome: string;
  cognome: string;
  email: string;
  nickname: string;
  password: string;
  confermaPassword: string;
  turnstileToken: string; // aggiunto campo per il token del captcha di Cloudflare Turnstile
};

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

let accessToken: string | null = null; // Variabile globale per memorizzare il token JWT
export const setAccessToken = (t: string | null) => { accessToken = t; }; // Funzione per aggiornare il token JWT memorizzato

let csrfToken: string | null = null;
export const setCsrfToken = (t: string | null) => { csrfToken = t; };
let csrfTokenPromise: Promise<string> | null = null;
let refreshTokenPromise: Promise<string | null> | null = null;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  const cookie = document.cookie
    .split("; ")
    .find((part) => part.startsWith(prefix));
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null;
}

// async function ensureCsrfToken(): Promise<string> {
//   const cookieToken = readCookie("csrf_token");
//   if (cookieToken) {
//     csrfToken = cookieToken;
//     return cookieToken;
//   }
//   if (csrfToken) return csrfToken;
//   if (csrfTokenPromise) return csrfTokenPromise;

//   csrfTokenPromise = (async () => {
//     const res = await fetch(`${API_BASE}/api/auth/csrf`, {
//       method: "GET",
//       credentials: "include",
//     });

//     if (!res.ok) throw new Error("Impossibile ottenere CSRF token");
//     const data = (await res.json()) as { csrfToken?: unknown };
//     if (typeof data.csrfToken !== "string" || !data.csrfToken) {
//       throw new Error("CSRF token non valido");
//     }

//     csrfToken = data.csrfToken;
//     return csrfToken;
//   })().finally(() => {
//     csrfTokenPromise = null;
//   });

//   return csrfTokenPromise;
// }
async function ensureCsrfToken(): Promise<string> {
  // RIMOSSO: readCookie non funziona cross-origin
  if (csrfToken) return csrfToken;
  if (csrfTokenPromise) return csrfTokenPromise;

  csrfTokenPromise = (async () => {
    const res = await fetch(`${API_BASE}/api/auth/csrf`, {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Impossibile ottenere CSRF token");
    const data = (await res.json()) as { csrfToken?: unknown };
    if (typeof data.csrfToken !== "string" || !data.csrfToken) {
      throw new Error("CSRF token non valido");
    }
    csrfToken = data.csrfToken;
    return csrfToken;
  })().finally(() => {
    csrfTokenPromise = null;
  });

  return csrfTokenPromise;
}

async function requestRefreshAccessToken(): Promise<string | null> {
  const refresh = (token: string) => fetch(`${API_BASE}/api/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: { "X-CSRF-Token": token },
  });

  let token = await ensureCsrfToken();
  let res = await refresh(token);

  if (res.status === 403) {
    csrfToken = null;
    token = await ensureCsrfToken();
    res = await refresh(token);
  }

  if (!res.ok) {
    accessToken = null;
    return null;
  }

  const data = (await res.json()) as { accessToken?: unknown };
  accessToken = typeof data.accessToken === "string" ? data.accessToken : null;
  return accessToken;
}

export async function refreshAccessToken(): Promise<string | null> {
  if (!refreshTokenPromise) {
    refreshTokenPromise = requestRefreshAccessToken().finally(() => {
      refreshTokenPromise = null;
    });
  }

  return refreshTokenPromise;
}


// Funzione helper per fare richieste HTTP al backend, gestendo automaticamente i cookie e gli errori
export async function http<T>(path: string, init?: RequestInit/*, _retried = false*/): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init, //Prima parto dai default del chiamante, poi impongo le regole obbligatorie personali
    credentials: "include",
    headers: {
      "Content-Type": "application/json", 
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}), // Se accessToken è presente, aggiungiamo l'header Authorization con il token JWT
      ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
      ...(init?.headers ?? {}),// Includiamo eventuali header aggiuntivi passati tramite init
    },
    // _retried = false
  });

  const isAuthEndpoint = path.includes("/auth/login") || path.includes("/auth/register") || path.includes("/auth/refresh");

  // token scaduto --> prova a rinnovarlo e riprova la richiesta
  // if (res.status === 401 && !path.includes("/auth/refresh")) { //problema con login
  // if (res.status === 401 && !path.includes("/auth/refresh") && !path.includes("/auth/login")) { possibile problema con registrazione
  if (res.status === 401 && !isAuthEndpoint && accessToken) { //no problemi con refresh, login e register
    const refreshedToken = await refreshAccessToken().catch(() => null);
    if (refreshedToken) {
      return http<T>(path, init/*, true*/); // riprova con il nuovo token //aggiunto flag per evitare loop infiniti di refresh
    }

    throw new Error("Sessione scaduta");
  }

  if (res.status === 403) {
    const text = await res.text().catch(() => "");
    try {
      const data = JSON.parse(text) as { error?: string; message?: string; suspendedUntil?: string };
      if (data.error === "banned") {
        window.dispatchEvent(new CustomEvent("auth:banned", { detail: { message: data.message } }));
        throw new Error(data.message ?? "Account bannato");
      }
      if (data.error === "suspended") {
        window.dispatchEvent(new CustomEvent("auth:suspended", { detail: { message: data.message, suspendedUntil: data.suspendedUntil } }));
        throw new Error(data.message ?? "Account sospeso");
      }
    } catch {
      // ignora parse errors
    }
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");

    // Prova a estrarre un messaggio "pulito" da risposte JSON del backend tipo:
    // { "error": "Credenziali non valide" }
    let message: string | null = null;
    try {
      const trimmed = text.trim();
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        const data = JSON.parse(trimmed) as { error?: unknown; message?: unknown };
        const candidate =
          typeof data?.error === "string"
            ? data.error
            : typeof data?.message === "string"
              ? data.message
              : null;
        if (candidate) message = candidate;
      }
    } catch {
      // ignore JSON parse errors
    }

    if (!message) {
      const trimmed = text.trim();
      const looksLikeHtml = trimmed.startsWith("<") || /<html/i.test(trimmed) || /<body/i.test(trimmed);
      const isExpressPostError = /Cannot\s+POST\s+/i.test(trimmed) || /Cannot\s+GET\s+/i.test(trimmed);
      if (isExpressPostError) {
        message = "Endpoint non trovato o metodo non valido. Verifica l'URL e riprova.";
      } else if (looksLikeHtml) {
        message = res.status === 404
          ? "Endpoint non trovato. Verifica l'URL e riprova."
          : "Errore di comunicazione con il server. Riprova più tardi.";
      } else if (res.status >= 500) {
        message = "Errore del server. Riprova più tardi.";
      } else {
        message = text || `HTTP ${res.status}`;
      }
    }

    throw new Error(message);
  }

  return (await res.json()) as T;
}



interface AuthAPI<T>{
  user: T | null;
  accessToken?: string; // aggiunto accessToken alla risposta dell'API di autenticazione per memorizzarlo e usarlo per richieste future
}

export const authApi = {
  // me: () => http<{ user: SafeUser | null }>("/api/auth/me"),
  me: () => http<AuthAPI<SafeUser>>("/api/auth/me"),

  login: (body: LoginRequest) =>
    http<AuthAPI<SafeUser>>("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),
  register: (body: RegisterRequest) =>
    http<AuthAPI<SafeUser>>("/api/auth/register", { method: "POST", body: JSON.stringify(body) }),
  requestTemporaryPassword: (body: { email: string; turnstileToken: string }) =>
    http<{ message: string }>("/api/auth/request-temp-password", { method: "POST", body: JSON.stringify(body) }),
  logout: async () => {
    const token = await ensureCsrfToken();
    return http<AuthAPI<SafeUser>>("/api/auth/logout", { method: "POST", headers: { "X-CSRF-Token": token } });
  },
};
