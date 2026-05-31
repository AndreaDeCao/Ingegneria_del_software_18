import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, GeoJSON, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const startIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: markerShadow,
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const endIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: markerShadow,
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

// marker viola per partenza personalizzata
const customStartIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png",
  shadowUrl: markerShadow,
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

function RecenterMap({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => { map.setView([lat, lon]); }, [lat, lon, map]);
  return null;
}

function FitRoute({ geojson }: { geojson: any }) {
  const map = useMap();
  useEffect(() => {
    if (!geojson) return;
    try {
      const layer = L.geoJSON(geojson);
      const bounds = layer.getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [40, 40] });
    } catch (e) { console.warn("FitRoute: bounds non validi", e); }
  }, [geojson, map]);
  return null;
}

// componente che intercetta i click sulla mappa
function MapClickHandler({ onMapClick }: { onMapClick?: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

type TrekMapProps = {
  name: string;
  coordinates?: { lat: number; lon: number };
  endCoordinates?: { lat: number; lon: number };
  routeGeojson?: any;
  customStart?: { lat: number; lon: number } | null;
  onMapClick?: (lat: number, lon: number) => void;
  clickToSelect?: boolean;
};

export default function TrekMap({
  name,
  coordinates,
  endCoordinates,
  routeGeojson,
  customStart,
  onMapClick,
  clickToSelect = false,
}: TrekMapProps) {
  const center = customStart ?? coordinates ?? { lat: 46.065, lon: 11.12 };
  const hasStart = !!coordinates;
  const hasEnd = !!endCoordinates;
  const hasCustomStart = !!customStart;

  const geojsonKey = routeGeojson ? JSON.stringify(routeGeojson).length : "none";

  // Estrae il primo e ultimo punto del tracciato GeoJSON (in [lon, lat])
  // e li converte in [lat, lon] per ancorare i marker all'inizio/fine reale del percorso.
  const routeCoords: [number, number][] =
    routeGeojson?.features?.[0]?.geometry?.coordinates ?? [];
  const routeStart = routeCoords.length > 0
    ? { lat: routeCoords[0][1], lon: routeCoords[0][0] }
    : null;
  const routeEnd = routeCoords.length > 1
    ? { lat: routeCoords[routeCoords.length - 1][1], lon: routeCoords[routeCoords.length - 1][0] }
    : null;

  // Usa il punto snappato del tracciato se disponibile, altrimenti le coordinate del DB
  const startPin = routeStart ?? coordinates;
  const endPin = routeEnd ?? endCoordinates;

  return (
    <MapContainer
      center={[center.lat, center.lon]}
      zoom={hasStart ? 13 : 9}
      style={{
        height: "100%",
        width: "100%",
        cursor: clickToSelect ? "crosshair" : "grab"
      }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | <a href="https://opentopomap.org">OpenTopoMap</a>'
        url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
        maxZoom={17}
      />

      {clickToSelect && <MapClickHandler onMapClick={onMapClick} />}

      {routeGeojson && (
        <>
          <GeoJSON
            key={geojsonKey}
            data={routeGeojson}
            style={() => ({ color: "#2563eb", weight: 5, opacity: 0.85 })}
          />
          <FitRoute geojson={routeGeojson} />
        </>
      )}

      {/* Marker partenza originale (verde) — visibile solo se NON c'è una custom */}
      {hasStart && !hasCustomStart && startPin && (
        <Marker position={[startPin.lat, startPin.lon]} icon={startIcon}>
          <Popup>🟢 Partenza: {name}</Popup>
        </Marker>
      )}

      {/* Marker partenza personalizzata (viola) */}
      {hasCustomStart && (
        <Marker position={[customStart!.lat, customStart!.lon]} icon={customStartIcon}>
          <Popup>🟣 La tua partenza</Popup>
        </Marker>
      )}

      {/* Marker arrivo (rosso) */}
      {hasEnd && endPin && (
        <Marker position={[endPin.lat, endPin.lon]} icon={endIcon}>
          <Popup>🔴 Arrivo: {name}</Popup>
        </Marker>
      )}

      {!routeGeojson && <RecenterMap lat={center.lat} lon={center.lon} />}
    </MapContainer>
  );
}