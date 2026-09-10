import Image from "next/image";
import Link from "next/link";

export default function PublicFooter() {
  return (
    <footer className="border-t border-[#CBF2F9] bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.6fr_0.6fr]">
        <div>
          <Link
            href="/"
            aria-label="Draftflow home"
            className="inline-flex items-center"
          >
            <Image
              src="/logo.png"
              alt="Draftflow"
              width={170}
              height={68}
              className="h-14 w-auto object-contain"
            />
          </Link>

          <p className="mt-4 max-w-md text-sm leading-6 text-slate-500">
            Clear, thoughtful financial literacy for everyday decisions.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#007CB6]">
            Explore
          </p>

          <div className="mt-4 flex flex-col gap-3 text-sm">
            <Link
              href="/"
              className="text-slate-600 transition hover:text-[#04045E]"
            >
              Home
            </Link>

            <Link
              href="/articles"
              className="text-slate-600 transition hover:text-[#04045E]"
            >
              Articles
            </Link>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#007CB6]">
            Admin
          </p>

          <div className="mt-4">
            <Link
              href="/admin"
              className="text-sm text-slate-600 transition hover:text-[#04045E]"
            >
              CMS Login
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>Draftflow</span>
          <span>Financial literacy, made clearer.</span>
        </div>
      </div>
    </footer>
  );
}
