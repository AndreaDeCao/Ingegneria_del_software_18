const Event = require("../models/events");

/**
 * NOTA:
 * Il Comune di Trento espone un'API ComunWeb (OpenPA) al seguente endpoint:
 * https://eventi.comune.trento.it/api/opendata/v2/content/search?classes=event
 * L'API risponde correttamente ma i dati risultano fermi al 2025 e non vengono
 * aggiornati con regolarità. Gli eventi più recenti sono visibili sul sito
 * eventi.comune.trento.it ma non vengono sincronizzati con l'API pubblica.
 *
 * La SAT pubblica un calendario eventi su sat.tn.it/eventi-sezioni/ 
 * ma non espone alcuna API pubblica né feed accessibile programmaticamente.
 *
 * Il portale dati.trentino.it (CKAN) include un dataset "Eventi del Comune di Trento" 
 * ma risulta anch'esso non mantenuto.
 *
 * SOLUZIONE ADOTTATA:
 * I dati vengono scaricati una tantum dall'API ComunWeb tramite
 * script backend/seedEvents.js e salvati nella collection MongoDB locale.
 * Il controller legge esclusivamente dal database, garantendo risposte veloci
 * e indipendenza dalla disponibilità delle sorgenti esterne.
 */

/**
 * Restituisce gli eventi pubblici del comune di Trento.
 * I duplicati per titolo vengono eliminati tramite aggregazione MongoDB,
 * mostrando un solo evento per ogni titolo, data e luogo univoco.
 * 
 * @route GET /api/trento-events
 * @param {import("express").Request} req - Oggetto richiesta Express
 * @param {import("express").Response} res - Oggetto risposta Express
 * @returns {Promise<void>} JSON con la lista degli eventi
*/
exports.getEventiComune = async (req, res) => {
    try {
    const RELEVANT_TOPICS = ["Ambiente", "Beni comuni", "Tempo libero"]; 

    const eventi = await Event.aggregate([
      {
        $match: {
          topics: {
            $in: RELEVANT_TOPICS   // Filtra per topic rilevanti
          }}
      },
      { 
        $sort: {
          startDate: 1
      }},
      {
        $group: {
          _id: {
            title: "$title",
            startDate: "$startDate",
            address: "$address"
          },
          doc: {
            $first: "$$ROOT"
          }}
        },
        { 
          $replaceRoot: {
            newRoot: "$doc"
        }},
        {
          $sort: {
            startDate: 1
          }},
        {
          $limit: 20
        }
    ]);
    res.json(eventi);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

