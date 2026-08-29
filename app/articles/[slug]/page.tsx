import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createClient } from "@/lib/supabase/server";

type ArticlePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function ArticlePage({
  params,
}: ArticlePageProps) {
  const { slug } = await params;

  const supabase = await createClient();

  const { data: article, error } = await supabase
    .from("articles")
    .select(
      "id, title, slug, excerpt, content, cover_image, status, published_at, created_at"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !article) {
    notFound();
  }

  const publishedDate = new Date(
    article.published_at || article.created_at
  ).toLocaleDateString();

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <article className="mx-auto max-w-4xl px-6 py-12">
        {/* Back to Articles */}
        <Link
          href="/articles"
          className="text-sm text-slate-400 transition hover:text-white"
        >
          ← Back to Articles
        </Link>

        {/* Article Header */}
        <header className="mt-8">
          <p className="text-sm text-slate-500">
            {publishedDate}
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            {article.title}
          </h1>

          {article.excerpt && (
            <p className="mt-5 text-lg leading-8 text-slate-400">
              {article.excerpt}
            </p>
          )}
        </header>

        {/* Cover Image */}
        {article.cover_image && (
          <div className="mt-8 overflow-hidden rounded-2xl border border-slate-800">
            <img
              src={article.cover_image}
              alt={article.title}
              className="h-auto w-full object-cover"
            />
          </div>
        )}

        {/* Article Content */}
        <div className="mt-10 border-t border-slate-800 pt-10">
          <div
            className="
              prose
              prose-invert
              max-w-none
              prose-headings:font-bold
              prose-headings:tracking-tight
              prose-headings:text-white
              prose-h2:mt-10
              prose-h2:text-3xl
              prose-h3:mt-8
              prose-h3:text-2xl
              prose-p:text-slate-300
              prose-p:leading-8
              prose-a:text-slate-200
              prose-a:underline
              prose-a:underline-offset-4
              hover:prose-a:text-white
              prose-strong:text-white
              prose-em:text-slate-200
              prose-blockquote:border-slate-600
              prose-blockquote:text-slate-400
              prose-ul:text-slate-300
              prose-ol:text-slate-300
              prose-li:marker:text-slate-500
              prose-code:text-slate-200
              prose-pre:border
              prose-pre:border-slate-800
              prose-pre:bg-slate-900
            "
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {article.content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="mt-12 border-t border-slate-800 pt-6">
          <Link
            href="/articles"
            className="text-sm font-medium text-slate-300 transition hover:text-white"
          >
            ← Back to all articles
          </Link>
        </div>
      </article>
    </main>
  );
}