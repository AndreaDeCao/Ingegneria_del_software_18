import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { http } from "../../auth/api";
import type { DiaryEntry } from "../../types/Diary";
import appStyles from "../../App.module.css";
import styles from "./DettagliDiario.module.css";
import TrekMap from "../../components/TrekMap";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

function areCoordsClose(
  a: { lat: number; lon: number } | undefined,
  b: { lat: number; lon: number } | undefined,
  epsilon = 1e-6
) {
  if (!a || !b) return false;
  return Math.abs(a.lat - b.lat) < epsilon && Math.abs(a.lon - b.lon) < epsilon;
}

function normalizeCoord(
  coord: { lat: number; lon?: number; lng?: number } | undefined
): { lat: number; lon: number } | undefined {
  if (!coord) return undefined;
  const lon = coord.lon ?? coord.lng;
  if (typeof coord.lat !== "number" || typeof lon !== "number") return undefined;
  return { lat: coord.lat, lon };
}

// converte il GPX XML in GeoJSON minimale per TrekMap
function gpxToGeojson(gpxText: string): any | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(gpxText, "application/xml");
    const trkpts = Array.from(doc.querySelectorAll("trkpt"));
    if (!trkpts.length) return null;

    const coordinates = trkpts.map(pt => [
      parseFloat(pt.getAttribute("lon") ?? "0"),
      parseFloat(pt.getAttribute("lat") ?? "0"),
    ]);

    return {
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        geometry: { type: "LineString", coordinates },
        properties: {}
      }]
    };
  } catch {
    return null;
  }
}

export default function DettagliVoceDiarioPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [entry, setEntry]           = useState<DiaryEntry | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [routeGeojson, setRouteGeojson] = useState<any>(null);
  const [lightboxUrl, setLightboxUrl]   = useState<string | null>(null);


  const gpxCoordinates = routeGeojson?.features?.[0]?.geometry?.coordinates || [];
  const hasGpxCoordinates = gpxCoordinates.length > 0;

//   const gpxStart = gpxCoordinates.length > 0
//       ? {
//           lat: gpxCoordinates[0][1],
//           lng: gpxCoordinates[0][0],
//         }
//       : 0;

//   const gpxEnd = gpxCoordinates.length > 0
//       ? {
//           lat: gpxCoordinates[gpxCoordinates.length - 1][1],
//           lng: gpxCoordinates[gpxCoordinates.length - 1][0],
//         }
//       : 0;

  const gpxStart = hasGpxCoordinates
    ? { lat: gpxCoordinates[0][1], lon: gpxCoordinates[0][0] }
    : undefined;

  const gpxEnd = hasGpxCoordinates
    ? {
        lat: gpxCoordinates[gpxCoordinates.length - 1][1],
        lon: gpxCoordinates[gpxCoordinates.length - 1][0],
      }
    : undefined;

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await http<DiaryEntry>(`/api/diary/${id}`);
        setEntry(data);

        // MAPPA: preferisci GPX caricato, poi fallback su route API
        if (data.gpxData) {
          const geojson = gpxToGeojson(data.gpxData);
          if (geojson) { setRouteGeojson(geojson); return; }
        }

        const trekNumericId = data.trekId?.id;
        if (trekNumericId) {
          const routeRes = await fetch(`${API_BASE}/api/route/${trekNumericId}`);
          if (routeRes.ok) {
            const routeData = await routeRes.json();
            setRouteGeojson(routeData.geojson);
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) return (
    <main className={appStyles.main}>
      <p className={appStyles.message}>Caricamento voce...</p>
    </main>
  );

  if (error || !entry) return (
    <main className={appStyles.main}>
      <p className={appStyles.messageError}>{error || "Voce non trovata"}</p>
    </main>
  );

  const trek = entry.trekId;
  const dataFormatted = new Date(entry.data).toLocaleDateString("it-IT", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric"
  });

  const trekStart = normalizeCoord(trek?.coordinates as any);
  const trekEnd = normalizeCoord(trek?.endCoordinates as any);

  const hasEntryGpx = !!entry.gpxData;
  const customStart = (() => {
    if (!hasEntryGpx || !gpxStart) return undefined;
    if (!trekStart) return gpxStart;
    return !areCoordsClose(gpxStart, trekStart) ? gpxStart : undefined;
  })();

  const startCoordinates = trekStart ?? (hasEntryGpx ? undefined : gpxStart);
  const endCoordinates = trekEnd ?? gpxEnd;

  return (
    <main className={appStyles.main}>

      {/* LIGHTBOX FOTO */}
      {lightboxUrl && (
        <div className={styles.lightbox} onClick={() => setLightboxUrl(null)}>
          <img src={lightboxUrl} className={styles.lightboxImg} alt="foto ingrandita" />
          <button className={styles.lightboxClose}>✕</button>
        </div>
      )}

      <div className={appStyles.contentLayout}>

        {/* LEFT */}
        <section className={appStyles.leftColumn}>

          {/* BACK */}
          {/* <button className={styles.backButton} onClick={() => navigate("/diario/visualizza")}>
            ← Torna al diario
          </button> */}

          {/* TITOLO */}
          <div className={appStyles.sectionHead}>
            <h1 className={styles.pageTitle}>{entry.titolo}</h1>
          </div>

          {/* BADGES */}
          <div className={styles.badges}>
            <span className={appStyles.sectionCount}>📅 {dataFormatted}</span>
            {entry.completato !== false && (
              <span className={appStyles.sectionCount}>✅ Completato</span>
            )}
            {entry.valutazione && (
              <span className={appStyles.sectionCount}>
                {"★".repeat(entry.valutazione)}{"☆".repeat(5 - entry.valutazione)}
              </span>
            )}
            {trek && <span className={appStyles.sectionCount}>🎯 {trek.difficulty}</span>}
            {trek?.duration && <span className={appStyles.sectionCount}>⏱ {trek.duration}</span>}
            {trek?.lengthKm && <span className={appStyles.sectionCount}>📏 {trek.lengthKm} km</span>}
          </div>

          {/* NOTE */}
          {entry.note && (
            <div className={styles.section}>
              <h2 className={appStyles.sectionTitle}>Note</h2>
              <p className={styles.noteText}>{entry.note}</p>
            </div>
          )}

          {/* MAPPA */}
          <div className={styles.mapContainer}>
            <TrekMap
              name={trek?.name ?? entry.percorsoPersonalizzato ?? "Percorso"}
              coordinates={startCoordinates}
              endCoordinates={endCoordinates}
              routeGeojson={routeGeojson}
              customStart={customStart}
            />
          </div>
          {/* <div className={styles.mapLegend}>
            {trek?.coordinates && <span>🟢 Partenza</span>}
            {trek?.endCoordinates && <span>🔴 Arrivo</span>}
            {routeGeojson && <span>🔵 Percorso</span>}
            {entry.gpxData && <span>📎 Traccia GPX</span>}
          </div> */}

          <div className={styles.mapLegend}>
            {trekStart && <span>🟢 Partenza</span>}
            {customStart && <span>🟣 Partenza GPX</span>}
            {!trekStart && startCoordinates && <span>🟢 Partenza</span>}

            {endCoordinates && (
                <span>🔴 Arrivo</span>
            )}

            {routeGeojson && <span>🔵 Percorso</span>}

            {entry.gpxData && <span>📎 Traccia GPX</span>}
          </div>

          {/* SEGNALAZIONE */}
          {entry.segnalazione?.tipo && (
            <div className={styles.segnalazioneCard}>
              <h2 className={appStyles.sectionTitle}>⚠ Segnalazione</h2>
              <span className={styles.segnalazioneTipo}>{entry.segnalazione.tipo}</span>
              {entry.segnalazione.descrizione && (
                <p className={styles.segnalazioneDesc}>{entry.segnalazione.descrizione}</p>
              )}
            </div>
          )}

          {/* FOTO */}
          {entry.foto && entry.foto.length > 0 && (
            <div className={styles.section}>
              <h2 className={appStyles.sectionTitle}>📸 Foto</h2>
              <div className={styles.fotoGrid}>
                {entry.foto.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`foto ${i + 1}`}
                    className={styles.fotoThumb}
                    onClick={() => setLightboxUrl(url)}
                  />
                ))}
              </div>
            </div>
          )}

        </section>

        {/* RIGHT — sidebar */}
        <section className={appStyles.rightColumn}>
          <div className={styles.sidebar}>

            {/* RIEPILOGO */}
            <div className={styles.card}>
              <h3 className={appStyles.sectionTitle}>Riepilogo</h3>
              <div className={styles.summaryList}>
                {trek ? (
                  <>
                    <span>🥾 {trek.name}</span>
                    <span>🎯 Difficoltà: {trek.difficulty}</span>
                    <span>⏱ Durata: {trek.duration}</span>
                    <span>📏 Lunghezza: {trek.lengthKm ?? "-"} km</span>
                  </>
                ) : entry.percorsoPersonalizzato ? (
                  <span>🗺 {entry.percorsoPersonalizzato}</span>
                ) : null}
                <span>📅 {dataFormatted}</span>
                {entry.valutazione && (
                  <span>⭐ Valutazione: {entry.valutazione}/5</span>
                )}
                {entry.completato !== false && <span>✅ Completato</span>}
                {entry.gpxData && <span>📎 Traccia GPX allegata</span>}
              </div>
            </div>

            {/* AZIONI */}
            <div className={styles.actionCard}>
              <h3 className={styles.actionTitle}>Azioni</h3>
              <button
                className={styles.actionButton}
                onClick={() => navigate(`/diario/visualizza`)}
              >
                ← Torna al diario
              </button>
              {trek?.id && (
                <button
                  className={styles.actionButtonSecondary}
                  onClick={() => navigate(`/treks/${trek.id}`)}
                >
                  🥾 Vai al percorso
                </button>
              )}
            </div>

          </div>
        </section>

      </div>
    </main>
  );
}
