import { z } from "zod";

// Zod validation schema for an individual SOS alert object
export const SingleAlertSchema = z.object({
  sosId: z.string().min(1, "sosId is required"),
  senderDeviceId: z.string().min(1, "senderDeviceId is required"),
  relayDeviceId: z.string().optional(),
  location: z.object({
    type: z.literal("Point").default("Point"),
    coordinates: z.tuple([
      z.number().min(-180).max(180), // Longitude
      z.number().min(-90).max(90),   // Latitude
    ]),
  }),
  altitude: z.number().optional(),
  hopCount: z.number().int().min(0).default(0),
  timestamp: z.union([z.string(), z.number()]).transform((val) => new Date(val)),
  status: z.enum(["ACTIVE", "RESOLVED", "ACKNOWLEDGED"]).default("ACTIVE"),
});

// Union schema supporting both single alert payload and array of relayed offline alerts
export const RelayPayloadSchema = z.union([
  SingleAlertSchema,
  z.array(SingleAlertSchema),
]);
