import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { http } from "../../auth/api";
import Modal from "../../components/Modal/Modal";
import styles from "./UtentiPageAdmin.module.css";
import { useSearchParams } from "react-router-dom";

// Type segnalazione utente
type UserReport = {
  _id: string;
  reportedBy: { _id: string; nickname: string; email: string } | string;
  reason: string;
  reportedAt: string;
  reportStatus: "pending" | "accepted" | "dismissed";
  reviewedAt?: string | null;
};

// Type utente admin
type AdminUser = {
  _id: string;
  nome: string;
  cognome: string;
  nickname: string;
  email: string;
  avatarUrl?: string | null;
  isBanned: boolean;
  isSuspended: boolean;
  suspendedUntil?: string | null;
  createdAt: string;
  reports: UserReport[];
};

type StatusFilter = "all" | "active" | "suspended" | "banned";


/**
 * Restituisce lo stato dell'utente in base ai campi isBanned e isSuspended.
 *
 * @param {AdminUser} user - Utente da valutare
 * @returns {"banned" | "suspended" | "active"} Stato dell'utente
 */
function getUserStatus(user: AdminUser): "banned" | "suspended" | "active" {
  if (user.isBanned) return "banned";
  if (user.isSuspended) return "suspended";
  return "active";
}


/**
 * Restituisce il nickname o email di chi ha segnalato.
 *
 * @param {UserReport["reportedBy"]} reportedBy - Utente che ha segnalato
 * @returns {string} Nome visualizzabile
 */
function getReporterName(reportedBy: UserReport["reportedBy"]): string {
  if (typeof reportedBy === "object") return reportedBy.nickname || reportedBy.email;
  return "Utente sconosciuto";
}


/**
 * Formatta una data.
 *
 * @param {string} dateStr - Data
 * @returns {string} Data formattata
 */
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}


/**
 * Avatar utente
 *
 * @param {Pick<AdminUser, "avatarUrl" | "nome">} user - Dati utente
 * @returns {JSX.Element}
 */
function UserAvatar({ user }: { user: Pick<AdminUser, "avatarUrl" | "nome"> }) {
  return user.avatarUrl ? (
    <img src={user.avatarUrl} alt="avatar" className={styles.avatar} />
  ) : (
    <div className={styles.avatarPlaceholder}>
      {user.nome?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}


/**
 * Badge con stato dell'utente (attivo, sospeso, bannato).
 *
 * @param {AdminUser} user - Utente da valutare
 * @returns {JSX.Element}
 */
function StatusBadge({ user }: { user: AdminUser }) {
  const status = getUserStatus(user);
  const classMap = {
    banned: styles.badgeBanned,
    suspended: styles.badgeSuspended,
    active: styles.badgeActive,
  };
  const labelMap = { banned: "Bannato", suspended: "Sospeso", active: "Attivo" };

  return (
    <span className={`${styles.badge} ${classMap[status]}`}>
      {labelMap[status]}
    </span>
  );
}


/**
 * Badge colorato con lo stato di una segnalazione.
 *
 * @param {UserReport["reportStatus"]} status - Stato della segnalazione
 * @returns {JSX.Element}
 */
function ReportStatusBadge({ status }: { status: UserReport["reportStatus"] }) {
  const classMap = {
    pending: styles.badgePending,
    accepted: styles.badgeAccepted,
    dismissed: styles.badgeDismissed,
  };
  const labelMap = { pending: "In attesa", accepted: "Accettata", dismissed: "Rigettata" };

  return (
    <span className={`${styles.badge} ${classMap[status]}`}>
      {labelMap[status]}
    </span>
  );
}

/**
 * Pagina admin per la gestione degli utenti.
 * Lista utenti con ricerca e filtro per stato.
 * Click su un utente apre un modal con dettagli, segnalazioni e azioni.
 *
 * @route /admin/utenti
 * @returns {JSX.Element} Pagina admin utenti
 */
export default function AdminUtentiPage() {
  const { user: adminUser } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [suspendDays, setSuspendDays] = useState(7);

  const [searchTrigger, setSearchTrigger] = useState(0);

  const isAdmin = adminUser?.role === "admin";

  const [searchParams] = useSearchParams();

  useEffect(() => {
    const userId = searchParams.get("userId");
    if (!userId || users.length === 0) return;
    const target = users.find(u => u._id === userId);
    if (target) setSelectedUser(target);
  }, [users, searchParams]);

  useEffect(() => {
  let cancelled = false;

  async function load() {
    if(!isAdmin) return;

    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);

      const data = await http<AdminUser[]>(`/api/admin/users?${params.toString()}`);
      if(!cancelled) {
        setUsers(data);
        setLoading(false);
      }

    } catch(err: unknown) {
      if (!cancelled && err instanceof Error) {
        setError(err.message);
        setLoading(false);
      }
    }
  }

  load();
  return () => { cancelled = true; };
}, [search, statusFilter, isAdmin, searchTrigger]);


  /**
   * Esegue un'azione admin su un utente.
   *
   * @param {"suspend" | "unsuspend" | "ban" | "unban"} action - Azione da eseguire
   * @param {number} [days] - Giorni di sospensione
   * @returns {Promise<void>}
   */
  async function handleAction(action: "suspend" | "unsuspend" | "ban" | "unban", days?: number) {
  if (!selectedUser) return;
  setActionLoading(true);
  try {
    const body = action === "suspend" ? { days } : undefined;
    await http(`/api/admin/users/${selectedUser._id}/${action}`, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
    
    
    setUsers(prev => prev.map(u => 
      u._id === selectedUser._id 
        ? { ...u, 
            isBanned: action === "ban" ? true : action === "unban" ? false : u.isBanned,
            isSuspended: action === "suspend" ? true : action === "unsuspend" ? false : u.isSuspended,
            suspendedUntil: action === "suspend" ? new Date(Date.now() + (days ?? 7) * 24 * 60 * 60 * 1000).toISOString() 
              : action === "unsuspend" ? null : u.suspendedUntil }
        : u
    ));

    const updatedUser = users.find(u => u._id === selectedUser._id);
    if (updatedUser) {
      setSelectedUser({
        ...updatedUser,
        isBanned: action === "ban" ? true : action === "unban" ? false : updatedUser.isBanned,
        isSuspended: action === "suspend" ? true : action === "unsuspend" ? false : updatedUser.isSuspended,
      });
    }

  } catch(err: unknown) {
    if (err instanceof Error) setError(err.message);
  } finally {
    setActionLoading(false);
  }
}

  if (!isAdmin) {
    return (
      <main className={styles.main}>
        <p className={styles.messageError}>Accesso riservato agli amministratori.</p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className={styles.main}>
        <p className={styles.message}>Caricamento utenti...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.main}>
        <p className={styles.messageError}>{error}</p>
      </main>
    );
  }

  const bannedCount = users.filter(u => u.isBanned).length;
  const suspendedCount = users.filter(u => u.isSuspended).length;
  const pendingReportsCount = users.reduce(
    (acc, u) => acc + u.reports.filter(r => r.reportStatus === "pending").length, 0
  );

  return (
    <main className={styles.main}>

      <h1 className={styles.title}>Gestione Utenti</h1>
      <p className={styles.message}>
        {users.length} utenti totali
        {bannedCount > 0 && ` · ${bannedCount} bannati`}
        {suspendedCount > 0 && ` · ${suspendedCount} sospesi`}
        {pendingReportsCount > 0 && ` · ${pendingReportsCount} segnalazioni in attesa`}
      </p>

      {/* FILTRI */}
      <div className={styles.filtersRow}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Cerca</label>
          <input 
            className={styles.input}
            placeholder="Nickname, nome, email..."
            value={search}
             onChange={(e) => {
              setSearch(e.target.value);
              if (e.target.value.trim().length === 0) setSearchTrigger(t => t + 1);
            }}
            onKeyDown={(e) => e.key === "Enter" && setSearchTrigger(t => t + 1)}
          />
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Stato</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className={styles.select}
          >
            <option value="all">Tutti</option>
            <option value="active">Attivi</option>
            <option value="suspended">Sospesi</option>
            <option value="banned">Bannati</option>
          </select>
        </div>
      </div>

      {/* LISTA UTENTI */}
      {users.length === 0 ? (
        <p className={styles.empty}>Nessun utente trovato</p>
      ) : (
        <div className={styles.list}>
          {users.map(u => {
            const pending = u.reports.filter(r => r.reportStatus === "pending").length;
            return (
              <div 
                key={u._id}
                className={styles.card}
                onClick={() => setSelectedUser(u)}
              >
                <UserAvatar user={u}/>
                <div className={styles.info}>
                  <p className={styles.name}>{u.nome} {u.cognome}</p>
                  <p className={styles.nickname}>@{u.nickname}</p>
                  <p className={styles.email}>{u.email}</p>
                </div>
                <div className={styles.cardRight}>
                  <StatusBadge user={u}/>
                  {pending > 0 && (
                    <span className={`${styles.badge} ${styles.badgePending}`}>
                      {pending} segnalazion{pending === 1 ? "e" : "i"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DETTAGLI UTENTE */}
      <Modal
        isOpen={selectedUser !== null}
        onClose={() => setSelectedUser(null)}
        title={selectedUser ? `@${selectedUser.nickname}` : ""}
      >
        {selectedUser && (
          <div className={styles.modalContent}>

            {/* INFO UTENTE */}
            <div className={styles.modalUserInfo}>
              <UserAvatar user={selectedUser} />
              <div className={styles.modalUserMeta}>
                <p className={styles.modalUserName}>{selectedUser.nome} {selectedUser.cognome}</p>
                <p className={styles.modalUserEmail}>{selectedUser.email}</p>
                <p className={styles.modalUserDate}>Iscritto il {formatDate(selectedUser.createdAt)}</p>
              </div>
              <StatusBadge user={selectedUser} />
            </div>

            {selectedUser.isSuspended && selectedUser.suspendedUntil && (
              <p className={styles.suspendedUntil}>
                Sospeso fino al {formatDate(selectedUser.suspendedUntil)}
              </p>
            )}

            {/* SEGNALAZIONI RICEVUTE */}
            <div className={styles.modalSection}>
              <h4 className={styles.modalSectionTitle}>
                Segnalazioni ricevute
                {selectedUser.reports.filter(r => r.reportStatus === "pending").length > 0 && (
                  <span className={`${styles.badge} ${styles.badgePending}`} style={{ marginLeft: 8 }}>
                    {selectedUser.reports.filter(r => r.reportStatus === "pending").length} in attesa
                  </span>
                )}
              </h4>

              {selectedUser.reports.length === 0 ? (
                <p className={styles.emptyReports}>Nessuna segnalazione.</p>
              ) : (
                <div className={styles.reportList}>
                  {selectedUser.reports.map(report => (
                    <div key={report._id} className={styles.reportItem}>
                      <div className={styles.reportItemHeader}>
                        <span className={styles.reportItemBy}>
                          Segnalato da <strong>{getReporterName(report.reportedBy)}</strong>
                        </span>
                        <ReportStatusBadge status={report.reportStatus} />
                      </div>
                      {report.reason && (
                        <p className={styles.reportReason}>{report.reason}</p>
                      )}
                      <p className={styles.reportDate}>{formatDate(report.reportedAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AZIONI ADMIN */}
            <div className={styles.modalSection}>
              <h4 className={styles.modalSectionTitle}>Azioni</h4>
              <div className={styles.actionsRow}>

                {!selectedUser.isBanned && (
                  selectedUser.isSuspended ? (
                    <button
                      className={styles.btn}
                      onClick={() => handleAction("unsuspend")}
                      disabled={actionLoading}
                    >
                      Rimuovi sospensione
                    </button>
                  ) : (
                    <div className={styles.suspendRow}>
                      <input
                        type="number"
                        min={1}
                        max={365}
                        value={suspendDays}
                        onChange={(e) => setSuspendDays(Number(e.target.value))}
                        className={styles.daysInput}
                      />
                      <span className={styles.daysLabel}>giorni</span>
                      <button
                        className={styles.btnWarning}
                        onClick={() => handleAction("suspend", suspendDays)}
                        disabled={actionLoading}
                      >
                        Sospendi
                      </button>
                    </div>
                  )
                )}

                {selectedUser.isBanned ? (
                  <button
                    className={styles.btn}
                    onClick={() => handleAction("unban")}
                    disabled={actionLoading}
                  >
                    Rimuovi ban
                  </button>
                ) : (
                  <button
                    className={styles.btnDanger}
                    onClick={() => handleAction("ban")}
                    disabled={actionLoading}
                  >
                    Banna utente
                  </button>
                )}

              </div>
              {actionLoading && <p className={styles.loadingMsg}>Attendere...</p>}
            </div>

          </div>
        )}
      </Modal>

    </main>
  );
}