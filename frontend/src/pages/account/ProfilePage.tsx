import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { http } from "../../auth/api";
import Modal from "../../components/Modal/Modal";
import styles from "./ProfilePage.module.css";


/**
 * Pagina profilo utente.
 * Permette di visualizzare e modificare le informazioni personali e di eliminare l'account.
 *
 * @route /account/profile
 * @returns {JSX.Element} Pagina profilo con sezioni modifica e elimina account
 */
export default function ProfilePage() {
  const { logout } = useAuth();

  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Stato del modal
  const [activeModal, setActiveModal] = useState<
    "nome" | "cognome" | "nickname" | "email" | "elimina" | null
  >(null);

  // Valori temp nel modal
  const [tempValue, setTempValue] = useState("");

  // Carica dati utente
  useEffect(() => {
     http<{ nome: string; cognome: string; nickname: string; email: string }>(
    "/users/me"
    )
    .then((data) => {
      setNome(data.nome ?? "");
      setCognome(data.cognome ?? "");
      setNickname(data.nickname ?? "");
      setEmail(data.email ?? "");
    })
    .catch((err: Error) => setError(err.message))
    .finally(() => setLoading(false));
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
     */
    async function handleSave() {
      if(!activeModal || activeModal === "elimina") return;

      const body: Record<string, string> = {
        nome,
        cognome,
        nickname,
        email,
        [activeModal]: tempValue,
      };

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
          setEmail(tempValue);
          setSuccessMsg("Controlla la tua nuova email per confermare il cambio");
        } else {
          setSuccessMsg("Modificato con successo");
        }

        setActiveModal(null);
      } catch(err: unknown) {
        if(err instanceof Error) setError(err.message);
      }
    }


    /**
     * Elimina account utente e fa il logout.
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

    if(loading) {
      return <p className={styles.message}>Caricamento profilo...</p>
    }

    return (
      <main className={styles.main}>

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

        {/* MESSAGGI */}
        {successMsg && <p className={styles.success}>{successMsg}</p>}
        {error && <p className={styles.error}>{error}</p>}

        {/* MODIFICA CAMPO NEL MODAL */}
        <Modal
          isOpen={activeModal !== null && activeModal !== "elimina"}
          onClose={() => setActiveModal(null)}
          title={`Modifica ${activeModal ?? ""}`}
        >
          <input
            className={styles.input}
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
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
            >
              Salva
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

      </main>
    )

}