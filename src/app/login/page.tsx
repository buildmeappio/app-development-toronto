import { Container } from "@/components/container";
import { LoginForm } from "@/components/login-form";

export const metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/") ? next : "/dashboard";

  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Sign in
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Manage or claim your company profile on Toronto App Developers.
          </p>
          <div className="mt-6">
            <LoginForm next={safeNext} />
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-slate-400">
          No password needed — we&apos;ll email you a secure sign-in link.
        </p>
      </div>
    </Container>
  );
}
