import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "../../auth/api";
import type { DiaryEntry } from "../../types/Diary";

import appStyles from "../../App.module.css";
import styles from "./Diario.module.css";
import { PageLoader } from "../../components/SkeletonLoader";

type ModalType = "delete" | null;

function parseGpxDistanceDuration(gpxText: string): { distanceMeters: number; durationSeconds: number } | null {
  try {
    const parser = new DOMParser(); 
    const doc = parser.parseFromString(gpxText, "application/xml");
    const trkpts = Array.from(doc.querySelectorAll("trkpt"));
    if (!trkpts.length) return null;

    const distanceEl = doc.querySelector("metadata extensions distance");
    const durationEl = doc.querySelector("metadata extensions duration");

    let distanceMeters = distanceEl ? parseFloat(distanceEl.textContent ?? "") : NaN;
    let durationSeconds = durationEl ? parseFloat(durationEl.textContent ?? "") : NaN;

    if (!Number.isFinite(distanceMeters)) {
      const coords = trkpts.map(pt => [
        parseFloat(pt.getAttribute("lon") ?? "0"),
        parseFloat(pt.getAttribute("lat") ?? "0"),
      ]);
      distanceMeters = calcDistanceFromCoords(coords);
    }

    if (!Number.isFinite(durationSeconds) && Number.isFinite(distanceMeters)) {
      durationSeconds = (distanceMeters / 3500) * 3600;
    }

    if (!Number.isFinite(distanceMeters) || !Number.isFinite(durationSeconds)) return null;
    return { distanceMeters, durationSeconds };
  } catch {
    return null;
  }
}

function calcDistanceFromCoords(coords: number[][]): number {
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    const [lon1, lat1] = coords[i - 1];
    const [lon2, lat2] = coords[i];
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    total += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  return total;
}

function formatDuration(seconds: number): string {
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} h`;
  return `${hours} h ${minutes} min`;
}

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

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<DiaryEntry | null>(null);
  // const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    http<DiaryEntry[]>("/api/diary")
      .then(setEntries)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    setDeleting(id);
    setActionLoading(true);
    try {
      await http(`/api/diary/${id}`, { method: "DELETE" });
      setEntries(prev => prev.filter(e => e._id !== id));
      setActiveModal(null);
      setEntryToDelete(null);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setDeleting(null);
      setActionLoading(false);
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

  if (loading) return <PageLoader />;

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
          <p>Il tuo diario è ancora vuoto.</p>
          <button className={styles.saveButton} onClick={() => navigate("/diario/crea")}>
            Crea la prima voce
          </button>
        </div>
      ) : (
        <div className={styles.entriesList}>
          {entries.map(entry => {
            const customRouteInfo = entry.gpxData ? parseGpxDistanceDuration(entry.gpxData) : null;
            return (
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
                    {entry.trekId && <span> {entry.trekId.name} · {entry.trekId.difficulty}</span>}
                    {entry.percorsoPersonalizzato && <span> {entry.percorsoPersonalizzato}</span>}
                  </p>
                </div>

                <div className={styles.entryBadges}>
                  {entry.completato !== false && <span className={styles.badge} style={{color: "var(--accent)", fontWeight: "bold"}}> Percorso completato</span>}
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
                  {entry.percorsoPersonalizzato && customRouteInfo && (
                    <>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Durata stimata</span>
                        <span>{formatDuration(customRouteInfo.durationSeconds)}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Lunghezza</span>
                        <span>{(customRouteInfo.distanceMeters / 1000).toFixed(1)} km</span>
                      </div>
                    </>
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
                    onClick={(e) => { e.stopPropagation(); setEntryToDelete(entry); setActiveModal("delete"); }}
                    disabled={actionLoading}
                  >
                    {deleting === entry._id ? "..." : "🗑 Elimina"}
                  </button>
                </div>
              </div>

            </div>
          );
          })}
        </div>
      )}
      </div>


      {activeModal === "delete" && (
        <div className={styles.modalOverlay} onClick={() => { setActiveModal(null); setEntryToDelete(null); }}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Elimina voce diario</h2>
            <p className={styles.modalBody}>
              Stai per eliminare definitivamente <strong>{entryToDelete?.titolo ?? "questa voce"}</strong> dal tuo diario.
              <br /><br />
              <strong>Questa operazione è irreversibile</strong> e non potrà essere annullata.
            </p>
            <div className={styles.modalActions}>
              <button className={appStyles.secondaryButton} onClick={() => { setActiveModal(null); setEntryToDelete(null); }} disabled={actionLoading}>Annulla</button>
              <button className={styles.dangerButton} onClick={() => entryToDelete && handleDelete(entryToDelete._id)} disabled={actionLoading || !entryToDelete}>
                {actionLoading ? "Eliminazione in corso..." : "Elimina definitivamente"}
              </button>
            </div>
          </div>
        </div>
      )}


    </main>
  );
}
