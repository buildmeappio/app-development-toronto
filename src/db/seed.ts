// Env is loaded via `tsx --env-file=.env.local` (see package.json db:seed).
import { db } from "./index";
import { locations } from "./schema";
import { GTA_TREE, type SeedLocation } from "../data/gta-locations";

/**
 * Idempotently seeds the GTA location tree.
 * Walks depth-first, building a denormalized `fullSlug` path as it goes.
 */
async function seedLocations() {
  console.log("Seeding GTA location tree...");
  let count = 0;

  async function insertNode(
    node: SeedLocation,
    parentId: string | null,
    parentPath: string[],
  ) {
    // Root (metro) has fullSlug == slug; children nest under the parent path.
    const path =
      node.type === "metro" ? [node.slug] : [...parentPath, node.slug];
    const fullSlug = path.join("/");

    const [row] = await db
      .insert(locations)
      .values({
        name: node.name,
        slug: node.slug,
        type: node.type,
        parentId,
        fullSlug,
        lat: node.lat,
        lng: node.lng,
      })
      .onConflictDoUpdate({
        target: locations.slug,
        set: { name: node.name, fullSlug, type: node.type, parentId },
      })
      .returning({ id: locations.id });

    count++;

    // Region children build their path from the region's own slug (drop the
    // metro root so URLs read /peel/mississauga, not /gta/peel/mississauga).
    const childParentPath = node.type === "metro" ? [] : path;
    for (const child of node.children ?? []) {
      await insertNode(child, row.id, childParentPath);
    }
  }

  await insertNode(GTA_TREE, null, []);
  console.log(`✓ Seeded ${count} locations.`);
}

seedLocations()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
