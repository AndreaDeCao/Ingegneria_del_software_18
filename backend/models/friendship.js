const mongoose = require("mongoose");

/**
 * Schema per la gestione delle amicizie tra utenti.
 * Lo stato della richiesta di amicizia può essere pending, accepted o declined.
 */
const FriendshipSchema = new mongoose.Schema(
  {
    // Utente che invia richiesta di amicizia
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Utente che riceve richiesta di amicizia
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    //Stato della richiesta di amicizia
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    }, 
  },
  { timestamps: true }
);

// Per impedire richieste duplicate tra gli stessi utenti
FriendshipSchema.index({ 
  sender: 1,
  receiver: 1
},
{ 
  unique: true 
});

module.exports = mongoose.model("Friendship", FriendshipSchema);