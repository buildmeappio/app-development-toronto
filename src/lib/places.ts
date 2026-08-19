/**
 * Thin client for the Google Places API (New) Text Search endpoint.
 * https://developers.google.com/maps/documentation/places/web-service/text-search
 */

const ENDPOINT = "https://places.googleapis.com/v1/places:searchText";

// Fields we request. Keep this tight — Places bills by the field categories used.
const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.websiteUri",
  "places.nationalPhoneNumber",
  "places.rating",
  "places.userRatingCount",
  "places.location",
  "places.businessStatus",
  "places.primaryType",
  "places.types",
  "nextPageToken",
].join(",");

export type PlaceResult = {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  rating?: number;
  userRatingCount?: number;
  location?: { latitude: number; longitude: number };
  businessStatus?: string;
  primaryType?: string;
  types?: string[];
};

export type SearchResponse = {
  places?: PlaceResult[];
  nextPageToken?: string;
};

/** Run one Text Search query. Optionally pass a pageToken for the next page. */
export async function searchText(
  textQuery: string,
  opts: { pageSize?: number; pageToken?: string } = {},
): Promise<SearchResponse> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_PLACES_API_KEY is not set");

  const body: Record<string, unknown> = {
    textQuery,
    pageSize: opts.pageSize ?? 20,
    // Bias toward Canadian results.
    regionCode: "CA",
  };
  if (opts.pageToken) body.pageToken = opts.pageToken;

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Places API ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json();
}

/** Fetch current details for one place (cheaper than search) — used to refresh
 * ratings for companies we already know. Returns null if the place is gone. */
export async function placeDetails(placeId: string): Promise<PlaceResult | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_PLACES_API_KEY is not set");

  const res = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
    {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "id,displayName,rating,userRatingCount,businessStatus,websiteUri",
      },
    },
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Place Details ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

export type GoogleReview = {
  name?: string;
  rating?: number;
  text?: { text?: string };
  originalText?: { text?: string };
  authorAttribution?: { displayName?: string };
  publishTime?: string;
};

/** Fetch a place's Google reviews (up to 5) via the official Places API. */
export async function getPlaceReviews(placeId: string): Promise<GoogleReview[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_PLACES_API_KEY is not set");

  const res = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
    {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "reviews",
      },
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Place reviews ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as { reviews?: GoogleReview[] };
  return data.reviews ?? [];
}
