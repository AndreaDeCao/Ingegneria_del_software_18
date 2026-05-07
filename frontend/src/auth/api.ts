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
};

export type RegisterRequest = {
  nome: string;
  cognome: string;
  email: string;
  nickname: string;
  password: string;
};

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

// const reqBody: RequestInit = {
//   body: JSON.stringify({ email: "", password: "" }),
//   headers: { "Content-Type": "application/json" },
// }

// http<string>("/api/auth/login", reqBody);

// Funzione helper per fare richieste HTTP al backend, gestendo automaticamente i cookie e gli errori
async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }

  return (await res.json()) as T;
}



interface AuthAPI<T>{
  user: T | null;
}

export const authApi = {
  // me: () => http<{ user: SafeUser | null }>("/api/auth/me"),
  me: () => http<AuthAPI<SafeUser>>("/api/auth/me"),

  login: (body: LoginRequest) =>
    http<AuthAPI<SafeUser>>("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),
  register: (body: RegisterRequest) =>
    http<AuthAPI<SafeUser>>("/api/auth/register", { method: "POST", body: JSON.stringify(body) }),
  logout: () => http<AuthAPI<SafeUser>>("/api/auth/logout", { method: "POST" }),
};

