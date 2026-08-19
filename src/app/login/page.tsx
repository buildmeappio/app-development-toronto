import { PageShell, Panel } from "@/components/ui";
import { LoginForm } from "@/components/login-form";
import { LogoMark } from "@/components/logo-mark";

export const metadata = { title: "Sign in", robots: { index: false } };

const PERKS = [
  "Manage your listing and keep it accurate",
  "Add your portfolio, services, and team",
  "Collect verified client reviews",
  "Reach buyers searching across the GTA",
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/") ? next : "/dashboard";

  return (
    <PageShell width="wide">
      <div className="mx-auto max-w-4xl">
        <Panel className="grid overflow-hidden md:grid-cols-2">
          <div className="p-8 sm:p-10">
            <div className="flex items-center gap-2">
              <LogoMark size={30} />
              <span className="font-bold tracking-tight text-slate-900">
                Sign in
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-500">
              Manage or claim your company profile on Toronto App Dev.
            </p>
            <div className="mt-7">
              <LoginForm next={safeNext} />
            </div>
            <p className="mt-5 text-center text-xs text-slate-400">
              No password needed — we&apos;ll email you a secure sign-in link.
            </p>
          </div>

          <div className="relative hidden bg-gradient-to-br from-blue-600 to-indigo-700 p-10 text-white md:flex md:flex-col md:justify-center">
            <div className="bg-grid pointer-events-none absolute inset-0 opacity-30" />
            <div className="relative">
              <h2 className="text-2xl font-bold tracking-tight">
                Grow your presence in the GTA
              </h2>
              <ul className="mt-6 space-y-3.5">
                {PERKS.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-sm text-blue-50">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs">
                      ✓
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
              <p className="mt-8 text-sm text-blue-200">
                Claiming is always free.
              </p>
            </div>
          </div>
        </Panel>
      </div>
    </PageShell>
  );
}
