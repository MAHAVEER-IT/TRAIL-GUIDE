import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import EmergencyAlert from "@/models/EmergencyAlert";

// Curated realistic tactical incidents for SAR Command Room (SECE Campus, Nilgiris Ridge, Sumatra Canopy)
let tacticalMemoryAlerts = [
  {
    sosId: "SOS-SECE-091",
    senderDeviceId: "HIKER-DEV-882",
    hikerName: "Ananya S. (Lead Scout)",
    emergencyType: "FALL INJURY / IMMOBILIZED",
    sector: "Sector 7 (SECE Perimeter)",
    batteryLevel: 18,
    stepCount: 8420,
    assignedTeam: "SAR RAPID TEAM ALPHA",
    relayDeviceId: "NODE-GATEWAY-04",
    location: {
      type: "Point",
      coordinates: [77.06054, 10.82804], // [lng, lat] SECE Main Grounds
    },
    altitude: 342.5,
    hopCount: 2,
    timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    status: "ACTIVE",
  },
  {
    sosId: "SOS-NILGIRIS-042",
    senderDeviceId: "EXPEDITION-LEAD-03",
    hikerName: "Rahul M. (Alpine Trekker)",
    emergencyType: "TRAIL DISORIENTATION / DENSE FOG",
    sector: "Sector 4 (Nilgiris Escarpment)",
    batteryLevel: 42,
    stepCount: 14180,
    assignedTeam: "FOREST RANGER UNIT 9",
    relayDeviceId: "RELAY-MESH-OOTY-02",
    location: {
      type: "Point",
      coordinates: [76.71130, 11.41020], // Nilgiris Ridge
    },
    altitude: 2240.0,
    hopCount: 3,
    timestamp: new Date(Date.now() - 11 * 60 * 1000).toISOString(),
    status: "ACTIVE",
  },
  {
    sosId: "SOS-SECE-078",
    senderDeviceId: "RANGER-PATROL-12",
    hikerName: "Vignesh K. (Field Marshal)",
    emergencyType: "EQUIPMENT COMPROMISE",
    sector: "Sector 7 (SECE Perimeter)",
    batteryLevel: 65,
    stepCount: 6120,
    assignedTeam: "SAR TEAM ECHO-1 (ETA 4 min)",
    relayDeviceId: "GATEWAY-SECE-BASE",
    location: {
      type: "Point",
      coordinates: [77.06412, 10.82510], // SECE South Perimeter
    },
    altitude: 338.2,
    hopCount: 1,
    timestamp: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
    status: "ACKNOWLEDGED",
  },
  {
    sosId: "SOS-SUMATRA-104",
    senderDeviceId: "RESEARCH-UNIT-07",
    hikerName: "Dr. Thorne (Field Ecologist)",
    emergencyType: "CANOPY EXTRACTION COMPLETED",
    sector: "Sector 9 (Sumatra Rainforest)",
    batteryLevel: 84,
    stepCount: 18940,
    assignedTeam: "MEDEVAC EXTRACTION TEAM",
    relayDeviceId: "SAT-UPLINK-RELAY",
    location: {
      type: "Point",
      coordinates: [101.34310, 0.78930], // Sumatra Jungle
    },
    altitude: 415.8,
    hopCount: 4,
    timestamp: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
    status: "RESOLVED",
  },
];

// Fetch all emergency alerts sorted by newest first
export async function GET() {
  let dbSuccess = false;
  let dbAlerts = [];

  try {
    // Attempt database connection with short timeout so UI is never blocked
    await Promise.race([
      dbConnect(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Database connection timeout")), 2500))
    ]);

    const alerts = await EmergencyAlert.find({})
      .sort({ timestamp: -1 })
      .limit(100)
      .lean()
      .exec();

    if (alerts && alerts.length > 0) {
      dbAlerts = alerts;
      dbSuccess = true;
    }
  } catch (error) {
    // SRV DNS or network block: gracefully fall through to in-memory mission store
    dbSuccess = false;
  }

  // If live MongoDB returned records, use them; otherwise serve tactical operational alerts
  const data = (dbSuccess && dbAlerts.length > 0) ? dbAlerts : tacticalMemoryAlerts;

  return NextResponse.json({
    success: true,
    count: data.length,
    data: data,
    source: dbSuccess ? "MONGODB_CLUSTER" : "TACTICAL_CACHE",
    dbConnected: dbSuccess,
  });
}

// Update alert status (e.g. ACKNOWLEDGE, RESOLVE, RE-OPEN)
export async function PUT(request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.sosId || !body.status) {
      return NextResponse.json(
        { success: false, error: "Missing parameters: sosId or status" },
        { status: 400 }
      );
    }

    const { sosId, status } = body;
    const normalizedStatus = status.toUpperCase();

    // 1. Update in-memory tactical store
    let memoryUpdated = false;
    tacticalMemoryAlerts = tacticalMemoryAlerts.map((alert) => {
      if (alert.sosId === sosId) {
        memoryUpdated = true;
        return { ...alert, status: normalizedStatus, updatedAt: new Date().toISOString() };
      }
      return alert;
    });

    // 2. Update in MongoDB if reachable
    let dbUpdated = null;
    try {
      await dbConnect();
      dbUpdated = await EmergencyAlert.findOneAndUpdate(
        { sosId },
        { status: normalizedStatus },
        { new: true }
      ).lean();
    } catch (_) {
      // Ignored if offline
    }

    return NextResponse.json({
      success: true,
      message: `Incident ${sosId} status updated to ${normalizedStatus}`,
      data: dbUpdated || tacticalMemoryAlerts.find(a => a.sosId === sosId),
    });
  } catch (error) {
    console.error("PUT /api/sos failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update alert", message: error.message },
      { status: 500 }
    );
  }
}

// Create or Simulate an SOS distress beacon
export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body" },
        { status: 400 }
      );
    }

    const newAlert = {
      sosId: body.sosId || `SOS-LIVE-${Math.floor(1000 + Math.random() * 9000)}`,
      senderDeviceId: body.senderDeviceId || `DEV-${Math.floor(100 + Math.random() * 900)}`,
      hikerName: body.hikerName || "Hiker in Distress",
      emergencyType: body.emergencyType || "SOS DISTRESS SIGNAL",
      sector: body.sector || "Sector 7 (SECE Perimeter)",
      batteryLevel: body.batteryLevel ?? Math.floor(15 + Math.random() * 70),
      stepCount: body.stepCount ?? Math.floor(3000 + Math.random() * 10000),
      assignedTeam: body.assignedTeam || "UNASSIGNED",
      relayDeviceId: body.relayDeviceId || "GATEWAY-BLE-01",
      location: body.location || {
        type: "Point",
        coordinates: [77.06054 + (Math.random() - 0.5) * 0.008, 10.82804 + (Math.random() - 0.5) * 0.008],
      },
      altitude: body.altitude ?? +(320 + Math.random() * 50).toFixed(1),
      hopCount: body.hopCount ?? (Math.floor(Math.random() * 3) + 1),
      timestamp: new Date().toISOString(),
      status: body.status || "ACTIVE",
    };

    // Prepend to tactical memory
    tacticalMemoryAlerts = [newAlert, ...tacticalMemoryAlerts];

    // Try saving to DB if connected
    try {
      await dbConnect();
      await EmergencyAlert.create(newAlert);
    } catch (_) {
      // Offline fallback
    }

    return NextResponse.json({
      success: true,
      message: "SOS Beacon transmitted and registered in Incident Control Room",
      data: newAlert,
    });
  } catch (error) {
    console.error("POST /api/sos failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to broadcast SOS beacon", message: error.message },
      { status: 500 }
    );
  }
}
