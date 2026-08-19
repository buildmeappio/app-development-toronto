import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { AdminNav } from "@/components/admin-nav";
import { LogoMark } from "@/components/logo-mark";

export const metadata = { title: "Admin", robots: { index: false } };
// Admin is auth-gated and data-heavy — always render on request.
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (!isAdminEmail(user.email)) notFound();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2 py-3">
            <LogoMark size={26} />
            <span className="text-sm font-bold text-slate-900">Admin</span>
          </div>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">
            ← Back to site
          </Link>
        </div>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <AdminNav />
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
