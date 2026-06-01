const mongoose = require("mongoose");

const ActivitySchema = new mongoose.Schema({ 
    title: { type: String, required: true },
    
    description: String,
    activityDate: Date, // Data e ora dell'attività. 
    maxParticipants: Number,
    partecipantList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    status: {
        type: String,
        enum: ["Aperto", "Chiuso", "Annullato"]
    },

    travelMode: {
        type: String,
        enum: ["walking", "bicycling"]
    },

    organizerID: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    trekID: { type: mongoose.Schema.Types.ObjectId, ref: 'Trek' },

    // ADMIN
    // Quando true: l'organizzatore non può modificare lo status;
    // viene mostrato un banner di avviso nella pagina dettagli.
    suspended: { type: Boolean, default: false },
    statusBeforeSuspend: { type: String, default: null }, // status salvato prima della sospensione, ripristinato all'unsuspend
    suspendedReason: { type: String, default: "" }, // motivo opzionale inserito dall'admin
    suspendedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // chi ha sospeso
    suspendedAt: { type: Date, default: null },
    // SEGNALAZIONI
    // Ogni elemento rappresenta la segnalazione di un utente.
    // reportStatus:
    //   "pending"   — in attesa di revisione admin (visibile solo all'admin)
    //   "accepted"  — accettata dall'admin (banner visibile a tutti)
    //   "dismissed" — rigettata dall'admin (nascosta agli utenti)
    reports: [
        {
            reportedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            reason:       { type: String, default: "" },
            reportedAt:   { type: Date, default: Date.now },
            reportStatus: { type: String, enum: ["pending", "accepted", "dismissed"], default: "pending" },
            reviewedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
            reviewedAt:   { type: Date, default: null },
            reviewNote:   { type: String, default: "" },
        }
    ],
 
    // Log delle azioni admin sull'attività (audit trail)
    adminLog: [
        {
            adminID:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            action:    { type: String }, // "suspend" | "unsuspend" | "delete" | "report_accept" | "report_dismiss" | ...
            reason:    { type: String, default: "" },
            date:      { type: Date, default: Date.now },
        }
    ],
});

module.exports = mongoose.model("Activity", ActivitySchema);