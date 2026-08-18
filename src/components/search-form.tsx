/** Native GET form → /search?q=… . No client JS needed. */
export function SearchForm({
  defaultValue = "",
  variant = "light",
}: {
  defaultValue?: string;
  variant?: "light" | "onDark";
}) {
  const onDark = variant === "onDark";
  return (
    <form action="/search" role="search" className="flex w-full max-w-xl gap-2">
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Search companies or cities…"
        aria-label="Search"
        className={`h-12 flex-1 rounded-xl px-4 text-sm outline-none transition ${
          onDark
            ? "border border-white/15 bg-white/10 text-white placeholder:text-slate-300 focus:border-white/40"
            : "border border-slate-300 bg-white text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        }`}
      />
      <button
        type="submit"
        className="h-12 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white transition hover:bg-blue-500"
      >
        Search
      </button>
    </form>
  );
}
