import Link from "next/link";

import {
  AltArrowRightIcon,
  ChartSquareIcon,
  DocumentTextIcon,
  EyeIcon,
  FolderWithFilesIcon,
  PenNewSquareIcon,
} from "@solar-icons/react/linear";

import ViewsChart from "@/components/analytics/ViewsChart";

import { createClient } from "@/lib/supabase/server";
import {
  getDashboardAnalytics,
  type DashboardPeriod,
} from "@/lib/analytics/dashboard";

export const dynamic = "force-dynamic";

type AdminDashboardPageProps = {
  searchParams: Promise<{
    days?: string;
  }>;
};

const regionNames = new Intl.DisplayNames(["en"], {
  type: "region",
});

function getCountryName(countryCode: string) {
  const code = countryCode.trim().toUpperCase();

  if (!code || code === "UNKNOWN") {
    return "Unknown";
  }

  try {
    return regionNames.of(code) || code;
  } catch {
    return code;
  }
}

function getPeriod(value?: string): DashboardPeriod {
  if (value === "7") return 7;
  if (value === "90") return 90;

  return 30;
}

function TrendIcon({
  positive,
}: {
  positive: boolean;
}) {
  return (
    <AltArrowRightIcon
      size={15}
      strokeWidth={2}
      className={
        positive
          ? "-rotate-90"
          : "rotate-90"
      }
      aria-hidden="true"
    />
  );
}

export default async function AdminDashboardPage({
  searchParams,
}: AdminDashboardPageProps) {
  const params = await searchParams;

  const days = getPeriod(params.days);

  const supabase = await createClient();

  const [
    { count: totalArticles },
    { count: publishedArticles },
    { count: draftArticles },
    analytics,
  ] = await Promise.all([
    supabase
      .from("articles")
      .select("*", {
        count: "exact",
        head: true,
      }),

    supabase
      .from("articles")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("status", "published"),

    supabase
      .from("articles")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("status", "draft"),

    getDashboardAnalytics(days),
  ]);

  const total =
    totalArticles ?? 0;

  const published =
    publishedArticles ?? 0;

  const drafts =
    draftArticles ?? 0;

  const publishedPercentage =
    total > 0
      ? Math.round(
          (published / total) * 100
        )
      : 0;

  const draftPercentage =
    total > 0
      ? Math.round(
          (drafts / total) * 100
        )
      : 0;

  const trendIsPositive =
    analytics.viewsTrend >= 0;

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-8 lg:px-10">
      {/* Header */}
      <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Welcome back! Here&apos;s an overview of your content and
            performance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
            Last {days} days
          </div>

          <Link
            href="/admin/articles/new"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <PenNewSquareIcon
              size={18}
              strokeWidth={1.8}
              aria-hidden="true"
            />

            <span>
              New Article
            </span>
          </Link>
        </div>
      </header>

      {/* Content Summary */}
      <section className="mt-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Content{" "}
          <span className="normal-case font-medium text-slate-400">
            (All time)
          </span>
        </p>

        <div className="grid gap-4 xl:grid-cols-4">
          {/* Total Articles */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <DocumentTextIcon
                size={21}
                strokeWidth={1.8}
                aria-hidden="true"
              />
            </div>

            <p className="mt-5 text-sm font-semibold text-slate-700">
              Total Articles
            </p>

            <p className="mt-1 text-3xl font-bold text-slate-950">
              {total}
            </p>
          </div>

          {/* Published */}
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <FolderWithFilesIcon
                size={21}
                strokeWidth={1.8}
                aria-hidden="true"
              />
            </div>

            <p className="mt-5 text-sm font-semibold text-slate-700">
              Published
            </p>

            <div className="mt-1 flex items-end gap-2">
              <p className="text-3xl font-bold text-slate-950">
                {published}
              </p>

              <p className="pb-1 text-sm font-semibold text-emerald-600">
                {publishedPercentage}% of total
              </p>
            </div>
          </div>

          {/* Drafts */}
          <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-5 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <PenNewSquareIcon
                size={21}
                strokeWidth={1.8}
                aria-hidden="true"
              />
            </div>

            <p className="mt-5 text-sm font-semibold text-slate-700">
              Drafts
            </p>

            <div className="mt-1 flex items-end gap-2">
              <p className="text-3xl font-bold text-slate-950">
                {drafts}
              </p>

              <p className="pb-1 text-sm font-semibold text-amber-600">
                {draftPercentage}% of total
              </p>
            </div>
          </div>

          {/* Total Views */}
          <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-blue-600">
              <EyeIcon
                size={21}
                strokeWidth={1.8}
                aria-hidden="true"
              />
            </div>

            <p className="mt-5 text-sm font-semibold text-slate-700">
              Total Views
            </p>

            <div className="mt-1 flex flex-wrap items-end gap-2">
              <p className="text-3xl font-bold text-slate-950">
                {analytics.totalViews.toLocaleString()}
              </p>

              <p
                className={`flex items-center gap-1 pb-1 text-sm font-semibold ${
                  trendIsPositive
                    ? "text-emerald-600"
                    : "text-red-500"
                }`}
              >
                {analytics.viewsTrend !==
                  0 && (
                  <TrendIcon
                    positive={
                      trendIsPositive
                    }
                  />
                )}

                <span>
                  {Math.abs(
                    analytics.viewsTrend
                  )}
                  %
                </span>
              </p>
            </div>

            <p className="mt-1 text-xs text-slate-400">
              from previous period
            </p>
          </div>
        </div>
      </section>

      {/* Draft Warning */}
      {drafts > 0 && (
        <section className="mt-6">
          <div className="flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-slate-900">
                You have {drafts} draft{" "}
                {drafts === 1
                  ? "article"
                  : "articles"}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Finish and publish your drafts to reach more readers.
              </p>
            </div>

            <Link
              href="/admin/articles"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800"
            >
              <span>
                View Drafts
              </span>

              <AltArrowRightIcon
                size={16}
                strokeWidth={1.8}
                aria-hidden="true"
              />
            </Link>
          </div>
        </section>
      )}

      {/* Views Overview */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ChartSquareIcon
                size={21}
                strokeWidth={1.8}
                className="text-blue-600"
                aria-hidden="true"
              />

              <h2 className="text-xl font-bold text-slate-900">
                Views Overview
              </h2>
            </div>

            <div className="mt-2 flex flex-wrap items-end gap-2">
              <p className="text-3xl font-bold text-slate-950">
                {analytics.totalViews.toLocaleString()}
              </p>

              <p
                className={`flex items-center gap-1 pb-1 text-sm font-semibold ${
                  trendIsPositive
                    ? "text-emerald-600"
                    : "text-red-500"
                }`}
              >
                {analytics.viewsTrend !==
                  0 && (
                  <TrendIcon
                    positive={
                      trendIsPositive
                    }
                  />
                )}

                <span>
                  {Math.abs(
                    analytics.viewsTrend
                  )}
                  %
                </span>
              </p>

              <p className="pb-1 text-xs text-slate-400">
                from previous period
              </p>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              {analytics.uniqueVisitors.toLocaleString()} unique{" "}
              {analytics.uniqueVisitors === 1
                ? "visitor"
                : "visitors"}
            </p>
          </div>

          {/* Period Selector */}
          <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-sm">
            <Link
              href="/admin?days=7"
              className={`rounded-lg px-3 py-2 ${
                days === 7
                  ? "bg-white font-semibold text-slate-900 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              7 days
            </Link>

            <Link
              href="/admin?days=30"
              className={`rounded-lg px-3 py-2 ${
                days === 30
                  ? "bg-white font-semibold text-slate-900 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              30 days
            </Link>

            <Link
              href="/admin?days=90"
              className={`rounded-lg px-3 py-2 ${
                days === 90
                  ? "bg-white font-semibold text-slate-900 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              90 days
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <ViewsChart
            data={
              analytics.dailyViews
            }
          />
        </div>
      </section>

      {/* Bottom Analytics */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Top Performing Articles */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <ChartSquareIcon
                size={19}
                strokeWidth={1.8}
                aria-hidden="true"
              />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Top Performing Articles
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Ranked by views this period
              </p>
            </div>
          </div>

          <div className="mt-6">
            {analytics.topArticles
              .length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-400">
                No article views yet.
              </p>
            ) : (
              <div>
                {/* Table Header */}
                <div className="grid grid-cols-[32px_minmax(0,1fr)_80px_90px] gap-3 border-b border-slate-100 pb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <span>#</span>
                  <span>Article</span>
                  <span className="text-right">
                    Views
                  </span>
                  <span className="text-right">
                    Trend
                  </span>
                </div>

                {/* Article Rows */}
                <div className="divide-y divide-slate-100">
                  {analytics.topArticles.map(
                    (
                      article,
                      index
                    ) => {
                      const articleTrendPositive =
                        article.trend >=
                        0;

                      return (
                        <div
                          key={
                            article.id
                          }
                          className="grid grid-cols-[32px_minmax(0,1fr)_80px_90px] items-center gap-3 py-4"
                        >
                          <span className="text-sm text-slate-400">
                            {index +
                              1}
                          </span>

                          <div className="min-w-0">
                            <Link
                              href={`/articles/${article.slug}`}
                              target="_blank"
                              className="block truncate text-sm font-semibold text-slate-900 transition hover:text-blue-600"
                            >
                              {
                                article.title
                              }
                            </Link>

                            <p className="mt-1 text-xs text-slate-400">
                              Previous:{" "}
                              {article.previousViews.toLocaleString()}{" "}
                              {article.previousViews ===
                              1
                                ? "view"
                                : "views"}
                            </p>
                          </div>

                          <span className="text-right text-sm font-semibold text-slate-700">
                            {article.views.toLocaleString()}
                          </span>

                          <span
                            className={`flex items-center justify-end gap-1 text-right text-sm font-semibold ${
                              article.trend >
                              0
                                ? "text-emerald-600"
                                : article.trend <
                                    0
                                  ? "text-red-500"
                                  : "text-slate-400"
                            }`}
                          >
                            {article.trend !==
                              0 && (
                              <TrendIcon
                                positive={
                                  articleTrendPositive
                                }
                              />
                            )}

                            <span>
                              {article.trend !==
                              0
                                ? `${Math.abs(
                                    article.trend
                                  )}%`
                                : "0%"}
                            </span>
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Visitors by Country */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <EyeIcon
                size={19}
                strokeWidth={1.8}
                aria-hidden="true"
              />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Visitors by Country
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {analytics.uniqueVisitors.toLocaleString()} unique{" "}
                {analytics.uniqueVisitors ===
                1
                  ? "visitor"
                  : "visitors"}{" "}
                this period
              </p>
            </div>
          </div>

          <div className="mt-6">
            {analytics.countries
              .length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-400">
                No country data yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {analytics.countries.map(
                  (country) => (
                    <div
                      key={
                        country.country
                      }
                      className="grid grid-cols-[1fr_auto_auto] items-center gap-4 py-4 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800">
                          {getCountryName(country.country)}
                        </p>

                        {country.country !== "UNKNOWN" && (
                          <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                            {country.country}
                          </p>
                        )}
                      </div>

                      <span className="text-slate-600">
                        {country.visitors.toLocaleString()}
                      </span>

                      <span className="w-14 text-right text-slate-500">
                        {
                          country.percentage
                        }
                        %
                      </span>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
