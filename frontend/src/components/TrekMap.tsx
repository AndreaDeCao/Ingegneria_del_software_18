import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, GeoJSON, Tooltip } from "react-leaflet";
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

const mountainIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Icona rossa per il punto di arrivo
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

// Questo componente si occupa di fare il fitBounds sulla polyline del percorso
function FitRoute({ geojson }: { geojson: any }) {
  const map = useMap();
  useEffect(() => {
    if (!geojson) return;
    const layer = L.geoJSON(geojson);
    map.fitBounds(layer.getBounds(), { padding: [30, 30] });
  }, [geojson, map]);
  return null;
}

type TrekMapProps = {
  name: string;
  coordinates?: { lat: number; lon: number };
  endCoordinates?: { lat: number; lon: number };  // aggiunto
  routeGeojson?: any;                             // aggiunto
};

export default function TrekMap({ name, coordinates, endCoordinates, routeGeojson }: TrekMapProps) {
  const center = coordinates ?? { lat: 46.065, lon: 11.12 };
  const hasCoords = !!coordinates;

  return (
    <MapContainer
      center={[center.lat, center.lon]}
      zoom={hasCoords ? 13 : 9}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
        url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
        maxZoom={17}
      />

      {/* Tracciato calcolato */}
      {routeGeojson && (
        <>
          <GeoJSON
            data={routeGeojson}
            style={{ color: "#2563eb", weight: 4, opacity: 0.8 }}
          />
          <FitRoute geojson={routeGeojson} />
        </>
      )}

      {/* Marker partenza (verde) */}
      {hasCoords && (
        <Marker position={[center.lat, center.lon]} icon={mountainIcon}>
          <Popup>Partenza: {name}</Popup>
        </Marker>
        
      )}
      

      {/* Marker arrivo (rosso) */}
      {endCoordinates && (
        <Marker position={[endCoordinates.lat, endCoordinates.lon]} icon={endIcon}>
          <Popup>Arrivo: {name}</Popup>
        </Marker>
      )}

      {/* Solo se non c'è il tracciato, ricentra sul marker */}
      {!routeGeojson && <RecenterMap lat={center.lat} lon={center.lon} />}
    </MapContainer>
  );
}