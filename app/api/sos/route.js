import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import EmergencyAlert from "@/models/EmergencyAlert";

// Fetch all emergency alerts sorted by newest first
export async function GET() {
  try {
    await dbConnect();
    const alerts = await EmergencyAlert.find({})
      .sort({ timestamp: -1 })
      .limit(100)
      .exec();

    return NextResponse.json({
      success: true,
      count: alerts.length,
      data: alerts,
    });
  } catch (error) {
    console.error("GET /api/sos failed:", error);
    return NextResponse.json(
      { success: false, error: "Database connection failed", message: error.message },
      { status: 500 }
    );
  }
}

// Update alert status (e.g. resolve or acknowledge)
export async function PUT(request) {
  try {
    await dbConnect();
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body" },
        { status: 400 }
      );
    }

    const { sosId, status } = body;
    if (!sosId || !status) {
      return NextResponse.json(
        { success: false, error: "Missing parameters sosId or status" },
        { status: 400 }
      );
    }

    const updatedAlert = await EmergencyAlert.findOneAndUpdate(
      { sosId },
      { status: status.toUpperCase() },
      { new: true }
    );

    if (!updatedAlert) {
      return NextResponse.json(
        { success: false, error: `No alert found with ID ${sosId}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Alert status updated successfully to ${status}`,
      data: updatedAlert,
    });
  } catch (error) {
    console.error("PUT /api/sos failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update alert", message: error.message },
      { status: 500 }
    );
  }
}
