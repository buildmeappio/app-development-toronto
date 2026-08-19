"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Client island for auth state in the header. Kept client-side on purpose:
 * reading auth cookies in a server component would force every page (including
 * the static SEO pages) into dynamic rendering. The Supabase client is imported
 * lazily so its ~100 KiB isn't in every page's initial bundle.
 */
export function HeaderAuth() {
  const [email, setEmail] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    (async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? null);
      const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
        setEmail(session?.user?.email ?? null),
      );
      unsub = () => sub.subscription.unsubscribe();
    })();
    return () => unsub?.();
  }, []);

  // Loading — reserve space to avoid layout shift.
  if (email === undefined) return <div className="h-9 w-32" />;

  if (email) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          Dashboard
        </Link>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition hover:text-slate-900 sm:block"
          >
            Sign out
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/login"
        className="hidden px-3 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-900 sm:block"
      >
        Sign in
      </Link>
      <Link
        href="/#for-companies"
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
      >
        Claim your listing
      </Link>
    </div>
  );
}
