import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { http } from "../../auth/api";
import appStyles from "../../App.module.css";
import styles from "../attivita/attivitaPage.module.css"; // FIXME: riuso stili form

/**
 * Pagina admin per la creazione di un nuovo percorso (trek).
 *
 * @route /admin/treks/crea
 * @returns {JSX.Element}
 */
export default function TrekCreateAdmin() {
  const navigate = useNavigate();

  // Campi principali
  const [name, setName]               = useState("");
  const [difficulty, setDifficulty]   = useState<"Facile" | "Medio" | "Difficile" | "">("");
  const [description, setDescription] = useState("");
  const [satRouteNumber, setSatRouteNumber] = useState("");

  // Distanze / tempi
  const [duration, setDuration]       = useState("");
  const [lengthKm, setLengthKm]       = useState<number | "">("");
  const [elevationGain, setElevationGain] = useState<number | "">("");

  // Quote
  const [minAltitude, setMinAltitude] = useState<number | "">("");
  const [maxAltitude, setMaxAltitude] = useState<number | "">("");

  // Luoghi
  const [comuni, setComuni]           = useState("");
  const [startPoint, setStartPoint]   = useState("");
  const [endPoint, setEndPoint]       = useState("");

  // Coordinate partenza
  const [startLat, setStartLat]       = useState<number | "">("");
  const [startLon, setStartLon]       = useState<number | "">("");

  // Coordinate arrivo
  const [endLat, setEndLat]           = useState<number | "">("");
  const [endLon, setEndLon]           = useState<number | "">("");

  // Condizioni attuali
  const [condizioniAttuali, setCondizioniAttuali] = useState("");

  const [error, setError]     = useState<string | null>(null);
  const [saving, setSaving]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) { setError("Il nome del percorso è obbligatorio."); return; }
    if (!difficulty)  { setError("Seleziona la difficoltà."); return; }

    const body: Record<string, unknown> = {
      name: name.trim(),
      difficulty,
      description: description.trim() || undefined,
      SatRouteNumber: satRouteNumber.trim() || undefined,
      duration: duration.trim() || undefined,
      lengthKm: lengthKm !== "" ? Number(lengthKm) : undefined,
      elevationGain: elevationGain !== "" ? Number(elevationGain) : undefined,
      minAltitude: minAltitude !== "" ? Number(minAltitude) : undefined,
      maxAltitude: maxAltitude !== "" ? Number(maxAltitude) : undefined,
      comuni: comuni ? comuni.split(",").map((c) => c.trim()).filter(Boolean) : undefined,
      startPoint: startPoint.trim() || undefined,
      endPoint: endPoint.trim() || undefined,
      coordinates:
        startLat !== "" && startLon !== ""
          ? { lat: Number(startLat), lon: Number(startLon) }
          : undefined,
      endCoordinates:
        endLat !== "" && endLon !== ""
          ? { lat: Number(endLat), lon: Number(endLon) }
          : undefined,
      condizioniAttuali: condizioniAttuali.trim() || undefined,
    };

    setSaving(true);
    try {
      const created = await http<{ numericId: number; mongoId: string }>("/treks", {
        method: "POST",
        body: JSON.stringify(body),
      });
      navigate(`/admin/treks/${created.numericId}`);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message || "Errore nella creazione del percorso");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={appStyles.contentLayout}>
        <div className={appStyles.leftColumn}>

          {/* Header */}
          <div style={{ paddingBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 className={styles.pageTitle}>Crea Percorso</h1>
            <Link to="/treks" className={appStyles.primaryButton}>
              ← Lista percorsi
            </Link>
          </div>

          <form className={styles.formCard} onSubmit={handleSubmit}>

            {/* NOME */}
            <div className={styles.section}>
              <label className={styles.label}>Nome percorso *</label>
              <input
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="es. Sentiero delle Pale di San Martino"
                required
              />
            </div>

            {/* DIFFICOLTÀ */}
            <div className={styles.section}>
              <label className={styles.label}>Difficoltà *</label>
              <select
                className={styles.input}
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}
                required
              >
                <option value="">Seleziona difficoltà</option>
                <option value="Facile">Facile</option>
                <option value="Medio">Medio</option>
                <option value="Difficile">Difficile</option>
              </select>
            </div>

            {/* NUMERO SAT */}
            <div className={styles.section}>
              <label className={styles.label}>Numero percorso SAT</label>
              <input
                className={styles.input}
                value={satRouteNumber}
                onChange={(e) => setSatRouteNumber(e.target.value)}
                placeholder="es. E101"
              />
            </div>

            {/* DESCRIZIONE */}
            <div className={styles.section}>
              <label className={styles.label}>Descrizione</label>
              <textarea
                className={styles.textarea}
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrivi il percorso..."
              />
            </div>

            {/* DURATA / LUNGHEZZA / DISLIVELLO */}
            <div className={styles.grid}>
              <div className={styles.section}>
                <label className={styles.label}>Durata stimata</label>
                <input
                  className={styles.input}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="es. 3 ore"
                />
              </div>
              <div className={styles.section}>
                <label className={styles.label}>Lunghezza (km)</label>
                <input
                  className={styles.input}
                  type="number"
                  min={0}
                  step={0.1}
                  value={lengthKm}
                  onChange={(e) => setLengthKm(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="es. 12.5"
                />
              </div>
            </div>

            <div className={styles.grid}>
              <div className={styles.section}>
                <label className={styles.label}>Dislivello (m)</label>
                <input
                  className={styles.input}
                  type="number"
                  min={0}
                  value={elevationGain}
                  onChange={(e) => setElevationGain(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="es. 850"
                />
              </div>
              <div className={styles.section}>
                <label className={styles.label}>Quota minima (m)</label>
                <input
                  className={styles.input}
                  type="number"
                  min={0}
                  value={minAltitude}
                  onChange={(e) => setMinAltitude(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="es. 800"
                />
              </div>
            </div>

            <div className={styles.grid}>
              <div className={styles.section}>
                <label className={styles.label}>Quota massima (m)</label>
                <input
                  className={styles.input}
                  type="number"
                  min={0}
                  value={maxAltitude}
                  onChange={(e) => setMaxAltitude(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="es. 2300"
                />
              </div>
              <div className={styles.section}>
                <label className={styles.label}>Comuni (separati da virgola)</label>
                <input
                  className={styles.input}
                  value={comuni}
                  onChange={(e) => setComuni(e.target.value)}
                  placeholder="es. Trento, Rovereto"
                />
              </div>
            </div>

            {/* PUNTO PARTENZA / ARRIVO */}
            <div className={styles.section}>
              <label className={styles.label}>Punto di partenza</label>
              <input
                className={styles.input}
                value={startPoint}
                onChange={(e) => setStartPoint(e.target.value)}
                placeholder="es. Parcheggio Malga Norda"
              />
            </div>

            <div className={styles.section}>
              <label className={styles.label}>Punto di arrivo</label>
              <input
                className={styles.input}
                value={endPoint}
                onChange={(e) => setEndPoint(e.target.value)}
                placeholder="es. Rifugio Dolomiti"
              />
            </div>

            {/* COORDINATE PARTENZA */}
            <div className={styles.section}>
              <label className={styles.label}>Coordinate partenza (lat / lon)</label>
              <div className={styles.grid}>
                <input
                  className={styles.input}
                  type="number"
                  step="any"
                  value={startLat}
                  onChange={(e) => setStartLat(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Latitudine  es. 46.0748"
                />
                <input
                  className={styles.input}
                  type="number"
                  step="any"
                  value={startLon}
                  onChange={(e) => setStartLon(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Longitudine  es. 11.1217"
                />
              </div>
            </div>

            {/* COORDINATE ARRIVO */}
            <div className={styles.section}>
              <label className={styles.label}>Coordinate arrivo (lat / lon)</label>
              <div className={styles.grid}>
                <input
                  className={styles.input}
                  type="number"
                  step="any"
                  value={endLat}
                  onChange={(e) => setEndLat(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Latitudine  es. 46.0901"
                />
                <input
                  className={styles.input}
                  type="number"
                  step="any"
                  value={endLon}
                  onChange={(e) => setEndLon(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Longitudine  es. 11.1390"
                />
              </div>
            </div>

            {/* CONDIZIONI ATTUALI */}
            <div className={styles.section}>
              <label className={styles.label}>Condizioni attuali percorso</label>
              <input
                className={styles.input}
                value={condizioniAttuali}
                onChange={(e) => setCondizioniAttuali(e.target.value)}
                placeholder="es. Sentiero aperto, qualche tratto innevato sopra 2000 m"
              />
            </div>

            <button className={appStyles.primaryButton} disabled={saving}>
              {saving ? "Creazione in corso…" : "Crea percorso"}
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
