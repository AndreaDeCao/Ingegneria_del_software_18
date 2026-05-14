import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix icone rotte con Vite
// Vite non gestisce correttamente le immagini di Leaflet, quindi dobbiamo sovrascrivere i percorsi delle icone manualmente.
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Creiamo un'icona personalizzata per i trek, usando un marker verde per distinguerlo dagli altri marker (se ce ne saranno in futuro).
const mountainIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Questo componente serve a recentrare la mappa quando cambiano le coordinate del trek visualizzato.
function RecenterMap({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lon]);
  }, [lat, lon, map]);
  return null;
}

// Il componente principale che visualizza la mappa con il trek.
type TrekMapProps = {
  name: string;
  coordinates?: { lat: number; lon: number };
};

// Se non ci sono coordinate, mostriamo comunque la mappa centrata su una posizione di default (Trento) e senza marker.
export default function TrekMap({ name, coordinates }: TrekMapProps) {
  const center = coordinates ?? { lat: 46.065, lon: 11.12 }; // fallback: Trento
  const hasCoords = !!coordinates;

  return (
    <MapContainer
      center={[center.lat, center.lon]}
      zoom={hasCoords ? 13 : 9}         // zoom più ravvicinato se abbiamo le coordinate del trek, altrimenti più ampio per mostrare l'area generale
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={true}            // sopratutto per laptop
    >
      <TileLayer
        attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
        url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
        maxZoom={17}// OpenTopoMap ha un dettaglio massimo a zoom 17, oltre non ci sono più dati
      />

      {hasCoords && (
        <Marker position={[center.lat, center.lon]} icon={mountainIcon}>
          <Popup>{name}</Popup>
        </Marker>
      )}

      <RecenterMap lat={center.lat} lon={center.lon} />
    </MapContainer>
  );
}