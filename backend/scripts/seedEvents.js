/**
 * Script per popolare la collection Event su MongoDB
 * 
 * Fonte: API ComunWeb del comune di Trento
 * Endpoint:  https://eventi.comune.trento.it/api/opendata/v2/content/search?classes=event
 * 
 * 
 * DA TERMINALE: node backend/scripts/seedEvents.js
 * 
 * Va eseguito una sola volta prima di avviare il server.
 * Rieseguire solo se si vuole aggiornare il dataset.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Event = require("../models/events");

const BASE_URL = process.env.COMUNE_TRENTO_API_URL;

/**
 * Rimuove tag HTML da una stringa.
 * 
 * @param {string} html - Stringa con tag HTML
 * @returns {string} Testo pulito senza tag HTML
 */
function stripHtml(html){
  return html ? html.replace(/<[^>]*>/g, "").trim() : "";
}


/**
 * Normalizza evento grezzo dell'API in un oggetto semplice.
 * 
 * @param {object} hit - Oggetto restituito dall'API
 * @returns {object} Evento normalizzato
 */
function normalizeEvent(hit){
  const d = hit.data?.["ita-IT"] ?? {};
  const extra = hit.extradata?.["ita-IT"] ?? {};
  const geo = (extra.geo ?? [])[0] ?? {};
  const place = (d.takes_place_in ?? [])[0]?.name?.["ita-IT"] ?? ""; 

  return{
    title: d.event_title ?? "",
    abstract: stripHtml(d.event_abstract ?? ""),
    address: place,
    typology: d.has_public_event_typology ?? [],
    topics: (d.topics ?? []).map(t => t.name?.["ita-IT"]).filter(Boolean),
    startDate: d.time_interval?.input?.startDateTime ?? null,
    endDate: d.time_interval?.input?.endDateTime ?? null,
    coordinates: {
      lat: geo.latitude ? parseFloat(geo.latitude) : null,
      lon: geo.longitude ? parseFloat(geo.longitude) : null,
    },
    isFree: d.is_accessible_for_free === 1,
    imageUrl: d.has_playbill?.url ?? null,
    sourceUrl: extra.urlAlias ? `https://eventi.comune.trento.it${extra.urlAlias}` : null,
    source: "comune_trento",
  };
}

/**
 * Scarica utti gli eventi dall'API tramite paginazione.
 * 
 *  @returns {Promise<object[]>} Array di eventi normalizzati
 */
async function fetchAllEvents() {
   const events = [];
  let url = BASE_URL;
  let page = 1;

  while (url && page <= 50) {
    console.log(`Fetching pagina ${page}...`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Errore HTTP ${res.status}`);
    const data = await res.json();
    events.push(...(data.searchHits ?? []).map(normalizeEvent));
    url = data.nextPageQuery ?? null;
    page++;
    if (url) await new Promise(r => setTimeout(r, 700));
  }

  return events;
}


/**
 * Connette a MongoDB, scarica gli eventi e popola la collection.
 * 
 * @returns {Promise<void>}
 */
async function seed(){
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connesso a MongoDB");

  const events = await fetchAllEvents();
  await Event.deleteMany({ source: "comune_trento" });
  await Event.insertMany(events);

  console.log(`Inseriti ${events.length} eventi`);
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});