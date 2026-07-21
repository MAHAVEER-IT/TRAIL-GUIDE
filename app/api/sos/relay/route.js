import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import EmergencyAlert from "@/models/EmergencyAlert";
import { RelayPayloadSchema } from "@/lib/validations";
import { verifyAuth } from "@/lib/auth";

export async function POST(request) {
  try {
    // 1. Authorization Verification
    const authResult = verifyAuth(request);
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    // 2. Parse & Validate Payload Body
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body" },
        { status: 400 }
      );
    }

    const validation = RelayPayloadSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error: Invalid alert payload structure",
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const alertsData = Array.isArray(validation.data) ? validation.data : [validation.data];

    if (alertsData.length === 0) {
      return NextResponse.json(
        { success: false, error: "Payload array is empty" },
        { status: 400 }
      );
    }

    // 3. Connect to Database
    await dbConnect();

    // 4. Deduplication & Upsert Operation using BulkWrite
    const bulkOperations = alertsData.map((alert) => ({
      updateOne: {
        filter: { sosId: alert.sosId },
        update: {
          $setOnInsert: {
            sosId: alert.sosId,
            senderDeviceId: alert.senderDeviceId,
            timestamp: alert.timestamp,
          },
          $set: {
            relayDeviceId: alert.relayDeviceId || null,
            location: alert.location,
            altitude: alert.altitude,
            hopCount: alert.hopCount,
            status: alert.status,
          },
        },
        upsert: true,
      },
    }));

    const bulkResult = await EmergencyAlert.bulkWrite(bulkOperations);

    const syncedIds = alertsData.map((a) => a.sosId);
    const upsertedCount = bulkResult.upsertedCount || 0;
    const modifiedCount = bulkResult.modifiedCount || 0;

    return NextResponse.json(
      {
        success: true,
        message: "BLE emergency alerts synced successfully",
        syncedCount: alertsData.length,
        newAlertsCreated: upsertedCount,
        alertsUpdated: modifiedCount,
        syncedIds,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing SOS relay payload:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error processing emergency alert relay",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
