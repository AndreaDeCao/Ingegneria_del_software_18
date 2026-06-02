import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { useAuth } from "../../auth/AuthProvider";
import { http } from "../../auth/api";
import type { Trek } from "../../types/Trek";
import appStyles from "../../App.module.css";
import styles from "./TrekDetails.module.css";
// import type { AlignCenter } from "lucide-react";

import TrekMap from "../../components/TrekMap";
import StarRating from "../../components/StarRating";
import starStyles from "../../components/StarRating.module.css";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
function downloadGpx(geojson: any, trekName: string, distanceMeters?: number, durationSeconds?: number, routeType?: string ) {
  const coords: [number, number][] =
    geojson?.features?.[0]?.geometry?.coordinates ?? [];

  const trkpts = coords
    .map(([lon, lat]) => `    <trkpt lat="${lat}" lon="${lon}"></trkpt>`)
    .join("\n");

  const gpx = `<?xml version="1.0" encoding="UTF-8"?>
  <gpx version="1.1" creator="DoloMate" xmlns="http://www.topografix.com/GPX/1/1">
    <metadata>
      ${distanceMeters !== undefined ? `<extensions><distance>${distanceMeters}</distance><duration>${durationSeconds}</duration>${routeType ? `<routeType>${routeType}</routeType>` : ""}</extensions>` : ""}
    </metadata>
    <trk>
      <name>${trekName}</name>
      <trkseg>
  ${trkpts}
      </trkseg>
    </trk>
  </gpx>`;

  const blob = new Blob([gpx], { type: "application/gpx+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${trekName.replace(/\s+/g, "_")}.gpx`;
  a.click();
  URL.revokeObjectURL(url);
}


export default function TrekDetails() {
  const { id } = useParams();
  const { user } = useAuth(); 

  const [trek, setTrek] = useState<Trek | null>(null);
  const [weather, setWeather] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [hoverVote, setHoverVote] = useState<number | null>(null);
  
  // const { user } = useAuth(); 

  const [myVote, setMyVote] = useState<number | null>(null);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [showNoteBox, setShowNoteBox] = useState(false);
  const [myNote, setMyNote] = useState<string>("");
  
  const [routeGeojson, setRouteGeojson] = useState<any>(null);
  const [routeInfo, setRouteInfo] = useState<{ distanceMeters: number; durationSeconds: number } | null>(null);

  // segnalazioni accettate dall'admin (banner pubblico)
  const [segnalazioniAccettate, setSegnalazioniAccettate] = useState<{ count: number; tipi: string[] } | null>(null);

  // partenza personalizzata (pin viola solo se attiva)
  const [customStart, setCustomStart] = useState<{ lat: number; lon: number } | null>(null);
  const [customStartLabel, setCustomStartLabel] = useState<string>("");
  // modalità selezione partenza: search | gps | map | parking
  const [selectMode, setSelectMode] = useState<"none" | "search" | "gps" | "map">("none");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [clickToSelect, setClickToSelect] = useState(false);
  const [parkingLoading, setParkingLoading] = useState(false);
  const [lastParkingCoords, setLastParkingCoords] = useState<{ lat: number; lon: number } | null>(null);

  // varianti di percorso (4 tipi: 2 a piedi + 2 in bici) — NON cambiano la partenza
  const [routeVariants, setRouteVariants] = useState<any[]>([]);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [variantsOpen, setVariantsOpen] = useState(false);
  const [activeVariantKey, setActiveVariantKey] = useState<string | null>(null);

  const [searchResults, setSearchResults] = useState<{ display_name: string; lat: string; lon: string }[]>([]);
  const [searchDebounce, setSearchDebounce] = useState<ReturnType<typeof setTimeout> | null>(null);


    
  //aggiunge Trek ai preferiti del user
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [favoriteError, setFavoriteError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  
  const disableSave = !user || favoriteLoading;

  const alreadyAtParking = !!lastParkingCoords && customStart?.lat === lastParkingCoords.lat && customStart?.lon === lastParkingCoords.lon;

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        const trekResponse = await fetch(`${API_BASE}/treks/${id}`);
        if (!trekResponse.ok) throw new Error("Errore caricamento trek");
        const trekData = await trekResponse.json();
        setTrek(trekData);

        // RATING UTENTE (solo se loggato)
        if (user) {
          const ratingData = await http<{ vote: number | null; note: string }>(`/treks/${id}/rate`);
          setMyVote(ratingData.vote);
          setMyNote(ratingData.note ?? "");
        }

        // TRACCIATO
        try {
          const routeResponse = await fetch(`${API_BASE}/api/route/${id}`);
          if (routeResponse.ok) {
            const routeData = await routeResponse.json();
            setRouteGeojson(routeData.geojson);
            setRouteInfo({
              distanceMeters: routeData.distanceMeters,
              durationSeconds: routeData.durationSeconds,
            });
          }
        } catch {
          // tracciato non disponibile, la mappa mostra solo il marker
        }

         // METEO 
        const weatherResponse = await fetch(
          `${API_BASE}/api/weather/${trekData._id}`
        );

        if (!weatherResponse.ok)
          throw new Error("Errore caricamento meteo");

        const weatherData = await weatherResponse.json();
        setWeather(weatherData);

        // SEGNALAZIONI ACCETTATE (banner pubblico)
        try {
          const segnRes = await fetch(`${API_BASE}/api/diary/segnalazioni-accettate?trekId=${id}`);
          if (segnRes.ok) {
            const segnData = await segnRes.json();
            if (segnData.count > 0) setSegnalazioniAccettate(segnData);
          }
        } catch {
          // silenzioso, il banner non è critico
        }

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);  

  useEffect(() => {
    if (!favoriteError) return;
    const timer = setTimeout(() => setFavoriteError(null), 3000);
    return () => clearTimeout(timer);
  }, [favoriteError]);

  //controlla i trek gia messi nei preferiti
  useEffect(() => {
    if (!user || !trek) return;

    const checkFavorite = () => {
      http<Trek[]>("/users/favorites")
        .then((favorites) => {
          const alreadySaved = favorites.some(
            (fav: any) => fav._id === (trek as any)._id
          );
          setIsFavorite(alreadySaved);
        })
        .catch(() => {
          // silenzioso, non blocca la pagina
        });
    };

    checkFavorite();

    window.addEventListener("focus", checkFavorite);
    return () => window.removeEventListener("focus", checkFavorite);
  }, [user, trek]);

  function getHourlyList(weather: any) {
    const hourly = weather?.weather?.["180"];
    if (!hourly) return [];

    const list = Object.entries(hourly).map(([key, value]: any) => {
      return {
        key,
        ...value,
      };
    });

    return list;
  }

  function getCurrentHourIndex(list: any[]) {
    const now = new Date().getHours();

    // approssimazione: ogni slot ≈ 3 ore
    const idx = Math.floor(now / 3);
    if (!Array.isArray(list) || list.length === 0) return idx;
    return Math.min(idx, list.length - 1);
  }

  function getDayList(weather: any) {
    const day = weather?.weather?.["1440"];
    if (!day) return [];

    const list = Object.entries(day).map(([key, value]: any) => {
      return {
        key,
        ...value,
      };
    });
    return list;
  }

  function formatSlotTime(key: string) {     // ogni step = 3 ore = 180 minuti
    // prendi solo la parte numerica finale
    const totalMinutes = parseInt(key.slice(-4)); // es: 0180, 0360
    const hours = Math.floor(totalMinutes / 60);

    const startHour = hours.toString().padStart(2, "0") + ":" + "00";
    const endHour = ((hours + 2) % 24).toString().padStart(2, "0") + ":" + "59";

    return `${startHour} - ${endHour}`;
  }

  function formatDayLabelFromKey(weather: any, key: string) {
    const start = new Date(weather.weather.start);

    const base = 144000000;
    const step = 1440;

    const numericKey = Number(key);

    const offsetDays = (numericKey - base) / step;

    const date = new Date(start);

    date.setDate(date.getDate() + offsetDays);

    return date.toLocaleDateString("it-IT", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    });
  }

  function skyToText(code: string): string {
    switch (code) {
      case "A": return "Cielo sereno";
      case "B": return "Soleggiato";
      case "C": return "Parzialmente nuvoloso";
      case "D": return "Nuvoloso";
      case "E": return "Molto nuvoloso";
      case "F": return "Rovesci";
      case "G": return "Rovesci forti";
      case "H": return "Pioggia moderata";
      case "I": return "Pioggia forte";
      case "J": return "Pioggia debole";
      case "K": return "Rovesci deboli";
      case "L": return "Neve debole e sole";
      case "M": return "Neve e sole";
      case "N": return "Neve debole";
      case "O": return "Neve moderata";
      case "P": return "Neve forte";
      case "Q": return "Neve bagnata e sole";
      case "R": return "Neve bagnata";
      case "S": return "Foschia";
      case "T": return "Foschia in quota";
      case "U": return "Instabile";
      case "V": return "Temporali";
      case "W": return "Instabile con neve bagnata";
      case "X": return "Temporali di neve bagnata";
      case "Y": return "Instabile con temporali nevosi";
      case "Z": return "Temporali nevosi";
      default: return "N/D";
    }
  }

  async function shareWithFriends() {
    const shareData = {
      title: trek?.name ?? "Percorso",
      text: `Guarda questo percorso su Dolomate!`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        console.log("Condivisione annullata");
      }
    }

    // fallback: copia link negli appunti
    try {
      await navigator.clipboard.writeText(shareData.url);
      alert("Link copiato negli appunti!");
    } catch {
      alert("Impossibile condividere automaticamente. Copia il link dalla barra degli indirizzi.");
    }
  }

  // applica una partenza personalizzata e ricalcola il tracciato (pin viola)
  async function applyCustomStart(lat: number, lon: number, label: string) {
    setCustomStart({ lat, lon });
    setCustomStartLabel(label);
    setClickToSelect(false);
    setSelectMode("none");
    setRouteLoading(true);
    // Chiude le varianti e le resetta: vanno ricalcolate con la nuova partenza
    setVariantsOpen(false);
    setRouteVariants([]);
    setActiveVariantKey(null);
    setLastParkingCoords(null);
    try {
      const res = await fetch(
        `${API_BASE}/api/route/${id}/custom?startLat=${lat}&startLon=${lon}`
      );
      if (!res.ok) throw new Error("Errore calcolo percorso");
      const data = await res.json();
      setRouteGeojson(data.geojson);
      setRouteInfo({ distanceMeters: data.distanceMeters, durationSeconds: data.durationSeconds });
    } catch (err: any) {
      setSearchError(err.message);
    } finally {
      setRouteLoading(false);
    }
  }

  // ripristina partenza originale (pin verde)
  async function resetCustomStart() {
    setCustomStart(null);
    setCustomStartLabel("");
    setSelectMode("none");
    setClickToSelect(false);
    setSearchError(null);
    setRouteLoading(true);
    setRouteVariants([]);
    setActiveVariantKey(null);
    setVariantsOpen(false);
    setLastParkingCoords(null);
    try {
      const res = await fetch(`${API_BASE}/api/route/${id}`);
      if (res.ok) {
        const data = await res.json();
        setRouteGeojson(data.geojson);
        setRouteInfo({ distanceMeters: data.distanceMeters, durationSeconds: data.durationSeconds });
      }
    } finally {
      setRouteLoading(false);
    }
  }

  // parcheggio più vicino → cambia punto di partenza (pin viola), stesso pannello delle altre modalità
  async function handleParking() {
    // Se la partenza corrente coincide con l'ultimo parcheggio, non fare nulla
    if ( lastParkingCoords && customStart?.lat === lastParkingCoords.lat && customStart?.lon === lastParkingCoords.lon ) {
      return; // oppure rendi button non cliccabile
    }

    setSearchError(null);
    setParkingLoading(true);
    try {
      const start = customStart ?? { lat: trek!.coordinates.lat, lon: trek!.coordinates.lon };
      const res = await fetch(
        `${API_BASE}/api/route/${id}/parking?startLat=${start.lat}&startLon=${start.lon}`
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Parcheggio non trovato");
      }
      const data = await res.json();

      // Salva le coordinate del parcheggio trovato
      setLastParkingCoords({ lat: data.startLat, lon: data.startLon });

      setCustomStart({ lat: data.startLat, lon: data.startLon });
      setCustomStartLabel(data.label);
      setRouteGeojson(data.geojson);
      setRouteInfo({ distanceMeters: data.distanceMeters, durationSeconds: data.durationSeconds });
      setSelectMode("none");
      setVariantsOpen(false);
      setRouteVariants([]);
      setActiveVariantKey(null);
    } catch (err: any) {
      setSearchError(err.message);
    } finally {
      setParkingLoading(false);
    }
}

  function handleSearchInput(value: string) {
    setSearchQuery(value);
    setSearchError(null);

    if (searchDebounce) clearTimeout(searchDebounce);

    if (value.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=5&addressdetails=1`,
          { headers: { "Accept-Language": "it" } }
        );
        const results = await res.json();
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);

    setSearchDebounce(timeout);
  }

  function handleSelectResult(result: { display_name: string; lat: string; lon: string }) {
    setSearchResults([]);
    setSearchQuery(result.display_name);
    applyCustomStart(parseFloat(result.lat), parseFloat(result.lon), result.display_name);
  }

  // GPS
  function handleGps() {
    setSearchError(null);
    if (!navigator.geolocation) {
      setSearchError("GPS non supportato dal browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => applyCustomStart(pos.coords.latitude, pos.coords.longitude, "La tua posizione"),
      () => setSearchError("Impossibile ottenere la posizione GPS")
    );
  }

  // click su mappa
  function handleMapClick(lat: number, lon: number) {
    applyCustomStart(lat, lon, `${lat.toFixed(5)}, ${lon.toFixed(5)}`);
  }

  // carica le 4 varianti di percorso con la partenza corrente (non cambia il pin)
  async function loadRouteVariants() {
    if (variantsOpen) { setVariantsOpen(false); return; }
    setVariantsOpen(true);
    if (routeVariants.length > 0) return;

    setVariantsLoading(true);
    try {
      const startLat = customStart?.lat ?? trek?.coordinates?.lat;
      const startLon = customStart?.lon ?? trek?.coordinates?.lon;
      const url = `${API_BASE}/api/route/${id}/variants?startLat=${startLat}&startLon=${startLon}`;
      const res = await fetch(url);
      const data = await res.json();
      setRouteVariants(data.variants ?? []);
    } catch {
      setRouteVariants([]);
    } finally {
      setVariantsLoading(false);
    }
  }

  // applica una variante (NON cambia il punto di partenza)
  function applyVariant(v: any) {
    if (v.error) return;
    setActiveVariantKey(v.key);
    setRouteGeojson(v.geojson);
    setRouteInfo({ distanceMeters: v.distanceMeters, durationSeconds: v.durationSeconds });
  }

  // reset variante → torna al percorso con la partenza corrente
  async function resetVariant() {
    setActiveVariantKey(null);
    setRouteLoading(true);
    try {
      if (customStart) {
        const res = await fetch(`${API_BASE}/api/route/${id}/custom?startLat=${customStart.lat}&startLon=${customStart.lon}`);
        if (res.ok) { const d = await res.json(); setRouteGeojson(d.geojson); setRouteInfo({ distanceMeters: d.distanceMeters, durationSeconds: d.durationSeconds }); }
      } else {
        const res = await fetch(`${API_BASE}/api/route/${id}`);
        if (res.ok) { const d = await res.json(); setRouteGeojson(d.geojson); setRouteInfo({ distanceMeters: d.distanceMeters, durationSeconds: d.durationSeconds }); }
      }
    } finally {
      setRouteLoading(false);
    }
  }
  
  async function toggleFavorite() {
    // console.log(user);

    if (!user) {
      setFavoriteError("Devi accedere per salvare un percorso");
      return;
    }
    
    // console.log("favoriteTreks:", user.favoriteTreks);
    // console.log("trek._id:", (trek as any)._id);

    if (!trek?.id) return;

    setFavoriteLoading(true);
    setFavoriteError(null);

    try {

      if (isFavorite) {

        await http(`/users/favorites/${trek.id}`, {
          method: "DELETE",
        });

        setIsFavorite(false);

      } else {

        await http(`/users/favorites/${trek.id}`, {
          method: "POST",
        });

        setIsFavorite(true);

      }

    } catch (err) {

      const message =
        err instanceof Error
          ? err.message
          : "Errore gestione preferiti";

      setFavoriteError(message);

    } finally {

      setFavoriteLoading(false);

    }
  }


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

  // async function handleVote(vote: number) {
    
  //   if (!user) return;
    
  //   setRatingLoading(true);
    
  //   try {
  //     const data = await http<{ averageRating: number; ratingCount: number }>(`/treks/${id}/rate`, {
  //       method: "PUT",
  //       body: JSON.stringify({ vote, note: myNote }),
  //     });

  //     setMyVote(vote);
  //     setTrek(prev => prev ? { ...prev, averageRating: data.averageRating, ratingCount: data.ratingCount } : prev);
  //   } catch (err) {
  //     console.error("Errore voto:", err);
  //   } finally {
  //     setRatingLoading(false);
  //   }
  // }
  
  function formatDuration(seconds: number): string {
    const totalMinutes = Math.round(seconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) return `${minutes} min`;
    if (minutes === 0) return `${hours} h`;
    return `${hours} h ${minutes} min`;
  }

  function calcDifficulty(distanceMeters: number, durationSeconds: number): string {
    const km = distanceMeters / 1000;
    const ore = durationSeconds / 3600;

    // velocità media in km/h (più è bassa, più il terreno è impegnativo)
    const speed = km / ore;

    // punteggio composito: penalizza distanze lunghe e velocità bassa
    const score = km * 0.6 + (1 / speed) * 10;

    if (score < 6) return "Facile";
    if (score < 12) return "Medio";
    return "Difficile";
  }


  async function handleVote() {

    if (!user || !myVote) return;

    setRatingError(null);
    setRatingLoading(true);

    try {

      const data = await http<{ averageRating: number; ratingCount: number }>(
        `/treks/${id}/rate`,
        {
          method: "PUT",
          body: JSON.stringify({
            vote: myVote,
            note: myNote
          }),
        }
      );

      setTrek(prev =>
        prev
          ? {
              ...prev,
              averageRating: data.averageRating,
              ratingCount: data.ratingCount
            }
          : prev
      );

      // reset UI dopo salvataggio
      setShowNoteBox(false);
      // mantieni la nota in stato (se vuoi riaprire la textarea)

    } catch (err) {

      const message = err instanceof Error ? err.message : "Errore nel salvataggio del voto";
      setRatingError(message);
      console.error("Errore voto:", err);

    } finally {

      setRatingLoading(false);

    }
  }

  return (
    <main className={appStyles.main}>
      <div className={appStyles.contentLayout}>
        
        {/* LEFT */}
        <section className={appStyles.leftColumn}>

          {/* HERO */}
          {/* <div className={styles.hero}> 
            <div className={styles.heroBadge}>
              SAT {trek.SatRouteNumber}
            </div>
          </div> */}

          {/* TITLE */}
          <div className={appStyles.sectionHead}>
            <h1 className={styles.pageTitle}>{trek.name}</h1>
          </div>

          {/* BADGES */}
          <div className={styles.badges}>
            <div className={appStyles.sectionCount}>
            <span>
              Trek details: 
            </span>
            <span> — {
              (customStart || activeVariantKey) && routeInfo?.distanceMeters && routeInfo?.durationSeconds
                ? calcDifficulty(routeInfo.distanceMeters, routeInfo.durationSeconds)
                : trek.difficulty
            }</span>

            <span> — {
              (customStart || activeVariantKey) && routeInfo?.durationSeconds
                ? `${formatDuration(routeInfo.durationSeconds)} (stimati)`
                : trek.duration
            }</span>

            <span> — {
              (customStart || activeVariantKey) && routeInfo?.distanceMeters
                ? `${(routeInfo.distanceMeters / 1000).toFixed(1)} km (calcolati)`
                : `${trek.lengthKm ?? "-"} km`
            }</span>
            <span> — {(customStart || activeVariantKey) ? "-" : (trek.elevationGain ?? "-")} m — </span>
            
            {(customStart || activeVariantKey) && (
              <span style={{ color: "#7c3aed", fontSize: "12px", borderBottom: "none" }}>
                {(customStart && activeVariantKey)
                  ? "Dati aggiornati dalla tua partenza e dal tipo di percorso selezionato"
                  : customStart
                    ? "Dati aggiornati dalla tua partenza"
                    : "Dati aggiornati in base al tipo di percorso selezionato"}
              </span>
            )}

            </div>

          </div>

          {/* DESCRIPTION */}
          <div className={styles.section}>
            <h2 className={appStyles.sectionTitle}>Descrizione</h2>

            <p className={appStyles.message}>
              {trek.description || "Nessuna descrizione disponibile."}
            </p>
          </div>

          {/* BANNER SEGNALAZIONI ACCETTATE */}
          {segnalazioniAccettate && segnalazioniAccettate.count > 0 && (
            <div style={{
              backgroundColor: "#fef3c7",
              border: "1px solid #f59e0b",
              borderRadius: "8px",
              padding: "0.75rem 1rem",
              marginBottom: "1rem",
              display: "flex",
              gap: "0.6rem",
              alignItems: "flex-start",
            }}>
              <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>⚠️</span>
              <div>
                <strong style={{ fontSize: "0.95rem", color: "#92400e" }}>
                  Attenzione: segnalazioni attive su questo percorso
                </strong>
                <ul style={{ margin: "0.3rem 0 0", paddingLeft: "1.1rem", fontSize: "0.85rem", color: "#78350f" }}>
                  {segnalazioniAccettate.tipi.map((tipo) => (
                    <li key={tipo}>{tipo}</li>
                  ))}
                </ul>
                <p style={{ margin: "0.4rem 0 0", fontSize: "0.8rem", color: "#92400e" }}>
                  Verifica le condizioni prima di partire.
                </p>
              </div>
            </div>
          )}

          {/* integrazione mappa google-Maps
          <div className={styles.mapContainer}>
            <iframe
              title="Mappa del percorso"
              src={
                trek.coordinates?.lat && trek.coordinates?.lon
                  ? `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${trek.coordinates.lat},${trek.coordinates.lon}&zoom=13`
                  : `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${encodeURIComponent(trek.name)}&zoom=12`
              }
              className={styles.map}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div> */}

          {/* ── CAMBIA PUNTO DI PARTENZA (pin viola) ─────────────────── */}
          <div className={styles.customStartBox}>

            {/* Banner partenza attiva — sopra, separato */}
            {customStart && (
              <div className={styles.customStartActiveBadge}>
                <span>🟣 Partenza: <strong>{customStartLabel}</strong></span>
                <button className={styles.resetButton} onClick={resetCustomStart}>
                  Ripristina predefinita
                </button>
              </div>
            )}

            {/* Riga label + bottoni — sempre visibile */}
            <div className={styles.customStartRow}>
              <span className={styles.customStartLabel}>Cambia punto di partenza:</span>
              <button
                className={`${styles.modeButton} ${selectMode === "search" ? styles.modeButtonActive : ""}`}
                onClick={() => { setSelectMode(selectMode === "search" ? "none" : "search"); setSearchError(null); }}
              >
                 Cerca un indirizzo
              </button>
              <button
                className={`${styles.modeButton} ${selectMode === "gps" ? styles.modeButtonActive : ""}`}
                onClick={() => { setSelectMode("gps"); handleGps(); }}
              >
                 Usa il GPS
              </button>
              <button
                className={`${styles.modeButton} ${selectMode === "map" ? styles.modeButtonActive : ""}`}
                onClick={() => {
                  const next = selectMode !== "map";
                  setSelectMode(next ? "map" : "none");
                  setClickToSelect(next);
                }}
              >
                Seleziona sulla mappa
              </button>

              <button
                className={`${styles.modeButton} ${alreadyAtParking ? styles.modeButtonDisabled : ""}`}
                onClick={handleParking}
                disabled={parkingLoading || alreadyAtParking}
                title={alreadyAtParking ? "Sei già partito dal parcheggio più vicino" : undefined}
              >
                {parkingLoading ? "Ricerca..." : alreadyAtParking ? "Già al parcheggio" : "Parcheggio più vicino"}
              </button>
            </div>

            {/* Pannello ricerca */}
            {selectMode === "search" && (
              <div className={styles.searchBox}>
                <div className={styles.searchInputWrapper}>
                  <input
                    className={styles.searchInput}
                    type="text"
                    placeholder="Es: Passo Rolle, Trento..."
                    value={searchQuery}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && searchResults.length > 0) handleSelectResult(searchResults[0]);
                      if (e.key === "Escape") setSearchResults([]);
                    }}
                    autoComplete="off"
                  />
                  {searchResults.length > 0 && (
                    <ul className={styles.searchDropdown}>
                      {searchResults.map((r, i) => (
                        <li key={i} className={styles.searchDropdownItem} onClick={() => handleSelectResult(r)}>
                          <span className={styles.searchDropdownIcon}>📍</span>
                          <span>{r.display_name}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {searchLoading && <span className={styles.searchSpinner}>⏳</span>}
                </div>
              </div>
            )}

            {selectMode === "map" && (
              <p className={styles.mapClickHint}>
                Clicca sulla mappa per scegliere il punto di partenza
              </p>
            )}

            {routeLoading && <p className={styles.routeLoading}>Ricalcolo percorso...</p>}
            {searchError && <p className={styles.searchErrorText}>{searchError}</p>}
          </div>

          {/* ── TIPO DI PERCORSO (4 varianti, partenza invariata) ─────── */}
          <div className={styles.customStartBox} style={{ marginTop: 8 }}>

            {/* Banner variante attiva — sparisce quando activeVariantKey è null */}
            {activeVariantKey !== null && (
              <div className={styles.customStartActiveBadge}>
                <span>Variante: <strong>{routeVariants.find(v => v.key === activeVariantKey)?.label ?? activeVariantKey}</strong></span>
                <button className={styles.resetButton} onClick={resetVariant}>
                  Ripristina sentiero hiking
                </button>
              </div>
            )}

            {/* Riga label + bottoni — sempre visibile */}
            <div className={styles.customStartRow}>
              <span className={styles.customStartLabel}>Tipo di percorso:</span>
              {routeVariants.length === 0 && !variantsLoading && (
                <button
                  className={styles.modeButton}
                  onClick={loadRouteVariants}
                >
                  Mostra varianti
                </button>
              )}
              {variantsLoading && <span className={styles.routeLoading}>Calcolo varianti...</span>}
              {routeVariants.map((v) => (
                <button
                  key={v.key}
                  className={`${styles.modeButton} ${activeVariantKey === v.key ? styles.modeButtonActive : ""} ${v.error ? styles.modeButtonDisabled : ""}`}
                  disabled={!!v.error}
                  title={v.error ? (v.errorMessage ?? "Non disponibile") : undefined}
                  onClick={() => {
                    // se è già attivo o è hiking (default), reset → banner sparisce
                    if (activeVariantKey === v.key || v.key === "hiking") {
                      resetVariant();
                    } else {
                      applyVariant(v);
                    }
                  }}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.mapContainer}>
            {/* <TrekMap
              name={trek.name}
              coordinates={trek.coordinates}
              endCoordinates={trek.endCoordinates}
              routeGeojson={routeGeojson}
            /> */}
            <TrekMap
              name={trek.name}
              coordinates={trek.coordinates}
              endCoordinates={trek.endCoordinates}
              routeGeojson={routeGeojson}
              customStart={customStart}
              onMapClick={handleMapClick}
              clickToSelect={clickToSelect}
            />
          </div>
          <div className={styles.mapLegend}>
            {customStart ? (
              <span>🟣 La tua partenza</span>
            ) : (
              <span>🟢 Partenza</span>
            )}
            <span>🔴 Arrivo</span>
            <span>🔵 Percorso</span>
          </div>

          {/* INFO BOX */}
          <div className={styles.infoCard}>
            <h2 className={appStyles.sectionTitle}>
              Informazioni del percorso predefinito
            </h2>

            <div className={styles.infoContent}>
              <div>
                <p>
                  <strong>Partenza:</strong> {trek.startPoint}
                </p>

                <p>
                  <strong>Arrivo:</strong> {trek.endPoint}
                </p>

                <p>
                  <strong>Durata:</strong> {trek.duration}
                </p>
              </div>

              <div>
                <p> 
                  <strong>Lunghezza:</strong> {trek.lengthKm ?? "-"} km
                </p>
                <p>
                  <strong>Quota minima:</strong> {trek.minAltitude ?? "-"} m
                </p>

                <p>
                  <strong>Quota massima:</strong> {trek.maxAltitude ?? "-"} m
                </p>

                <p>
                  <strong>Dislivello:</strong> {trek.elevationGain ?? "-"} m
                </p>
              </div>
            </div>
          </div>

          {/* WEATHER BOX */}
          {weather && (
            <section className={styles.weatherBox}>
              <h2 className={appStyles.sectionTitle}>Meteo</h2>

              {(() => {
                const hourlyList = getHourlyList(weather);
                const currentHourIndex = getCurrentHourIndex(hourlyList);

                const dayList = getDayList(weather);

                if (!hourlyList || !dayList) {
                  return <p>Dati meteo non disponibili</p>;
                }

                return (
                  <div className={styles.weatherGrid}>
                    
                    {/* METEO ORARIO */}
                    <div>
                      <h3 className={appStyles.sectionSubtitle}>Previsioni orarie (oggi)</h3>

                      <div className={styles.weatherTimeline}>
                        {hourlyList.slice(currentHourIndex, 8).map((item, index) => (
                          <div
                            key={item.key}
                            className={
                              index === 0
                                ? styles.weatherActive
                                : styles.weatherItem
                            }
                          >
                            <p>
                              {formatSlotTime(item.key)}
                            </p>

                            <p><span>🌡</span> {item.temperature}°C</p>

                            <p><span>🌧</span> {item.rain_probability}%</p>

                            <p><span>💨</span> {item.wind_speed} km/h</p>

                            <p><span>❄</span> {item.snow_level} m</p>

                            <p>{skyToText(item.sky_condition)}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* METEO GIORNALIERO (trend) */}
                    
                    <div>
                      <h3 className={appStyles.sectionSubtitle}>Previsioni giornaliere</h3>

                      <div className={styles.weatherTimeline}>
                        {dayList.map((item, index) => (
                          <div
                            key={item.key}
                            className={
                              index === 0
                                ? styles.weatherActive
                                : styles.weatherItem
                            }
                          >
                            <p>
                              {formatDayLabelFromKey(weather, item.key)}
                            </p>

                            <p><span>🌡</span> Min-Max: <br />{item.temperature_minimum}-{item.temperature_maximum}°C</p>
                            <p><span>🌧</span> Pioggia: <br />{item.rain_fall} mm</p>
                            <p><span>🌧</span> Probabilità: <br />{item.rain_probability}%</p>
                            <p><span>❄</span> Neve: <br />{item.snow_level} m</p>

                            <p>{skyToText(item.sky_condition)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </section>
          )}
        </section>

        {/* RIGHT */}
        <section className={appStyles.rightColumn}>
          <div className={styles.sidebar}>

            {/* SUMMARY */}
            {/* <div className={styles.card}>
              <h3 className={appStyles.sectionTitle}>Riepilogo</h3>

              <div className={styles.summaryList}>
                <span>Difficoltà: {trek.difficulty}</span>
                <span>Durata: {trek.duration}</span>
                <span>Lunghezza: {trek.lengthKm ?? "-"} km</span>
                <span>Dislivello: {trek.elevationGain ?? "-"} m</span>
              </div>
            </div> */}
            <div className={styles.card}>
              <h3 className={appStyles.sectionTitle}>Riepilogo</h3>
              <div className={styles.summaryList}>
                <span>Difficoltà: {
                  (customStart || activeVariantKey) && routeInfo?.distanceMeters && routeInfo?.durationSeconds
                    ? calcDifficulty(routeInfo.distanceMeters, routeInfo.durationSeconds)
                    : trek.difficulty
                }</span>
                <span>Durata: {
                  (customStart || activeVariantKey) && routeInfo?.durationSeconds
                    ? `${formatDuration(routeInfo.durationSeconds)} (stimati)`
                    : trek.duration
                }</span>
                <span>Lunghezza: {
                  (customStart || activeVariantKey) && routeInfo?.distanceMeters
                    ? `${(routeInfo.distanceMeters / 1000).toFixed(1)} km (calcolati)`
                    : `${trek.lengthKm ?? "-"} km`
                }</span>
                <span>Dislivello: {(customStart || activeVariantKey) ? "-" : (trek.elevationGain ?? "-")} m</span>

                {(customStart || activeVariantKey) && (
                  <span style={{ color: "#7c3aed", fontSize: "12px", borderBottom: "none" }}>
                    {/* {customStart && activeVariantKey ? "Dati aggiornati dalla tua partenza" : "Dati aggiornati in base al tipo di percorso selezionato"} */}
                    {(customStart && activeVariantKey)
                      ? "Dati aggiornati dalla tua partenza e dal tipo di percorso selezionato"
                      : customStart
                        ? "Dati aggiornati dalla tua partenza"
                        : "Dati aggiornati in base al tipo di percorso selezionato"}
                  </span>
                )}
              </div>
            </div>

            {/* RATING */}
            <div className={styles.card}>
              <h3 className={appStyles.sectionTitle}>Valutazione</h3>

              {/* Media attuale */}
              <div style={{ marginBottom: "0.75rem" }}>
                <StarRating rating={trek.averageRating ?? 0} />
                <p style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
                  {trek.averageRating
                    ? `${trek.ratingCount ?? 0} vot${(trek.ratingCount ?? 0) === 1 ? "o" : "i"}`
                    : "Nessuna valutazione ancora"}
                </p>
              </div>

              {/* Stelle cliccabili (solo se loggato) */}
              {user ? (
                <div>
                  <p style={{ fontSize: "0.85rem", marginBottom: "0.4rem" }}>
                    {myVote ? `Il tuo voto: ${myVote}/5` : "Dai un voto a questo percorso:"}
                  </p>
                  <div className={starStyles.stars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        // onClick={() => handleVote(star)}
                        onClick={() => {
                          setMyVote(star);
                          setShowNoteBox(true);
                          setRatingError(null);
                        }}
                        onMouseEnter={() => setHoverVote(star)}
                        onMouseLeave={() => setHoverVote(null)}
                        disabled={ratingLoading}
                        className={starStyles.starButton}
                      >
                        <span
                          className={`${starStyles.star} ${
                            star <= (hoverVote ?? myVote ?? 0) ? starStyles.starFull : starStyles.starEmpty
                          }`}
                        >
                          ★
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* <textarea
                    value={myNote}
                    onChange={(e) => setMyNote(e.target.value)}
                    placeholder="Aggiungi una nota (opzionale)..."
                    maxLength={500}
                    rows={3}
                    style={{
                      marginTop: "0.75rem",
                      width: "100%",
                      resize: "vertical",
                      padding: "0.4rem",
                      fontSize: "0.85rem",
                      borderRadius: "6px",
                      border: "1px solid #d1d5db",
                      boxSizing: "border-box"
                    }}
                  />
                  <button
                    onClick={() => handleVote(myVote ?? 0)}
                    disabled={ratingLoading || !myVote}
                    style={{
                      marginTop: "0.4rem",
                      fontSize: "0.8rem",
                      padding: "0.3rem 0.8rem",
                      cursor: !myVote || ratingLoading ? "not-allowed" : "pointer",
                      borderRadius: "6px",
                      border: "none",
                      background: !myVote ? "#d1d5db" : "#f59e0b",
                      color: "white"
                    }}
                  >
                    Salva nota
                  </button> */}

                  {showNoteBox && (
                    <div className={styles.noteBox}>
                      <textarea
                        className={styles.noteTextarea}
                        value={myNote}
                        onChange={(e) => setMyNote(e.target.value)}
                        placeholder="Aggiungi una nota (opzionale)..."
                        maxLength={500}
                        rows={3}
                      />

                      <button
                        className={styles.noteSaveButton}
                        onClick={handleVote}
                        disabled={ratingLoading || !myVote}
                      >
                        Salva recensione
                      </button>
                    </div>
                  )}

                  {ratingLoading && (
                    <p style={{ fontSize: "0.8rem", marginTop: "0.3rem" }}>Salvataggio...</p>
                  )}

                  {ratingError && (
                    <p style={{ fontSize: "0.8rem", marginTop: "0.3rem", color: "#b91c1c" }}>
                      {ratingError}
                    </p>
                  )}
                </div>
              ) : (
                <p style={{ fontSize: "0.85rem", color: "gray" }}>
                  Accedi per votare questo percorso.
                </p>
              )}
            </div>

            {/* ACTION CARD */}
            <div className={styles.actionCard}>
              <h3 className={styles.actionTitle}>
                Pronto per partire?
              </h3>

              <p className={styles.actionText}>
                Salva il percorso o condividilo con amici.
              </p>

              
              <button
                className={styles.saveShareButton}
                onClick={toggleFavorite}
                disabled={disableSave}
              >
                {!user
                  ? "Accedi per salvare"
                  : favoriteLoading
                    ? "Caricamento..."
                    : isFavorite
                      ? "Rimuovi dai preferiti"
                      : "Salva percorso"}
              </button>

              {favoriteError && (
                <p
                  style={{
                    marginTop: "0.4rem",
                    fontSize: "0.8rem",
                    color: "#b91c1c",
                  }}
                >
                  {favoriteError}
                </p>
              )}

              <button className={styles.saveShareButton} onClick={shareWithFriends}>
                Condividi con amici
              </button>
              
              
              {/* Bottone GPX: visibile solo se abbiamo le coordinate */}
              {trek.coordinates && trek.endCoordinates && (
                <button
                  className={styles.saveShareButton}
                  disabled={!routeGeojson} 
                  onClick={() => downloadGpx(routeGeojson, trek.name, routeInfo?.distanceMeters, routeInfo?.durationSeconds, activeVariantKey ?? "hiking")} 
                >
                  {routeGeojson ? "⬇ Scarica GPX" : "Caricamento..."}
                </button>
              )}
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
