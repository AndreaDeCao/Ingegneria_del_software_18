import { useEffect, useState } from "react";
import styles from "./attivitaPage.module.css";
import appStyles from "../../App.module.css";

import type { Trek } from "../../types/Trek";
import { useAuth } from "../../auth/AuthProvider";
import { http } from "../../auth/api";
import { Link, useNavigate } from "react-router-dom";




// Type dell'amico di un utente
type Friend = {
  friendshipId: string;
  user: {
    _id: string;
    nome: string;
    cognome: string;
    nickname: string;
    avatarUrl?: string;
  };
};


/**
 * Pagina per creazione di una nuova attività.
 * Permette di selezionare trek, data, partecipanti, visibilità e amici da invitare.
 * 
 * @route /attivita/crea
 * @returns {JSX.Element} Form di creazione attività
 */
export default function CreaAttivitaPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [treks, setTreks] = useState<Trek[]>([]);
  const [title, setTitle] = useState("");
  const [selectedTrek, setSelectedTrek] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [activityDate, setActivityDate] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [travelMode, setTravelMode] = useState("");

  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [invitedUsers, setInvitedUsers] = useState<string[]>([]);
  const [friendSearch, setFriendSearch] = useState("");

  const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

  useEffect(() => {
    async function fetchTreks() {
      try {
        const res = await fetch(`${API_BASE}/treks/`);
        const data = await res.json();
        const sorted = data.sort((a: Trek, b: Trek) =>
          a.name.localeCompare(b.name)
      );
      setTreks(sorted);

      } catch(err) {
         console.error(err);
        setError("Errore nel caricamento dei trek");
      }
    }
    fetchTreks();
  }, []);

  // Carica lista amici
  useEffect(() => {
    http<Friend[]>("/api/friendships")
      .then((data) => setFriends(data))
      .catch((err: Error) =>
        console.error("Errore caricamento amici:", err.message)
    );
  }, []);


  /**
   * Gestisce la selezione del trek.
   * 
   * @param {string} trekID - ID del trek selezionato
   */
  function handleTrekChange(trekID: string) {
    setSelectedTrek(trekID);
  }


  /**
   * Gestisce selezione di amici da invitare.
   * 
   * @param {string} userId - ID dell'amico
   */
  function toggleInvite(userId: string) {
    setInvitedUsers((prev) => {
      if(prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      }
      if(prev.length >= maxParticipants - 1) {
        setError(`Puoi invitare al massimo ${maxParticipants - 1} amici`);
        return prev;
      }
      return [...prev, userId];
    });
  }


  /**
   * Gestisce l'invio del form di creazione attività.
   * 
   * @param {React.FormEvent} e - Evento submit del form
   */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const now = new Date();
    const selectedDate = new Date(activityDate);

    if(isNaN(selectedDate.getTime())) {
      setError("Data non valida");
      return;
    }

    if(selectedDate < now) {
      setError("La data deve essere futura");
      return;
    }

    try {
      const body = {
        title,
        description,
        activityDate: selectedDate.toISOString(),
        maxParticipants,
        trekID: selectedTrek,
        travelMode,
        visibility,
        invitedUsers,
        status: "Aperto",
        organizerID: user?._id,
      };

      // const res = await fetch("http://localhost:3000/activities", {
      const res = await fetch(`${API_BASE}/activities/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message /*|| "Errore backend"*/);
      }

      const created = await res.json();
      navigate(`/attivita/${created._id}`);

    } catch(err: unknown) {
      // console.error(err);
      if(err instanceof Error) setError(err.message || "Errore nella creazione attività");
    }
  }

  return (
    <main className={styles.page}>
      <div className={appStyles.contentLayout}>
        <div className={appStyles.leftColumn}>
          
          <div style={{ paddingBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',}}>
            <h1 className={styles.pageTitle}>Crea Attività</h1>
            <Link to="/attivita/visualizza" className={appStyles.primaryButton}>
              Apri Lista Attività
            </Link>
          </div>

          {/* FORM */}
          <form className={styles.formCard} onSubmit={handleSubmit}>
            
            {/* TITOLO */}
            <div className={styles.section}>
              <label className={styles.label}>Titolo attività</label>
              <input
                className={styles.input}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* TREK */}
            <div className={styles.section}>
              <label className={styles.label}>Trek</label>
              <select
                className={styles.input}
                value={selectedTrek}
                onChange={(e) => handleTrekChange(e.target.value)}
                required
              >
                <option value="">Seleziona un trek</option>
                {treks.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Modalità */}
            <div className={styles.section}>
              <label className={styles.label}>Modalità percorso</label>
              <select
                className={styles.input}
                value={travelMode}
                onChange={(e) => setTravelMode(e.target.value)}
                required
              >
                <option value="">Seleziona modalità</option>
                <option value="walking">A piedi</option>
                <option value="bicycling">In bici</option>
              </select>
            </div>

            {/* PARTECIPANTI E DATA */}
            <div className={styles.grid}>
              <div className={styles.section}>
                <label className={styles.label}>Partecipanti max</label>
                <input
                  className={styles.input}
                  type="number"
                  min={1}
                  max={50}
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(Number(e.target.value))}
                  required
                />
              </div>

              <div className={styles.section}>
                <label className={styles.label}>Data</label>
                <input
                  className={styles.input}
                  type="datetime-local"
                  value={activityDate}
                  onChange={(e) => setActivityDate(e.target.value)}
                  required
                />
              </div>
            </div>

          {/* DESCRIZIONE */}
          <div className={styles.section}>
            <label className={styles.label}>Descrizione</label>
            <textarea
              className={styles.textarea}
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Visibilità */}
          <div className={styles.section}>
            <label className={styles.label}>Visibilità</label>
            <select
              className={styles.input}
              value={visibility}
              onChange={(e) => {
                setVisibility(e.target.value as "public" | "private");
                setInvitedUsers([]);
              }}
            >
              <option value="public">Pubblica</option>
              <option value="private">Privata</option>
            </select>
          </div>

          {/* SELEZIONA AMICI */}
          <div className={styles.section}>
            <label className={styles.label}>
              Invita amici ({invitedUsers.length}/{maxParticipants - 1} posti disponibili)
            </label>

            {friends.length === 0 ? (
              <p className={styles.emptyFriends}>
                Non hai ancora amici da invitare
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
                {friends
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
                        <p className={styles.friendName}>{friend.nome} {friend.cognome}</p>
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
          </div>

          <button className={appStyles.primaryButton}>
            Crea attività
          </button>

          {error && (
            <div
              role="alert"
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 8,
                border: "1px solid #f5c6cb",
                background: "#fdecea",
                color: "#7a1f1f",
              }}
            >
              {error}
            </div>
          )}

          </form>
        </div>
      </div>
    </main>
  );
}