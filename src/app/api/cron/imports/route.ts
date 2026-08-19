import { runAllImports } from "@/lib/imports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // external fetches can be slow

/** Monthly review-import refresh. Runs every active import config. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    const result = await runAllImports();
    return Response.json({ ok: true, ...result, ranAt: new Date().toISOString() });
  } catch (err) {
    return Response.json(
      { ok: false, error: (err as Error).message },
      { status: 500 },
    );
  }
}
