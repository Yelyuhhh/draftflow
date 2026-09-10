import PublicNavbar from "@/components/public/PublicNavbar";
import ArticleCard from "@/components/public/ArticleCard";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  authors: string[] | null;
  published_at: string | null;
  created_at: string;
};

export default async function ArticlesPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("articles")
    .select(
      `
        id,
        title,
        slug,
        excerpt,
        content,
        cover_image,
        authors,
        published_at,
        created_at
      `
    )
    .eq("status", "published")
    .order("published_at", {
      ascending: false,
      nullsFirst: false,
    })
    .order("created_at", {
      ascending: false,
    });

  const articles = (data ?? []) as Article[];

  const featuredArticle = articles[0] ?? null;
  const remainingArticles = articles.slice(1);

  return (
    <main className="min-h-screen bg-[#F8FCFD] text-slate-950">
      <PublicNavbar active="articles" />

      <section className="border-b border-[#CBF2F9] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-14 sm:py-16 lg:py-20">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#007CB6]">
              Draftflow Journal
            </p>

            <h1 className="mt-4 font-serif text-5xl font-semibold tracking-[-0.03em] text-[#04045E] sm:text-6xl">
              Articles
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Clear, thoughtful stories and practical ideas about money,
              communities, and the systems that shape everyday life.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12 sm:py-14 lg:py-16">
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8">
            <h2 className="text-lg font-semibold text-red-900">
              We couldn&apos;t load the articles.
            </h2>

            <p className="mt-2 text-sm leading-6 text-red-700">
              Please refresh the page and try again.
            </p>
          </div>
        ) : articles.length === 0 ? (
          <div className="rounded-[28px] border border-[#CBF2F9] bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#CBF2F9] text-2xl text-[#04045E]">
              ✦
            </div>

            <h2 className="mt-5 font-serif text-2xl font-semibold text-[#04045E]">
              No published articles yet
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
              New stories will appear here once they are published.
            </p>
          </div>
        ) : (
          <>
            {featuredArticle && (
              <div>
                <div className="mb-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#007CB6]">
                      Latest
                    </p>

                    <h2 className="mt-1 font-serif text-2xl font-semibold text-[#04045E]">
                      Featured story
                    </h2>
                  </div>

                  <p className="hidden text-sm text-slate-400 sm:block">
                    {articles.length}{" "}
                    {articles.length === 1 ? "article" : "articles"}
                  </p>
                </div>

                <ArticleCard
                  article={featuredArticle}
                  featured
                />
              </div>
            )}

            {remainingArticles.length > 0 && (
              <div className="mt-14 sm:mt-16">
                <div className="mb-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#007CB6]">
                    More from Draftflow
                  </p>

                  <h2 className="mt-1 font-serif text-2xl font-semibold text-[#04045E]">
                    Explore more stories
                  </h2>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {remainingArticles.map((article) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
