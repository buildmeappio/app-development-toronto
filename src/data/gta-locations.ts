/**
 * The fixed Greater Toronto Area geography.
 *
 * Hierarchy: metro > region > city/town > district.
 * This is the seed for the `locations` tree. Neighbourhoods (a deeper level)
 * are intentionally deferred to phase 2.
 */

export type SeedLocation = {
  name: string;
  slug: string;
  type: "metro" | "region" | "city" | "district";
  lat?: number;
  lng?: number;
  children?: SeedLocation[];
};

export const GTA_TREE: SeedLocation = {
  name: "Greater Toronto Area",
  slug: "gta",
  type: "metro",
  lat: 43.7,
  lng: -79.42,
  children: [
    {
      name: "City of Toronto",
      slug: "toronto",
      type: "region",
      lat: 43.6532,
      lng: -79.3832,
      children: [
        { name: "Old Toronto", slug: "old-toronto", type: "district" },
        { name: "North York", slug: "north-york", type: "district" },
        { name: "Scarborough", slug: "scarborough", type: "district" },
        { name: "Etobicoke", slug: "etobicoke", type: "district" },
        { name: "York", slug: "york", type: "district" },
        { name: "East York", slug: "east-york", type: "district" },
      ],
    },
    {
      name: "Peel Region",
      slug: "peel",
      type: "region",
      lat: 43.6,
      lng: -79.75,
      children: [
        { name: "Mississauga", slug: "mississauga", type: "city", lat: 43.589, lng: -79.6441 },
        { name: "Brampton", slug: "brampton", type: "city", lat: 43.7315, lng: -79.7624 },
        { name: "Caledon", slug: "caledon", type: "city", lat: 43.8554, lng: -79.9761 },
      ],
    },
    {
      name: "York Region",
      slug: "york-region",
      type: "region",
      lat: 44.05,
      lng: -79.46,
      children: [
        { name: "Markham", slug: "markham", type: "city", lat: 43.8561, lng: -79.337 },
        { name: "Vaughan", slug: "vaughan", type: "city", lat: 43.8372, lng: -79.5083 },
        { name: "Richmond Hill", slug: "richmond-hill", type: "city", lat: 43.8828, lng: -79.4403 },
        { name: "Newmarket", slug: "newmarket", type: "city", lat: 44.0592, lng: -79.4613 },
        { name: "Aurora", slug: "aurora", type: "city", lat: 44.0065, lng: -79.4504 },
        { name: "King", slug: "king", type: "city", lat: 43.9268, lng: -79.5285 },
        { name: "Whitchurch-Stouffville", slug: "whitchurch-stouffville", type: "city", lat: 43.9709, lng: -79.244 },
        { name: "East Gwillimbury", slug: "east-gwillimbury", type: "city", lat: 44.13, lng: -79.42 },
        { name: "Georgina", slug: "georgina", type: "city", lat: 44.3, lng: -79.43 },
      ],
    },
    {
      name: "Halton Region",
      slug: "halton",
      type: "region",
      lat: 43.53,
      lng: -79.87,
      children: [
        { name: "Oakville", slug: "oakville", type: "city", lat: 43.4675, lng: -79.6877 },
        { name: "Burlington", slug: "burlington", type: "city", lat: 43.3255, lng: -79.799 },
        { name: "Milton", slug: "milton", type: "city", lat: 43.5183, lng: -79.8774 },
        { name: "Halton Hills", slug: "halton-hills", type: "city", lat: 43.63, lng: -79.95 },
      ],
    },
    {
      name: "Durham Region",
      slug: "durham",
      type: "region",
      lat: 43.95,
      lng: -78.9,
      children: [
        { name: "Pickering", slug: "pickering", type: "city", lat: 43.8384, lng: -79.0868 },
        { name: "Ajax", slug: "ajax", type: "city", lat: 43.8509, lng: -79.0204 },
        { name: "Whitby", slug: "whitby", type: "city", lat: 43.8975, lng: -78.9429 },
        { name: "Oshawa", slug: "oshawa", type: "city", lat: 43.8971, lng: -78.8658 },
        { name: "Clarington", slug: "clarington", type: "city", lat: 43.9351, lng: -78.6069 },
        { name: "Uxbridge", slug: "uxbridge", type: "city", lat: 44.1092, lng: -79.1197 },
        { name: "Scugog", slug: "scugog", type: "city", lat: 44.1, lng: -78.94 },
        { name: "Brock", slug: "brock", type: "city", lat: 44.31, lng: -79.05 },
      ],
    },
  ],
};
