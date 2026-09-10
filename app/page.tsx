import Link from "next/link";

import {
  AltArrowRightIcon,
  ChartSquareIcon,
  DocumentTextIcon,
  EyeIcon,
  FolderWithFilesIcon,
  LightningIcon,
  PenNewSquareIcon,
  UsersGroupRoundedIcon,
} from "@solar-icons/react/linear";

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

function getReadingTime(content: string) {
  const plainText = content
    .replace(/<[^>]*>/g, " ")
    .replace(/[#>*_`~[\]()!-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = plainText ? plainText.split(" ").length : 0;

  return Math.max(1, Math.ceil(words / 220));
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const features = [
  {
    icon: DocumentTextIcon,
    title: "Content Editor",
    text: "Write and format rich articles with headings, links, images, lists, quotes, highlights, and more.",
  },
  {
    icon: PenNewSquareIcon,
    title: "Publishing Workflow",
    text: "Save drafts, review article details, add contributors, and publish when the content is ready.",
  },
  {
    icon: ChartSquareIcon,
    title: "Analytics Dashboard",
    text: "Track article views, visitors, top-performing stories, trends, and audience countries.",
  },
  {
    icon: FolderWithFilesIcon,
    title: "Article Management",
    text: "Organize drafts and published content, then edit, update, or remove articles from one hub.",
  },
];

const benefits = [
  {
    icon: LightningIcon,
    title: "Work faster",
    description:
      "Move from draft to published article in a clear, focused workflow.",
  },
  {
    icon: UsersGroupRoundedIcon,
    title: "Built for contributors",
    description:
      "Credit multiple authors and editors without tying bylines to an admin account.",
  },
  {
    icon: EyeIcon,
    title: "See what works",
    description:
      "Use built-in analytics to understand article performance and audience activity.",
  },
  {
    icon: FolderWithFilesIcon,
    title: "Manage everything centrally",
    description:
      "Create, edit, publish, and organize your content from one CMS.",
  },
];

export default async function HomePage() {
  const supabase = await createClient();

  const { data } = await supabase
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
    .limit(3);

  const latestArticles = (data ?? []) as Article[];

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <PublicNavbar active="home" />

      {/* HERO */}
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
                  Draft<span className="text-[#00B2D6]">flow</span>
                </p>

                <div className="mt-5 space-y-1.5 text-[11px] font-medium">
                  {["Dashboard", "Articles", "New Article", "Analytics"].map(
                    (item, index) => (
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
                  {["Drafts", "Published", "Views", "Visitors"].map((label) => (
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
                      ["Published article", "Published"],
                      ["Article draft", "Draft"],
                      ["Edited story", "Published"],
                    ].map(([title, status], index) => (
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
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="border-b border-[#D8EEF5] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[#04045E] sm:text-4xl">
              Everything you need to publish and grow
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Powerful tools, a simpler workflow, and useful insights — all in
              one place.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.title}
                  className="rounded-xl border border-[#BFE5EF] bg-white p-6 transition hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(4,4,94,0.07)]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#CBF2F9] text-[#007CB6]">
                    <Icon size={22} strokeWidth={1.8} />
                  </div>

                  <h3 className="mt-5 text-base font-bold text-[#04045E]">
                    {feature.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {feature.text}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* PRODUCT BENEFITS */}
      <section className="border-b border-[#D8EEF5] bg-[#F5FBFD]">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-[1fr_0.9fr] lg:py-20">
          <div className="overflow-hidden rounded-xl border border-[#B9DFEA] bg-white shadow-[0_16px_40px_rgba(4,4,94,0.08)]">
            <div className="grid min-h-[315px] grid-cols-[120px_1fr]">
              <aside className="border-r border-[#D8EEF5] bg-[#F7FCFD] p-4">
                <p className="text-sm font-bold text-[#04045E]">
                  Draft<span className="text-[#00B2D6]">flow</span>
                </p>

                <div className="mt-5 space-y-1.5 text-[11px] font-medium">
                  {["Dashboard", "Articles", "New Article", "Analytics"].map(
                    (item, index) => (
                      <div
                        key={item}
                        className={`rounded-md px-3 py-2 ${
                          index === 1
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

              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-[#04045E]">
                      Articles
                    </h3>

                    <p className="mt-1 text-[10px] text-slate-400">
                      Manage drafts and published content.
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-1.5 rounded-md bg-[#04045E] px-3 py-2 text-[9px] font-semibold text-white">
                    <PenNewSquareIcon
                      size={12}
                      strokeWidth={1.8}
                    />
                    New Article
                  </div>
                </div>

                <div className="mt-5 flex gap-4 border-b border-[#D8EEF5] pb-3 text-[10px] font-semibold text-slate-400">
                  <span className="text-[#007CB6]">All</span>
                  <span>Drafts</span>
                  <span>Published</span>
                </div>

                <div className="mt-3 grid grid-cols-[1.5fr_0.7fr_0.6fr] gap-3 border-b border-slate-100 pb-2 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                  <span>Title</span>
                  <span>Status</span>
                  <span>Updated</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {[
                    ["Article draft", "Draft"],
                    ["Published story", "Published"],
                    ["Editorial update", "Published"],
                  ].map(([title, status], index) => (
                    <div
                      key={title}
                      className="grid grid-cols-[1.5fr_0.7fr_0.6fr] items-center gap-3 py-4"
                    >
                      <div
                        className={`h-2.5 rounded-full bg-slate-200 ${
                          index === 0
                            ? "w-4/5"
                            : index === 1
                              ? "w-2/3"
                              : "w-3/4"
                        }`}
                      />

                      <span
                        className={`w-fit rounded-full px-2 py-1 text-[8px] font-semibold ${
                          status === "Published"
                            ? "bg-[#CBF2F9] text-[#007CB6]"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {status}
                      </span>

                      <span className="text-[9px] text-slate-400">
                        Today
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-bold tracking-tight text-[#04045E] sm:text-4xl">
              Turn your ideas into impact
            </h2>

            <div className="mt-8 space-y-6">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;

                return (
                  <div
                    key={benefit.title}
                    className="flex gap-4"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#007CB6] shadow-sm">
                      <Icon size={20} strokeWidth={1.8} />
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-[#04045E]">
                        {benefit.title}
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* LATEST ARTICLES */}
      <section className="border-b border-[#D8EEF5] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-[#04045E]">
                Latest Articles
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Recently published content from Draftflow.
              </p>
            </div>

            <Link
              href="/articles"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-[#007CB6] transition hover:text-[#04045E]"
            >
              View all articles
              <AltArrowRightIcon
                size={18}
                strokeWidth={1.8}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </div>

          {latestArticles.length > 0 ? (
            <div className="mt-8 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
              {latestArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/articles/${article.slug}`}
                  className="group block"
                >
                  <article>
                    <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-[#EAF8FC]">
                      {article.cover_image ? (
                        <div
                          role="img"
                          aria-label={`Cover image for ${article.title}`}
                          className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-[1.03]"
                          style={{
                            backgroundImage: `url("${article.cover_image}")`,
                          }}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#CBF2F9] to-[#91E0EF]">
                          <DocumentTextIcon
                            size={34}
                            strokeWidth={1.6}
                            className="text-[#04045E]"
                          />
                        </div>
                      )}
                    </div>

                    <h3 className="mt-4 text-base font-bold leading-6 text-[#04045E] transition group-hover:text-[#007CB6]">
                      {article.title}
                    </h3>

                    {article.excerpt && (
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                        {article.excerpt}
                      </p>
                    )}

                    <p className="mt-3 text-xs text-slate-400">
                      {formatDate(article.published_at || article.created_at)}
                      {" · "}
                      {getReadingTime(article.content)} min read
                    </p>
                  </article>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-xl border border-[#D8EEF5] bg-[#F7FCFD] px-6 py-10 text-center">
              <DocumentTextIcon
                size={30}
                strokeWidth={1.6}
                className="mx-auto text-[#007CB6]"
              />

              <p className="mt-3 text-sm text-slate-500">
                Published articles will appear here automatically.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#04045E]">
        <div className="mx-auto max-w-7xl px-6 py-16 text-center sm:py-20">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to start publishing?
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#CBF2F9]">
            Open Draftflow and manage your article workflow from one focused
            workspace.
          </p>

          <Link
            href="/admin"
            className="group mt-7 inline-flex items-center gap-2 rounded-lg bg-[#00B2D6] px-5 py-3 text-sm font-semibold text-[#04045E] transition hover:bg-[#91E0EF]"
          >
            Get Started
            <AltArrowRightIcon
              size={18}
              strokeWidth={1.8}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
