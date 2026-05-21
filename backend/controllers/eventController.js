//Proxy verso API del comune di Trento
//Per adesso restituisce tutti gli eventi per capire la risposta JSON

const COMUNE_API_URL = process.env.COMUNE_TRENTO_API_URL;

/**
 * Restituisce gli eventi pubblici del Comune di Trento dall'API Open Data ufficiale.
 * 
 * @route GET /api/trento-events
 * @param {import("express").Request} req - Oggetto richiesta Express
 * @param {import("express").Response} res - Oggetto risposta Express
 * @returns {Promise<void>} JSON con gli eventi
*/
exports.getEventiComune = async (req, res) => {
  try {
    const response = await fetch(COMUNE_API_URL);

    if(!response.ok) {
      return res.status(502).json({ error: "Errore API Comune di Trento: " + response.status });
    }

    const data = await response.json();
    res.json(data);

  } catch(err) {
    res.status(500).json({ error: err.message });
  }
};
