const mongoose = require("mongoose");

const ActivitySchema = new mongoose.Schema({ 
    id: Number,
    titolo: { type: String, required: true },
    descrizione: String,
    dataAttivita: { type: Date, required: true}, // Data e ora dell'attività. 
    nMaxPartecipanti: Number,
    stato: {
        type: String,
        enum: ["Aperto", "Chiuso", "Annullato"]
    },

    organizzatoreID: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    percorsoID: { type: mongoose.Schema.Types.ObjectId, ref: 'Trek' }
});

module.exports = mongoose.model("Activity", ActivitySchema);