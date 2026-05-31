import { useEffect, useState } from "react";
import { http } from "../../auth/api";
import styles from "./Friends.module.css";


// Type amico dell'utente
type Friend = {
  friendshipId: string;
  user: {
    _id: string;
    nome: string;
    cognome: string;
    nickname: string;
    avatarUrl?: string;
  };
  since: string;
};

// Type richiesta di amicizia
type FriendRequest = {
  _id: string;
  sender?: {
    _id: string;
    nome: string;
    cognome: string;
    nickname: string;
    avatarUrl?: string;
  };
  receiver?: {
    _id: string;
    nome: string;
    cognome: string;
    nickname: string;
    avatarUrl?: string;
  };
  status: string;
  createdAt: string;
};

// Type utente trovato nella ricerca 
type SearchUser = {
   _id: string;
  nome: string;
  cognome: string;
  nickname: string;
  avatarUrl?: string;
};


/**
 * Pagina per la gestione delle amicizie.
 * Permette di cercare utenti, inviare richieste di amicizia,
 * gestire richieste in entrata e visualizzare la lista degli amici.
 *
 * @route /friends
 * @returns {JSX.Element} Pagina amicizie
 */
export default function Friends() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);


  useEffect(() => {
    loadAll();

    const interval = setInterval(() => {
      loadAll();  //refresh ogni 15 sec
    }, 15000); 

    return () => clearInterval(interval);
  }, []);
  
  // Carica amici e richiestae in entrata/uscita
  async function loadAll() {
    try {
      const [friendsData, incomingData, outgoingData] = await Promise.all([
        http<Friend[]>("/api/friendships"),
        http<FriendRequest[]>("/api/friendships/requests/incoming"),
        http<FriendRequest[]>("/api/friendships/requests/outgoing"),
      ]);
      setFriends(friendsData);
      setIncoming(incomingData);
      setOutgoing(outgoingData);

    } catch(err: unknown) {
      if(err instanceof Error) setError(err.message);
    }
  }


  //Cerca utenti per nickname, nome o cognome
  async function handleSearch() {
    if(searchQuery.trim().length < 2) return;
    setSearching(true);
    setError(null);
    try {
      const results = await http<SearchUser[]>(
        `/api/friendships/search?q=${encodeURIComponent(searchQuery.trim())}`
      );
      setSearchResults(results);

    } catch (err: unknown) {
      if(err instanceof Error) setError(err.message);
    } finally {
      setSearching(false);
    }
  }


  // Invia richiesta di amicizia
  async function sendRequest(userId: string) {
    setError(null);
    try {
      await http(`/api/friendships/request/${userId}`, { method: "POST" });
      setSuccessMsg("Richiesta inviata!");
      setSearchResults([]);
      setSearchQuery("");
      await loadAll();

    } catch(err: unknown) {
      if(err instanceof Error) setError(err.message);
    }
  }


  // Accetta richiesta di amicizia
  async function acceptRequest(friendshipId: string) {
    setError(null);
    try {
      await http(`/api/friendships/accept/${friendshipId}`, { method: "PUT" });
      setSuccessMsg("Amicizia accettata");
      await loadAll();

    } catch(err: unknown) {
      if (err instanceof Error) setError(err.message);
    }
  }


  // Rifiuta richiesta di amicizia
  async function declineRequest(friendshipId: string) {
    setError(null);
    try {
      await http(`/api/friendships/decline/${friendshipId}`, { method: "PUT" });
      setSuccessMsg("Amicizia rifiutata");
      await loadAll();

    } catch(err: unknown) {
      if (err instanceof Error) setError(err.message);
    }
  }


  // Rimuove amico dalla lista amici
  async function removeFriend(friendshipId: string) {
    setError(null);
    try {
      await http(`/api/friendships/${friendshipId}`, { method: "DELETE" });
      setSuccessMsg("Amico rimosso.");
      await loadAll();

    } catch(err: unknown) {
      if (err instanceof Error) setError(err.message);
    }
  }


  // Renderizza l'avatar di un utente
  function Avatar({ user } : { user: {
    nome?: string;
    avatarUrl?: string
  }}) {
    return user.avatarUrl ? (
       <img src={user.avatarUrl} alt="avatar" className={styles.avatar} />
    ) : (
      <div className={styles.avatarPlaceholder}>
        {user.nome?.[0]?.toUpperCase() ?? "?"}
      </div>
    );
  }


  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Amici</h1>

      {/* MESSAGGI */}
      {successMsg && (
        <p 
          className={styles.success} 
          onClick={() => setSuccessMsg(null)}
        >
          {successMsg}
        </p>
      )}
      {error && (
        <p
          className={styles.error} 
          onClick={() => setError(null)}
        >
          {error}
        </p>
      )}

      {/* CERCA UTENTI */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Cerca utenti</h2>
        <div className={styles.searchRow}>
          <input
            className={styles.input}
            placeholder="Cerca per nickname o nome..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.trim().length < 2) setSearchResults([]);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button 
            className={styles.btnPrimary}
            onClick={handleSearch}
            disabled={searching}
          >
            {searching ? "..." : "Cerca"}
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className={styles.list}>
            {searchResults.map((u) => (
              <div key={u._id} className={styles.card}>
                <Avatar user={u} />
                <div className={styles.info}>
                  <p className={styles.name}>{u.nome} {u.cognome}</p>
                  <p className={styles.nickname}>@{u.nickname}</p>
                </div>
                <button
                  className={styles.btnPrimary}
                  onClick={() => sendRequest(u._id)}
                >
                  Aggiungi
                </button>
              </div>
            ))}
          </div>
        )}

        {searchResults.length === 0 && searchQuery.length >= 2 && !searching && (
          <p className={styles.empty}>Nessun utente trovato.</p>
        )}
      </section>

      {/* RICHIESTE IN ENTRATA */}
      {incoming.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Richieste ricevute
            <span className={styles.badge}>{incoming.length}</span>
          </h2>
          <div className={styles.list}>
            {incoming.map((req) => (
              <div 
                key={req._id}
                className={styles.card}
              >
                <Avatar user={req.sender ?? {}} />
                <div className={styles.info}>
                  <p className={styles.name}>
                    {req.sender?.nome} {req.sender?.cognome}
                  </p>
                  <p className={styles.nickname}>@{req.sender?.nickname}</p>
                </div>
                <div className={styles.actions}>
                  <button
                    className={styles.btnPrimary}
                    onClick={() => acceptRequest(req._id)}
                  >
                    Accetta
                  </button>
                  <button
                    className={styles.btnDanger}
                    onClick={() => declineRequest(req._id)}
                  >
                    Rifiuta
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* RICHIESTE IN USCITA */}
      {outgoing.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Richieste inviate</h2>
          <div className={styles.list}>
            {outgoing.map((req) => (
              <div key={req._id} className={styles.card}>
                <Avatar user={req.receiver ?? {}} />
                <div className={styles.info}>
                  <p className={styles.name}>
                    {req.receiver?.nome} {req.receiver?.cognome}
                  </p>
                  <p className={styles.nickname}>@{req.receiver?.nickname}</p>
                </div>
                <span className={styles.pendingBadge}>In attesa</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* LISTA AMICI */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          I tuoi amici
          {friends.length > 0 && (
            <span className={styles.badge}>{friends.length}</span>
          )}
        </h2>

        {friends.length === 0 ? (
          <p className={styles.empty}>Non hai ancora amici</p>
        ) : (
          <div className={styles.list}>
            {friends.map(({ friendshipId, user: friend }) => (
              <div key={friendshipId} className={styles.card}>
                <Avatar user={friend} />
                <div className={styles.info}>
                  <p className={styles.name}>{friend.nome} {friend.cognome}</p>
                  <p className={styles.nickname}>@{friend.nickname}</p>
                </div>
                <button
                  className={styles.btnDanger}
                  onClick={() => removeFriend(friendshipId)}
                >
                  Rimuovi
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

    </main>
  );
}
