import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { LoginRequest, RegisterRequest, SafeUser } from "./api";
import { authApi, refreshAccessToken, setAccessToken } from "./api";
import styles from "./BanModal.module.css";

type AuthContextValue = {
  user: SafeUser | null;
  loading: boolean;
  login: (req: LoginRequest) => Promise<void>;
  register: (req: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const SESSION_REFRESH_INTERVAL_MS = 10 * 1000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const token = await refreshAccessToken();
        if (!token) {
          if (!cancelled) setUser(null);
          return;
        }

        const r = await authApi.me();
        if (!cancelled) {
          if (r.user) {
            setUser(r.user);
          }
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user || loading) return;

    let lastRefresh = 0;
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    const keepSessionAlive = (force = false) => {
      const now = Date.now();
      if (!force && now - lastRefresh < SESSION_REFRESH_INTERVAL_MS) return;
      lastRefresh = now;
      refreshAccessToken().catch(() => {
        // La prossima chiamata protetta gestira' l'eventuale sessione scaduta.
      });
    };

    const handleActivity = () => keepSessionAlive(false);
    const handleNavigation = () => keepSessionAlive(true);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") keepSessionAlive(true);
    };

    window.history.pushState = function (...args) {
      const result = originalPushState.apply(this, args);
      window.dispatchEvent(new Event("app:navigation"));
      return result;
    };

    window.history.replaceState = function (...args) {
      const result = originalReplaceState.apply(this, args);
      window.dispatchEvent(new Event("app:navigation"));
      return result;
    };

    const events = ["click", "pointerdown", "keydown", "touchstart", "submit"];
    events.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity, { capture: true, passive: true });
    });
    window.addEventListener("focus", handleNavigation);
    window.addEventListener("popstate", handleNavigation);
    window.addEventListener("app:navigation", handleNavigation);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    keepSessionAlive(true);

    return () => {
      events.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity, { capture: true });
      });
      window.removeEventListener("focus", handleNavigation);
      window.removeEventListener("popstate", handleNavigation);
      window.removeEventListener("app:navigation", handleNavigation);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, [user, loading]);

  const [banStatus, setBanStatus] = useState<{
    type: "banned" | "suspended";
    message: string;
    suspendedUntil?: string;
  } | null>(null);

  useEffect(() => {
    function handleBanned(e: Event) {
      const detail = (e as CustomEvent).detail as { message?: string };
      setBanStatus({ 
        type: "banned",
        message: detail.message ?? "Il tuo account è stato bannato." 
      });
      setAccessToken(null);
      setUser(null);
    }

    function handleSuspended(e: Event) {
      const detail = (e as CustomEvent).detail as { message?: string; suspendedUntil?: string };
      setBanStatus({ 
        type: "suspended", 
        message: detail.message ?? "Il tuo account è sospeso.", 
        suspendedUntil: detail.suspendedUntil 
      });
      setAccessToken(null);
      setUser(null);
    }

    window.addEventListener("auth:banned", handleBanned);
    window.addEventListener("auth:suspended", handleSuspended);
    return () => {
      window.removeEventListener("auth:banned", handleBanned);
      window.removeEventListener("auth:suspended", handleSuspended);
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,

      login: async (req) => {
        const r = await authApi.login(req);
        setAccessToken(r.accessToken ?? null);
        setUser(r.user);
      },

      register: async (req) => {
        const r = await authApi.register(req);
        setAccessToken(r.accessToken ?? null);
        setUser(r.user);
      },

      logout: async () => {
        await authApi.logout();
        setAccessToken(null);
        setUser(null);
      },

      refreshUser: async () => {
        const r = await authApi.me();
        setUser(r.user);
      },
    }),
    [user, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {banStatus && (
        <div className={styles.overlay}>
          <div className={`${styles.modal} ${banStatus.type === "banned" ? styles.modalBanned : styles.modalSuspended}`}>
            <h2 className={`${styles.title} ${banStatus.type === "banned" ? styles.titleBanned : styles.titleSuspended}`}>
              {banStatus.type === "banned" ? "Account bannato" : "Account sospeso"}
            </h2>
            <p className={styles.message}>{banStatus.message}</p>
            {banStatus.type === "suspended" && banStatus.suspendedUntil && (
              <p className={styles.date}>
                Sospeso fino al {new Date(banStatus.suspendedUntil).toLocaleDateString("it-IT", {
                  day: "2-digit", month: "long", year: "numeric"
                })}
              </p>
            )}
            <button
              className={banStatus.type === "banned" ? styles.btnBanned : styles.btnSuspended}
              onClick={async () => {
                await authApi.logout();
                setAccessToken(null);
                setUser(null);
                setBanStatus(null);
              }}
            >
              Esci dall'account
            </button>
          </div>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
}


// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
