import { createClient } from "@/lib/supabase/server";

export type DashboardPeriod = 7 | 30 | 90;

export type DailyView = {
  date: string;
  views: number;
};

export type TopArticle = {
  id: string;
  title: string;
  slug: string;
  views: number;
  previousViews: number;
  trend: number;
};

export type CountryVisitor = {
  country: string;
  visitors: number;
  percentage: number;
};

export type DashboardAnalytics = {
  totalViews: number;
  uniqueVisitors: number;
  previousPeriodViews: number;
  viewsTrend: number;
  dailyViews: DailyView[];
  topArticles: TopArticle[];
  countries: CountryVisitor[];
};

function getPeriodDates(days: DashboardPeriod) {
  const now = new Date();

  const currentStart = new Date(now);
  currentStart.setUTCDate(currentStart.getUTCDate() - (days - 1));
  currentStart.setUTCHours(0, 0, 0, 0);

  const previousStart = new Date(currentStart);
  previousStart.setUTCDate(previousStart.getUTCDate() - days);

  return {
    now,
    currentStart,
    previousStart,
  };
}

function calculateTrend(current: number, previous: number) {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }

  return Math.round(((current - previous) / previous) * 100);
}

export async function getDashboardAnalytics(
  days: DashboardPeriod = 30
): Promise<DashboardAnalytics> {
  const supabase = await createClient();

  const { now, currentStart, previousStart } = getPeriodDates(days);

  const currentStartISO = currentStart.toISOString();
  const previousStartISO = previousStart.toISOString();
  const nowISO = now.toISOString();

  const [
    currentVisitsResult,
    previousVisitsResult,
    currentArticleViewsResult,
    previousArticleViewsResult,
  ] = await Promise.all([
    // Current site visits
    supabase
      .from("site_visits")
      .select("visitor_id, country, visited_at")
      .gte("visited_at", currentStartISO)
      .lte("visited_at", nowISO),

    // Previous-period site visits
    supabase
      .from("site_visits")
      .select("id")
      .gte("visited_at", previousStartISO)
      .lt("visited_at", currentStartISO),

    // Current article views
    supabase
      .from("article_views")
      .select(`
        article_id,
        visitor_id,
        visited_at,
        articles (
          id,
          title,
          slug
        )
      `)
      .gte("visited_at", currentStartISO)
      .lte("visited_at", nowISO),

    // Previous-period article views
    supabase
      .from("article_views")
      .select(`
        article_id,
        visited_at
      `)
      .gte("visited_at", previousStartISO)
      .lt("visited_at", currentStartISO),
  ]);

  if (currentVisitsResult.error) {
    console.error(
      "Failed to load current site visits:",
      currentVisitsResult.error
    );
  }

  if (previousVisitsResult.error) {
    console.error(
      "Failed to load previous site visits:",
      previousVisitsResult.error
    );
  }

  if (currentArticleViewsResult.error) {
    console.error(
      "Failed to load current article views:",
      currentArticleViewsResult.error
    );
  }

  if (previousArticleViewsResult.error) {
    console.error(
      "Failed to load previous article views:",
      previousArticleViewsResult.error
    );
  }

  const currentVisits = currentVisitsResult.data ?? [];
  const previousVisits = previousVisitsResult.data ?? [];
  const currentArticleViews = currentArticleViewsResult.data ?? [];
  const previousArticleViews = previousArticleViewsResult.data ?? [];

  // ---------------------------------------------------------
  // TOTAL VIEWS
  // ---------------------------------------------------------

  const totalViews = currentVisits.length;
  const previousPeriodViews = previousVisits.length;

  const viewsTrend = calculateTrend(
    totalViews,
    previousPeriodViews
  );

  // ---------------------------------------------------------
  // UNIQUE VISITORS
  // ---------------------------------------------------------

  const uniqueVisitorIds = new Set(
    currentVisits
      .map((visit) => visit.visitor_id)
      .filter(Boolean)
  );

  const uniqueVisitors = uniqueVisitorIds.size;

  // ---------------------------------------------------------
  // DAILY VIEWS
  // ---------------------------------------------------------

  const dailyViewMap = new Map<string, number>();

  for (let index = 0; index < days; index++) {
    const date = new Date(currentStart);

    date.setUTCDate(currentStart.getUTCDate() + index);

    const dateKey = date.toISOString().slice(0, 10);

    dailyViewMap.set(dateKey, 0);
  }

  for (const visit of currentVisits) {
    if (!visit.visited_at) continue;

    const dateKey = new Date(visit.visited_at)
      .toISOString()
      .slice(0, 10);

    dailyViewMap.set(
      dateKey,
      (dailyViewMap.get(dateKey) ?? 0) + 1
    );
  }

  const dailyViews: DailyView[] = Array.from(
    dailyViewMap.entries()
  ).map(([date, views]) => ({
    date,
    views,
  }));

  // ---------------------------------------------------------
  // PREVIOUS ARTICLE VIEW COUNTS
  // ---------------------------------------------------------

  const previousArticleViewCounts = new Map<string, number>();

  for (const view of previousArticleViews) {
    if (!view.article_id) continue;

    previousArticleViewCounts.set(
      view.article_id,
      (previousArticleViewCounts.get(view.article_id) ?? 0) + 1
    );
  }

  // ---------------------------------------------------------
  // TOP ARTICLES
  // ---------------------------------------------------------

  const articleMap = new Map<string, TopArticle>();

  for (const view of currentArticleViews) {
    const articleRelation = view.articles;

    const article = Array.isArray(articleRelation)
      ? articleRelation[0]
      : articleRelation;

    if (!article) continue;

    const existing = articleMap.get(article.id);

    if (existing) {
      existing.views += 1;
      continue;
    }

    articleMap.set(article.id, {
      id: article.id,
      title: article.title,
      slug: article.slug,
      views: 1,
      previousViews:
        previousArticleViewCounts.get(article.id) ?? 0,
      trend: 0,
    });
  }

  const topArticles = Array.from(articleMap.values())
    .map((article) => ({
      ...article,
      trend: calculateTrend(
        article.views,
        article.previousViews
      ),
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  // ---------------------------------------------------------
  // VISITORS BY COUNTRY
  //
  // Count UNIQUE visitor IDs per country rather than counting
  // every page view as another visitor.
  // ---------------------------------------------------------

  const countryVisitors = new Map<
    string,
    Set<string>
  >();

  for (const visit of currentVisits) {
    if (!visit.visitor_id) continue;

    const country =
      visit.country?.trim().toUpperCase() || "UNKNOWN";

    if (!countryVisitors.has(country)) {
      countryVisitors.set(country, new Set());
    }

    countryVisitors
      .get(country)!
      .add(visit.visitor_id);
  }

  const totalCountryVisitors = Array.from(
    countryVisitors.values()
  ).reduce((total, visitors) => {
    return total + visitors.size;
  }, 0);

  const countries: CountryVisitor[] = Array.from(
    countryVisitors.entries()
  )
    .map(([country, visitors]) => {
      const visitorCount = visitors.size;

      const percentage =
        totalCountryVisitors > 0
          ? Math.round(
              (visitorCount / totalCountryVisitors) * 1000
            ) / 10
          : 0;

      return {
        country,
        visitors: visitorCount,
        percentage,
      };
    })
    .sort((a, b) => b.visitors - a.visitors);

  return {
    totalViews,
    uniqueVisitors,
    previousPeriodViews,
    viewsTrend,
    dailyViews,
    topArticles,
    countries,
  };
}