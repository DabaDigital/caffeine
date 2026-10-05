import { googlePlaceSchema } from "@/lib/google-reviews";

export const dynamic = "force-dynamic";

export async function GET() {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;
  const headers = { "Cache-Control": "private, no-store" };
  if (!key || !placeId)
    return Response.json({ available: false }, { status: 503, headers });
  try {
    const response = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
      {
        headers: {
          "X-Goog-Api-Key": key,
          "X-Goog-FieldMask":
            "displayName,rating,userRatingCount,reviews,googleMapsUri",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(6000),
      },
    );
    if (!response.ok) throw new Error("Google Places unavailable");
    const result = googlePlaceSchema.safeParse(await response.json());
    if (!result.success) throw new Error("Invalid place response");
    return Response.json(result.data, { headers });
  } catch {
    // Never expose Google's response, request headers, or credentials.
    return Response.json({ available: false }, { status: 503, headers });
  }
}
