// Env loaded via `tsx --env-file=.env.local` (see package.json curate:rank).
// Thin CLI wrapper around the shared ranking engine.
import { generateRankings } from "../lib/rankings";

generateRankings()
  .then((r) => {
    console.log(
      `✓ Ranked ${r.pairs} (location,company) pairs across periods "all-time" and "${r.period}".`,
    );
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
