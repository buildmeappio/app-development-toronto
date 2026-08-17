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
