import Link from "next/link";
import { notFound } from "next/navigation";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import sanitizeHtml from "sanitize-html";

import { createClient } from "@/lib/supabase/server";

import ArticleViewTracker from "@/components/analytics/article-view-tracker";
import PublicNavbar from "@/components/public/PublicNavbar";

type ArticlePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamic = "force-dynamic";

function sanitizeArticleHtml(content: string) {
  return sanitizeHtml(content, {
    allowedTags: [
      "h1",
      "h2",
      "h3",
      "p",
      "br",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "strike",
      "span",
      "mark",
      "a",
      "blockquote",
      "ul",
      "ol",
      "li",
      "code",
      "pre",
      "img",
      "hr",
    ],

    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "title", "width", "height"],
      span: ["style"],
      mark: ["style", "data-color"],
      p: ["style"],
      h1: ["style"],
      h2: ["style"],
      h3: ["style"],
    },

    allowedSchemes: [
      "http",
      "https",
      "mailto",
      "tel",
    ],

    allowedStyles: {
      "*": {
        color: [
          /^#[0-9a-fA-F]{3,8}$/,
          /^rgb\([^)]+\)$/,
          /^rgba\([^)]+\)$/,
        ],

        "background-color": [
          /^#[0-9a-fA-F]{3,8}$/,
          /^rgb\([^)]+\)$/,
          /^rgba\([^)]+\)$/,
        ],

        "text-align": [
          /^left$/,
          /^center$/,
          /^right$/,
          /^justify$/,
        ],
      },
    },

    transformTags: {
      a: sanitizeHtml.simpleTransform(
        "a",
        {
          rel: "noopener noreferrer nofollow",
          target: "_blank",
        },
        true
      ),
    },
  });
}

function formatPeople(people: string[]) {
  if (people.length === 0) return "";
  if (people.length === 1) return people[0];

  if (people.length === 2) {
    return `${people[0]} and ${people[1]}`;
  }

  return `${people.slice(0, -1).join(", ")}, and ${
    people[people.length - 1]
  }`;
}

function getReadingTime(content: string) {
  const plainText = content
    .replace(/<[^>]*>/g, " ")
    .replace(/[#>*_`~[\]()!-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = plainText
    ? plainText.split(" ").length
    : 0;

  return Math.max(1, Math.ceil(words / 220));
}

export default async function ArticlePage({
  params,
}: ArticlePageProps) {
  const { slug } = await params;

  const supabase = await createClient();

  const { data: article, error } =
    await supabase
      .from("articles")
      .select(
        `
          id,
          title,
          slug,
          excerpt,
          content,
          content_format,
          cover_image,
          authors,
          editors,
          status,
          published_at,
          created_at
        `
      )
      .eq("slug", slug)
      .eq("status", "published")
      .single();

  if (error || !article) {
    notFound();
  }

  const publishedDate = new Date(
    article.published_at ||
      article.created_at
  ).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const readingTime =
    getReadingTime(article.content);

  const contentFormat =
    article.content_format ??
    "markdown";

  const safeHtml =
    contentFormat === "html"
      ? sanitizeArticleHtml(
          article.content
        )
      : "";

  const authors =
    Array.isArray(article.authors)
      ? article.authors
      : [];

  const editors =
    Array.isArray(article.editors)
      ? article.editors
      : [];

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <ArticleViewTracker
        articleId={article.id}
      />

      <PublicNavbar />

      {/* Article */}
      <article className="mx-auto w-full max-w-[760px] px-6 pb-20 pt-14 sm:pt-16">
        <Link
          href="/articles"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-indigo-600"
        >
          <span>←</span>
          <span>Back to Articles</span>
        </Link>

        <header className="mt-9">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            <span>
              {publishedDate}
            </span>

            <span aria-hidden="true">
              ·
            </span>

            <span>
              {readingTime} min read
            </span>
          </div>

          <h1 className="mt-5 font-serif text-[42px] font-semibold leading-[1.08] tracking-[-0.02em] text-slate-950 sm:text-[56px]">
            {article.title}
          </h1>

          {article.excerpt && (
            <p className="mt-7 font-serif text-xl leading-9 text-slate-600 sm:text-[22px]">
              {article.excerpt}
            </p>
          )}

          {(authors.length > 0 ||
            editors.length > 0) && (
            <div className="mt-7 flex flex-col gap-1.5 text-sm text-slate-500 sm:flex-row sm:flex-wrap sm:gap-x-5">
              {authors.length > 0 && (
                <p>
                  By{" "}
                  <span className="font-semibold text-slate-800">
                    {formatPeople(
                      authors
                    )}
                  </span>
                </p>
              )}

              {editors.length > 0 && (
                <p>
                  Edited by{" "}
                  <span className="font-medium text-slate-700">
                    {formatPeople(
                      editors
                    )}
                  </span>
                </p>
              )}
            </div>
          )}
        </header>

        {article.cover_image && (
          <div className="mt-10 overflow-hidden rounded-2xl bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                article.cover_image
              }
              alt={
                article.title
              }
              className="aspect-[16/9] w-full object-cover"
            />
          </div>
        )}

        <div className="mt-12 border-t border-slate-200 pt-10">
          {contentFormat ===
          "html" ? (
            <div
              className="
                article-content
                font-serif
                text-[18px]
                leading-9
                text-slate-700

                [&_h1]:mb-5
                [&_h1]:mt-12
                [&_h1]:font-serif
                [&_h1]:text-4xl
                [&_h1]:font-semibold
                [&_h1]:tracking-tight
                [&_h1]:text-slate-950

                [&_h2]:mb-4
                [&_h2]:mt-12
                [&_h2]:font-serif
                [&_h2]:text-3xl
                [&_h2]:font-semibold
                [&_h2]:tracking-tight
                [&_h2]:text-slate-950

                [&_h3]:mb-3
                [&_h3]:mt-10
                [&_h3]:font-serif
                [&_h3]:text-2xl
                [&_h3]:font-semibold
                [&_h3]:text-slate-900

                [&_p]:my-6

                [&_strong]:font-bold
                [&_strong]:text-slate-950

                [&_em]:text-slate-700

                [&_a]:font-medium
                [&_a]:text-indigo-600
                [&_a]:underline
                [&_a]:decoration-indigo-200
                [&_a]:underline-offset-4
                hover:[&_a]:text-indigo-700

                [&_ul]:my-7
                [&_ul]:list-disc
                [&_ul]:space-y-2
                [&_ul]:pl-7

                [&_ol]:my-7
                [&_ol]:list-decimal
                [&_ol]:space-y-2
                [&_ol]:pl-7

                [&_li]:pl-1
                [&_li::marker]:text-indigo-500

                [&_blockquote]:my-9
                [&_blockquote]:border-l-[3px]
                [&_blockquote]:border-indigo-500
                [&_blockquote]:bg-indigo-50/70
                [&_blockquote]:px-6
                [&_blockquote]:py-4
                [&_blockquote]:font-serif
                [&_blockquote]:italic
                [&_blockquote]:text-slate-700

                [&_code]:rounded
                [&_code]:bg-slate-100
                [&_code]:px-1.5
                [&_code]:py-0.5
                [&_code]:font-mono
                [&_code]:text-sm
                [&_code]:text-indigo-700

                [&_pre]:my-9
                [&_pre]:overflow-x-auto
                [&_pre]:rounded-xl
                [&_pre]:bg-slate-950
                [&_pre]:p-5
                [&_pre]:font-mono
                [&_pre]:text-sm
                [&_pre]:leading-7
                [&_pre]:text-slate-100

                [&_pre_code]:bg-transparent
                [&_pre_code]:p-0
                [&_pre_code]:text-slate-100

                [&_img]:my-10
                [&_img]:h-auto
                [&_img]:w-full
                [&_img]:rounded-2xl

                [&_hr]:my-10
                [&_hr]:border-slate-200

                [&_mark]:rounded
                [&_mark]:px-1
              "
              dangerouslySetInnerHTML={{
                __html:
                  safeHtml,
              }}
            />
          ) : (
            <div
              className="
                font-serif
                text-[18px]
                leading-9
                text-slate-700

                [&_h1]:mb-5
                [&_h1]:mt-12
                [&_h1]:text-4xl
                [&_h1]:font-semibold
                [&_h1]:text-slate-950

                [&_h2]:mb-4
                [&_h2]:mt-12
                [&_h2]:text-3xl
                [&_h2]:font-semibold
                [&_h2]:text-slate-950

                [&_h3]:mb-3
                [&_h3]:mt-10
                [&_h3]:text-2xl
                [&_h3]:font-semibold
                [&_h3]:text-slate-900

                [&_p]:my-6

                [&_ul]:my-7
                [&_ul]:list-disc
                [&_ul]:space-y-2
                [&_ul]:pl-7

                [&_ol]:my-7
                [&_ol]:list-decimal
                [&_ol]:space-y-2
                [&_ol]:pl-7

                [&_li::marker]:text-indigo-500

                [&_blockquote]:my-9
                [&_blockquote]:border-l-[3px]
                [&_blockquote]:border-indigo-500
                [&_blockquote]:bg-indigo-50/70
                [&_blockquote]:px-6
                [&_blockquote]:py-4
                [&_blockquote]:italic

                [&_strong]:text-slate-950

                [&_a]:font-medium
                [&_a]:text-indigo-600
                [&_a]:underline
                [&_a]:underline-offset-4
              "
            >
              <ReactMarkdown
                remarkPlugins={[
                  remarkGfm,
                ]}
              >
                {article.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        <footer className="mt-14 border-t border-slate-200 pt-7">
          <Link
            href="/articles"
            className="text-sm font-medium text-slate-500 transition hover:text-indigo-600"
          >
            ← Back to all articles
          </Link>
        </footer>
      </article>
    </main>
  );
}
