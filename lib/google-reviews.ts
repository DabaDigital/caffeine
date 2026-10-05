import { z } from "zod";

const httpsUrl = z
  .string()
  .url()
  .refine((url) => url.startsWith("https://"));
export const googlePlaceSchema = z.object({
  rating: z.number().min(1).max(5),
  userRatingCount: z.number().int().nonnegative(),
  googleMapsUri: httpsUrl,
  displayName: z.object({ text: z.string() }),
  reviews: z
    .array(
      z.object({
        name: z.string(),
        rating: z.number().min(1).max(5),
        text: z.object({ text: z.string() }).optional(),
        publishTime: z.string().datetime().optional(),
        googleMapsUri: httpsUrl.optional(),
        authorAttribution: z.object({
          displayName: z.string(),
          uri: httpsUrl.optional(),
          photoUri: httpsUrl.optional(),
        }),
      }),
    )
    .optional()
    .default([]),
});
export type GooglePlaceReviews = z.infer<typeof googlePlaceSchema>;
