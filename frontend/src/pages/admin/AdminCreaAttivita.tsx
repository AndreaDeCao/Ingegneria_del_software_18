import { useEffect, useState } from "react";
import styles from "../attivita/attivitaPage.module.css";
import adminStyles from "./AdminattivitaPage.module.css";
import appStyles from "../../App.module.css";

import type { Trek } from "../../types/Trek";
import { useAuth } from "../../auth/AuthProvider";
import { http } from "../../auth/api";
import { Link, useNavigate } from "react-router-dom";


/**
 * Pagina per la creazione di una nuova attività da parte di un amministratore.
 * 
 * A differenza della pagina utente:
 * - L'admin non viene aggiunto come partecipante.
 * - Non è possibile invitare amici (l'admin non ha una lista amici rilevante).
 * - È possibile impostare lo status iniziale dell'attività.
 * - È possibile marcare l'attività come sospesa già in fase di creazione.
 * 
 * @route /admin/attivita/crea
 * @returns {JSX.Element} Form di creazione attività per admin
 */
export default function AdminCreaAttivita() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [treks, setTreks] = useState<Trek[]>([]);
  const [title, setTitle] = useState("");
  const [selectedTrek, setSelectedTrek] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [activityDate, setActivityDate] = useState("");
  const [description, setDescription] = useState("");
  const [travelMode, setTravelMode] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [initialStatus, setInitialStatus] = useState<"Aperto" | "Chiuso" | "Annullato">("Aperto");
  const [suspendedReason, setSuspendedReason] = useState("");
  const [markSuspended, setMarkSuspended] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

  useEffect(() => {
    async function fetchTreks() {
      try {
        const res = await fetch(`${API_BASE}/treks/`);
        const data = await res.json();
        const sorted = data.sort((a: Trek, b: Trek) => a.name.localeCompare(b.name));
        setTreks(sorted);
      } catch (err) {
        console.error(err);
        setError("Errore nel caricamento dei trek");
      }
    }
    fetchTreks();
  }, []);


  /**
   * Gestisce l'invio del form.
   * 
   * @param {React.FormEvent} e - Evento submit del form
   */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const now = new Date();
    const selectedDate = new Date(activityDate);

    if (isNaN(selectedDate.getTime())) {
      setError("Data non valida");
      setSubmitting(false);
      return;
    }

    if (selectedDate < now) {
      setError("La data deve essere futura");
      setSubmitting(false);
      return;
    }

    if (markSuspended && !suspendedReason.trim()) {
      setError("Inserisci un motivo per la sospensione");
      setSubmitting(false);
      return;
    }

    try {
      const body: Record<string, unknown> = {
        title,
        description,
        activityDate: selectedDate.toISOString(),
        maxParticipants,
        trekID: selectedTrek || undefined,
        travelMode,
        visibility,
        status: initialStatus,
        organizerID: user?._id,
        invitedUsers: [],
      };

      if (markSuspended) {
        body.suspended = true;
        body.suspendedReason = suspendedReason.trim();
        body.suspendedBy = user?._id;
        body.suspendedAt = new Date().toISOString();
        body.statusBeforeSuspend = initialStatus;
        body.status = "Annullato";
      }

      const created = await http<{ _id: string }>("/activities/", {
        method: "POST",
        body: JSON.stringify(body),
      });

      navigate(`/admin/attivita/${created._id}`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Errore nella creazione attività");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={appStyles.contentLayout}>
        <div className={appStyles.leftColumn}>

          <div style={{ paddingBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 className={styles.pageTitle}>Crea Attività (Admin)</h1>
            <Link to="/admin/attivita/visualizza" className={appStyles.primaryButton}>
              Lista Attività
            </Link>
          </div>

          <div className={adminStyles.adminBadge}>
            Stai creando un'attività come amministratore. Non verrai aggiunto come partecipante.
          </div>

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
                onChange={(e) => setSelectedTrek(e.target.value)}
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

            {/* MODALITA */}
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

            {/* STATUS INIZIALE — controllo esclusivo admin */}
            <div className={styles.section}>
              <label className={styles.label}>Status iniziale</label>
              <select
                className={styles.input}
                value={initialStatus}
                onChange={(e) => setInitialStatus(e.target.value as "Aperto" | "Chiuso" | "Annullato")}
                disabled={markSuspended}
              >
                <option value="Aperto">Aperto</option>
                <option value="Chiuso">Chiuso</option>
                <option value="Annullato">Annullato</option>
              </select>
              {markSuspended && (
                <p style={{ marginTop: 6, fontSize: "0.85rem", color: "var(--text-muted, #888)" }}>
                  Lo status viene impostato automaticamente ad Annullato quando l'attività è sospesa.
                </p>
              )}
            </div>

            {/* SOSPENSIONE — controllo esclusivo admin */}
            <div className={styles.section}>
              <label className={styles.label} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={markSuspended}
                  onChange={(e) => {
                    setMarkSuspended(e.target.checked);
                    if (!e.target.checked) setSuspendedReason("");
                  }}
                  style={{ width: 16, height: 16 }}
                />
                Crea attività già sospesa
              </label>

              {markSuspended && (
                <div style={{ marginTop: 10 }}>
                  <label className={styles.label}>Motivo sospensione</label>
                  <textarea
                    className={styles.textarea}
                    rows={3}
                    value={suspendedReason}
                    onChange={(e) => setSuspendedReason(e.target.value)}
                    placeholder="Inserisci il motivo della sospensione (obbligatorio)"
                    required={markSuspended}
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              className={appStyles.primaryButton}
              disabled={submitting}
            >
              {submitting ? "Creazione in corso..." : "Crea attività"}
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
