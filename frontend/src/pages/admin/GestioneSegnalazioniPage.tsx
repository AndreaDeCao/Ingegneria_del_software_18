import { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { http } from "../../auth/api";
import styles from "../attivita/attivitaPage.module.css";
import reportStyles from "./GestioneSegnalazioni.module.css";
import { useAuth } from "../../auth/AuthProvider";
import type { ActivityWithReports, Report, ReportStatus,} from "../../types/Reports.ts";
import type { PopulatedUser } from "../../types/User.ts";
// ── Costanti ──────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
const POLL_INTERVAL = 20_000;

const STATUS_LABEL: Record<ReportStatus, string> = {
  pending:   "In attesa",
  accepted:  "Accettata",
  dismissed: "Rigettata",
};

const STATUS_BADGE_CLASS: Record<ReportStatus, string> = {
  pending:   styles.statusPendingReport,
  accepted:  styles.statusReported,
  dismissed: styles.statusClosed,
};

// ── Tipi trek segnalazione ────────────────────────────────────────────────

interface SegnalazioneEntry {
  _id: string;
  titolo: string;
  createdAt: string;
  userId: {
    _id: string;
    nickname?: string;
    email?: string;
    nome?: string;
    cognome?: string;
  } | null;
  segnalazione: {
    tipo: string;
    descrizione?: string;
    stato: ReportStatus;
    gestitaDaAdmin: boolean;
    gestitaAt?: string | null;
  };
  reportedUser?: {
    _id: string;
    nickname?: string;
    nome?: string;
    cognome?: string;
  } | null;
}

interface TrekWithSegnalazioni {
  trekId: number;
  trekMongoId: string;
  trekName: string;
  entries: SegnalazioneEntry[];
}

// ── Helpers puri ──────────────────────────────────────────────────────────

function getDisplayName(user: PopulatedUser | string | null | undefined, fallback: string): string {
  if (!user) return fallback;
  if (typeof user === "object") return user.nickname || user.email || fallback;
  return user;
}

function getEmail(user: PopulatedUser | string | null | undefined): string | null {
  if (user && typeof user === "object") return user.email ?? null;
  return null;
}

function getFullName(user: PopulatedUser | string | null | undefined): string | null {
  if (user && typeof user === "object") {
    const full = [user.nome, user.cognome].filter(Boolean).join(" ");
    return full || null;
  }
  return null;
}

// Flat list attività con filtro stato
function buildFlatActivityReports(
  activities: ActivityWithReports[],
  statusFilter: string
): { activity: ActivityWithReports; report: Report }[] {
  const flat: { activity: ActivityWithReports; report: Report }[] = [];
  for (const activity of activities) {
    for (const report of activity.reports ?? []) {
      if (statusFilter !== "all" && report.reportStatus !== statusFilter) continue;
      flat.push({ activity, report });
    }
  }
  flat.sort((a, b) => {
    const ap = a.report.reportStatus === "pending";
    const bp = b.report.reportStatus === "pending";
    if (ap !== bp) return ap ? -1 : 1;
    return new Date(b.report.reportedAt).getTime() - new Date(a.report.reportedAt).getTime();
  });
  return flat;
}

// Flat list percorsi con filtro stato
function buildFlatTrekSegnalazioni(
  treks: TrekWithSegnalazioni[],
  statusFilter: string
): { trekId: number; trekName: string; entry: SegnalazioneEntry }[] {
  const flat: { trekId: number; trekName: string; entry: SegnalazioneEntry }[] = [];
  for (const t of treks) {
    for (const entry of t.entries) {
      if (statusFilter !== "all" && entry.segnalazione.stato !== statusFilter) continue;
      flat.push({ trekId: t.trekId, trekName: t.trekName, entry });
    }
  }
  flat.sort((a, b) => {
    const ap = a.entry.segnalazione.stato === "pending";
    const bp = b.entry.segnalazione.stato === "pending";
    if (ap !== bp) return ap ? -1 : 1;
    return new Date(b.entry.createdAt).getTime() - new Date(a.entry.createdAt).getTime();
  });
  return flat;
}

// ── Componenti interni ────────────────────────────────────────────────────

function UserMeta({
  label,
  user,
  fallback,
}: {
  label: string;
  user: PopulatedUser | string | null | undefined;
  fallback: string;
}) {
  const displayName = getDisplayName(user, fallback);
  const email = getEmail(user);
  const fullName = getFullName(user);
  return (
    <div className={reportStyles.reportMeta}>
      <span>
        {label} <strong>{displayName}</strong>
        {email && email !== displayName && (
          <><span style={{ opacity: 0.5, margin: "0 6px" }}>·</span><span style={{ opacity: 0.7 }}>{email}</span></>
        )}
        {fullName && (
          <><span style={{ opacity: 0.5, margin: "0 6px" }}>·</span><span style={{ opacity: 0.7 }}>{fullName}</span></>
        )}
      </span>
    </div>
  );
}

// ── Card attività ─────────────────────────────────────────────────────────

function ActivityReportCard({
  activity,
  report,
  actionLoading,
  onAction,
}: {
  activity: ActivityWithReports;
  report: Report;
  actionLoading: string | null;
  onAction: (activityId: string, reportId: string, action: "accept" | "dismiss", e: React.MouseEvent) => void;
}) {
  const isPending = report.reportStatus === "pending";
  const isLoading = actionLoading === report._id;

  return (
    <Link to={`/admin/attivita/${activity._id}`} className={reportStyles.reportCardLink}>
      <div className={`${reportStyles.reportCard} ${isPending ? reportStyles.reportCardPending : ""}`}>
        <div className={reportStyles.reportCardHeader}>
          <div className={reportStyles.reportCardLeft}>
            <span className={reportStyles.reportCategory}>Attività</span>
            <span className={reportStyles.reportActivityTitle}>{activity.title}</span>
          </div>
          <span className={`${styles.statusBadge} ${STATUS_BADGE_CLASS[report.reportStatus]}`}>
            {STATUS_LABEL[report.reportStatus]}
          </span>
        </div>

        <UserMeta label="Segnalata da" user={report.reportedBy} fallback="Utente sconosciuto" />

        <div className={reportStyles.reportMeta}>
          <span className={reportStyles.reportDate}>
            {new Date(report.reportedAt).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })}
          </span>
        </div>

        <UserMeta label="Organizzatore" user={activity.organizerID} fallback="Organizzatore sconosciuto" />

        {report.reason
          ? <p className={reportStyles.reportReason}>{report.reason}</p>
          : <p className={reportStyles.reportReasonEmpty}>Nessun motivo specificato</p>}

        {!isPending && report.reviewNote && (
          <p className={reportStyles.reportReviewNote}>Nota admin: {report.reviewNote}</p>
        )}

        {isPending && (
          <div className={reportStyles.reportActions}>
            <button className={styles.acceptReportButton} onClick={(e) => onAction(activity._id, report._id, "accept", e)} disabled={isLoading}>
              {isLoading ? "Attendere..." : "Accetta"}
            </button>
            <button className={styles.dismissReportButton} onClick={(e) => onAction(activity._id, report._id, "dismiss", e)} disabled={isLoading}>
              {isLoading ? "Attendere..." : "Rigetta"}
            </button>
          </div>
        )}

        {report.reportStatus === "accepted" && (
          <div className={reportStyles.reportActions}>
            <button className={styles.dismissReportButton} onClick={(e) => onAction(activity._id, report._id, "dismiss", e)} disabled={isLoading} title="Rimuove il banner 'Segnalata' dall'attività">
              {isLoading ? "Attendere..." : "Rimuovi segnalazione"}
            </button>
          </div>
        )}
      </div>
    </Link>
  );
}

// ── Card segnalazione percorso ────────────────────────────────────────────

function TrekSegnalazioneCard({
  trekId,
  trekName,
  entry,
  actionLoading,
  onAction,
}: {
  trekId: number;
  trekName: string;
  entry: SegnalazioneEntry;
  actionLoading: string | null;
  onAction: (entryId: string, action: "accept" | "dismiss" | "reopen", e: React.MouseEvent) => void;
}) {
  const stato = entry.segnalazione.stato;
  const isPending = stato === "pending";
  const isLoading = actionLoading === entry._id;
  const isUtente = entry.segnalazione.tipo === "Utente";

  const utente = entry.userId;
  const displayName = utente?.nickname ? `@${utente.nickname}` : utente?.email ?? "Utente sconosciuto";
  const email = utente?.email;
  const nomeCompleto = utente ? [utente.nome, utente.cognome].filter(Boolean).join(" ") : null;

  const reportedUser = entry.reportedUser;

  const Wrapper = isUtente
    ? ({ children }: { children: React.ReactNode }) => (
        <Link 
          to={reportedUser?._id ? `/admin/utenti?userId=${reportedUser._id}` : `/admin/utenti`} 
          className={reportStyles.reportCardLink}
          onClick={() => {
            if (entry.segnalazione.stato === "pending") {
              onAction(entry._id, "accept", { stopPropagation: () => {}, preventDefault: () => {} } as React.MouseEvent);
          }
          }}
        >
          {children}
        </Link>
      )
    : ({ children }: { children: React.ReactNode }) => (
        <Link to={`/admin/treks/${trekId}`} className={reportStyles.reportCardLink}>{children}</Link>
      );

  return (
    <Wrapper>
      <div className={`${reportStyles.reportCard} ${isPending ? reportStyles.reportCardPending : ""}`}>
        <div className={reportStyles.reportCardHeader}>
          <div className={reportStyles.reportCardLeft}>
            <span className={reportStyles.reportCategory}>
              {isUtente ? "Utente" : "Percorso"}
            </span>
            <span className={reportStyles.reportActivityTitle}>
              {isUtente ? (reportedUser?.nickname ? `@${reportedUser.nickname}` : "Utente segnalato") : trekName}
            </span>
          </div>
          <span className={`${styles.statusBadge} ${STATUS_BADGE_CLASS[stato]}`}>
            {STATUS_LABEL[stato]}
          </span>
        </div>

        {!isUtente && (
          <div className={reportStyles.reportMeta}>
            <span 
              className={reportStyles.reportActivityTitle} 
              style={{ fontSize: "13px", fontWeight: 400 }}
            >
              Percorso: {trekName}
            </span>
          </div>
        )}

        {isUtente && reportedUser && (
          <div className={reportStyles.reportMeta}>
            <span>
              Utente segnalato: 
              <strong>{reportedUser.nickname ? `@${reportedUser.nickname}` : ""}</strong>
              {reportedUser.nome && (
                <>
                  <span className={reportStyles.metaSeparator}>·</span>
                  <span className={reportStyles.metaMuted}>{reportedUser.nome} {reportedUser.cognome}</span>
                </>
              )}
            </span>
          </div>
        )}

        {/* Segnalatore */}
        <div className={reportStyles.reportMeta}>
          <span>
            Segnalata da <strong>{displayName}</strong>
            {email && email !== displayName && (
              <><span style={{ opacity: 0.5, margin: "0 6px" }}>·</span><span style={{ opacity: 0.7 }}>{email}</span></>
            )}
            {nomeCompleto && (
              <><span style={{ opacity: 0.5, margin: "0 6px" }}>·</span><span style={{ opacity: 0.75 }}>{nomeCompleto}</span></>
            )}
          </span>
        </div>

        <div className={reportStyles.reportMeta}>
          <span className={reportStyles.reportDate}>
            {new Date(entry.createdAt).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })}
          </span>
        </div>

        <p className={reportStyles.reportReason}>
          {isUtente ? entry.segnalazione.descrizione : (
            <>
              <strong>{entry.segnalazione.tipo}</strong>
              {entry.segnalazione.descrizione ? `: ${entry.segnalazione.descrizione}` : ""}
            </>
          )}
        </p>

        
        


        {!isUtente && isPending && (
          <div className={reportStyles.reportActions}>
            <button className={styles.acceptReportButton} onClick={(e) => onAction(entry._id, "accept", e)} disabled={isLoading}>
              {isLoading ? "Attendere..." : "Accetta"}
            </button>
            <button className={styles.dismissReportButton} onClick={(e) => onAction(entry._id, "dismiss", e)} disabled={isLoading}>
              {isLoading ? "Attendere..." : "Rigetta"}
            </button>
          </div>
        )}

        {!isUtente && stato === "accepted" && (
          <div className={reportStyles.reportActions}>
            <button className={styles.dismissReportButton} onClick={(e) => onAction(entry._id, "dismiss", e)} disabled={isLoading} title="Rimuove il banner dagli utenti">
              {isLoading ? "Attendere..." : "Rigetta (rimuovi banner)"}
            </button>
            <button className={styles.dismissReportButton} onClick={(e) => onAction(entry._id, "reopen", e)} disabled={isLoading}>
              {isLoading ? "Attendere..." : "Riporta in attesa"}
            </button>
          </div>
        )}

        {!isUtente && stato === "dismissed" && (
          <div className={reportStyles.reportActions}>
            <button className={styles.dismissReportButton} onClick={(e) => onAction(entry._id, "reopen", e)} disabled={isLoading}>
              {isLoading ? "Attendere..." : "Riporta in attesa"}
            </button>
          </div>
        )}
      </div>
    </Wrapper>
  );
}

// ── Pagina principale ─────────────────────────────────────────────────────

export default function GestioneSegnalazioniPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");

  // ── Tab attivo: "attivita" | "percorsi"
  const [tab, setTab] = useState<"attivita" | "percorsi" | "utenti">(() => {
    if (tabParam === "percorsi") return "percorsi";
    if (tabParam === "utenti") return "utenti";
    return "attivita";
  });

  const [statusFilter, setStatusFilter] = useState("all");

  // ── Stato attività
  const [activities, setActivities] = useState<ActivityWithReports[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);
  const [actActionLoading, setActActionLoading] = useState<string | null>(null);

  // ── Stato percorsi
  const [treksWithSegnalazioni, setTreksWithSegnalazioni] = useState<TrekWithSegnalazioni[]>([]);
  const [treksLoading, setTreksLoading] = useState(true);
  const [treksError, setTreksError] = useState<string | null>(null);
  const [trekActionLoading, setTrekActionLoading] = useState<string | null>(null);

  const [segnalazioniUtenti, setSegnalazioniUtenti] = useState<SegnalazioneEntry[]>([]);
  const [utentiLoading, setUtentiLoading] = useState(true);
  const [utentiError, setUtentiError] = useState<string | null>(null);
  const [utentiActionLoading, setUtentiActionLoading] = useState<string | null>(null);

  const isAdmin = user?.role === "admin";

  // ── Sync tab → searchParams
  function switchTab(t: "attivita" | "percorsi" | "utenti") {
    setTab(t);
    setStatusFilter("all");
    setSearchParams({ tab: t });
  }

  // ── Fetch attività ────────────────────────────────────────────────────────

  const fetchActivities = useCallback(async (silent = false) => {
    if (!isAdmin) return;
    try {
      const res = await fetch(`${API_BASE}/activities/`);
      if (!res.ok) throw new Error("Errore nel recupero attività");
      const data: ActivityWithReports[] = await res.json();
      setActivities(data.filter((a) => (a.reports ?? []).length > 0));
    } catch (err: any) {
      if (!silent) setActivitiesError(err.message);
    } finally {
      if (!silent) setActivitiesLoading(false);
    }
  }, [isAdmin]);

  // ── Fetch percorsi + segnalazioni (fan-out) ───────────────────────────────

  const fetchTrekSegnalazioni = useCallback(async (silent = false) => {
    if (!isAdmin) return;
    try {
      // 1. Prendi tutti i trek
      const treksRes = await fetch(`${API_BASE}/treks/`);
      if (!treksRes.ok) throw new Error("Errore nel recupero dei percorsi");
      const allTreks: { id: number; _id: string; name: string }[] = await treksRes.json();

      // 2. Fan-out: per ogni trek prendi le segnalazioni (in parallelo, a batch di 10)
      const results: TrekWithSegnalazioni[] = [];
      const BATCH = 10;
      for (let i = 0; i < allTreks.length; i += BATCH) {
        const batch = allTreks.slice(i, i + BATCH);
        const settled = await Promise.allSettled(
          batch.map((t) =>
            http<SegnalazioneEntry[]>(`/api/diary/segnalazioni?trekId=${t.id}`)
          )
        );
        settled.forEach((res, idx) => {
          if (res.status === "fulfilled" && res.value.length > 0) {
            results.push({
              trekId: batch[idx].id,
              trekMongoId: batch[idx]._id,
              trekName: batch[idx].name,
              entries: res.value,
            });
          }
        });
      }

      setTreksWithSegnalazioni(results);
    } catch (err: any) {
      if (!silent) setTreksError(err.message);
    } finally {
      if (!silent) setTreksLoading(false);
    }
  }, [isAdmin]);


  const fetchSegnalazioniUtenti = useCallback(async (silent = false) => {
    if(!isAdmin) return;
    try {
      const data = await http<SegnalazioneEntry[]>("/api/diary/segnalazioni-utenti");
      setSegnalazioniUtenti(data);

    } catch(err: unknown) {
      if(!silent) setUtentiError(err instanceof Error ? err.message : "Errore");
    } finally {
      if(!silent) setUtentiLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchSegnalazioniUtenti(false);
    const interval = setInterval(() => fetchSegnalazioniUtenti(true), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchSegnalazioniUtenti]);

  // ── Effetti iniziali e polling ────────────────────────────────────────────

  useEffect(() => {
    fetchActivities(false);
    const interval = setInterval(() => fetchActivities(true), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchActivities]);

  useEffect(() => {
    fetchTrekSegnalazioni(false);
    const interval = setInterval(() => fetchTrekSegnalazioni(true), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchTrekSegnalazioni]);

  // ── Azioni attività ───────────────────────────────────────────────────────

  async function handleActivityAction(
    activityId: string,
    reportId: string,
    action: "accept" | "dismiss",
    e: React.MouseEvent
  ) {
    e.stopPropagation();
    e.preventDefault();
    setActActionLoading(reportId);
    try {
      const res = await fetch(
        `${API_BASE}/activities/${activityId}/reports/${reportId}/${action}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userID: user?._id, userRole: user?.role }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || "Errore");
      }
      const updated: ActivityWithReports = await res.json();
      setActivities((prev) =>
        prev
          .map((a) => (a._id === activityId ? { ...a, reports: updated.reports } : a))
          .filter((a) => (a.reports ?? []).length > 0)
      );
    } catch (err: any) {
      console.error(err);
    } finally {
      setActActionLoading(null);
    }
  }

  // ── Azioni percorso ───────────────────────────────────────────────────────

  async function handleTrekAction(
    entryId: string,
    action: "accept" | "dismiss" | "reopen",
    e: React.MouseEvent
  ) {
    e.stopPropagation();
    e.preventDefault();
    setTrekActionLoading(entryId);
    try {
      await http(`/api/diary/segnalazioni/${entryId}/${action}`, { method: "PATCH" });
      const newStato: ReportStatus =
        action === "accept" ? "accepted" : action === "dismiss" ? "dismissed" : "pending";
      setTreksWithSegnalazioni((prev) =>
        prev.map((t) => ({
          ...t,
          entries: t.entries.map((s) =>
            s._id === entryId
              ? { ...s, segnalazione: { ...s.segnalazione, stato: newStato, gestitaDaAdmin: action !== "reopen" } }
              : s
          ),
        }))
      );
    } catch (err: any) {
      console.error(err);
    } finally {
      setTrekActionLoading(null);
    }
  }

  async function handleUtentiAction(
    entryId: string,
    action: "accept" | "dismiss" | "reopen",
    e: React.MouseEvent
  ) {
    e.stopPropagation();
    e.preventDefault();
    setUtentiActionLoading(entryId);
    try {
      await http(`/api/diary/segnalazioni/${entryId}/${action}`, { method: "PATCH" });

      const newStato: ReportStatus =
        action === "accept" ? "accepted" : action === "dismiss" ? "dismissed" : "pending";
      setSegnalazioniUtenti((prev) =>
        prev.map((s) =>
          s._id === entryId
            ? { ...s, segnalazione: { ...s.segnalazione, stato: newStato, gestitaDaAdmin: action !== "reopen" } }
            : s
        )
      );

    } catch(err: unknown) {
      console.error(err);
    } finally {
      setUtentiActionLoading(null);
    }
  }

  // ── Guard ─────────────────────────────────────────────────────────────────

  if (!isAdmin) {
    return (
      <main className={styles.page}>
        <p className={styles.messageError}>Accesso riservato agli amministratori.</p>
      </main>
    );
  }

  // ── Dati derivati ─────────────────────────────────────────────────────────

  const actPendingCount = activities.reduce(
    (acc, a) => acc + (a.reports ?? []).filter((r) => r.reportStatus === "pending").length, 0
  );
  const trekPendingCount = treksWithSegnalazioni.reduce(
    (acc, t) => acc + t.entries.filter((s) => s.segnalazione.stato === "pending").length, 0
  );

  const flatActivities = buildFlatActivityReports(activities, statusFilter);
  const flatTreks = buildFlatTrekSegnalazioni(treksWithSegnalazioni, statusFilter);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className={styles.page}>

      {/* Intestazione */}
      <div style={{ marginBottom: "1rem" }}>
        <h1 className={styles.pageTitle}>Gestione Segnalazioni</h1>
      </div>

      {/* Tab */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", borderBottom: "2px solid var(--border)" }}>
        <button
          onClick={() => switchTab("attivita")}
          style={{
            padding: "0.5rem 1.25rem",
            fontWeight: 600,
            fontSize: "0.95rem",
            background: "none",
            border: "none",
            borderBottom: tab === "attivita" ? "2px solid var(--accent)" : "2px solid transparent",
            marginBottom: "-2px",
            cursor: "pointer",
            color: tab === "attivita" ? "var(--accent)" : "var(--text-muted)",
          }}
        >
          Attività
          {actPendingCount > 0 && (
            <span style={{ marginLeft: "0.4rem", background: "var(--accent)", color: "#fff", borderRadius: "9999px", fontSize: "0.72rem", padding: "1px 7px", verticalAlign: "middle" }}>
              {actPendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => switchTab("percorsi")}
          style={{
            padding: "0.5rem 1.25rem",
            fontWeight: 600,
            fontSize: "0.95rem",
            background: "none",
            border: "none",
            borderBottom: tab === "percorsi" ? "2px solid var(--accent)" : "2px solid transparent",
            marginBottom: "-2px",
            cursor: "pointer",
            color: tab === "percorsi" ? "var(--accent)" : "var(--text-muted)",
          }}
        >
          Percorsi
          {trekPendingCount > 0 && (
            <span style={{ marginLeft: "0.4rem", background: "var(--accent)", color: "#fff", borderRadius: "9999px", fontSize: "0.72rem", padding: "1px 7px", verticalAlign: "middle" }}>
              {trekPendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => switchTab("utenti")}
          style={{
            padding: "0.5rem 1.25rem",
            fontWeight: 600,
            fontSize: "0.95rem",
            background: "none",
            border: "none",
            borderBottom: tab === "utenti" ? "2px solid var(--accent)" : "2px solid transparent",
            marginBottom: "-2px",
            cursor: "pointer",
            color: tab === "utenti" ? "var(--accent)" : "var(--text-muted)",
          }}
        >
          Utenti
          {segnalazioniUtenti.filter(s => s.segnalazione.stato === "pending").length > 0 && (
            <span style={{ marginLeft: "0.4rem", background: "var(--accent)", color: "#fff", borderRadius: "9999px", fontSize: "0.72rem", padding: "1px 7px", verticalAlign: "middle" }}>
              {segnalazioniUtenti.filter(s => s.segnalazione.stato === "pending").length}
            </span>
          )}
        </button>
      </div>

      {/* Filtro stato (comune ai due tab) */}
      <div className={styles.filtersBar} style={{ marginBottom: "1rem" }}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Stato</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={styles.select}>
            <option value="all">Tutte</option>
            <option value="pending">In attesa</option>
            <option value="accepted">Accettate</option>
            <option value="dismissed">Rigettate</option>
          </select>
        </div>
      </div>

      {/* ── TAB: ATTIVITÀ ── */}
      {tab === "attivita" && (
        <>
          {activitiesLoading && <p className={styles.message}>Caricamento segnalazioni attività...</p>}
          {activitiesError && <p className={styles.messageError}>{activitiesError}</p>}
          {!activitiesLoading && !activitiesError && (
            <>
              <p className={styles.message}>
                {actPendingCount > 0
                  ? `${actPendingCount} segnalazion${actPendingCount === 1 ? "e" : "i"} in attesa`
                  : "Nessuna segnalazione attività in attesa"}
              </p>
              {flatActivities.length === 0 ? (
                <p className={styles.message}>Nessuna segnalazione corrisponde ai filtri selezionati.</p>
              ) : (
                <div className={reportStyles.reportList}>
                  {flatActivities.map(({ activity, report }) => (
                    <ActivityReportCard
                      key={report._id}
                      activity={activity}
                      report={report}
                      actionLoading={actActionLoading}
                      onAction={handleActivityAction}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── TAB: PERCORSI ── */}
      {tab === "percorsi" && (
        <>
          {treksLoading && <p className={styles.message}>Caricamento segnalazioni percorsi...</p>}
          {treksError && <p className={styles.messageError}>{treksError}</p>}
          {!treksLoading && !treksError && (
            <>
              <p className={styles.message}>
                {trekPendingCount > 0
                  ? `${trekPendingCount} segnalazion${trekPendingCount === 1 ? "e" : "i"} in attesa`
                  : "Nessuna segnalazione percorso in attesa"}
              </p>
              {flatTreks.length === 0 ? (
                <p className={styles.message}>Nessuna segnalazione corrisponde ai filtri selezionati.</p>
              ) : (
                <div className={reportStyles.reportList}>
                  {flatTreks.map(({ trekId, trekName, entry }) => (
                    <TrekSegnalazioneCard
                      key={entry._id}
                      trekId={trekId}
                      trekName={trekName}
                      entry={entry}
                      actionLoading={trekActionLoading}
                      onAction={handleTrekAction}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {tab === "utenti" && (
        <>
          {utentiLoading && <p className={styles.message}>Caricamento segnalazioni utenti...</p>}
          {utentiError && <p className={styles.messageError}>{utentiError}</p>}
          {!utentiLoading && !utentiError && (
            <>
              <p className={styles.message}>
                {segnalazioniUtenti.filter(s => s.segnalazione.stato === "pending").length > 0
                  ? `${segnalazioniUtenti.filter(s => s.segnalazione.stato === "pending").length} segnalazion${segnalazioniUtenti.filter(s => s.segnalazione.stato === "pending").length === 1 ? "e" : "i"} in attesa`
                  : "Nessuna segnalazione utente in attesa"}
              </p>
              {segnalazioniUtenti.length === 0 ? (
                <p className={styles.message}>Nessuna segnalazione utente.</p>
              ) : (
                <div className={reportStyles.reportList}>
                  {segnalazioniUtenti
                    .filter(s => statusFilter === "all" || s.segnalazione.stato === statusFilter)
                    .map(entry => (
                      <TrekSegnalazioneCard
                        key={entry._id}
                        trekId={0}
                        trekName=""
                        entry={entry}
                        actionLoading={utentiActionLoading}
                        onAction={handleUtentiAction}
                      />
                    ))}
                </div>
              )}
            </>
          )}
        </>
      )}

    </main>
  );
}
