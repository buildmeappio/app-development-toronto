// Deterministic monogram avatar. Swaps to a real image once logoUrl is set
// (after a company claims + uploads via Supabase Storage in a later phase).

const PALETTE = [
  "from-blue-500 to-blue-700",
  "from-indigo-500 to-indigo-700",
  "from-violet-500 to-violet-700",
  "from-emerald-500 to-emerald-700",
  "from-rose-500 to-rose-700",
  "from-amber-500 to-amber-700",
  "from-cyan-500 to-cyan-700",
  "from-fuchsia-500 to-fuchsia-700",
  "from-teal-500 to-teal-700",
  "from-sky-500 to-sky-700",
];

function initials(name: string): string {
  const words = name
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function CompanyLogo({
  name,
  logoUrl,
  size = 48,
}: {
  name: string;
  logoUrl?: string | null;
  size?: number;
}) {
  if (logoUrl) {
    return (
      // Company-uploaded logos are arbitrary external URLs; plain img is fine here.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={`${name} logo`}
        width={size}
        height={size}
        className="shrink-0 rounded-xl object-cover ring-1 ring-slate-200"
        style={{ width: size, height: size }}
      />
    );
  }
  const gradient = PALETTE[hash(name) % PALETTE.length];
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br font-bold text-white shadow-sm ${gradient}`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-hidden
    >
      {initials(name)}
    </div>
  );
}
