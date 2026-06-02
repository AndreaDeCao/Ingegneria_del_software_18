import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { http } from "../../auth/api";
import Modal from "../../components/Modal/Modal";
import styles from "./ProfilePage.module.css";

const VERIFY_MESSAGES: Record<string, { text: string; type: "success" | "error" }> = { 
  success: { text: "Email verificata con successo.",          type: "success" },
  invalid: { text: "Il link è scaduto o già utilizzato.",     type: "error"   },
  taken:   { text: "L'email è già in uso da un altro account.", type: "error" },
  error:   { text: "Qualcosa è andato storto. Riprova.",      type: "error"   },
};

// Type per notifiche utente
type UserNotification = {
  _id: string;
  type: string;
  message: string;
  read: boolean;
  status: "pending" | "accepted" | "rejected";
  ref: string | null;
  createdAt: string;
};

// Banner per messaggi di successo e errore
function Banner({ msg, type, onClose }: {
  msg: string;
  type: "success" | "error";
  onClose: () => void;
}): React.ReactElement {
  return (
    <div className={`${styles.banner} ${type === "success" ? styles.bannerSuccess : styles.bannerError}`}>
      <span>{msg}</span>
      <button className={styles.bannerClose} onClick={onClose} aria-label="Chiudi">✕</button>
    </div>
  );
}

/**
 * Pagina profilo utente.
 * Permette di visualizzare e modificare le informazioni personali e di eliminare l'account.
 *
 * @route /account/profile
 * @returns {JSX.Element} Pagina profilo con sezioni modifica e elimina account
 */
export default function ProfilePage() {
  const { logout, refreshUser } = useAuth();

  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();

  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Stato del modal
  const [activeModal, setActiveModal] = useState<
    "nome" | "cognome" | "nickname" | "email" | "password" | "elimina" | null
  >(null);

  // Valori temp nel modal
  const [tempValue, setTempValue] = useState("");

  const [avatar, setAvatar] = useState<string | null>(null);

  const [verifyStatus, setVerifyStatus] = useState<string | null>(
    () => searchParams.get("email-verified") 
  );

  const [passwordForm, setPasswordForm] = useState({
    current: "",
    next: "",
    confirm: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    next: false,
    confirm: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);       //per il cambio password passwrod
  const [isSubmittingField, setIsSubmittingField] = useState(false);     //per il cambio mail

  // Notifiche
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const unread = notifications.filter(n => !n.read).length;

  useEffect(() => {
  if (searchParams.get("email-verified")) {
    setSearchParams({}, { replace: true });
  }
}, [searchParams, setSearchParams]);

  // Carica dati utente
  useEffect(() => {
     http<{ nome: string; cognome: string; nickname: string; email: string; avatarUrl: string; }>(
    "/users/me"
    )
    .then((data) => {
      setNome(data.nome ?? "");
      setCognome(data.cognome ?? "");
      setNickname(data.nickname ?? "");
      setEmail(data.email ?? "");
      setAvatar(data.avatarUrl ?? null);     
    })
    .catch((err: Error) => setError(err.message))
    .finally(() => setLoading(false));
    }, []);

    // Carica notifiche utente
    useEffect(() => {
      http<UserNotification[]>("/users/me/notifications")
        .then(setNotifications)
        .catch(() => {});
    }, []);


    /**
     * Apre modal per modificare campo specifico.
     * 
     * @param field - Campo da modificare
     * @param currentValue - Valore attuale del campo
     */
    function openModal(
      field: "nome" | "cognome" | "nickname" | "email" | "elimina",
      currentValue = ""
    ) {
      setTempValue(currentValue);
      setActiveModal(field);
      setSuccessMsg(null);
      setError(null);
    }


    /**
     * Salva modifica del campo aperto nel modal.
     * 
     * @returns {Promise<void>}
     */
    async function handleSave() {
      if(!activeModal || activeModal === "elimina") return;
      if (isSubmittingField) return; // controllo come per pwd

      if (activeModal === "email") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(tempValue)) {
          setError("Inserisci un indirizzo email valido");
          return;
        }
      }

      const body: Record<string, string> = {
        nome,
        cognome,
        nickname,
        email,
        [activeModal]: tempValue,
      };

      // Validazione campo vuoto
      if (!tempValue.trim()) {
        setError("Il campo non può essere vuoto");
        return;
      }

      setIsSubmittingField(true); 

      try {
        await http<{ message: string }>("/users/me", {
          method:"PUT",
          body: JSON.stringify(body),
        });

        // Aggiorna stato locale
        if(activeModal === "nome") setNome(tempValue);
        if(activeModal === "cognome") setCognome(tempValue);
        if(activeModal === "nickname") setNickname(tempValue);
        if(activeModal === "email") {
          setSuccessMsg("Controlla la tua nuova email per confermare il cambio");
        } else {
          setSuccessMsg("Modificato con successo");
        }

        setActiveModal(null);
      } catch(err: unknown) {
        if(err instanceof Error) setError(err.message);
      } finally {
        setIsSubmittingField(false); // sblocca sempre
      }
    }


    /**
     * Elimina account utente e fa il logout.
     * 
     * @returns {Promise<void>}
     */
    async function handleDelete() {
      try {
        await http("/users/me", {
          method: "DELETE",
        });
        await logout();
      } catch (err: unknown) {
          if (err instanceof Error) setError(err.message);
      }
    }

/**
 * Aggiorna password dell'utente autenticato.
 * Prima della richiesta valida i requisiti e chiede la conferma.
 *
 * @returns {Promise<void>}
 */
    async function handlePasswordSave() {
      if (isSubmitting) return; //controllo prima di ulteriori invii
      
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,32}$/;

      if(passwordForm.next !== passwordForm.confirm) {
        setError("Le nuove password non coincidono");
        return;
      }
      if(!passwordRegex.test(passwordForm.next)) {
        setError("La password deve essere tra 6 e 32 caratteri e contenere almeno un numero, una lettera maiuscola e una minuscola");
        return;
      }

      if(passwordForm.next === passwordForm.current) {
        setError("La nuova password non può essere uguale a quella attuale");
        return;
      }

      setIsSubmitting(true);

      try {
        await http<{ message: string }>("/users/me/password", {
          method: "PUT",
          body: JSON.stringify({
            currentPassword: passwordForm.current,
            newPassword: passwordForm.next,
          }),
        });
        setSuccessMsg("Password aggiornata con successo");
        setPasswordForm({ current: "", next: "", confirm: "" });
        setActiveModal(null);

      } catch(err: unknown) {
        if (err instanceof Error) setError(err.message);
      } finally{
        setIsSubmitting(false); //sblocco 
      }
    }


    /**
     * Gestisce upload immagine profilo.
     * Converte il file in base64 e lo salva tramite API.
     *
     * @param e - Evento change dell'input file
     */
    async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0];
      if(!file) return;

      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target?.result as string;
        try {
          await http("/users/me/avatar", {
            method: "PUT",
            body: JSON.stringify({ avatarBase64: base64 }),
          });
          setAvatar(base64);
          await refreshUser();
          setSuccessMsg("Foto profilo aggiornata");
        } catch(err: unknown) {
          if(err instanceof Error) setError(err.message);
        }
      };
      reader.readAsDataURL(file);
    }


    /**
     * Elimina avatar dell'utente autenticato.
     *
     * @returns {Promise<void>}
     */
    async function handleAvatarDelete() {
      try {
        await http("/users/me/avatar", { method: "DELETE" });
        setAvatar(null);
        await refreshUser();
        setSuccessMsg("Foto profilo eliminata");

      } catch(err: unknown) {
        if(err instanceof Error) setError(err.message);
      }
    }


    /**
     * Marca tutte le notifiche come lette.
     * 
     * @returns {Promise<void>}
     */
    async function markAllRead() {
      try {
        await http("/users/me/notifications/read-all", { method: "PUT" });
        setNotifications(prev => prev.map(
          n => ({ ...n, read: true})
        ));

      } catch(err: unknown) {
          if(err instanceof Error) {
            setError(err.message);
          }
        }
    }


    /**
     * Marca una singola notifica come letta.
     * 
     * @param id - ID della notifica da marcare come letta
     * @returns {Promise<void>}
     */
    async function markOneRead(id: string) {
      try {
        await http(`/users/me/notifications/${id}/read`, { method: "PUT" });
        setNotifications(prev => prev.map(
          n => n._id === id ? { ...n, read: true } : n
        ));

      } catch {
        //silenzioso
      }
    }


    /**
     * Accetta o rifiuta una notifica di tipo friend_request o activity_invite.
     * Inoltre aggiorna status della notifica e chiama l'endpoint.
     * 
     * @param notif - Notifica su cui agire
     * @param action - Azione da eseguire
     * @returns {Promise<void>}
     */
    async function handleNotifAction(notif: UserNotification, action: "accept" | "reject") {
      const endpoint =
        notif.type === "friend_request"
          ? `/api/friendships/${action === "accept" ? "accept" : "decline"}/${notif.ref}`
          : `/activities/${notif.ref}/${action}-invite`;

      try {
        await http(endpoint, { method: "PUT" });
        await http(`/users/me/notifications/${notif._id}/status`, {
          method: "PUT",
          body: JSON.stringify({ status: action === "accept" ? "accepted" : "rejected" }),
        });
        setNotifications(prev => prev.map(
          n => n._id === notif._id
            ? { ...n, read: true, status: action === "accept" ? "accepted" : "rejected" }
            : n
        ));

      } catch(err: unknown) {
        if(err instanceof Error) {
          setError(err.message);
        }
      }
    }


    /**
     * Elimina tutte le notifiche dell'utente.
     * 
     * @returns {Promise<void>}
     */
    async function clearNotifications() {
      try {
        await http("/users/me/notifications", { method: "DELETE" });
        setNotifications([]);

      } catch(err) {
        if (err instanceof Error) setError(err.message);
      }
    }

    if(loading) {
      return <p className={styles.message}>Caricamento profilo...</p>
    }

    return (
      <main className={styles.main}>

        {/* MESSAGGI */}
        {successMsg && 
        <Banner 
          msg={successMsg}
          type="success"
          onClose={() => setSuccessMsg(null)}
        />}
        {error &&
        <Banner 
          msg={error}
          type="error"
          onClose={() => setError(null)}
        />}

        {/* AVATAR */}
        <section className={styles.avatarSection}>
          <div className={styles.avatarWrapper}>
            {avatar ? (
              <img src={avatar} alt="avatar" className={styles.avatarImg} />
            ) : (
              <div className={styles.avatarPlaceholder}>
                <svg width={40} height={40} viewBox="0 0 24 24" fill="white">
                  <circle cx={12} cy={8} r={4}/>
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
              </div>
            )}
          </div>

          <div className={styles.avatarInfo}>
            <p className={styles.label}>{nome} {cognome}</p>
            <p className={styles.hint}>@{nickname}</p>
            <div className={styles.avatarBtn}>
              <label className={styles.avatarEditBtn}>
                Cambia foto
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleAvatarUpload}
                />
              </label>
              {avatar && (
                <button
                  className={styles.avatarDeleteBtn}
                  onClick={handleAvatarDelete}
                >
                  Rimuovi foto
                </button>
              )}
            </div>
          </div>  

          {/* NOTIFICHE */}
            <button 
              className={styles.notifBtn}
              onClick={() => setNotificationsOpen(true)}
              aria-label="Notifications"
            >
              Notifiche
              {unread > 0 && (
                <span className={styles.notifBadge}>{unread}</span>
              )}
            </button>       
        </section>

        {/* INFO ACCOUNT */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Informazioni account</h2>

          <div className={styles.row}>
            <span className={styles.label}>Nome</span>
            <div className={styles.rowRight}>
              <span className={styles.value}>{nome}</span>
              <button className={styles.editBtn} onClick={() => openModal("nome", nome)}>
                Modifica
              </button>
            </div>
          </div>

          <div className={styles.row}>
            <span className={styles.label}>Cognome</span>
            <div className={styles.rowRight}>
              <span className={styles.value}>{cognome}</span>
              <button className={styles.editBtn} onClick={() => openModal("cognome", cognome)}>
                Modifica
              </button>
            </div>
          </div>

          <div className={styles.row}>
            <span className={styles.label}>Nickname</span>
            <div className={styles.rowRight}>
              <span className={styles.value}>{nickname}</span>
              <button className={styles.editBtn} onClick={() => openModal("nickname", nickname)}>
                Modifica
              </button>
            </div>
          </div>

          <div className={styles.row}>
            <span className={styles.label}>Email</span>
            <div className={styles.rowRight}>
              <span className={styles.value}>{email}</span>
              <button className={styles.editBtn} onClick={() => openModal("email", email)}>
                Modifica
              </button>
            </div>
          </div>

          <div className={styles.row}>
            <span className={styles.label}>Password</span>
            <div className={styles.rowRight}>
              <span className={styles.value}>••••••••</span>
              <button 
                className={styles.editBtn} 
                onClick={() => {
                  setPasswordForm({ current: "", next: "", confirm: ""});
                  setActiveModal("password");
                  setSuccessMsg(null);
                  setError(null);
                }}
              >
                Modifica
              </button>
            </div>
          </div>

        </section>

        <hr className={styles.divider}/>

        {/* ELIMINA ACCOUNT */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Elimina account</h2>
          <div className={styles.row}>
            <div>
              <p className={styles.label}>Chiudi il tuo account</p>
              <p className={styles.hint}>Questa azione è irreversibile</p>
            </div>
            <button
              className={styles.deleteBtn}
              onClick={() => setActiveModal("elimina")}
            >
              Elimina account
            </button>
          </div>
        </section>

        {/* CAMBIO PASSWORD NEL MODAL */}
        <Modal
          isOpen={activeModal === "password"}
          onClose={() => setActiveModal(null)}
          title="Cambia password"
        >
          <label className={styles.fieldLabel}>Password attuale</label>
          <div className={styles.inputWrapper}>
            <input
              className={styles.input}
              type={showPasswords.current ? "text" : "password"}
              autoComplete="current-password"
              value={passwordForm.current}
              onChange={(e) => setPasswordForm((p) => ({ ...p, current: e.target.value }))}
              autoFocus
            />
            <button
              type="button"
              className={styles.eyeBtn}
              onClick={() => setShowPasswords((p) => ({ ...p, current: !p.current }))}
              aria-label={showPasswords.current ? "Nascondi password" : "Mostra password"}
            >
              <i className={showPasswords.current ? "ti ti-eye" : "ti ti-eye-off"} aria-hidden="true" />
            </button>
          </div>

          <label className={styles.fieldLabel}>Nuova password</label>
          <div className={styles.inputWrapper}>
            <input
              className={styles.input}
              type={showPasswords.next ? "text" : "password"}
              autoComplete="new-password"
              value={passwordForm.next}
              onChange={(e) => setPasswordForm((p) => ({ ...p, next: e.target.value }))}
            />
            <button
              type="button"
              className={styles.eyeBtn}
              onClick={() => setShowPasswords((p) => ({ ...p, next: !p.next }))}
              aria-label={showPasswords.next ? "Nascondi password" : "Mostra password"}
            >
              <i className={showPasswords.next ? "ti ti-eye" : "ti ti-eye-off"} aria-hidden="true" />
            </button>
          </div>

          <label className={styles.fieldLabel}>Conferma nuova password</label>
          <div className={styles.inputWrapper}>
            <input
              className={styles.input}
              type={showPasswords.confirm ? "text" : "password"}
              autoComplete="new-password"
              value={passwordForm.confirm}
              onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && handlePasswordSave()}
            />
            <button
              type="button"
              className={styles.eyeBtn}
              onClick={() => setShowPasswords((p) => ({ ...p, confirm: !p.confirm }))}
              aria-label={showPasswords.confirm ? "Nascondi password" : "Mostra password"}
            >
              <i className={showPasswords.confirm ? "ti ti-eye" : "ti ti-eye-off"} aria-hidden="true" />
            </button>
          </div>

          {error && <p className={styles.errorBanner}>{error}</p>}

          <div className={styles.modalActions}>
            <button className={styles.cancelBtn} onClick={() => setActiveModal(null)}>
              Annulla
            </button>
            <button 
              className={styles.saveBtn} 
              onClick={handlePasswordSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Salvataggio..." : "Salva"}
            </button>
          </div>
        </Modal>

        {/* MODIFICA CAMPO NEL MODAL */}
        <Modal
          isOpen={activeModal !== null && activeModal !== "password" && activeModal !== "elimina"}
          onClose={() => setActiveModal(null)}
          title={`Modifica ${activeModal ?? ""}`}
        >
          <input
            className={styles.input}
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            type={activeModal === "email" ? "email" : "text"}
            autoFocus
          />
          <div className={styles.modalActions}>
            <button 
              className={styles.cancelBtn} 
              onClick={() => setActiveModal(null)}
            >
              Annulla
            </button>
           <button
              className={styles.saveBtn}
              onClick={handleSave}
              disabled={isSubmittingField}
            >
              {isSubmittingField ? "Salvataggio..." : "Salva"}
            </button>
          </div>
        </Modal>

        {/* CONFERMA ELIMINA NEL MODAL*/}
        <Modal
          isOpen={activeModal === "elimina"}
          onClose={() => setActiveModal(null)}
          title="Elimina account"
        >
          <p className={styles.hint}>
            Sei sicuro di voler eliminare il tuo account? Questa azione è irreversibile
          </p>
          <div className={styles.modalActions}>
            <button 
              className={styles.cancelBtn}
              onClick={() => setActiveModal(null)}
            >
              Annulla
            </button>
            <button 
              className={styles.deleteBtn} 
              onClick={handleDelete}
            >
              Elimina
            </button>
          </div>
        </Modal>

        {/* CONFERMA VERIFICA EMAIL NEL MODAL */}
        <Modal
        isOpen={verifyStatus !== null}
        onClose={() => setVerifyStatus(null)}
        title={verifyStatus === "success" ? "Email verificata" : "Verifica email"}
      >
        {verifyStatus && (
          <p className={
            VERIFY_MESSAGES[verifyStatus]?.type === "success"
              ? styles.success
              : styles.error
          }>
            {VERIFY_MESSAGES[verifyStatus]?.text ?? "Errore sconosciuto"}
          </p>
        )}
        <div className={styles.modalActions}>
          <button className={styles.saveBtn} onClick={() => setVerifyStatus(null)}>
            OK
          </button>
        </div>
      </Modal>

      {/* MODAL NOTIFICHE */}
      <Modal
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        title="Notifiche"
      >
        {notifications.length === 0 ? (
          <p className={styles.hint}>Nessuna notifica</p>
        ) : (
          <>
            <div className={styles.notifHeader}>
              {unread > 0 && (
                <button 
                  className={styles.markAllBtn}
                  onClick={markAllRead}
                >
                  Contrassegna come tutte lette
                </button>
              )}
              <button 
                  className={styles.clearNotifications}
                  onClick={clearNotifications}
                >
                  Elimina tutto
                </button>
            </div>
            <div className={styles.notifList}>
              {notifications.map(n => {
                const isActivityInvite = n.type === "activity_invite" && n.ref;
                const isFriendRequest  = n.type === "friend_request"  && n.ref;
                const isPending        = n.status === "pending" && !n.read;

                return (
                  <div
                    key={n._id}
                    className={`
                        ${styles.notifItem} 
                        ${!n.read ? styles.notifUnread : styles.notifRead} 
                        ${isActivityInvite || isFriendRequest ? styles.notifClickable : ""}
                    `}
                    onClick={async () => {
                      if(!n.read) {
                        await markOneRead(n._id);
                      }
                      if(isActivityInvite) {
                        setNotificationsOpen(false);
                        navigate(`/attivita/${n.ref}`);
                      } else {
                        setNotificationsOpen(false);
                        navigate("/friends");
                      }
                    }}
                  >
                    <p className={styles.notifMsg}>{n.message}</p>
                    <div className={styles.notifFooter}>
                      <p className={styles.notifDate}>
                        {new Date(n.createdAt).toLocaleDateString(
                          "it-IT", { day: "2-digit", month: "short", year: "numeric", }
                        )}
                      </p>
                      {n.status === "accepted" && (
                        <span className={styles.notifTagAccepted}>Accettato</span>
                      )}
                      {n.status === "rejected" && (
                        <span className={styles.notifTagRejected}>Rifiutato</span>
                      )}
                    </div>
                    {isPending && (isFriendRequest || isActivityInvite) && (
                      <div className={styles.notifActions}>
                        <button
                          className={styles.notifAcceptBtn}
                          onClick={async (e) => {
                            e.stopPropagation();
                            await handleNotifAction(n, "accept");
                          }}
                        >
                          Accetta
                        </button>
                        <button
                          className={styles.notifRejectBtn}
                          onClick={async (e) => {
                            e.stopPropagation();
                            await handleNotifAction(n, "reject");
                          }}
                        >
                          Rifiuta
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Modal>

    </main>
  );

}