import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

import styles from "./attivitaPage.module.css";
import appStyles from "../../App.module.css";

import { useAuth } from "../../auth/AuthProvider";
import { http } from "../../auth/api";

import type { Activity } from "../../types/Activity";
import type {Trek} from "../../types/Trek";
import type {Organizer} from "../../types/Organizer";
import type {Participant} from "../../types/Participant";
import type {Friend} from "../../types/Friend"
import type {ActivityInvite} from "../../types/ActivityInvite";

type ActivityPopulated = Omit<Activity, "partecipantList"> & {
  partecipantList: Participant[];
};

type ModalType = "join" | "leave" | "cancel" | "uncancel" | "delete" | null;

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

function Banner({
  msg,
  type,
  onClose,
}: {
  msg: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  return (
    <div className={`${styles.banner} ${type === "success" ? styles.bannerSuccess : styles.bannerError}`}>
      <span>{msg}</span>
      <button className={styles.bannerClose} onClick={onClose} aria-label="Chiudi">
        ✕
      </button>
    </div>
  );
}

export default function DettagliAttivita() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activity, setActivity] = useState<ActivityPopulated | null>(null);
  const [trek, setTrek] = useState<Trek | null>(null);
  const [organizer, setOrganizer] = useState<Organizer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [friends, setFriends] = useState<Friend[]>([]);
  const [invitedUsers, setInvitedUsers] = useState<string[]>([]);
  const [friendSearch, setFriendSearch] = useState("");
  const [pendingInvites, setPendingInvites] = useState<ActivityInvite[]>([]);
  const [myInvite, setMyInvite] = useState<ActivityInvite | null>(null);

  const [banner, setBanner] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  async function loadPageData() {
    try {
      setError(null);
      // const resActivity = await fetch(`http://localhost:3000/activities/${id}`);
      const resActivity = await fetch(`${API_BASE}/activities/${id}`);
      if (!resActivity.ok) {
        const err = await resActivity.json().catch(() => ({}));
        throw new Error(err.error || err.message || `Errore ${resActivity.status}`);
      }

      const activityData: ActivityPopulated = await resActivity.json();
      activityData.partecipantList = activityData.partecipantList ?? [];
      setActivity(activityData);

      if (activityData.trekID) {
        // 1. Recupera l'id numerico partendo dall'_id Mongo
        const resId = await fetch(`${API_BASE}/treks/by-mongo-id/${activityData.trekID}`);
        if (resId.ok) {
          const { id: trekNumericId } = await resId.json();

          // 2. Recupera il trek usando l'id numerico
          const resTrek = await fetch(`${API_BASE}/treks/${trekNumericId}`);
          if (resTrek.ok) setTrek(await resTrek.json());
        }
      }

      if (activityData.organizerID) {
        const resOrg = await fetch(`${API_BASE}/users/${activityData.organizerID}`);
        if (resOrg.ok) setOrganizer(await resOrg.json());
      }

      const currentUserId = user?._id;
      const isOrganizerView =
        !!currentUserId && activityData.organizerID?.toString() === currentUserId;

      if (isOrganizerView) {
        const [friendsData, pendingData] = await Promise.all([
          http<Friend[]>("/api/friendships"),
          http<ActivityInvite[]>(`/activities/${id}/invites`),
        ]);
        setFriends(friendsData);
        setPendingInvites(pendingData);
        setMyInvite(null);
        setInvitedUsers([]);
        setFriendSearch("");
      } else if (currentUserId) {
        const myInvites = await http<ActivityInvite[]>(`/activities/${id}/invites/me`);        
        setMyInvite(myInvites[0] ?? null);
        setPendingInvites([]);
        setFriends([]);
        setInvitedUsers([]);
        setFriendSearch("");
      } else {
        setFriends([]);
        setPendingInvites([]);
        setMyInvite(null);
        setInvitedUsers([]);
        setFriendSearch("");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Errore nel caricamento dei dati");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    void loadPageData();
  }, [id, user?._id]);

  function showBanner(msg: string, type: "success" | "error") {
    setBanner({ msg, type });
  }

  async function handleAction(endpoint: string, method: string) {
    setActionLoading(true);
    try {
      const updated = await http<ActivityPopulated>(`/activities/${id}/${endpoint}`, {
        method,
        body: JSON.stringify({ userID: user?._id }),
      });
      updated.partecipantList = updated.partecipantList ?? [];
      setActivity(updated);
//      showMessage(
//        endpoint === "join" ? "Partecipazione confermata" :
//        endpoint === "leave" ? "Hai lasciato l'attività" :
//        endpoint === "cancel" ? "Attività annullata" :
//        endpoint === "uncancel" ? "Attività riattivata" :
//        endpoint === "open" ? "Attività raperta" :
//        endpoint === "close" ? "Attività chiusa" :
//        endpoint === "delete" ? "Attività eliminata" :
//        "N/A"
//      );
    } catch (err: any) {
      showBanner(err.message || "Errore", "error");
    } finally {
      setActionLoading(false);
      setActiveModal(null);
    }
  }

  async function handleDelete() {
    setActionLoading(true);
    try {
      await http<{ message: string }>(`/activities/${id}`, {
        method: "DELETE",
        body: JSON.stringify({ userID: user?._id }),
      });
      navigate("/attivita/visualizza");
    } catch (err: any) {
      showBanner(err.message || "Errore", "error");
      setActiveModal(null);
    } finally {
      setActionLoading(false);
    }
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Annullato": return styles.statusCancelled;
      case "Chiuso":    return styles.statusClosed;
      case "Aperto":    return styles.statusAvailable;
      default:          return styles.statusAvailable;
    }
  };

  const formatTravelMode = (mode: string) => {
    switch (mode) {
      case "walking":   return "A piedi";
      case "bicycling": return "In bicicletta";
      default:          return mode;
    }
  };

  const formatDate = (date: string | Date) =>
    new Date(date).toLocaleDateString("it-IT", {
      weekday: "long", day: "2-digit", month: "long", year: "numeric",
    });

  const formatTime = (date: string | Date) =>
    new Date(date).toLocaleTimeString("it-IT", {
      hour: "2-digit", minute: "2-digit",
    });

  if (loading) return <main className={styles.page}><p className={styles.message}>Caricamento attività...</p></main>;
  if (error || !activity) return <main className={styles.page}><p className={styles.messageError}>{error || "Attività non trovata"}</p></main>;

  const currentUserID = user?._id;
  const isOrganizer = !!currentUserID && activity.organizerID?.toString() === currentUserID;
  const isParticipant = !isOrganizer && activity.partecipantList.some((p) => p._id === currentUserID);
  const participantCount = activity.partecipantList.length;
  const spotsLeft = activity.maxParticipants - participantCount;
  const isExpired = new Date(activity.activityDate).getTime() < Date.now();
  const canJoin = !isOrganizer && !isParticipant && activity.visibility === "public" && activity.status === "Aperto" && spotsLeft > 0 && !isExpired;
  const canInviteFriends = isOrganizer && activity.status === "Aperto" && !isExpired && spotsLeft > 0;

  const organizerName = organizer?.nickname || `${organizer?.nome ?? ""} ${organizer?.cognome ?? ""}`.trim() || organizer?.email || "—";
  const inviteableFriends = friends.filter((friend) =>
    !pendingInvites.some((invite) => invite.receiver._id === friend.user._id) &&
    !activity.partecipantList.some((participant) => participant._id === friend.user._id)
  );

  /**
   * Gestisce selezione di amici da invitare.
   *
   * @param {string} userId - ID dell'amico
   */
  function toggleInvite(userId: string) {
    setInvitedUsers((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      }
      if (prev.length >= spotsLeft) {
        showBanner(`Puoi invitare al massimo ${spotsLeft} amici`, "error");
        return prev;
      }
      return [...prev, userId];
    });
  }

  async function sendInvites() {
    if (!canInviteFriends) {
      showBanner("Non puoi inviare inviti su questa attività", "error");
      return;
    }
    if (invitedUsers.length === 0) {
      showBanner("Seleziona almeno un amico da invitare", "error");
      return;
    }

    setActionLoading(true);
    try {
      await Promise.all(
        invitedUsers.map((friendId) =>
          http(`/activities/${id}/invite/${friendId}`, { method: "POST" })
        )
      );

      setInvitedUsers([]);
      setFriendSearch("");
      showBanner("Inviti inviati", "success");
      await loadPageData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        showBanner(err.message, "error");
      } else {
        showBanner("Errore durante l'invio degli inviti", "error");
      }
    } finally {
      setActionLoading(false);
    }
  }

  async function acceptInvite(inviteId: string) {
    setActionLoading(true);
    try {
      await http(`/activities/${id}/invites/${inviteId}/accept`, { method: "PUT" });
      showBanner("Invito accettato", "success");
      await loadPageData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        showBanner(err.message, "error");
      } else {
        showBanner("Errore durante l'accettazione dell'invito", "error");
      }
    } finally {
      setActionLoading(false);
    }
  }

  async function declineInvite(inviteId: string) {
    setActionLoading(true);
    try {
      await http(`/activities/${id}/invites/${inviteId}/decline`, { method: "PUT" });
      showBanner("Invito rifiutato", "success");
      await loadPageData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        showBanner(err.message, "error");
      } else {
        showBanner("Errore durante il rifiuto dell'invito", "error");
      }
    } finally {
      setActionLoading(false);
    }
  }

  async function cancelInvite(inviteId: string) {
    setActionLoading(true);
    try {
      await http(`/activities/${id}/invites/${inviteId}/cancel`, { method: "PUT" });
      showBanner("Invito revocato", "success");
      await loadPageData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        showBanner(err.message, "error");
      } else {
        showBanner("Errore durante la revoca dell'invito", "error");
      }
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={appStyles.contentLayout}>

        {/* ── SINISTRA ── */}
        <div className={appStyles.leftColumn}>
          <div style={{ paddingBottom: "20px" }}>
            {isOrganizer && (
              <>
                <div className={styles.organizerBadge}>Sei l'organizzatore di questa attività</div>
              </>
            )}
            {isParticipant && (
              <>
                <div className={styles.alreadyJoinedBadge}>Partecipi a questa attività</div>
              </>
            )}
            {activity.visibility === "private" && (
              <>
                <div className={styles.visibilityBadge}>L'attività è privata</div>
              </>
            )}
            {isExpired && (
              <div className={styles.errorBox}>
                Questa attività è scaduta — la data era il {new Date(activity.activityDate).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })}
              </div>
            )}  
          </div>

          {/* Hero */}
          <div className={styles.detailHero}>
            <div className={styles.detailHeroTop}>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                {(() => { const effectiveStatus = (activity.status === "Aperto" && isExpired) ? "Chiuso" : activity.status; return <span className={`${styles.statusBadge} ${getStatusClass(effectiveStatus ?? "")}`}>{effectiveStatus ?? "—"}</span>; })()}
              </div>
              <span className={styles.activityId}>#{activity._id}</span>
            </div>
            <h1 className={styles.detailTitle}>{activity.title}</h1>
            {trek && <div className={styles.detailTrekName}>Trek: <strong>{trek.name}</strong></div>}
            {activity.description && <p className={styles.detailDescription}>{activity.description}</p>}
          </div>

          {/* Info grid */}
          <div className={styles.detailGrid}>
            <div className={styles.detailCard}>
              <div>
                <span className={styles.detailCardLabel}>Data</span>
                <span className={styles.detailCardValue}>{formatDate(activity.activityDate)}</span>
                <span className={styles.detailCardSub}>ore {formatTime(activity.activityDate)}</span>
              </div>
            </div>

            <div className={styles.detailCard}>
              <div>
                <span className={styles.detailCardLabel}>Modalità</span>
                <span className={styles.detailCardValue}>{formatTravelMode(activity.travelMode ?? "")}</span>
              </div>
            </div>

            <div className={styles.detailCard}>
              <div>
                <span className={styles.detailCardLabel}>Partecipanti</span>
                <span className={styles.detailCardValue}>{participantCount} / {activity.maxParticipants}</span>
                <span className={styles.detailCardSub}>
                  {spotsLeft > 0 ? `${spotsLeft} post${spotsLeft === 1 ? "o" : "i"} disponibil${spotsLeft === 1 ? "e" : "i"}` : "Attività al completo"}
                </span>
              </div>
            </div>

            <div className={styles.detailCard}>
              <div>
                <span className={styles.detailCardLabel}>Organizzatore</span>
                <span className={styles.detailCardValue}>{organizerName}</span>
                {isOrganizer && <span className={styles.detailCardSub}>Sei tu l'organizzatore</span>}
              </div>
            </div>
          </div>

          {/* Trek details */}
          {trek && (trek.lengthKm || trek.duration || trek.difficulty || trek.description) && (
            <Link to={`/treks/${trek.id}`} className={styles.formCard}>
              <h2 className={styles.detailSectionTitle}>Dettagli del trek</h2>
              {trek.name && <p className={styles.activityName}>{trek.name}</p>}
              <div className={styles.activityInfo}>
                {trek.difficulty && <div className={styles.infoItem}><span className={styles.infoLabel}>Difficoltà</span><span className={styles.infoValue}>{trek.difficulty}</span></div>}
                {trek.lengthKm && <div className={styles.infoItem}><span className={styles.infoLabel}>Distanza</span><span className={styles.infoValue}>{trek.lengthKm} km</span></div>}
                {trek.duration && <div className={styles.infoItem}><span className={styles.infoLabel}>Durata stimata</span><span className={styles.infoValue}>{trek.duration}</span></div>}
              </div>
            </Link>
          )}

          {/* ── AZIONI ── */}
          <div className={styles.detailActions}>

            {/* Organizzatore */}
            {isOrganizer && (
              <>
                <div className={styles.buttonActions}>
                  {activity.status !== "Annullato" && (
                    <button className={styles.dangerButton} disabled={isExpired} onClick={() => setActiveModal("cancel")}>
                      Annulla attività
                    </button>
                  )}
                  {activity.status === "Annullato" && (
                    <button className={styles.dangerButton} disabled={isExpired} onClick={() => setActiveModal("uncancel")}>
                      Riattiva attività
                    </button>
                  )}
                  {activity.status !== "Annullato" && activity.status === "Chiuso" && participantCount < activity.maxParticipants && (
                    <button className={styles.dangerButton} disabled={isExpired} onClick={() => handleAction("open", "PATCH")}>
                      Apri attività
                    </button>
                  )}
                  {activity.status !== "Annullato" && activity.status === "Aperto" && (
                    <button className={styles.dangerButton} disabled={isExpired} onClick={() => handleAction("close", "PATCH")}>
                      Chiudi attività
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Può partecipare */}
            {canJoin && (
              <button className={appStyles.primaryButton} onClick={() => setActiveModal("join")}>
                Partecipa all'attività
              </button>
            )}

            {/* Non può partecipare */}
            {!isOrganizer && !isParticipant && activity.visibility === "public" && !canJoin && (
              <button className={appStyles.primaryButton} disabled>
                {activity.status !== "Aperto"
                  ? `Iscrizione non disponibile (${activity.status ?? ""})`
                  : "Attività al completo"}
              </button>
            )}

            {/* Già partecipante */}
            {isParticipant && (
              <>
                <div className={styles.buttonActions}>
                  <button className={styles.leaveButton} disabled={isExpired} onClick={() => setActiveModal("leave")}>
                    Lascia attività
                  </button>
                </div>
              </>
            )}

          </div>

        </div>

        {/* ── DESTRA ── */}
        <div className={appStyles.rightColumn}>
            {banner && (
              <Banner
                msg={banner.msg}
                type={banner.type}
                onClose={() => setBanner(null)}
              />
            )}
            <div className={appStyles.buttonBox}>
              <Link to="/attivita/visualizza" className={appStyles.primaryButton}>
                Lista attività
              </Link>
              <Link to="/attivita/crea" className={appStyles.primaryButton}>
                + Crea attività
              </Link>
            </div>

          <div className={styles.formCard}>
            <h2 className={styles.detailSectionTitle}>Partecipanti ({participantCount})</h2>

            {activity.partecipantList.length === 0 ? (
              <p className={styles.message}>Nessun partecipante ancora.</p>
            ) : (
              <ul className={styles.participantList}>
                {activity.partecipantList.map((p, i) => (
                  <li key={p._id} className={styles.participantItem}>
                    <div className={styles.participantAvatar}>
                      {(p.nickname?.[0] ?? p.email?.[0] ?? "?").toUpperCase()}
                    </div>
                    <div className={styles.participantInfo}>
                      <span className={styles.participantNickname}>
                        {p.nickname}
                        {i === 0 && <span className={styles.organizerTag}> (organizzatore) </span>}
                      </span>
                      {isOrganizer && <span className={styles.participantEmail}>{p.email}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {canInviteFriends && (
            <div className={styles.section}>
              <label className={styles.label}>
                Invita amici {spotsLeft > 0 ? `(max ${spotsLeft})` : "(nessun posto disponibile)"}
              </label>

              {spotsLeft <= 0 ? (
                <p className={styles.emptyFriends}>
                  Non ci sono posti disponibili per nuovi inviti.
                </p>
              ) : inviteableFriends.length === 0 ? (
                <p className={styles.emptyFriends}>
                  Non hai amici disponibili da invitare
                </p>
              ) : (
                <>
                  <input
                    className={styles.input}
                    placeholder="Cerca un amico..."
                    value={friendSearch}
                    onChange={(e) => setFriendSearch(e.target.value)}
                  />

                  <div className={styles.friendsList}>
                    {inviteableFriends
                      .filter(({ user: f }) =>
                        `${f.nome} ${f.cognome} ${f.nickname}`
                          .toLowerCase()
                          .includes(friendSearch.toLowerCase())
                      )
                      .map(({ friendshipId, user: friend }) => {
                        const isSelected = invitedUsers.includes(friend._id);
                        return (
                          <div
                            key={friendshipId}
                            onClick={() => toggleInvite(friend._id)}
                            className={`${styles.friendItem} ${isSelected ? styles.friendItemSelected : ""}`}
                          >
                            {friend.avatarUrl ? (
                              <img
                                src={friend.avatarUrl}
                                alt={friend.nickname}
                                className={styles.friendAvatar}
                              />
                            ) : (
                              <div className={styles.friendAvatarPlaceholder}>
                                {friend.nome?.[0]?.toUpperCase() ?? "?"}
                              </div>
                            )}
                            <div className={styles.friendInfo}>
                              <p className={styles.friendName}>
                                {friend.nome} {friend.cognome}
                              </p>
                              <p className={styles.friendNickname}>@{friend.nickname}</p>
                            </div>
                            <div className={styles.friendCheck}>
                              {isSelected ? (
                                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={2.5}>
                                  <circle cx={12} cy={12} r={10} />
                                  <path d="M8 12l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              ) : (
                                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="var(--border)" strokeWidth={2}>
                                  <circle cx={12} cy={12} r={10} />
                                </svg>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </>
              )}

              <button
                className={appStyles.primaryButton}
                onClick={sendInvites}
                disabled={actionLoading || invitedUsers.length === 0 || spotsLeft <= 0}
              >
                {actionLoading ? "Invio in corso..." : "Invia inviti"}
              </button>
            </div>
          )}

          {pendingInvites.length > 0 && isOrganizer && (
            <div className={styles.section}>
              <h2 className={styles.detailSectionTitle}>
                Inviti in attesa
                <span className={styles.sectionCount}>{pendingInvites.length}</span>
              </h2>

              <div className={styles.inviteList}>
                {pendingInvites.map((invite) => {
                  const receiver = invite.receiver;
                  return (
                    <div key={invite._id} className={styles.inviteCard}>
                      {receiver.avatarUrl ? (
                        <img src={receiver.avatarUrl} alt={receiver.nickname} className={styles.friendAvatar} />
                      ) : (
                        <div className={styles.friendAvatarPlaceholder}>
                          {receiver.nome?.[0]?.toUpperCase() ?? "?"}
                        </div>
                      )}
                      <div className={styles.inviteInfo}>
                        <p className={styles.friendName}>
                          {receiver.nome} {receiver.cognome}
                        </p>
                        <p className={styles.friendNickname}>@{receiver.nickname}</p>
                      </div>
                      <div className={styles.inviteActions}>
                        <span className={styles.pendingBadge}>In attesa</span>
                        <button
                          className={styles.leaveButton}
                          onClick={() => cancelInvite(invite._id)}
                          disabled={actionLoading}
                        >
                          Annulla invito
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {myInvite && !isParticipant && (
            <div className={styles.section}>
              <h2 className={styles.detailSectionTitle}>Invito ricevuto</h2>

              <div className={styles.inviteCard}>
                {myInvite.sender.avatarUrl ? (
                  <img src={myInvite.sender.avatarUrl} alt={myInvite.sender.nickname} className={styles.friendAvatar} />
                ) : (
                  <div className={styles.friendAvatarPlaceholder}>
                    {myInvite.sender.nome?.[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
                <div className={styles.inviteInfo}>
                  <p className={styles.friendName}>
                    {myInvite.sender.nome} {myInvite.sender.cognome}
                  </p>
                  <p className={styles.friendNickname}>@{myInvite.sender.nickname}</p>
                </div>
                <div className={styles.inviteActions}>
                  <button
                    className={styles.dangerButton}
                    onClick={() => declineInvite(myInvite._id)}
                    disabled={actionLoading}
                  >
                    Rifiuta
                  </button>
                  <button
                    className={appStyles.primaryButton}
                    onClick={() => acceptInvite(myInvite._id)}
                    disabled={actionLoading}
                  >
                    Accetta
                  </button>
                </div>
              </div>
            </div>
          )}
          
        </div>

      </div>

      {/* ── MODALI ── */}

      {/* Join */}
      {activeModal === "join" && (
        <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Conferma partecipazione</h2>
            <p className={styles.modalBody}>
              Il tuo <strong>nickname</strong> sarà visibile a tutti nella pagina dell'attività e la tua <strong>email</strong> sarà condivisa con l'organizzatore (<strong>{organizerName}</strong>).
            </p>
            <div className={styles.modalActions}>
              <button className={appStyles.secondaryButton} onClick={() => setActiveModal(null)} disabled={actionLoading}>Annulla</button>
              <button className={appStyles.primaryButton} onClick={() => handleAction("join", "POST")} disabled={actionLoading}>
                {actionLoading ? "Iscrizione in corso..." : "Conferma"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave */}
      {activeModal === "leave" && (
        <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Lascia attività</h2>
            <p className={styles.modalBody}>Sei sicuro di voler abbandonare questa attività? Potrai re-iscriverti finché ci sono posti disponibili.</p>
            <div className={styles.modalActions}>
              <button className={appStyles.secondaryButton} onClick={() => setActiveModal(null)} disabled={actionLoading}>Annulla</button>
              <button className={styles.dangerButton} onClick={() => handleAction("leave", "POST")} disabled={actionLoading}>
                {actionLoading ? "Attendere..." : "Lascia attività"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel */}
      {activeModal === "cancel" && (
        <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Annulla attività</h2>
            <p className={styles.modalBody}>Sei sicuro di voler annullare <strong>{activity.title}</strong>? Questa azione è reversibile.</p>
            <div className={styles.modalActions}>
              <button className={appStyles.secondaryButton} onClick={() => setActiveModal(null)} disabled={actionLoading}>Indietro</button>
              <button className={styles.dangerButton} onClick={() => handleAction("cancel", "PATCH")} disabled={actionLoading}>
                {actionLoading ? "Attendere..." : "Annulla attività"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Uncancel */}
      {activeModal === "uncancel" && (
        <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Riattiva attività</h2>
            <p className={styles.modalBody}>Sei sicuro di voler riattivare <strong>{activity.title}</strong>? Questa azione potrebbe riaprire l'attività a nuovi partecipanti.</p>
            <div className={styles.modalActions}>
              <button className={appStyles.secondaryButton} onClick={() => setActiveModal(null)} disabled={actionLoading}>Indietro</button>
              <button className={styles.dangerButton} onClick={() => handleAction("uncancel", "PATCH")} disabled={actionLoading}>
                {actionLoading ? "Attendere..." : "Riattiva attività"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === "delete" && (
        <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Elimina attività</h2>
            <p className={styles.modalBody}>
              Stai per eliminare definitivamente <strong>{activity.title}</strong> dal database.
              <br /><br />
              <strong>Questa operazione è irreversibile</strong> e non potrà essere annullata.
            </p>
            <div className={styles.modalActions}>
              <button className={appStyles.secondaryButton} onClick={() => setActiveModal(null)} disabled={actionLoading}>Annulla</button>
              <button className={styles.dangerButton} onClick={handleDelete} disabled={actionLoading}>
                {actionLoading ? "Eliminazione in corso..." : "Elimina definitivamente"}
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
