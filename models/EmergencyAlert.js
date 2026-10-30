import mongoose from "mongoose";

const EmergencyAlertSchema = new mongoose.Schema(
  {
    sosId: {
      type: String,
      required: [true, "sosId is required"],
      unique: true,
      index: true,
    },
    senderDeviceId: {
      type: String,
      required: [true, "senderDeviceId is required"],
    },
    hikerName: {
      type: String,
      default: "Hiker Beacon",
    },
    emergencyType: {
      type: String,
      default: "Wilderness Distress",
    },
    sector: {
      type: String,
      default: "Sector 7 (SECE Trail)",
    },
    batteryLevel: {
      type: Number,
      default: 75,
    },
    stepCount: {
      type: Number,
      default: 3200,
    },
    assignedTeam: {
      type: String,
      default: "Unassigned",
    },
    relayDeviceId: {
      type: String,
      required: false,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
        required: true,
      },
      coordinates: {
        type: [Number], // Format: [longitude, latitude]
        required: true,
      },
    },
    altitude: {
      type: Number,
      required: false,
    },
    hopCount: {
      type: Number,
      default: 0,
    },
    timestamp: {
      type: Date,
      required: [true, "timestamp is required"],
    },
    status: {
      type: String,
      enum: ["ACTIVE", "RESOLVED", "ACKNOWLEDGED"],
      default: "ACTIVE",
      index: true,
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

// Enable spatial 2DSphere indexing for geographic calculations ($near, $geoWithin)
EmergencyAlertSchema.index({ location: "2dsphere" });

export default mongoose.models.EmergencyAlert || mongoose.model("EmergencyAlert", EmergencyAlertSchema);
