const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  cognome: { type: String, required: false },
  email: { type: String, unique: true, required: true },
  nickname: { type: String, unique: true, required: true },
  passwordHash: { 
    type: String,
    required: function () {
      return !this.googleId && !this.githubId;
    },
    select: false,
   },
  googleId: { type: String, unique: true, sparse: true, required: false},
  githubId: { type: String, unique: true, sparse: true, required: false }, // per utenti registrati con GitHub OAuth2
  turnstileToken: { type: String, required: false }, // per memorizzare il token Turnstile, se necessario
  role: { type: String, enum: ["user", "admin"], default: "user" },
  favoriteTreks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Trek" }],

  emailVerified: { type: Boolean, default: false }, // true dopo che user clicca il link
  emailVerificationToken: {type: String, select: false }, // token random per link
  emailVerificationExpires: { type: Date, select: false }, // scadenza token
  tempPasswordExpires: { type: Date, select: false }, // password temporanea valida per un periodo limitato

  avatarUrl: { type: String, default: null },

  notifications: [ {
    type: {
      type: String,
      enum: [
        "friend_request",
        "friend_accepted",
        "friend_declined",
        "diary_tag",
        "activity_invite",
        "activity_join",
      ],
      required: true,
    },
    message: {
      type: String,
      required: true
    },
    read: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    ref: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
  }
],

isSuspended: { type: Boolean, default: false },
suspendedUntil: {type: Date, default: null },
isBanned: { type: Boolean, default: false },

reports: [
  {
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    reason: {type: String, default: "" },
    reportedAt: { type: Date, default: Date.now},
    reportStatus: {
      type: String,
      enum: ["pending", "accepted", "dismissed"],
      default: "pending",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {type: Date, default: null },
    reviewNote: { type: String, default: "" },
  },
],
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);