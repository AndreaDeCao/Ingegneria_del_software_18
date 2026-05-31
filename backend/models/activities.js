const mongoose = require("mongoose");

const ActivitySchema = new mongoose.Schema({ 
    title: { type: String, required: true },
    
    description: String,
    activityDate: { type: Date, required: true}, // Data e ora dell'attività. 
    maxParticipants: { type: Number, default: 10, max: 50},

    partecipantList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    status: {
        type: String,
        enum: ["Aperto", "Chiuso", "Annullato"],
        default: "Aperto"
    },

    travelMode: {
        type: String,
        enum: ["walking", "bicycling"]
    },

    // Visibilità attività (public o private)
    visibility: {
        type: String,
        enum: ["public", "private"],
        default: "public",
    },
    
    // Utetìnte che crea attività
    organizerID: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // ID Percorso dell'attività
    trekID: { type: mongoose.Schema.Types.ObjectId, ref: 'Trek' },

    // Lista utenti invitati all'attività (può avere solo amici dell'organizzatore)
    invitedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
},
{ timestamps: true });

module.exports = mongoose.model("Activity", ActivitySchema);