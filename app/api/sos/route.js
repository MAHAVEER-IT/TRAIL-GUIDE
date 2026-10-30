import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import EmergencyAlert from "@/models/EmergencyAlert";

// Fetch all emergency alerts dynamically from MongoDB Atlas
export async function GET() {
  try {
    await dbConnect();

    const alerts = await EmergencyAlert.find({})
      .sort({ timestamp: -1 })
      .limit(100)
      .lean()
      .exec();

    return NextResponse.json({
      success: true,
      count: alerts.length,
      data: alerts,
    });
  } catch (error) {
    console.error("GET /api/sos database error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Database connection failed",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// Update alert status dynamically in MongoDB Atlas (ACTIVE -> ACKNOWLEDGED -> RESOLVED)
export async function PUT(request) {
  try {
    await dbConnect();

    const body = await request.json().catch(() => null);
    if (!body || !body.sosId || !body.status) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters: sosId or status" },
        { status: 400 }
      );
    }

    const { sosId, status } = body;
    const normalizedStatus = status.toUpperCase();

    const updatedAlert = await EmergencyAlert.findOneAndUpdate(
      { sosId },
      { status: normalizedStatus },
      { new: true }
    ).lean();

    if (!updatedAlert) {
      return NextResponse.json(
        { success: false, error: `No alert found with ID ${sosId}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Alert ${sosId} status updated to ${normalizedStatus}`,
      data: updatedAlert,
    });
  } catch (error) {
    console.error("PUT /api/sos database error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update alert in database",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// Dynamically create a new SOS alert directly in MongoDB Atlas
export async function POST(request) {
  try {
    await dbConnect();

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body" },
        { status: 400 }
      );
    }

    const sosId = body.sosId || `SOS-LIVE-${Math.floor(1000 + Math.random() * 9000)}`;

    const newAlertData = {
      sosId,
      senderDeviceId: body.senderDeviceId || `DEV-${Math.floor(100 + Math.random() * 900)}`,
      hikerName: body.hikerName || "Field Agent",
      emergencyType: body.emergencyType || "SOS DISTRESS SIGNAL",
      sector: body.sector || "Sector 7 (SECE Perimeter)",
      batteryLevel: body.batteryLevel ?? Math.floor(15 + Math.random() * 70),
      stepCount: body.stepCount ?? Math.floor(3000 + Math.random() * 10000),
      assignedTeam: body.assignedTeam || "UNASSIGNED",
      relayDeviceId: body.relayDeviceId || "GATEWAY-BLE-01",
      location: body.location || {
        type: "Point",
        coordinates: [
          77.06054 + (Math.random() - 0.5) * 0.008,
          10.82804 + (Math.random() - 0.5) * 0.008,
        ],
      },
      altitude: body.altitude ?? +(320 + Math.random() * 50).toFixed(1),
      hopCount: body.hopCount ?? (Math.floor(Math.random() * 3) + 1),
      timestamp: body.timestamp || new Date().toISOString(),
      status: (body.status || "ACTIVE").toUpperCase(),
    };

    const createdAlert = await EmergencyAlert.create(newAlertData);

    return NextResponse.json({
      success: true,
      message: "SOS alert registered dynamically in MongoDB Atlas",
      data: createdAlert,
    });
  } catch (error) {
    console.error("POST /api/sos database error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to insert alert into database",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// Dynamically delete an alert or purge test alerts from MongoDB Atlas
export async function DELETE(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const sosId = searchParams.get("sosId");
    const purgeAll = searchParams.get("all") === "true";

    if (purgeAll) {
      const result = await EmergencyAlert.deleteMany({});
      return NextResponse.json({
        success: true,
        message: `Purged ${result.deletedCount} alert(s) from database`,
        deletedCount: result.deletedCount,
      });
    }

    if (!sosId) {
      return NextResponse.json(
        { success: false, error: "Missing sosId query parameter" },
        { status: 400 }
      );
    }

    const deleted = await EmergencyAlert.findOneAndDelete({ sosId });
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: `No alert found with ID ${sosId}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Alert ${sosId} deleted from database`,
      data: deleted,
    });
  } catch (error) {
    console.error("DELETE /api/sos database error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete alert from database",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
