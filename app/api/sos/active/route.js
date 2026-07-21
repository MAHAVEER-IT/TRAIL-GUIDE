import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import EmergencyAlert from "@/models/EmergencyAlert";

export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const radiusInKm = searchParams.get("radiusInKm") || "50";
    const statusParam = searchParams.get("status") || "ACTIVE";

    const query = {
      status: statusParam.toUpperCase(),
    };

    // If spatial coordinates are provided, perform a 2DSphere $near spatial query
    if (lat !== null && lng !== null) {
      const parsedLat = parseFloat(lat);
      const parsedLng = parseFloat(lng);
      const parsedRadiusKm = parseFloat(radiusInKm);

      if (
        isNaN(parsedLat) ||
        isNaN(parsedLng) ||
        parsedLat < -90 ||
        parsedLat > 90 ||
        parsedLng < -180 ||
        parsedLng > 180
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid coordinates provided. Latitude must be between -90 and 90, Longitude between -180 and 180.",
          },
          { status: 400 }
        );
      }

      const maxDistanceMeters = (isNaN(parsedRadiusKm) ? 50 : parsedRadiusKm) * 1000;

      query.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parsedLng, parsedLat], // GeoJSON order: [longitude, latitude]
          },
          $maxDistance: maxDistanceMeters,
        },
      };
    }

    const alerts = await EmergencyAlert.find(query).exec();

    return NextResponse.json(
      {
        success: true,
        count: alerts.length,
        filterStatus: statusParam.toUpperCase(),
        spatialFilter:
          lat !== null && lng !== null
            ? {
                latitude: parseFloat(lat),
                longitude: parseFloat(lng),
                radiusInKm: parseFloat(radiusInKm),
              }
            : null,
        data: alerts,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching active emergency alerts:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error fetching emergency alerts",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
