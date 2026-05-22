const mongoose = require("mongoose");

const ActivitySchema = new mongoose.Schema({ 
    id: Number,
    title: { type: String, required: true },
    
    description: String,
    activityDate: Date, // Data e ora dell'attività. 
    maxParticipants: Number,
    status: {
        type: String,
        enum: ["Aperto", "Chiuso", "Annullato"]
    },

    travelMode: {
        type: String,
        enum: ["walking", "bicycling"]
    },

    organizerID: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    trekID: { type: mongoose.Schema.Types.ObjectId, ref: 'Trek' }
});

module.exports = mongoose.model("Activity", ActivitySchema);