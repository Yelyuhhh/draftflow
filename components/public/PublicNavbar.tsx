import Link from "next/link";

type PublicNavbarProps = {
  active?: "home" | "articles";
};

export default function PublicNavbar({
  active,
}: PublicNavbarProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-[#D9EEF5] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-6 px-6">
        {/* Draftflow wordmark */}
        <Link
          href="/"
          aria-label="Draftflow home"
          className="flex shrink-0 items-center"
        >
          <span className="text-xl font-extrabold tracking-[-0.04em] text-[#04045E]">
            Draft
            <span className="text-[#00B2D6]">
              flow
            </span>
          </span>
        </Link>

        {/* Navigation */}
        <nav
          aria-label="Public navigation"
          className="flex items-center gap-2 text-sm font-medium text-[#04045E] sm:gap-5"
        >
          <Link
            href="/#features"
            className="hidden rounded-lg px-2 py-2 transition hover:text-[#007CB6] md:inline-flex"
          >
            Features
          </Link>

          <Link
            href="/articles"
            className={`rounded-lg px-2 py-2 transition ${
              active === "articles"
                ? "text-[#007CB6]"
                : "hover:text-[#007CB6]"
            }`}
          >
            Articles
          </Link>

          <Link
            href="/admin"
            className="hidden rounded-lg px-2 py-2 transition hover:text-[#007CB6] sm:inline-flex"
          >
            Login
          </Link>

          <Link
            href="/admin"
            className="ml-1 inline-flex rounded-lg bg-[#04045E] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#007CB6] sm:text-sm"
          >
            Get Started
          </Link>
        </nav>
      </div>
    </header>
  );
}