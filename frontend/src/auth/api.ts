export type SafeUser = {
  _id: string;
  nome: string;
  cognome: string;
  email: string;
  nickname: string;
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

async function ensureCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;

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
}


// Funzione helper per fare richieste HTTP al backend, gestendo automaticamente i cookie e gli errori
async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json", 
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}), // Se accessToken è presente, aggiungiamo l'header Authorization con il token JWT
      ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
      ...(init?.headers ?? {}),// Includiamo eventuali header aggiuntivi passati tramite init
    },
    ...init,
  });

  const isAuthEndpoint = path.includes("/auth/login") || path.includes("/auth/register") || path.includes("/auth/refresh");

  // token scaduto --> prova a rinnovarlo e riprova la richiesta
  // if (res.status === 401 && !path.includes("/auth/refresh")) { //problema con login
  // if (res.status === 401 && !path.includes("/auth/refresh") && !path.includes("/auth/login")) { possibile problema con registrazione
  if (res.status === 401 && !isAuthEndpoint) { //no problemi con refresh, login e register
    const token = await ensureCsrfToken().catch(() => null);
    const refreshed = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: token ? { "X-CSRF-Token": token } : undefined,
    });

    if (refreshed.ok) {
      const data = await refreshed.json();
      accessToken = data.accessToken;

      return http<T>(path, init); // riprova con il nuovo token
    } else {
      accessToken = null;

      throw new Error("Sessione scaduta");
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
      if (res.status >= 500) message = "Errore del server. Riprova più tardi.";
      else message = text || `HTTP ${res.status}`;
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
  logout: async () => {
    const token = await ensureCsrfToken();
    return http<AuthAPI<SafeUser>>("/api/auth/logout", { method: "POST", headers: { "X-CSRF-Token": token } });
  },
};
