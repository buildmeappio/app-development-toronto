"use client";

import Link from "next/link";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-6xl flex-col items-center justify-center px-6 py-20 text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-rose-600">
        Something went wrong
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
        We hit a snag
      </h1>
      <p className="mt-3 max-w-md text-slate-500">
        An unexpected error occurred. You can try again, or head back home.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
