"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

/**
 * Client island for auth state in the header. Kept client-side on purpose:
 * reading auth cookies in a server component would force every page (including
 * the static SEO pages) into dynamic rendering.
 */
export function HeaderAuth() {
  const [email, setEmail] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth
      .getUser()
      .then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setEmail(session?.user?.email ?? null),
    );
    return () => sub.subscription.unsubscribe();
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
