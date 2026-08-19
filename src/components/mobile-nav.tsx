"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const LINKS = [
  { href: "/app-development-companies/gta", label: "Browse GTA" },
  { href: "/#how", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
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

  // Lock scroll while the sheet is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 transition hover:bg-slate-100"
      >
        <span className="text-2xl leading-none">{open ? "✕" : "☰"}</span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 top-16 z-40 bg-slate-900/20"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-x-0 top-16 z-50 border-b border-slate-200 bg-white shadow-lg">
            <nav className="flex flex-col p-4">
              {LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 text-base font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  {l.label}
                </Link>
              ))}

              <div className="my-2 border-t border-slate-100" />

              {email ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-3 text-base font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Dashboard
                  </Link>
                  <form action="/auth/signout" method="post">
                    <button
                      type="submit"
                      className="w-full rounded-lg px-3 py-3 text-left text-base font-medium text-slate-500 transition hover:bg-slate-50"
                    >
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-3 text-base font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/pricing"
                    onClick={() => setOpen(false)}
                    className="mt-2 rounded-lg bg-blue-600 px-3 py-3 text-center text-base font-semibold text-white transition hover:bg-blue-700"
                  >
                    Claim your listing
                  </Link>
                </>
              )}
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
