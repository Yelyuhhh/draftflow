import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type FunFact = {
  id: string;
  title: string;
  week_number: number;
  image_path: string;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
};

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function FunFactsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("fun_facts")
    .select(
      `
        id,
        title,
        week_number,
        image_path,
        status,
        published_at,
        created_at
      `
    )
    .order("week_number", {
      ascending: false,
    });

  const funFacts = (data ?? []) as FunFact[];

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-8 lg:px-10">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Fun Facts
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage the weekly Fun Facts displayed on the website.
          </p>
        </div>

        <Link
          href="/admin/fun-facts/new"
          className="inline-flex w-fit items-center rounded-lg bg-[#04045E] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#007CB6]"
        >
          Add Fun Fact
        </Link>
      </header>

      {error ? (
        <div className="mt-8 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
          Failed to load Fun Facts: {error.message}
        </div>
      ) : funFacts.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
          <h2 className="text-base font-semibold text-slate-800">
            No Fun Facts yet
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Upload your first weekly Fun Fact.
          </p>

          <Link
            href="/admin/fun-facts/new"
            className="mt-5 inline-flex rounded-lg bg-[#04045E] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#007CB6]"
          >
            Add Fun Fact
          </Link>
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="hidden grid-cols-[1fr_120px_130px_170px] border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
            <span>Title</span>
            <span>Week</span>
            <span>Status</span>
            <span>Published</span>
          </div>

          <div className="divide-y divide-slate-100">
            {funFacts.map((fact) => (
              <div
                key={fact.id}
                className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_120px_130px_170px] md:items-center"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {fact.title}
                  </p>
                </div>

                <p className="text-sm text-slate-600">
                  #{fact.week_number}
                </p>

                <div>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      fact.status === "published"
                        ? "bg-[#CBF2F9] text-[#007CB6]"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {fact.status === "published"
                      ? "Published"
                      : "Draft"}
                  </span>
                </div>

                <p className="text-sm text-slate-500">
                  {formatDate(fact.published_at)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}