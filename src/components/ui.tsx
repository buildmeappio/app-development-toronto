import type { ReactNode } from "react";

/* ---- Surfaces ---------------------------------------------------------- */

/** Soft branded background + centered container for gated/app pages. */
export function PageShell({
  children,
  width = "default",
}: {
  children: ReactNode;
  width?: "narrow" | "default" | "wide";
}) {
  const max =
    width === "narrow"
      ? "max-w-2xl"
      : width === "wide"
        ? "max-w-5xl"
        : "max-w-3xl";
  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-slate-50">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(65%_100%_at_50%_0%,rgba(37,99,235,0.10),transparent)]" />
      <div className={`relative mx-auto ${max} px-4 py-10 sm:px-6`}>
        {children}
      </div>
    </div>
  );
}

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

/** A titled card section. */
export function Section({
  title,
  desc,
  aside,
  children,
}: {
  title: string;
  desc?: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Panel className="p-6 sm:p-7">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {desc && <p className="mt-1 text-sm text-slate-500">{desc}</p>}
        </div>
        {aside}
      </div>
      {children}
    </Panel>
  );
}

export function PageHeading({
  eyebrow,
  title,
  desc,
  children,
}: {
  eyebrow?: string;
  title: string;
  desc?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {title}
        </h1>
        {desc && <p className="mt-1.5 text-slate-500">{desc}</p>}
      </div>
      {children}
    </div>
  );
}

/* ---- Form primitives --------------------------------------------------- */

export const inputCls =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";
export const textareaCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

export function Field({
  label,
  hint,
  htmlFor,
  required,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="mb-1.5 flex items-center gap-1 text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-blue-600">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

/* ---- Buttons ----------------------------------------------------------- */

const BTN_BASE =
  "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition disabled:opacity-60";
const BTN_VARIANTS = {
  primary: "bg-blue-600 text-white shadow-sm hover:bg-blue-700",
  secondary:
    "border border-slate-200 bg-white text-slate-800 shadow-sm hover:border-slate-300 hover:bg-slate-50",
  dark: "bg-slate-900 text-white shadow-sm hover:bg-slate-700",
  ghost: "text-slate-600 hover:bg-slate-100",
} as const;

/** Class string for buttons — works on <button>, <a>, and <Link>. */
export function btn(
  variant: keyof typeof BTN_VARIANTS = "primary",
  extra = "",
): string {
  return `${BTN_BASE} ${BTN_VARIANTS[variant]} ${extra}`;
}

/* ---- Stats ------------------------------------------------------------- */

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <Panel className="p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </Panel>
  );
}
