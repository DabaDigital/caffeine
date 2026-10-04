import "server-only";

// Google refuses to show its share links and place pages inside an iframe.
// Its embed endpoint can be framed, and searching for the place's own Google
// name at its pin shows the same card as Maps: name, rating and directions.

const shortLinkHosts = new Set(["maps.app.goo.gl", "goo.gl"]);

/**
 * Embeddable Google Map of the place a Maps link opens. Null when the link
 * doesn't lead to a place, or Google can't be reached, so a map never shows
 * an unverified spot.
 */
export async function placeMapEmbed(mapUrl: string): Promise<string | null> {
  try {
    const link = await expandShortLink(mapUrl);
    const place = link.match(/\/maps\/place\/([^/?#]+)/)?.[1];
    // !3d…!4d… is the place's pin; @lat,lng is the view, centered on it.
    const [, lat, lng] =
      link.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) ??
      link.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ??
      [];
    if (!place || !lat || !lng) return null;
    const params = new URLSearchParams({
      q: decodeURIComponent(place.replace(/\+/g, " ")),
      ll: `${lat},${lng}`,
      z: "17",
      hl: "en",
      output: "embed",
    });
    return `https://www.google.com/maps?${params}`;
  } catch {
    return null;
  }
}

/** Share links (maps.app.goo.gl/…) redirect to the full place link. */
async function expandShortLink(link: string) {
  if (!shortLinkHosts.has(new URL(link).hostname)) return link;
  const response = await fetch(link, {
    redirect: "manual",
    signal: AbortSignal.timeout(4000),
  });
  return response.headers.get("location") ?? link;
}
