import { revalidatePath } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * On-demand ISR revalidation. Used by the placement-activation script so a paid
 * feature goes live immediately instead of waiting for the daily revalidate.
 * Secured with the same CRON_SECRET.
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    paths?: unknown;
  };
  const paths = Array.isArray(body.paths)
    ? body.paths.filter((p): p is string => typeof p === "string")
    : [];

  for (const path of paths) revalidatePath(path);
  return Response.json({ ok: true, revalidated: paths });
}
