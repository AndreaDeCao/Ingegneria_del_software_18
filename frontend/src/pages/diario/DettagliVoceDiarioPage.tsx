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

// converte il GPX XML in GeoJSON minimale per TrekMap senza info su percorso
// function gpxToGeojson(gpxText: string): any | null {
//   try {
//     const parser = new DOMParser();
//     const doc = parser.parseFromString(gpxText, "application/xml");
//     const trkpts = Array.from(doc.querySelectorAll("trkpt"));
//     if (!trkpts.length) return null;

//     const coordinates = trkpts.map(pt => [
//       parseFloat(pt.getAttribute("lon") ?? "0"),
//       parseFloat(pt.getAttribute("lat") ?? "0"),
//     ]);

//     return {
//       type: "FeatureCollection",
//       features: [{
//         type: "Feature",
//         geometry: { type: "LineString", coordinates },
//         properties: {}
//       }]
//     };
//   } catch {
//     return null;
//   }
// }

// converte il GPX XML in GeoJSON minimale per TrekMap con info su percorso prese da metadati
function gpxToGeojson(gpxText: string): {
  geojson: any;
  distanceMeters?: number;
  durationSeconds?: number;
  routeType?: string;
} | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(gpxText, "application/xml");
    const trkpts = Array.from(doc.querySelectorAll("trkpt"));
    if (!trkpts.length) return null;

    const coordinates = trkpts.map(pt => [
      parseFloat(pt.getAttribute("lon") ?? "0"),
      parseFloat(pt.getAttribute("lat") ?? "0"),
    ]);

    const geojson = {
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        geometry: { type: "LineString", coordinates },
        properties: {}
      }]
    };

    const distanceEl = doc.querySelector("metadata extensions distance");
    const durationEl = doc.querySelector("metadata extensions duration");
    const routeTypeEl = doc.querySelector("metadata extensions routeType");

    const distanceMeters = distanceEl ? parseFloat(distanceEl.textContent ?? "") : undefined;
    const durationSeconds = durationEl ? parseFloat(durationEl.textContent ?? "") : undefined;
    const routeType = routeTypeEl?.textContent ?? undefined;

    return { geojson, distanceMeters, durationSeconds, routeType };
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

function calcDifficulty(distanceMeters: number, durationSeconds: number): string {
  const km = distanceMeters / 1000;
  const ore = durationSeconds / 3600;
  const speed = km / ore;
  const score = km * 0.6 + (1 / speed) * 10;
  if (score < 6) return "Facile";
  if (score < 12) return "Medio";
  return "Difficile";
}

function formatDuration(seconds: number): string {
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} h`;
  return `${hours} h ${minutes} min`;
}

function downloadGpx(entry: DiaryEntry | null) {
  if (!entry?.gpxData) return;
  const blob = new Blob([entry.gpxData], { type: "application/gpx+xml" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const fileName = entry.titolo
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "tracciato";
  link.href = url;
  link.download = `${fileName}.gpx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function DettagliVoceDiarioPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [entry, setEntry]           = useState<DiaryEntry | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [routeGeojson, setRouteGeojson] = useState<any>(null);
  const [lightboxUrl, setLightboxUrl]   = useState<string | null>(null);

  const [routeInfo, setRouteInfo] = useState<{
    distanceMeters: number;
    durationSeconds: number;
    routeType?: string;
  } | null>(null);

  const typeMap: Record<string, string> = { 
    bike_mountain: "mountain bike",
    bike_road: "bici da strada",
    walk_road: "camminata prediligendo la strada",
    hiking_road: "camminata prediligendo i sentieri",
    hiking:"camminata prediligendo i sentieri"
  };


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
          const result = gpxToGeojson(data.gpxData);
          if (result) { 
            setRouteGeojson(result.geojson); 
            
            if (result.distanceMeters && result.durationSeconds) {
              setRouteInfo({
                distanceMeters: result.distanceMeters,
                durationSeconds: result.durationSeconds,
                routeType: result.routeType,
              });      
            } else {
              // fallback calcolo da coordinate
              const coords = result.geojson.features[0].geometry.coordinates;
              const distanceMeters = calcDistanceFromCoords(coords);
              const durationSeconds = (distanceMeters / 3500) * 3600;
              setRouteInfo({ distanceMeters, durationSeconds });
            }
            return;
          }
        }
        // Nessun GPX → carica solo la geometria per la mappa, senza toccare routeInfo
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

          {/* TITOLO */}
          <div className={appStyles.sectionHead}>
            <h1 className={styles.pageTitle}>{entry.titolo}</h1>
          </div>

          {/* BADGES */}
          {/* <div className={styles.badges}>
            <span className={appStyles.sectionCount}>📅 {dataFormatted}</span>
            {entry.completato !== false && (
              <span className={appStyles.sectionCount}>✅ Completato</span>
            )}
            {entry.valutazione && (
              <span className={appStyles.sectionCount}>
                {"★".repeat(entry.valutazione)}{"☆".repeat(5 - entry.valutazione)}
              </span>
            )}
            {trek && <span className={appStyles.sectionCount}> {routeInfo ? calcDifficulty(routeInfo.distanceMeters, routeInfo.durationSeconds) : trek.difficulty} </span>}
            {(trek?.duration || routeInfo) && <span className={appStyles.sectionCount}>{routeInfo ? formatDuration(routeInfo.durationSeconds) : trek!.duration}</span>}
            {(trek?.lengthKm || routeInfo) && <span className={appStyles.sectionCount}>{routeInfo ? `${(routeInfo.distanceMeters / 1000).toFixed(1)} km` : `${trek!.lengthKm} km`}</span>}
          </div> */}

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

          <div className={styles.mapLegend}>
            {trekStart && <span>🟢 Partenza</span>}
            {customStart && <span>🟣 Partenza GPX</span>}
            {!trekStart && startCoordinates && <span>🟢 Partenza</span>}

            {endCoordinates && (
                <span>🔴 Arrivo</span>
            )}

            {routeGeojson && <span>🔵 Percorso</span>}

            {entry.gpxData && <span> Traccia GPX</span>}
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
              <h2 className={appStyles.sectionTitle}> Foto del percorso</h2>
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
                {trek ? ( //percorso predefinito
                  <>
                    <span> {trek.name}</span>
                    <span> {dataFormatted}</span>
                    <span>Difficoltà: {routeInfo ? calcDifficulty(routeInfo.distanceMeters, routeInfo.durationSeconds) : trek.difficulty}</span>
                    <span> Durata: {routeInfo ? formatDuration(routeInfo.durationSeconds) : trek.duration}</span>
                    <span> Lunghezza: {routeInfo ? `${(routeInfo.distanceMeters / 1000).toFixed(1)} km` : `${trek.lengthKm ?? "-"} km`}</span>
                    <span> Tracciato per: camminata prediligendo i sentieri</span>

                    {/* {entry.valutazione && <span> Valutazione: {entry.valutazione} / 5 </span>} */}
                    {entry.valutazione && (
                      <span className={appStyles.sectionCount}>
                        Valutazione: {"★".repeat(entry.valutazione)}{"☆".repeat(5 - entry.valutazione)}
                      </span>
                    )}
                    {entry.completato !== false && <span style={{color:"#2d6a4f"}}> Percorso completato </span>}
                  </>
                ) : routeInfo ? (
                  // nessun trek collegato ma abbiamo il GPX
                  <>
                    {entry.percorsoPersonalizzato && <span> {entry.percorsoPersonalizzato}</span>}
                    <span> {dataFormatted}</span>
                    {/* {entry.valutazione && <span> Valutazione: {entry.valutazione} / 5 </span>} */}
                    {entry.valutazione && (
                      <span className={appStyles.sectionCount}>
                        Valutazione: {"★".repeat(entry.valutazione)}{"☆".repeat(5 - entry.valutazione)}
                      </span>
                    )}
                    {entry.completato !== false && <span style={{color:"#2d6a4f"}}> Percorso completato</span>}
                    {entry.gpxData && <span> Traccia GPX allegata</span>}
                    {routeInfo?.routeType && (
                      <span> Tracciato per: {typeMap[routeInfo.routeType] ?? routeInfo.routeType}</span>
                    )}
                    <span style={{ color: "#7c3aed", fontSize: "12px", borderBottom: "none" }}>
                      Dati calcolati dal GPX allegato
                    </span>
                    <span> Difficoltà: {calcDifficulty(routeInfo.distanceMeters, routeInfo.durationSeconds)}</span>
                    <span> Durata: {formatDuration(routeInfo.durationSeconds)}</span>
                    <span> Lunghezza: {(routeInfo.distanceMeters / 1000).toFixed(1)} km</span>
                  </>
                ) : entry.percorsoPersonalizzato ? (
                  <span> {entry.percorsoPersonalizzato}</span>
                ) : null}

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
              {entry.gpxData && (
                <button
                  className={styles.actionButtonSecondary}
                  onClick={() => downloadGpx(entry)}
                >
                  Scarica GPX
                </button>
              )}
              {trek?.id && (
                <button
                  className={styles.actionButtonSecondary}
                  onClick={() => navigate(`/treks/${trek.id}`)}
                >
                   Vai al percorso
                </button>
              )}
            </div>

          </div>
        </section>

      </div>
    </main>
  );
}
