const mongoose = require("mongoose");

const ActivityInvitationSchema = new mongoose.Schema(
  {
    activity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Activity",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },
    acceptedAt: {
      type: Date,
    },
    declinedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

ActivityInvitationSchema.index(
  {
    activity: 1,
    sender: 1,
    receiver: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model("ActivityInvitation", ActivityInvitationSchema);
