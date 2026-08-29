"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

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

export default function ArticlesAdminPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
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

  async function handleLogout() {
    try {
      setLoggingOut(true);
      setError("");

      const supabase = createClient();

      const { error } = await supabase.auth.signOut();

      if (error) {
        throw new Error(error.message);
      }

      window.location.href = "/login";
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to log out"
      );
      setLoggingOut(false);
    }
  }

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

      const response = await fetch(
        `/api/articles/${article.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to delete article"
        );
      }

      setArticles((currentArticles) =>
        currentArticles.filter(
          (currentArticle) =>
            currentArticle.id !== article.id
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
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-slate-400">
              Draftflow Admin
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Articles
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Manage your articles, drafts, and published content.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/articles/new"
              className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              New Article
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {/* Total Articles */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              Total Articles
            </p>

            <p className="mt-2 text-2xl font-bold">
              {loading ? "..." : totalArticles}
            </p>
          </div>

          {/* Published */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              Published
            </p>

            <p className="mt-2 text-2xl font-bold">
              {loading ? "..." : publishedArticles}
            </p>
          </div>

          {/* Drafts */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              Drafts
            </p>

            <p className="mt-2 text-2xl font-bold">
              {loading ? "..." : draftArticles}
            </p>
          </div>
        </div>

        {/* Article List */}
        <section className="mt-8 overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 px-6 py-4">
            <h2 className="font-semibold">
              All Articles
            </h2>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex min-h-64 items-center justify-center px-6">
              <p className="text-sm text-slate-400">
                Loading articles...
              </p>
            </div>
          )}

          {/* Empty State */}
          {!loading && totalArticles === 0 && (
            <div className="flex min-h-64 items-center justify-center px-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold">
                  No articles yet
                </h3>

                <p className="mt-2 text-sm text-slate-400">
                  Create your first article to get started.
                </p>

                <Link
                  href="/admin/articles/new"
                  className="mt-5 inline-flex rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium transition hover:bg-slate-800"
                >
                  Create Article
                </Link>
              </div>
            </div>
          )}

          {/* Articles */}
          {!loading && totalArticles > 0 && (
            <div className="divide-y divide-slate-800">
              {articles.map((article) => (
                <div
                  key={article.id}
                  className="flex items-center justify-between gap-6 px-6 py-5 transition hover:bg-slate-800/40"
                >
                  {/* Article Information */}
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold">
                      {article.title}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      /{article.slug}
                    </p>

                    {article.excerpt && (
                      <p className="mt-2 line-clamp-2 text-sm text-slate-400">
                        {article.excerpt}
                      </p>
                    )}

                    <p className="mt-2 text-xs text-slate-500">
                      Created{" "}
                      {new Date(
                        article.created_at
                      ).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Status + Actions */}
                  <div className="flex shrink-0 items-center gap-3">
                    {/* Status */}
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        article.status === "published"
                          ? "bg-emerald-950 text-emerald-300"
                          : "bg-amber-950 text-amber-300"
                      }`}
                    >
                      {article.status === "published"
                        ? "Published"
                        : "Draft"}
                    </span>

                    {/* Edit */}
                    <Link
                      href={`/admin/articles/${article.id}`}
                      className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
                    >
                      Edit
                    </Link>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDelete(article)}
                      disabled={deletingId === article.id}
                      className="rounded-lg border border-red-900 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-950 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingId === article.id
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}