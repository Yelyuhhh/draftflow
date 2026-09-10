"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  DocumentTextIcon,
  FolderWithFilesIcon,
  PenNewSquareIcon,
} from "@solar-icons/react/linear";

type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ArticlesAdminPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchArticles() {
      try {
        setError("");

        const response = await fetch("/api/articles", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load articles");
        }

        if (!cancelled) {
          setArticles(data.articles ?? []);
        }
      } catch (error) {
        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : "Failed to load articles"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchArticles();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDelete(article: Article) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${article.title}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(article.id);
      setError("");

      const response = await fetch(`/api/articles/${article.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete article");
      }

      setArticles((currentArticles) =>
        currentArticles.filter(
          (currentArticle) => currentArticle.id !== article.id
        )
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete article"
      );
    } finally {
      setDeletingId(null);
    }
  }

  const totalArticles = articles.length;

  const publishedArticles = articles.filter(
    (article) => article.status === "published"
  ).length;

  const draftArticles = articles.filter(
    (article) => article.status === "draft"
  ).length;

  return (
    <div className="min-h-screen bg-[#F7FCFD] text-slate-900">
      <div className="mx-auto max-w-[1280px] px-6 py-8 lg:px-10 lg:py-10">
        {/* Header */}
        <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#007CB6]">
              Draftflow Admin
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-[#04045E]">
              Articles
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Manage your articles, drafts, and published content.
            </p>
          </div>

          <Link
            href="/admin/articles/new"
            className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#04045E] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#007CB6] focus:outline-none focus:ring-4 focus:ring-[#CBF2F9]"
          >
            <PenNewSquareIcon
              size={18}
              strokeWidth={1.8}
              aria-hidden="true"
            />

            <span>New Article</span>
          </Link>
        </header>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {/* Stats */}
        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[#D8EEF5] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-600">
                  Total Articles
                </p>

                <p className="mt-2 text-3xl font-bold tracking-tight text-[#04045E]">
                  {loading ? "—" : totalArticles}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  All content in Draftflow
                </p>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#CBF2F9] text-[#007CB6]">
                <DocumentTextIcon
                  size={22}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#D8EEF5] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-600">
                  Published
                </p>

                <p className="mt-2 text-3xl font-bold tracking-tight text-[#04045E]">
                  {loading ? "—" : publishedArticles}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Live on the public website
                </p>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <FolderWithFilesIcon
                  size={22}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#D8EEF5] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-600">
                  Drafts
                </p>

                <p className="mt-2 text-3xl font-bold tracking-tight text-[#04045E]">
                  {loading ? "—" : draftArticles}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Work still in progress
                </p>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <PenNewSquareIcon
                  size={22}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Article List */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-[#D8EEF5] bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-[#E7F3F7] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-lg font-bold text-[#04045E]">
                All Articles
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Review status, dates, and article details.
              </p>
            </div>

            {!loading && (
              <span className="w-fit rounded-full bg-[#F0FAFC] px-3 py-1.5 text-xs font-semibold text-[#007CB6]">
                {totalArticles}{" "}
                {totalArticles === 1 ? "article" : "articles"}
              </span>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div className="divide-y divide-slate-100">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="animate-pulse px-5 py-6 sm:px-6"
                >
                  <div className="h-4 w-2/5 rounded bg-slate-200" />
                  <div className="mt-3 h-3 w-1/3 rounded bg-slate-100" />
                  <div className="mt-4 h-3 w-3/4 rounded bg-slate-100" />
                  <div className="mt-4 h-3 w-1/2 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && totalArticles === 0 && (
            <div className="flex min-h-[320px] items-center justify-center px-6 py-12">
              <div className="max-w-sm text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#CBF2F9] text-[#007CB6]">
                  <DocumentTextIcon
                    size={28}
                    strokeWidth={1.7}
                    aria-hidden="true"
                  />
                </div>

                <h3 className="mt-5 text-lg font-bold text-[#04045E]">
                  No articles yet
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Create your first article and start building your publishing
                  library.
                </p>

                <Link
                  href="/admin/articles/new"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#04045E] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#007CB6]"
                >
                  <PenNewSquareIcon
                    size={17}
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />

                  Create Article
                </Link>
              </div>
            </div>
          )}

          {/* Articles */}
          {!loading && totalArticles > 0 && (
            <div className="divide-y divide-slate-100">
              {articles.map((article) => (
                <article
                  key={article.id}
                  className="px-5 py-5 transition hover:bg-[#FAFDFE] sm:px-6 sm:py-6"
                >
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="min-w-0 text-base font-bold leading-6 text-[#04045E]">
                          {article.title}
                        </h3>

                        <span
                          className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${
                            article.status === "published"
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                              : "bg-amber-50 text-amber-700 ring-amber-200"
                          }`}
                        >
                          {article.status === "published"
                            ? "Published"
                            : "Draft"}
                        </span>
                      </div>

                      <p className="mt-1.5 truncate text-sm font-medium text-[#007CB6]">
                        /{article.slug}
                      </p>

                      {article.excerpt && (
                        <p className="mt-3 line-clamp-2 max-w-4xl text-sm leading-6 text-slate-500">
                          {article.excerpt}
                        </p>
                      )}

                      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-400">
                        <span>
                          Created{" "}
                          <span className="font-medium text-slate-500">
                            {formatDate(article.created_at)}
                          </span>
                        </span>

                        <span>
                          Updated{" "}
                          <span className="font-medium text-slate-500">
                            {formatDate(article.updated_at)}
                          </span>
                        </span>

                        {article.status === "published" && (
                          <span>
                            Published{" "}
                            <span className="font-medium text-slate-500">
                              {formatDate(article.published_at)}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 xl:pl-6">
                      <Link
                        href={`/admin/articles/${article.id}`}
                        className="inline-flex items-center gap-2 rounded-lg border border-[#CBE8F0] bg-white px-3.5 py-2 text-xs font-semibold text-[#04045E] transition hover:border-[#91E0EF] hover:bg-[#F2FBFD]"
                      >
                        <PenNewSquareIcon
                          size={15}
                          strokeWidth={1.8}
                          aria-hidden="true"
                        />

                        Edit
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDelete(article)}
                        disabled={deletingId === article.id}
                        className="rounded-lg border border-red-200 bg-white px-3.5 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingId === article.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
