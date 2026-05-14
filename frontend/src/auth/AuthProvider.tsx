import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { LoginRequest, RegisterRequest, SafeUser } from "./api";
import { authApi } from "./api";
import { setAccessToken } from "./api";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

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
    fetch(`${API_BASE}/api/auth/refresh`, { // endpoint per rinnovare l'access token usando il refresh token 
      method: "POST",
      credentials: "include",
    })
      .then((r) => {
        // console.log("refresh status:", r.status);   //debug
        return r.ok ? r.json() : Promise.reject(`refresh failed: ${r.status}`); // se la risposta non è ok, rifiuta la promessa con un messaggio di errore che include lo status code, in modo da poterlo vedere nei log di debug
      })
      .then((data) => {
        // console.log("refresh ok, token:", data.accessToken);    //debug
        setAccessToken(data.accessToken);
      })
      .catch((e) => {
        // console.log("refresh error:", e); //debug
        // nessun refresh token valido, utente non loggato
      })
      .finally(() => {
        authApi
          .me()
          .then((r) => {
            // console.log("me ok:", r.user);  //debug
            setUser(r.user);
          })
          .catch((e) => {
            // console.log("me error:", e);  //debug
            setUser(null);
          })
          .finally(() => setLoading(false));
      });
      
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

