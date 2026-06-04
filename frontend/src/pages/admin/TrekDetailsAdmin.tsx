import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams, Link } from "react-router-dom";

import { useAuth } from "../../auth/AuthProvider";
import { http } from "../../auth/api";
import type { Trek } from "../../types/Trek";
import appStyles from "../../App.module.css";
import styles from "../Treks/TrekDetails.module.css";
import adminStyles from "../admin/AdminattivitaPage.module.css";

import StarRating from "../../components/StarRating";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

// ── Tipi locali ──────────────────────────────────────────────────────────────

interface SegnalazioneEntry {
  _id: string;
  titolo: string;
  data: string;
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
    stato: "pending" | "accepted" | "dismissed";
    gestitaDaAdmin: boolean;
    gestitaAt?: string | null;
  };
}

// ── Componente ───────────────────────────────────────────────────────────────

export default function TrekDetailsAdmin() {
  const { id } = useParams();
  const { user } = useAuth();

  const [trek, setTrek] = useState<Trek | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [segnalazioni, setSegnalazioni] = useState<SegnalazioneEntry[]>([]);
  const [segnalazioniLoading, setSegnalazioniLoading] = useState(false);
  const [segnalazioniError, setSegnalazioniError] = useState<string | null>(null);
  const [segnActionLoading, setSegnActionLoading] = useState(false);

  // Modifica descrizione
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState("");
  const [descSaving, setDescSaving] = useState(false);
  const [descError, setDescError] = useState<string | null>(null);
  const [descSuccess, setDescSuccess] = useState(false);

  const [closedLoading, setClosedLoading] = useState(false);
  const [closedError, setClosedError] = useState<string | null>(null);

  const messageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // ── Fetch trek ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${API_BASE}/treks/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Errore caricamento trek");
        return res.json();
      })
      .then(setTrek)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Fetch segnalazioni ───────────────────────────────────────────────────

  const fetchSegnalazioni = useCallback(async () => {
    if (!id) return;
    setSegnalazioniLoading(true);
    setSegnalazioniError(null);
    try {
      const data = await http<SegnalazioneEntry[]>(`/api/diary/segnalazioni?trekId=${id}`);
      setSegnalazioni(data);
    } catch (err: any) {
      setSegnalazioniError(err.message ?? "Errore nel caricamento delle segnalazioni");
    } finally {
      setSegnalazioniLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSegnalazioni();

    // Polling: aggiorna trek + segnalazioni ogni 30 secondi
    const pollInterval = setInterval(async () => {
      if (!id) return;
      try {
        const res = await fetch(`${API_BASE}/treks/${id}`);
        if (res.ok) setTrek(await res.json());
      } catch { /* silenzioso */ }
      fetchSegnalazioni();
    }, 30_000);

    return () => clearInterval(pollInterval);
  }, [fetchSegnalazioni, id]);

  // Salva descrizione modificata
  const handleSaveDescription = useCallback(async () => {
    if (!id) return;
    setDescSaving(true);
    setDescError(null);
    setDescSuccess(false);
    try {
      const updated = await http<Trek>(`/treks/${id}/description`, {
        method: "PATCH",
        body: JSON.stringify({ description: descDraft }),
      });
      setTrek(updated);
      setEditingDesc(false);
      setDescSuccess(true);
      setTimeout(() => setDescSuccess(false), 3000);
    } catch (err: any) {
      setDescError(err.message ?? "Errore nel salvataggio della descrizione");
    } finally {
      setDescSaving(false);
    }
  }, [id, descDraft]);

  // ── Toggle chiusura percorso ─────────────────────────────────────────────

  const handleToggleClosed = useCallback(async () => {
    if (!id) return;
    setClosedLoading(true);
    setClosedError(null);
    try {
      const result = await http<{ closed: boolean }>(`/treks/${id}/closed`, { method: "PATCH" });
      setTrek((prev) => prev ? { ...prev, closed: result.closed } : prev);
    } catch (err: any) {
      setClosedError(err.message ?? "Errore nel cambio stato del percorso");
    } finally {
      setClosedLoading(false);
    }
  }, [id]);

  // ── Azioni segnalazioni ──────────────────────────────────────────────────

  const showMessage = useCallback((msg: string) => {
    setActionMessage(msg);
    if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    messageTimerRef.current = setTimeout(() => setActionMessage(null), 4000);
  }, []);

  const handleSegnalazioneAction = useCallback(
    async (entryId: string, action: "accept" | "dismiss" | "reopen") => {
      setSegnActionLoading(true);
      try {
        await http(`/api/diary/segnalazioni/${entryId}/${action}`, {
          method: "PATCH",
        });
        await fetchSegnalazioni();
        const messages = {
          accept:  "Segnalazione accettata — il banner sarà visibile agli utenti.",
          dismiss: "Segnalazione rigettata.",
          reopen:  "Segnalazione riportata in attesa.",
        };
        //showMessage(messages[action]);
      } catch (err: any) {
        setSegnalazioniError(err.message ?? "Errore");
      } finally {
        setSegnActionLoading(false);
      }
    },
    [fetchSegnalazioni, showMessage]
  );

  // ── Dati derivati ────────────────────────────────────────────────────────

  const { pending, accepted, dismissed } = useMemo(() => ({
    pending:   segnalazioni.filter((s) => s.segnalazione.stato === "pending"   || (!s.segnalazione.stato && !s.segnalazione.gestitaDaAdmin)),
    accepted:  segnalazioni.filter((s) => s.segnalazione.stato === "accepted"),
    dismissed: segnalazioni.filter((s) => s.segnalazione.stato === "dismissed"),
  }), [segnalazioni]);

  // retrocompat alias
  const aperte  = pending;
  const gestite = [...accepted, ...dismissed];

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("it-IT", {
      day: "2-digit", month: "long", year: "numeric",
    });

  // ── Loading / error ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <main className={appStyles.main}>
        <p className={appStyles.message}>Caricamento percorso...</p>
      </main>
    );
  }

  if (error || !trek) {
    return (
      <main className={appStyles.main}>
        <p className={appStyles.messageError}>
          {error || "Errore nel caricamento del percorso"}
        </p>
      </main>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <main className={appStyles.main}>
      <div className={appStyles.contentLayout}>

        {/* ══ SINISTRA ══════════════════════════════════════════════════════ */}
        <section className={appStyles.leftColumn}>

          {/* Badge admin */}
          <div className={adminStyles.adminBadge}>
            Stai visualizzando questo percorso come amministratore
          </div>

          {/* Titolo + badge segnalazioni aperte */}
          <div className={appStyles.sectionHead} style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <h1 className={styles.pageTitle}>{trek.name}</h1>
            {aperte.length > 0 && (
              <span className={`${adminStyles.statusBadge} ${adminStyles.statusPendingReport}`}>
                {aperte.length} segnalaz. aperte
              </span>
            )}
            {trek.closed && (
              <span className={adminStyles.statusBadge} style={{ background: "#fee2e2", color: "#b91c1c" }}>
                Chiuso
              </span>
            )}
          </div>

          {/* Descrizione */}
          <div className={styles.section}>
            <h2 className={appStyles.sectionTitle}>Descrizione</h2>
            {editingDesc ? (
              <div>
                <textarea
                  rows={5}
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text)", resize: "vertical", fontSize: "0.9rem", boxSizing: "border-box" }}
                  value={descDraft}
                  onChange={(e) => setDescDraft(e.target.value)}
                />
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <button
                    className={appStyles.primaryButton}
                    onClick={handleSaveDescription}
                    disabled={descSaving}
                  >
                    {descSaving ? "Salvataggio…" : "Salva"}
                  </button>
                  <button
                    className={appStyles.secondaryButton}
                    onClick={() => { setEditingDesc(false); setDescError(null); }}
                    disabled={descSaving}
                  >
                    Annulla
                  </button>
                </div>
                {descError && (
                  <p style={{ color: "#b91c1c", fontSize: "0.85rem", marginTop: "0.4rem" }}>{descError}</p>
                )}
              </div>
            ) : (
              <div>
                <p className={appStyles.message}>
                  {trek.description || "Nessuna descrizione disponibile."}
                </p>
                {descSuccess && (
                  <p style={{ color: "#15803d", fontSize: "0.85rem", marginBottom: "0.4rem" }}>Descrizione aggiornata ✓</p>
                )}
                <button
                  className={appStyles.secondaryButton}
                  style={{ marginTop: "0.5rem" }}
                  onClick={() => { setDescDraft(trek.description ?? ""); setEditingDesc(true); setDescError(null); }}
                >
                  Modifica descrizione
                </button>
              </div>
            )}
          </div>

          {/* Info percorso */}
          <div className={styles.infoCard}>
            <h2 className={appStyles.sectionTitle}>
              Informazioni del percorso predefinito
            </h2>
            <div className={styles.infoContent}>
              <div>
                <p><strong>Difficoltà:</strong> {trek.difficulty ?? "—"}</p>
                <p><strong>Partenza:</strong> {trek.startPoint ?? "—"}</p>
                <p><strong>Arrivo:</strong> {trek.endPoint ?? "—"}</p>
                <p><strong>Durata:</strong> {trek.duration ?? "—"}</p>
              </div>
              <div>
                <p><strong>Lunghezza:</strong> {trek.lengthKm != null ? `${trek.lengthKm} km` : "—"}</p>
                <p><strong>Quota minima:</strong> {trek.minAltitude != null ? `${trek.minAltitude} m` : "—"}</p>
                <p><strong>Quota massima:</strong> {trek.maxAltitude != null ? `${trek.maxAltitude} m` : "—"}</p>
                <p><strong>Dislivello:</strong> {trek.elevationGain != null ? `${trek.elevationGain} m` : "—"}</p>
              </div>
            </div>
          </div>

          {/* ── PANNELLO ADMIN ── */}
          <div className={adminStyles.detailActions}>
            <div className={adminStyles.adminPanel}>
              <span className={adminStyles.adminPanelTitle}>Pannello amministratore — Segnalazioni percorso</span>

              {/* Feedback azione */}
              {actionMessage && (
                <p className={appStyles.message} style={{ marginTop: "0.5rem" }}>
                  {actionMessage}
                </p>
              )}

              {/* 
              {segnalazioniLoading && (
                <p className={appStyles.message}>Caricamento segnalazioni...</p>
              )}
              {segnalazioniError && (
                <p className={appStyles.messageError}>{segnalazioniError}</p>
              )} */}

              {!segnalazioniLoading && segnalazioni.length === 0 && (
                <p className={appStyles.message}>
                  Nessuna segnalazione per questo percorso.
                </p>
              )}

              {/* ── Segnalazioni in attesa ── */}
              {pending.length > 0 && (
                <div className={adminStyles.adminReportsSection}>
                  <span className={adminStyles.adminReportsSectionTitle}>
                    In attesa ({pending.length})
                  </span>

                  {pending.map((entry) => {
                    const utente = entry.userId;
                    const label = utente?.nickname
                      ? `@${utente.nickname}`
                      : utente?.email ?? "Utente sconosciuto";
                    const nomeCompleto = [utente?.nome, utente?.cognome].filter(Boolean).join(" ");

                    return (
                      <div key={entry._id} className={adminStyles.adminReportItem}>
                        <div className={adminStyles.adminReportMeta}>
                          <span className={adminStyles.adminReportDate}>
                            {formatDate(entry.createdAt)}
                          </span>
                        </div>

                        {utente?.nickname && (
                          <div className={adminStyles.adminReportContact}>
                            <span className={adminStyles.adminReportUser}> Nickname: {label}</span>
                            <span> - Email: {utente.email}</span>
                            {nomeCompleto && (
                              <span style={{ marginLeft: "12px" }}>Nome: {nomeCompleto}</span>
                            )}

                          </div>
                        )}

                        <p className={adminStyles.adminReportReason} style={{ fontWeight: 600, marginBottom: "0.2rem" }}>
                            {entry.segnalazione.tipo}: {entry.segnalazione.descrizione}
                        </p>

                        <div className={adminStyles.adminReportActions}>
                          <button
                            className={adminStyles.acceptReportButton}
                            onClick={() => handleSegnalazioneAction(entry._id, "accept")}
                            disabled={segnActionLoading}
                          >
                            Accetta
                          </button>
                          <button
                            className={adminStyles.dismissReportButton}
                            onClick={() => handleSegnalazioneAction(entry._id, "dismiss")}
                            disabled={segnActionLoading}
                          >
                            Rigetta
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── Segnalazioni accettate (banner attivo per utenti) ── */}
              {accepted.length > 0 && (
                <div className={adminStyles.adminReportsSection}>
                  <span className={adminStyles.adminReportsSectionTitle}>
                    Accettate — banner visibile agli utenti ({accepted.length})
                  </span>

                  {accepted.map((entry) => {
                    const utente = entry.userId;
                    const label = utente?.nickname
                      ? `@${utente.nickname}`
                      : utente?.email ?? "Utente sconosciuto";
                    const nomeCompleto = [utente?.nome, utente?.cognome].filter(Boolean).join(" ");

                    return (
                      <div key={entry._id} className={adminStyles.adminReportItem}>
                        <div className={adminStyles.adminReportMeta}>
                          <span
                            className={`${adminStyles.statusBadge} ${adminStyles.statusReported}`}
                            style={{ fontSize: "11px", padding: "3px 8px", color: "#15803d" }}
                          >
                            Accettata
                          </span>
                        </div>

                        {utente?.nickname && (
                          <div className={adminStyles.adminReportContact}>
                            <span className={adminStyles.adminReportUser}> Nickname: {label}</span>
                            <span> - Email: {utente.email}</span>
                            {nomeCompleto && (
                              <span style={{ marginLeft: "12px" }}>Nome: {nomeCompleto}</span>
                            )}

                          </div>
                        )}

                        <p className={adminStyles.adminReportReason} style={{ fontWeight: 600, marginBottom: "0.2rem" }}>
                          {entry.segnalazione.tipo}: {entry.segnalazione.descrizione}
                        </p>

                        <div className={adminStyles.adminReportActions}>
                          <button
                            className={adminStyles.dismissReportButton}
                            onClick={() => handleSegnalazioneAction(entry._id, "dismiss")}
                            disabled={segnActionLoading}
                            style={{ fontSize: "0.8rem" }}
                            title="Rimuove il banner dalle pagine degli utenti"
                          >
                            Rigetta (rimuovi banner)
                          </button>
                          <button
                            className={adminStyles.dismissReportButton}
                            onClick={() => handleSegnalazioneAction(entry._id, "reopen")}
                            disabled={segnActionLoading}
                            style={{ fontSize: "0.8rem" }}
                          >
                            Riporta in attesa
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── Segnalazioni rigettate ── */}
              {dismissed.length > 0 && (
                <div className={adminStyles.adminReportsSection}>
                  <span className={adminStyles.adminReportsSectionTitle}>
                    Rigettate ({dismissed.length})
                  </span>

                  {dismissed.map((entry) => {
                    const utente = entry.userId;
                    const label = utente?.nickname
                      ? `@${utente.nickname}`
                      : utente?.email ?? "Utente sconosciuto";
                    const nomeCompleto = [utente?.nome, utente?.cognome].filter(Boolean).join(" ");

                    return (
                      <div
                        key={entry._id}
                        className={adminStyles.adminReportItem}
                        style={{ opacity: 0.65 }}
                      >
                        <div className={adminStyles.adminReportMeta}>
                          <span
                            className={adminStyles.statusBadge}
                            style={{ fontSize: "11px", padding: "3px 8px", color: "#6b7280" }}
                          >
                            Rigettata
                          </span>
                        </div>

                        {utente?.nickname && (
                          <div className={adminStyles.adminReportContact}>
                            <span className={adminStyles.adminReportUser}> Nickname: {label}</span>
                            <span> - Email: {utente.email}</span>
                            {nomeCompleto && (
                              <span style={{ marginLeft: "12px" }}>Nome: {nomeCompleto}</span>
                            )}

                          </div>
                        )}

                        <p className={adminStyles.adminReportReason} style={{ fontWeight: 600, marginBottom: "0.2rem" }}>
                          {entry.segnalazione.tipo}: {entry.segnalazione.descrizione}
                        </p>

                        <div className={adminStyles.adminReportActions}>
                          <button
                            className={adminStyles.dismissReportButton}
                            onClick={() => handleSegnalazioneAction(entry._id, "reopen")}
                            disabled={segnActionLoading}
                            style={{ fontSize: "0.8rem" }}
                          >
                            Riporta in attesa
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          </div>

        </section>

        {/* ══ DESTRA ════════════════════════════════════════════════════════ */}
        <section className={appStyles.rightColumn}>
          <div className={styles.sidebar}>

            {/* Link navigazione */}
            <div className={appStyles.buttonBox}>
              <Link to="/treks" className={appStyles.primaryButton}>
                ← Lista percorsi
              </Link>
              <Link to="/admin/treks/crea" className={appStyles.primaryButton} style={{ marginTop: "0.5rem", display: "block" }}>
                + Crea nuovo percorso
              </Link>
            </div>

            {/* Toggle chiusura percorso */}
            <div className={styles.card}>
              <h3 className={appStyles.sectionTitle}>Stato percorso</h3>
              <p style={{ fontSize: "0.9rem", marginBottom: "0.6rem" }}>
                Il percorso e attualmente{" "}
                <strong style={{ color: trek.closed ? "#b91c1c" : "#15803d" }}>
                  {trek.closed ? "chiuso" : "aperto"}
                </strong>.
              </p>
              <button
                className={trek.closed ? appStyles.primaryButton : appStyles.secondaryButton}
                onClick={handleToggleClosed}
                disabled={closedLoading}
                style={{ width: "100%" }}
              >
                {closedLoading ? "Salvataggio…" : trek.closed ? "Riapri percorso" : "Chiudi percorso"}
              </button>
              {closedError && (
                <p style={{ color: "#b91c1c", fontSize: "0.85rem", marginTop: "0.4rem" }}>{closedError}</p>
              )}
            </div>

            {/* Valutazione */}
            <div className={styles.card}>
              <h3 className={appStyles.sectionTitle}>Valutazione media</h3>
              <div style={{ marginBottom: "0.75rem" }}>
                <StarRating rating={trek.averageRating ?? 0} />
                <p style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
                  {trek.averageRating
                    ? `${trek.ratingCount ?? 0} vot${(trek.ratingCount ?? 0) === 1 ? "o" : "i"}`
                    : "Nessuna valutazione ancora"}
                </p>
              </div>
            </div>

            {/* Riepilogo segnalazioni */}
            <div className={styles.card}>
              <h3 className={appStyles.sectionTitle}>Riepilogo segnalazioni</h3>
              <p style={{ fontSize: "0.9rem", margin: "0.25rem 0" }}>
                <strong>Totale:</strong> {segnalazioni.length}
              </p>
              <p style={{ fontSize: "0.9rem", margin: "0.25rem 0" }}>
                <strong>In attesa:</strong>{" "}
                <span style={{ color: pending.length > 0 ? "var(--color-warning, #d97706)" : "inherit" }}>
                  {pending.length}
                </span>
              </p>
              <p style={{ fontSize: "0.9rem", margin: "0.25rem 0" }}>
                <strong>Accettate (banner attivo):</strong>{" "}
                <span style={{ color: accepted.length > 0 ? "#15803d" : "inherit" }}>
                  {accepted.length}
                </span>
              </p>
              <p style={{ fontSize: "0.9rem", margin: "0.25rem 0" }}>
                <strong>Rigettate:</strong> {dismissed.length}
              </p>
            </div>

          </div>
        </section>

      </div>
    </main>
  );
}
