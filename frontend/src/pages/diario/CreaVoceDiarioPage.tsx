import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "../../auth/api";
import type { Trek } from "../../types/Trek";
import type { CreateDiaryEntryPayload } from "../../types/Diary";
import appStyles from "../../App.module.css";
import styles from "./Diario.module.css";

const SEGNALAZIONE_TIPI = [
  "Sentiero danneggiato",
  "Neve/ghiaccio",
  "Sentiero chiuso",
  "Fauna pericolosa",
  "Altro",
];

type FriendOption = {
  _id: string;
  nome: string;
  cognome: string;
  nickname: string;
  avatarUrl?: string;
}

export default function CreaVoceDiarioPage() {
  const navigate = useNavigate();

  const [titolo, setTitolo]           = useState("");
  const [data, setData]               = useState("");
  const [note, setNote]               = useState("");
  const [valutazione, setValutazione] = useState<number | null>(null);
  const [hoverVote, setHoverVote]     = useState<number | null>(null);
  const [completato, setCompletato]   = useState(true);

  const [modalitaPercorso, setModalitaPercorso] = useState<"predefinito" | "personalizzato">("predefinito");
  const [treks, setTreks]             = useState<Trek[]>([]);
  const [trekId, setTrekId]           = useState("");
  const [percorsoPersonalizzato, setPercorsoPersonalizzato] = useState("");
  const [gpxData, setGpxData]         = useState("");
  const [gpxFileName, setGpxFileName] = useState("");

  const [foto, setFoto]               = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const [segnalazioneAttiva, setSegnalazioneAttiva] = useState(false);
  const [segnalazioneTipo, setSegnalazioneTipo]     = useState("");
  const [segnalazioneDesc, setSegnalazioneDesc]     = useState("");

  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState<string[]>([]);
  const [success, setSuccess]   = useState(false);

  // Amici selezionati
  const [friendOptions, setFriendOptions] = useState<FriendOption[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<FriendOption[]>([]);
  const [friendSearch, setFriendSearch] = useState("");

  const filteredFriends = friendOptions.filter(f => {
    const q = friendSearch.toLowerCase();
    const fullName = `${f.nome} ${f.cognome}`.toLowerCase();
    return (
      !selectedFriends.some(s => s._id === f._id) && (
        f.nickname.toLowerCase().includes(q) ||
        f.nome.toLowerCase().includes(q) ||
        f.cognome.toLowerCase().includes(q) ||
        fullName.includes(q)
      )
    );
  })
  .slice(0, 5);

  const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

  useEffect(() => {
    fetch(`${API_BASE}/treks`)
      .then(r => r.json()).then(setTreks).catch(() => {});

      http<{ friendshipId: string; user: FriendOption }[]>("/api/friendships")
        .then(data => setFriendOptions(data.map(f => f.user)))
        .catch(() => {});
  }, []);

  function handleGpxUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setErrors(["File GPX troppo grande (max 5MB)"]); return; }
    setGpxFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setGpxData(ev.target?.result as string ?? "");
    reader.readAsText(file);
  }

  async function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Impossibile leggere il file immagine"));
      reader.readAsDataURL(file);
    });
  }

  async function processImageFiles(files: File[]) {
    const errorsList: string[] = [];
    const nextPhotos: string[] = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        errorsList.push(`Il file ${file.name} non è un'immagine valida.`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        errorsList.push("Foto troppo grande: il limite massimo è 5 MB.");
        continue;
      }
      try {
        nextPhotos.push(await readFileAsDataUrl(file));
      } catch {
        errorsList.push(`Impossibile leggere ${file.name}.`);
      }
    }

    if (errorsList.length) {
      setErrors(errorsList);
      return;
    }

    setFoto(prev => [...prev, ...nextPhotos]);
  }

  async function handleFotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    await processImageFiles(files);
    e.target.value = "";
  }

  async function handleDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files ?? []);
    if (!files.length) return;
    await processImageFiles(files);
  }

  function handleDragOver(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
  }

  function handleDragEnter(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragActive(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragActive(false);
  }

  function removeFoto(i: number) {
    setFoto(prev => prev.filter((_, idx) => idx !== i));
  }

  const today = new Date();
  const selectedDate = new Date(data);

  function validate(): string[] {
    const errs: string[] = [];
    if (!titolo.trim()) errs.push("Il titolo è obbligatorio");
    if (!selectedDate) errs.push("La data è obbligatoria");
    if (selectedDate > today) errs.push("Non è possibile creare una voce diario con data futura");
    if (modalitaPercorso === "predefinito" && !trekId) errs.push("Seleziona un percorso predefinito");
    if (modalitaPercorso === "personalizzato" && !percorsoPersonalizzato.trim()) errs.push("Inserisci il nome del percorso personalizzato");
    if (gpxData && gpxData.length > 5 * 1024 * 1024) errs.push("Il file GPX è troppo grande (max 5MB)");
    if (segnalazioneAttiva && !segnalazioneTipo) errs.push("Seleziona il tipo di segnalazione");
    return errs;
  }

  async function handleSubmit() {
    const errs = validate();
    if (errs.length) { setErrors(errs); window.scrollTo({ top: 0, behavior: "smooth" }); return; }

    setErrors([]);
    setLoading(true);

    const payload: CreateDiaryEntryPayload = {
      titolo, data,
      note: note || undefined,
      foto: foto.length ? foto : undefined,
      valutazione: valutazione ?? undefined,
      completato,
      trekId: modalitaPercorso === "predefinito" ? trekId : undefined,
      percorsoPersonalizzato: modalitaPercorso === "personalizzato" ? percorsoPersonalizzato : undefined,
      gpxData: gpxData || undefined,
      amici: selectedFriends.map(f => f._id),
      segnalazione: segnalazioneAttiva && segnalazioneTipo
        ? { tipo: segnalazioneTipo, descrizione: segnalazioneDesc || undefined }
        : undefined,
    };

    try {
      await http("/api/diary", { method: "POST", body: JSON.stringify(payload) });
      setSuccess(true);
      setTimeout(() => navigate("/diario"), 1200);
    } catch (err: any) {
      const msg = err.message ?? "";
      if (msg.includes("413") || msg.toLowerCase().includes("large"))
        setErrors(["Payload troppo grande. Riduci il file GPX o le foto."]);
      else setErrors([msg || "Errore nel salvataggio"]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={appStyles.main}>
      <div className={appStyles.contentLayout}>
        <section className={appStyles.leftColumn}>
          <div className={styles.blocksStack}>

          <header className={`${styles.pageHeader} ${styles.pageHeaderInColumns}`}>
            <div className={styles.pageHeaderTop}>
              <h1 className={`${styles.pageTitle} ${styles.pageTitleInHeader}`}>Nuova voce del diario</h1>
              <p className={styles.pageSubtitle}>Compila i campi e salva la tua esperienza</p>
            </div>
          </header>

          {/* BANNER ERRORI */}
          {errors.length > 0 && (
            <div className={styles.errorBanner}>
              {/* <span className={styles.errorBannerIcon}>⚠</span> */}
              <div>
                {/* <p className={styles.errorBannerTitle}>Correggi i seguenti errori:</p> */}
                <ul className={styles.errorBannerList}>
                  {errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
              <button className={styles.errorBannerClose} onClick={() => setErrors([])}>✕</button>
            </div>
          )}

          {/* BANNER SUCCESSO */}
          {success && (
            <div className={styles.successBanner}>
              ✅ Voce salvata! Reindirizzamento in corso...
            </div>
          )}

          {/* PERCORSO */}
          <div className={styles.card}>
            <h2 className={appStyles.sectionTitle}>Informazioni sul percorso</h2>
            <div className={styles.toggleRow}>
              <button
                className={`${styles.toggleButton} ${modalitaPercorso === "predefinito" ? styles.toggleActive : ""}`}
                onClick={() => setModalitaPercorso("predefinito")}
              >
                Percorso predefinito
              </button>
              <button
                className={`${styles.toggleButton} ${modalitaPercorso === "personalizzato" ? styles.toggleActive : ""}`}
                onClick={() => setModalitaPercorso("personalizzato")}
              >
                Percorso personalizzato
              </button>
            </div>

            {modalitaPercorso === "predefinito" ? (
              <select className={styles.select} value={trekId} onChange={e => setTrekId(e.target.value)}>
                <option value="">— Seleziona un percorso —</option>
                {treks.map(t => (
                  <option key={t.id} value={t.id}>{t.name} · {t.difficulty}</option>
                ))}
              </select>
            ) : (
              <div className={styles.fieldGroup}>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="Nome del percorso"
                  value={percorsoPersonalizzato}
                  onChange={e => setPercorsoPersonalizzato(e.target.value)}
                />
                <label className={styles.fileLabel}>
                  📎 {gpxFileName || "Carica file GPX (opzionale, max 5MB)"}
                  <input type="file" accept=".gpx,.geojson" style={{ display: "none" }} onChange={handleGpxUpload} />
                </label>
              </div>
            )}
          </div>

          {/* DETTAGLI */}
          <div className={styles.card}>
            <h2 className={appStyles.sectionTitle}>Dettagli del percorso</h2>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Titolo *</label>
              <input
                className={styles.input}
                type="text"
                placeholder="Es: Gita sul Monte Baldo"
                value={titolo}
                onChange={e => setTitolo(e.target.value)}
              />

              <label className={styles.label}>Data *</label>
              <input
                className={styles.input}
                type="date"
                lang="it-IT"
                value={data}
                onChange={e => setData(e.target.value)}
              />

              <label className={styles.label}>Note</label>
              <textarea
                className={styles.textarea}
                rows={5}
                placeholder="Descrivi la tua esperienza, le condizioni del percorso, punti di interesse..."
                value={note}
                onChange={e => setNote(e.target.value)}
              />

              {/* CHECKBOX CUSTOM */}
              <div
                className={`${styles.customCheck} ${completato ? styles.customCheckActive : ""}`}
                onClick={() => setCompletato(p => !p)}
              >
                <div className={styles.customCheckBox}>
                  {completato && <span>✓</span>}
                </div>
                <div>
                  <p className={styles.customCheckLabel}>Percorso completato</p>
                  <p className={styles.customCheckHint}>Deseleziona se hai dovuto interrompere</p>
                </div>
              </div>
            </div>
          </div>

          {/* FOTO */}
          <div className={styles.card}>
            <h2 className={appStyles.sectionTitle}>Foto del percorso</h2>
            <p className={styles.hint}>Carica foto reali del percorso</p>
            <label
              className={`${styles.fileLabel} ${dragActive ? styles.fileLabelActive : ""}`}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
               Trascina qui le immagini o clicca per selezionare (max 5MB ciascuna)
              <input
                type="file"
                accept="image/*"
                multiple
                style={{ display: "none" }}
                onChange={handleFotoUpload}
              />
            </label>
            {foto.length > 0 && (
              <div className={styles.fotoGrid}>
                {foto.map((src, i) => (
                  <div key={i} className={styles.fotoItem}>
                    <img src={src} alt={`foto ${i + 1}`} className={styles.fotoThumb} />
                    <button className={styles.fotoRemove} onClick={() => removeFoto(i)}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SEGNALAZIONE */}
          <div className={styles.card}>
            <h2 className={appStyles.sectionTitle}>Qualcosa da segnalare ?</h2>
            <p className={styles.hint}>Avvisa altri utenti di problemi sul percorso</p>

            <div
              className={`${styles.customCheck} ${segnalazioneAttiva ? styles.customCheckActive : ""}`}
              onClick={() => setSegnalazioneAttiva(p => !p)}
            >
              <div className={styles.customCheckBox}>
                {segnalazioneAttiva && <span>✓</span>}
              </div>
              <div>
                <p className={styles.customCheckLabel}>Vuoi segnalare un problema?</p>
                <p className={styles.customCheckHint}>La segnalazione sarà visibile agli altri utenti</p>
              </div>
            </div>

            {segnalazioneAttiva && (
              <div className={styles.fieldGroup} style={{ marginTop: "16px" }}>
                <label className={styles.label}>Tipo di problema</label>
                <div className={styles.segnalazioneTipi}>
                  {SEGNALAZIONE_TIPI.map(tipo => (
                    <button
                      key={tipo}
                      className={`${styles.tipoButton} ${segnalazioneTipo === tipo ? styles.tipoButtonActive : ""}`}
                      onClick={() => setSegnalazioneTipo(tipo)}
                    >
                      {tipo}
                    </button>
                  ))}
                </div>

                <label className={styles.label}>Descrizione</label>
                <textarea
                  className={styles.textarea}
                  rows={3}
                  placeholder="Descrivi il problema in dettaglio..."
                  value={segnalazioneDesc}
                  onChange={e => setSegnalazioneDesc(e.target.value)}
                  maxLength={1000}
                />
                <p className={styles.charCount}>{segnalazioneDesc.length}/1000</p>
              </div>
            )}
          </div>

          </div>
        </section>

        {/* RIGHT */}
        <section className={appStyles.rightColumn}>
          <div className={styles.sidebar}>

            {/* VALUTAZIONE */}
            <div className={styles.card}>
              <h3 className={appStyles.sectionTitle}>Valutazione</h3>
              <p className={styles.hint}>{valutazione ? `Hai dato ${valutazione} su 5` : "Com'è andata?"}</p>
              <div className={styles.starsRow}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    className={styles.starButton}
                    onMouseEnter={() => setHoverVote(star)}
                    onMouseLeave={() => setHoverVote(null)}
                    onClick={() => setValutazione(prev => prev === star ? null : star)}
                  >
                    <span className={star <= (hoverVote ?? valutazione ?? 0) ? styles.starFull : styles.starEmpty}>★</span>
                  </button>
                ))}
              </div>
              {valutazione && (
                <button className={styles.resetVote} onClick={() => setValutazione(null)}>Rimuovi voto</button>
              )}
            </div>

            {/* AMICI */}
            <div className={styles.card}>
              <h3 className={appStyles.sectionTitle}>Amici</h3>
              <p className={styles.hint}>Chi era con te?</p>

              {friendOptions.length === 0 ? (
                <p className={styles.hint}>Non hai ancora amici aggiunti.</p>
              ) : (
                <>
                  {selectedFriends.length > 0 && (
                    <div className={styles.friendsList}>
                      {selectedFriends.map(f => (
                        <div
                          key={f._id}
                          className={`${styles.friendItem} ${styles.friendItemSelected}`}
                          onClick={() => setSelectedFriends(prev => prev.filter(s => s._id !== f._id))}
                        >
                          <div className={styles.friendAvatar}>
                            {f.avatarUrl
                              ? <img src={f.avatarUrl} alt="avatar" className={styles.friendAvatarImg} />
                              : <span>{f.nome[0].toUpperCase()}</span>
                            }
                          </div>
                          <div className={styles.friendInfo}>
                            <p className={styles.friendName}>{f.nome} {f.cognome}</p>
                            <p className={styles.friendNick}>@{f.nickname}</p>
                          </div>
                          <span className={styles.friendCheck}>✓</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <input
                    className={`${styles.input} ${selectedFriends.length > 0 ? styles.friendSearchInput : ""}`}
                    placeholder="Cerca amico..."
                    value={friendSearch}
                    onChange={e => setFriendSearch(e.target.value)}
                  />

                  {filteredFriends.length > 0 && (
                    <div className={styles.friendsList}>
                      {filteredFriends.map(f => (
                        <div
                          key={f._id}
                          className={styles.friendItem}
                          onClick={() => {
                            setSelectedFriends(prev => [...prev, f]);
                            setFriendSearch("");
                          }}
                        >
                          <div className={styles.friendAvatar}>
                            {f.avatarUrl
                              ? <img src={f.avatarUrl} alt="avatar" className={styles.friendAvatarImg} />
                              : <span>{f.nome[0].toUpperCase()}</span>
                            }
                          </div>
                          <div className={styles.friendInfo}>
                            <p className={styles.friendName}>{f.nome} {f.cognome}</p>
                            <p className={styles.friendNick}>@{f.nickname}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {friendSearch.length > 0 && filteredFriends.length === 0 && (
                    <p className={styles.hint}>Nessun amico trovato.</p>
                  )}
                </>
              )}
            </div>

            {/* RIEPILOGO + SALVA */}
            <div className={styles.actionCard}>
              <h3 className={styles.actionTitle}>Riepilogo</h3>
              <div className={styles.riepilogoList}>
                <span>Nome del percorso: {modalitaPercorso === "predefinito"
                  ? (treks.find(t => String(t.id) === trekId)?.name ?? "Nessun percorso selezionato")
                  : (percorsoPersonalizzato || "Percorso personalizzato")
                }</span>
                {titolo && <span>Titolo: {titolo}</span>}
                {data && <span>Data scelta: {new Date(data).toLocaleDateString("it-IT")}</span>}
                {valutazione && <span>Valutazione: {valutazione}/5</span>}
                {completato && <span>Percorso completato</span>}
                {segnalazioneAttiva && segnalazioneTipo && <span>Segnalazione effettuata: {segnalazioneTipo}</span>}
              </div>

              <button className={styles.saveButton} onClick={handleSubmit} disabled={loading}>
                {loading ? "Salvataggio..." : " Salva voce"}
              </button>
              <button className={styles.cancelButton} onClick={() => navigate("/diario")}>
                Annulla
              </button>
            </div>

          </div>
        </section>
      </div>
    </main>
  );
}
