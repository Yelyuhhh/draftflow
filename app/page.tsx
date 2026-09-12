import Link from "next/link";

import {
  AltArrowRightIcon,
  ChartSquareIcon,
  DocumentTextIcon,
  LightningIcon,
} from "@solar-icons/react/linear";

import FunFactsStories from "@/components/public/FunFactsStories";
import PublicFooter from "@/components/public/PublicFooter";
import PublicNavbar from "@/components/public/PublicNavbar";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  published_at: string | null;
  created_at: string;
};

type FunFact = {
  id: string;
  title: string;
  week_number: number;
  image_path: string;
  published_at: string | null;
};

function getReadingTime(content: string) {
  const plainText = content
    .replace(/<[^>]*>/g, " ")
    .replace(/[#>*_`~[\]()!-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = plainText
    ? plainText.split(" ").length
    : 0;

  return Math.max(
    1,
    Math.ceil(words / 220)
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );
}

export default async function HomePage() {
  const supabase = await createClient();

  const [
    { data: articleData },
    { data: funFactData },
  ] = await Promise.all([
    supabase
      .from("articles")
      .select(
        `
          id,
          title,
          slug,
          excerpt,
          content,
          cover_image,
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
      })
      .limit(4),

    supabase
      .from("fun_facts")
      .select(
        `
          id,
          title,
          week_number,
          image_path,
          published_at
        `
      )
      .eq("status", "published")
      .order("week_number", {
        ascending: false,
      }),
  ]);

  const latestArticles =
    (articleData ?? []) as Article[];

  const featuredArticle =
    latestArticles[0] ?? null;

  const recentArticles =
    latestArticles.slice(1, 4);

  const funFactRows =
    (funFactData ?? []) as FunFact[];

  const funFacts = funFactRows
    .filter(
      (
        fact
      ): fact is FunFact & {
        published_at: string;
      } => Boolean(fact.published_at)
    )
    .map((fact) => {
      const { data: imageData } =
        supabase.storage
          .from("fun-facts")
          .getPublicUrl(
            fact.image_path
          );

      return {
        id: fact.id,
        title: fact.title,
        week_number:
          fact.week_number,
        image_url:
          imageData.publicUrl,
        published_at:
          fact.published_at,
      };
    });

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <PublicNavbar active="home" />

      {/* ==================================================
          HERO
      ================================================== */}
      <section className="border-b border-[#D8EEF5] bg-white">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-[0.88fr_1.12fr] lg:py-24">
          <div className="max-w-xl">
            <h1 className="text-5xl font-bold leading-[0.98] tracking-[-0.045em] text-[#04045E] sm:text-6xl lg:text-[72px]">
              Write, Publish,
              <br />
              and Track with Ease
            </h1>

            <p className="mt-6 max-w-lg text-base leading-7 text-slate-600 sm:text-lg">
              A modern publishing CMS for creating rich articles, managing
              drafts, publishing content, organizing contributors, and tracking
              performance from one focused workspace.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/admin"
                className="rounded-lg bg-[#04045E] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#007CB6]"
              >
                Get Started
              </Link>

              <Link
                href="/articles"
                className="group inline-flex items-center gap-2 rounded-lg border border-[#B9DFEA] bg-white px-5 py-3 text-sm font-semibold text-[#04045E] transition hover:bg-[#F2FBFD]"
              >
                View Articles

                <AltArrowRightIcon
                  size={18}
                  strokeWidth={1.8}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </div>

            <p className="mt-3 text-xs text-slate-400">
              From first draft to published article — all in one place.
            </p>
          </div>

          {/* Dashboard preview */}
          <div className="overflow-hidden rounded-xl border border-[#B9DFEA] bg-white shadow-[0_20px_50px_rgba(4,4,94,0.10)]">
            <div className="grid min-h-[350px] grid-cols-[125px_1fr]">
              <aside className="border-r border-[#D8EEF5] bg-[#F7FCFD] p-4">
                <p className="text-sm font-bold text-[#04045E]">
                  Draft
                  <span className="text-[#00B2D6]">
                    flow
                  </span>
                </p>

                <div className="mt-5 space-y-1.5 text-[11px] font-medium">
                  {[
                    "Dashboard",
                    "Articles",
                    "New Article",
                    "Analytics",
                  ].map(
                    (
                      item,
                      index
                    ) => (
                      <div
                        key={item}
                        className={`rounded-md px-3 py-2 ${
                          index === 0
                            ? "bg-[#CBF2F9] text-[#04045E]"
                            : "text-slate-500"
                        }`}
                      >
                        {item}
                      </div>
                    )
                  )}
                </div>
              </aside>

              <div className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-[#04045E]">
                      Publishing overview
                    </h2>

                    <p className="mt-1 text-[11px] text-slate-400">
                      See what&apos;s happening with your content.
                    </p>
                  </div>

                  <div className="h-8 w-8 rounded-full bg-[#91E0EF]" />
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    "Drafts",
                    "Published",
                    "Views",
                    "Visitors",
                  ].map((label) => (
                    <div
                      key={label}
                      className="rounded-lg border border-[#D8EEF5] p-3"
                    >
                      <div className="h-2.5 w-8 rounded-full bg-[#00B2D6]/65" />

                      <p className="mt-3 text-[10px] font-semibold text-[#04045E]">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 overflow-hidden rounded-lg border border-[#D8EEF5]">
                  <div className="flex items-center justify-between border-b border-[#D8EEF5] px-4 py-3">
                    <span className="text-[11px] font-semibold text-[#04045E]">
                      Recent Articles
                    </span>

                    <span className="inline-flex items-center gap-1 text-[9px] font-medium text-[#007CB6]">
                      View all

                      <AltArrowRightIcon
                        size={12}
                        strokeWidth={1.8}
                      />
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {[
                      [
                        "Published article",
                        "Published",
                      ],
                      [
                        "Article draft",
                        "Draft",
                      ],
                      [
                        "Edited story",
                        "Published",
                      ],
                    ].map(
                      (
                        [
                          title,
                          status,
                        ],
                        index
                      ) => (
                        <div
                          key={title}
                          className="flex items-center gap-3 px-4 py-3"
                        >
                          <div className="h-3 w-3 rounded-sm bg-[#CBF2F9]" />

                          <div
                            className={`h-2.5 rounded-full bg-slate-200 ${
                              index === 0
                                ? "w-3/4"
                                : index === 1
                                  ? "w-2/3"
                                  : "w-1/2"
                            }`}
                          />

                          <span className="ml-auto text-[9px] text-slate-400">
                            {status}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          DRAFTFLOW PURPOSE
      ================================================== */}
      <section className="border-b border-[#D8EEF5] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-14 sm:py-16">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#007CB6]">
              Built for better publishing
            </p>

            <div className="mt-2 flex items-center gap-5">
              <h2 className="text-3xl font-bold tracking-tight text-[#04045E]">
                Why Draftflow
              </h2>

              <div className="h-px w-8 bg-[#04045E]" />
            </div>
          </div>

          <div className="mt-7 grid gap-5 md:grid-cols-2">
            <article className="flex gap-5 rounded-xl border border-[#D8EEF5] bg-white p-6">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[#B9DFEA] bg-[#F7FCFD] text-[#007CB6]">
                <DocumentTextIcon
                  size={30}
                  strokeWidth={1.7}
                />
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#04045E]">
                  Create with clarity
                </h3>

                <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
                  Write, organize, and publish content from one focused
                  workspace without making the publishing process unnecessarily
                  complicated.
                </p>
              </div>
            </article>

            <article className="flex gap-5 rounded-xl border border-[#D8EEF5] bg-white p-6">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[#B9DFEA] bg-[#F7FCFD] text-[#007CB6]">
                <ChartSquareIcon
                  size={30}
                  strokeWidth={1.7}
                />
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#04045E]">
                  Understand your reach
                </h3>

                <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
                  Track article performance, visitors, trends, and audience
                  activity so published content can be understood as well as
                  managed.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ==================================================
          FEATURED ARTICLE
      ================================================== */}
      <section className="border-b border-[#D8EEF5] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#007CB6]">
              Featured Article
            </p>

            <div className="mt-2 flex items-center gap-5">
              <h2 className="text-3xl font-bold tracking-tight text-[#04045E]">
                Today&apos;s Featured Read
              </h2>

              <div className="h-px w-8 bg-[#04045E]" />
            </div>
          </div>

          {featuredArticle ? (
            <article className="mt-7 grid overflow-hidden rounded-xl border border-[#D8EEF5] bg-white lg:grid-cols-[0.9fr_1.1fr]">
              <Link
                href={`/articles/${featuredArticle.slug}`}
                className="group relative block min-h-[280px] overflow-hidden bg-[#EAF8FC] lg:min-h-[360px]"
              >
                {featuredArticle.cover_image ? (
                  <div
                    role="img"
                    aria-label={`Cover image for ${featuredArticle.title}`}
                    className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-[1.03]"
                    style={{
                      backgroundImage: `url("${featuredArticle.cover_image}")`,
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#CBF2F9] to-[#91E0EF]">
                    <DocumentTextIcon
                      size={50}
                      strokeWidth={1.4}
                      className="text-[#04045E]"
                    />
                  </div>
                )}
              </Link>

              <div className="flex flex-col justify-center p-7 sm:p-9 lg:p-12">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#007CB6]">
                  Latest Publication
                </p>

                <h3 className="mt-4 max-w-xl text-3xl font-bold leading-tight tracking-tight text-[#04045E]">
                  {featuredArticle.title}
                </h3>

                {featuredArticle.excerpt ? (
                  <p className="mt-4 max-w-xl text-sm leading-7 text-slate-500">
                    {featuredArticle.excerpt}
                  </p>
                ) : null}

                <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span>
                    {formatDate(
                      featuredArticle.published_at ||
                        featuredArticle.created_at
                    )}
                  </span>

                  <span>·</span>

                  <span>
                    {getReadingTime(
                      featuredArticle.content
                    )}{" "}
                    min read
                  </span>
                </div>

                <Link
                  href={`/articles/${featuredArticle.slug}`}
                  className="group mt-7 inline-flex w-fit items-center gap-3 rounded-lg bg-[#04045E] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#007CB6]"
                >
                  Read Article

                  <AltArrowRightIcon
                    size={18}
                    strokeWidth={1.8}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              </div>
            </article>
          ) : (
            <div className="mt-7 rounded-xl border border-dashed border-[#B9DFEA] bg-[#F7FCFD] px-6 py-16 text-center">
              <DocumentTextIcon
                size={34}
                strokeWidth={1.6}
                className="mx-auto text-[#007CB6]"
              />

              <p className="mt-3 text-sm text-slate-500">
                Your newest published article will appear here.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ==================================================
          RECENT ARTICLES + WEEKLY FUN FACT
      ================================================== */}
      <section className="border-b border-[#D8EEF5] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-14 sm:py-16">
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px] xl:gap-10">
            {/* ==================================================
                LEFT — RECENT ARTICLES
            ================================================== */}
            <div className="min-w-0">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#007CB6]">
                    Latest Articles
                  </p>

                  <div className="mt-2 flex items-center gap-5">
                    <h2 className="text-3xl font-bold tracking-tight text-[#04045E]">
                      Recent Articles
                    </h2>

                    <div className="h-px w-8 bg-[#04045E]" />
                  </div>
                </div>

                <Link
                  href="/articles"
                  className="group inline-flex items-center gap-2 text-sm font-semibold text-[#04045E] transition hover:text-[#007CB6]"
                >
                  View all articles

                  <AltArrowRightIcon
                    size={18}
                    strokeWidth={1.8}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              </div>

              {recentArticles.length > 0 ? (
                <div className="mt-7 space-y-5">
                  {recentArticles.map(
                    (article) => (
                      <Link
                        key={article.id}
                        href={`/articles/${article.slug}`}
                        className="group grid overflow-hidden rounded-xl border border-[#D8EEF5] bg-white transition hover:border-[#B9DFEA] hover:shadow-[0_10px_30px_rgba(4,4,94,0.06)] sm:grid-cols-[280px_1fr] lg:grid-cols-[300px_1fr]"
                      >
                        {/* Article image */}
                        <div className="relative aspect-[16/9] overflow-hidden bg-[#EAF8FC] sm:aspect-auto sm:min-h-[215px]">
                          {article.cover_image ? (
                            <div
                              role="img"
                              aria-label={`Cover image for ${article.title}`}
                              className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-[1.035]"
                              style={{
                                backgroundImage: `url("${article.cover_image}")`,
                              }}
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#CBF2F9] to-[#91E0EF]">
                              <DocumentTextIcon
                                size={34}
                                strokeWidth={1.5}
                                className="text-[#04045E]"
                              />
                            </div>
                          )}
                        </div>

                        {/* Article details */}
                        <div className="flex flex-col justify-center p-6 sm:p-7">
                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#007CB6]">
                            Article
                          </p>

                          <h3 className="mt-2 text-xl font-bold leading-tight text-[#04045E] transition group-hover:text-[#007CB6] sm:text-2xl">
                            {article.title}
                          </h3>

                          {article.excerpt ? (
                            <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">
                              {article.excerpt}
                            </p>
                          ) : null}

                          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                            <span>
                              {formatDate(
                                article.published_at ||
                                  article.created_at
                              )}
                            </span>

                            <span>·</span>

                            <span>
                              {getReadingTime(
                                article.content
                              )}{" "}
                              min read
                            </span>
                          </div>

                          <div className="mt-5 inline-flex w-fit items-center gap-2 text-sm font-semibold text-[#04045E]">
                            Read Article

                            <AltArrowRightIcon
                              size={16}
                              strokeWidth={1.8}
                              className="transition-transform group-hover:translate-x-1"
                            />
                          </div>
                        </div>
                      </Link>
                    )
                  )}
                </div>
              ) : (
                <div className="mt-7 rounded-xl border border-dashed border-[#B9DFEA] bg-[#F7FCFD] px-6 py-14 text-center">
                  <p className="text-sm text-slate-500">
                    More published articles will appear here.
                  </p>
                </div>
              )}
            </div>

            {/* ==================================================
                RIGHT — WEEKLY FUN FACT
            ================================================== */}
            <div className="lg:sticky lg:top-8 lg:pt-[72px]">
              <FunFactsStories
                funFacts={funFacts}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          DRAFTFLOW PHILOSOPHY
      ================================================== */}
      <section className="border-b border-[#D8EEF5] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col gap-6 rounded-xl border border-[#D8EEF5] bg-[#F7FCFD] px-6 py-7 md:flex-row md:items-center md:justify-between lg:px-8">
            <div className="flex gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[#B9DFEA] bg-white text-[#007CB6]">
                <LightningIcon
                  size={30}
                  strokeWidth={1.7}
                />
              </div>

              <div>
                <h2 className="text-2xl font-bold tracking-tight text-[#04045E]">
                  The Idea Behind Draftflow
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Great publishing should feel like a clear flow from the first
                  draft to the final story. Draftflow keeps the tools,
                  publishing process, and performance insights together so the
                  focus stays on the content.
                </p>
              </div>
            </div>

            <Link
              href="/articles"
              className="group inline-flex shrink-0 items-center justify-center gap-3 rounded-lg bg-[#04045E] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#007CB6]"
            >
              Explore Articles

              <AltArrowRightIcon
                size={18}
                strokeWidth={1.8}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}