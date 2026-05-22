import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, GeoJSON } from "react-leaflet";
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
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const endIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function RecenterMap({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lon]);
  }, [lat, lon, map]);
  return null;
}

function FitRoute({ geojson }: { geojson: any }) {
  const map = useMap();
  useEffect(() => {
    if (!geojson) return;
    try {
      const layer = L.geoJSON(geojson);
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    } catch (e) {
      console.warn("FitRoute: bounds non validi", e);
    }
  }, [geojson, map]);
  return null;
}

type TrekMapProps = {
  name: string;
  coordinates?: { lat: number; lon: number };
  endCoordinates?: { lat: number; lon: number };
  routeGeojson?: any;
};

export default function TrekMap({ name, coordinates, endCoordinates, routeGeojson }: TrekMapProps) {
  const center = coordinates ?? { lat: 46.065, lon: 11.12 };
  const hasStart = !!coordinates;
  const hasEnd = !!endCoordinates;

  // Chiave univoca per forzare il re-render del layer GeoJSON quando cambia il tracciato
  const geojsonKey = routeGeojson ? JSON.stringify(routeGeojson).length : "none";

  return (
    <MapContainer
      center={[center.lat, center.lon]}
      zoom={hasStart ? 13 : 9}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | <a href="https://opentopomap.org">OpenTopoMap</a>'
        url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
        maxZoom={17}
      />

      {/* Tracciato — la key forza il re-render se cambia il geojson */}
      {routeGeojson && (
        <>
          <GeoJSON
            key={geojsonKey}
            data={routeGeojson}
            style={() => ({
              color: "#2563eb",
              weight: 5,
              opacity: 0.85,
            })}
          />
          <FitRoute geojson={routeGeojson} />
        </>
      )}

      {/* Marker partenza (verde) */}
      {hasStart && (
        <Marker position={[center.lat, center.lon]} icon={startIcon}>
          <Popup>🟢 Partenza: {name}</Popup>
        </Marker>
      )}

      {/* Marker arrivo (rosso) */}
      {hasEnd && (
        <Marker position={[endCoordinates!.lat, endCoordinates!.lon]} icon={endIcon}>
          <Popup>🔴 Arrivo: {name}</Popup>
        </Marker>
      )}

      {/* Ricentra solo se non c'è tracciato */}
      {!routeGeojson && <RecenterMap lat={center.lat} lon={center.lon} />}
    </MapContainer>
  );
}