import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ArticlesPage() {
  const supabase = await createClient();

  const { data: articles, error } = await supabase
    .from("articles")
    .select(
      "id, title, slug, excerpt, content, cover_image, status, published_at, created_at"
    )
    .eq("status", "published")
    .order("published_at", { ascending: false });

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* Header */}
        <header className="mb-10">
          <p className="text-sm font-medium text-slate-500">
            Draftflow
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            Articles
          </h1>

          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-400">
            Insights, stories, and updates from Draftflow.
          </p>
        </header>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-900 bg-red-950/40 p-6">
            <h2 className="font-semibold text-red-400">
              Unable to load articles
            </h2>

            <p className="mt-2 text-sm text-red-300">
              {error.message}
            </p>
          </div>
        )}

        {/* Empty State */}
        {!error && (!articles || articles.length === 0) && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
            <h2 className="text-xl font-semibold text-white">
              No articles yet
            </h2>

            <p className="mt-2 text-slate-400">
              Published articles will appear here.
            </p>
          </div>
        )}

        {/* Articles */}
        {!error && articles && articles.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => {
              const publishedDate = new Date(
                article.published_at || article.created_at
              ).toLocaleDateString();

              return (
                <article
                  key={article.id}
                  className="group overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 transition hover:border-slate-700 hover:bg-slate-900/80"
                >
                  {/* Cover Image */}
                  {article.cover_image ? (
                    <Link href={`/articles/${article.slug}`}>
                      <div className="aspect-video overflow-hidden bg-slate-800">
                        <img
                          src={article.cover_image}
                          alt={article.title}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      </div>
                    </Link>
                  ) : (
                    <Link href={`/articles/${article.slug}`}>
                      <div className="flex aspect-video items-center justify-center bg-slate-800">
                        <span className="text-sm text-slate-500">
                          Draftflow
                        </span>
                      </div>
                    </Link>
                  )}

                  {/* Content */}
                  <div className="p-6">
                    <p className="text-xs text-slate-500">
                      {publishedDate}
                    </p>

                    <h2 className="mt-3 text-xl font-semibold tracking-tight text-white">
                      <Link
                        href={`/articles/${article.slug}`}
                        className="transition hover:text-slate-300"
                      >
                        {article.title}
                      </Link>
                    </h2>

                    {article.excerpt && (
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">
                        {article.excerpt}
                      </p>
                    )}

                    <div className="mt-6">
                      <Link
                        href={`/articles/${article.slug}`}
                        className="text-sm font-medium text-slate-300 transition hover:text-white"
                      >
                        Read article →
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}