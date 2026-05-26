import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "../../auth/api";
import type { DiaryEntry } from "../../types/Diary";
import appStyles from "../../App.module.css";
import styles from "./Diario.module.css";

export default function VisualizzaDiarioPage() {
  const navigate = useNavigate();
  const [entries, setEntries]         = useState<DiaryEntry[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [deleting, setDeleting]       = useState<string | null>(null);
  const [expanded, setExpanded]       = useState<string | null>(null);
  const [editing, setEditing]         = useState<string | null>(null);
  const [editNote, setEditNote]       = useState("");
  const [editTitolo, setEditTitolo]   = useState("");
  const [editValutazione, setEditValutazione] = useState<number | null>(null);
  const [editHover, setEditHover]     = useState<number | null>(null);
  const [saving, setSaving]           = useState(false);

  useEffect(() => {
    http<DiaryEntry[]>("/api/diary")
      .then(setEntries)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Eliminare questa voce?")) return;
    setDeleting(id);
    try {
      await http(`/api/diary/${id}`, { method: "DELETE" });
      setEntries(prev => prev.filter(e => e._id !== id));
    } catch (e: any) {
      alert(e.message);
    } finally {
      setDeleting(null);
    }
  }

  function startEdit(entry: DiaryEntry) {
    setEditing(entry._id);
    setEditTitolo(entry.titolo);
    setEditNote(entry.note ?? "");
    setEditValutazione(entry.valutazione ?? null);
  }

  async function saveEdit(id: string) {
    setSaving(true);
    try {
      const updated = await http<DiaryEntry>(`/api/diary/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          titolo: editTitolo,
          note: editNote,
          valutazione: editValutazione ?? undefined,
        }),
      });
      setEntries(prev => prev.map(e => e._id === id ? updated : e));
      setEditing(null);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <main className={appStyles.main}>
      <p className={appStyles.message}>Caricamento diario...</p>
    </main>
  );

  if (error) return (
    <main className={appStyles.main}>
      <p className={appStyles.messageError}>{error}</p>
    </main>
  );

  return (
    <main className={appStyles.main}>
      <div className={styles.pageLayout}>
      <header className={styles.pageHeader}>
        <div className={styles.pageHeaderTop}>
          <h1 className={`${styles.pageTitle} ${styles.pageTitleInHeader}`}>Il mio diario</h1>
          <p className={styles.pageSubtitle}>
            {entries.length === 1 ? "1 voce salvata" : `${entries.length} voci salvate`}
          </p>
        </div>
        <div className={styles.pageHeaderActions}>
          <button
            className={styles.newEntryButton}
            onClick={() => navigate("/diario/crea")}
            aria-label="Crea una nuova voce del diario"
          >
            + Nuova voce
          </button>
        </div>
      </header>

      {entries.length === 0 ? (
        <div className={styles.emptyState}>
          <p style={{ fontSize: "3rem" }}>📖</p>
          <p>Il tuo diario è ancora vuoto.</p>
          <button className={styles.saveButton} onClick={() => navigate("/diario/crea")}>
            Crea la prima voce
          </button>
        </div>
      ) : (
        <div className={styles.entriesList}>
          {entries.map(entry => (
            <div key={entry._id} className={styles.entryCard} onClick={() => navigate(`/diario/${entry._id}`)} style={{ cursor: "pointer" }}>

              {/* HEADER */}
              <div className={styles.entryHeader}>
                <div className={styles.entryHeaderLeft}>
                  {/* data pill */}
                  <span className={styles.datePill}>
                    {new Date(entry.data).toLocaleDateString("it-IT", {
                      day: "2-digit", month: "short", year: "numeric"
                    })}
                  </span>

                  {editing === entry._id ? (
                    <input
                      className={styles.editTitleInput}
                      value={editTitolo}
                      onChange={e => setEditTitolo(e.target.value)}
                      onClick={(e) => { e.stopPropagation();}}
                    />
                  ) : (
                    <h2 className={styles.entryTitle}>{entry.titolo}</h2>
                  )}

                  <p className={styles.entryMeta}>
                    {entry.trekId && <span>🥾 {entry.trekId.name} · {entry.trekId.difficulty}</span>}
                    {entry.percorsoPersonalizzato && <span>🗺 {entry.percorsoPersonalizzato}</span>}
                  </p>
                </div>

                <div className={styles.entryBadges}>
                  {entry.completato !== false && <span className={styles.badge}>✅ Completato</span>}
                  {entry.valutazione && (
                    <span className={styles.badge}>
                      {"★".repeat(entry.valutazione)}{"☆".repeat(5 - entry.valutazione)}
                    </span>
                  )}
                  {entry.segnalazione?.tipo && (
                    <span className={`${styles.badge} ${styles.badgeWarn}`}>⚠ {entry.segnalazione.tipo}</span>
                  )}
                </div>
              </div>

              {/* NOTE / EDIT */}
              {editing === entry._id ? (
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Note</label>
                  <textarea
                    className={styles.textarea}
                    rows={4}
                    value={editNote}
                    onChange={e => setEditNote(e.target.value)}
                    onClick={(e) => { e.stopPropagation(); }}
                  />
                  <label className={styles.label}>Valutazione</label>
                  <div className={styles.starsRow}>
                    {[1,2,3,4,5].map(star => (
                      <button
                        key={star}
                        className={styles.starButton}
                        onMouseEnter={() => setEditHover(star)}
                        onMouseLeave={() => setEditHover(null)}
                        onClick={(e) => { e.stopPropagation(); setEditValutazione(prev => prev === star ? null : star); }}
                      >
                        <span className={star <= (editHover ?? editValutazione ?? 0) ? styles.starFull : styles.starEmpty}>★</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                entry.note && <p className={styles.entryNote}>{entry.note}</p>
              )}

              {/* DETTAGLI ESPANSI */}
              {expanded === entry._id && (
                <div className={styles.entryDetails}>
                  {entry.trekId && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Durata stimata</span>
                      <span>{entry.trekId.duration ?? "-"}</span>
                    </div>
                  )}
                  {entry.trekId && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Lunghezza</span>
                      <span>{entry.trekId.lengthKm ?? "-"} km</span>
                    </div>
                  )}
                  {entry.segnalazione?.tipo && (
                    <div className={styles.segnalazioneBox}>
                      <p className={styles.segnalazioneTitle}>⚠ Segnalazione: {entry.segnalazione.tipo}</p>
                      {entry.segnalazione.descrizione && (
                        <p className={styles.segnalazioneDesc}>{entry.segnalazione.descrizione}</p>
                      )}
                    </div>
                  )}
                  {entry.foto && entry.foto.length > 0 && (
                    <div className={styles.fotoGrid}>
                      {entry.foto.map((url, i) => (
                        <img key={i} src={url} alt={`foto ${i+1}`} className={styles.fotoThumb} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* FOOTER */}
              <div className={styles.entryFooter}>
                <button
                  className={styles.expandButton}
                  onClick={(e) => { e.stopPropagation(); setExpanded(expanded === entry._id ? null : entry._id); }}
                >
                  {expanded === entry._id ? "▲ Meno dettagli" : "▼ Più dettagli"}
                </button>


                <div className={styles.entryActions}>
                  {editing === entry._id ? (
                    <>
                      <button className={styles.saveEditButton} onClick={(e) => { e.stopPropagation(); saveEdit(entry._id); }} disabled={saving}>
                        {saving ? "..." : "✓ Salva"}
                      </button>
                      <button className={styles.cancelEditButton} onClick={(e) => { e.stopPropagation(); setEditing(null); }}>
                        Annulla
                      </button>
                    </>
                  ) : (
                    <button className={styles.editButton} onClick={(e) => { e.stopPropagation(); startEdit(entry); }}>
                      ✏ Modifica
                    </button>
                  )}
                  <button
                    className={styles.deleteButton}
                    onClick={(e) => { e.stopPropagation(); handleDelete(entry._id); }}
                    disabled={deleting === entry._id}
                  >
                    {deleting === entry._id ? "..." : "🗑 Elimina"}
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
      </div>
    </main>
  );
}
