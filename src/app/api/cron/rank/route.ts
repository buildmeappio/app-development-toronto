import { generateRankings } from "@/lib/rankings";

// Node runtime (postgres-js), always fresh, allow up to 60s.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Monthly ranking refresh. Vercel Cron calls this with
 * `Authorization: Bearer <CRON_SECRET>`. Regenerates the all-time canonical
 * ranking plus the current month's dated snapshot.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const result = await generateRankings();
    return Response.json({ ok: true, ...result, ranAt: new Date().toISOString() });
  } catch (err) {
    console.error("Ranking cron failed:", err);
    return Response.json(
      { ok: false, error: (err as Error).message },
      { status: 500 },
    );
  }
}
