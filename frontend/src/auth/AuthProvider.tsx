import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { LoginRequest, RegisterRequest, SafeUser } from "./api";
import { authApi } from "./api";
import { setAccessToken } from "./api";

type AuthContextValue = {
  user: SafeUser | null;
  loading: boolean;
  login: (req: LoginRequest) => Promise<void>;
  register: (req: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
};



const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    authApi
      .me()
      .then((r) => setUser(r.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      // login: async (req) => {
      //   const r = await authApi.login(req);
      //   setUser(r.user);
      // },
      // register: async (req) => {
      //   const r = await authApi.register(req);
      //   setUser(r.user);
      // },
      // logout: async () => {
      //   await authApi.logout();
      //   setUser(null);
      // },
      // login
      login: async (req) => {
        const r = await authApi.login(req);
        setAccessToken(r.accessToken ?? null); // salva il token JWT restituito dall'API di login in memoria
        setUser(r.user);      
      },

      // register
      register: async (req) => {
        const r = await authApi.register(req);
        setAccessToken(r.accessToken ?? null); // salva il token JWT restituito dall'API di registrazione in memoria
        setUser(r.user);
      },

      // logout
      logout: async () => {
        await authApi.logout();
        setAccessToken(null); // pulisce il token JWT memorizzato in memoria quando l'utente effettua il logout
        setUser(null);
      },
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

