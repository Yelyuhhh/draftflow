-- ============================================
-- Draftflow Initial Database Schema
-- ============================================

-- ============================================
-- 1. ARTICLES
-- ============================================

create table public.articles (
  id uuid primary key default gen_random_uuid(),

  title text not null,

  slug text not null unique,

  excerpt text,

  content text not null,

  cover_image text,

  status text not null default 'draft'
    check (status in ('draft', 'published')),

  published_at timestamptz,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);


-- ============================================
-- 2. ARTICLE VIEWS
-- ============================================

create table public.article_views (
  id uuid primary key default gen_random_uuid(),

  article_id uuid not null
    references public.articles(id)
    on delete cascade,

  visitor_id text not null,

  country text,

  visited_at timestamptz not null default now()
);


-- ============================================
-- 3. SITE VISITS
-- ============================================

create table public.site_visits (
  id uuid primary key default gen_random_uuid(),

  visitor_id text not null,

  page_path text not null,

  country text,

  visited_at timestamptz not null default now()
);


-- ============================================
-- 4. INDEXES
-- ============================================

create index articles_status_idx
  on public.articles(status);

create index articles_published_at_idx
  on public.articles(published_at desc);

create index article_views_article_id_idx
  on public.article_views(article_id);

create index article_views_visited_at_idx
  on public.article_views(visited_at desc);

create index site_visits_visited_at_idx
  on public.site_visits(visited_at desc);

create index site_visits_page_path_idx
  on public.site_visits(page_path);


-- ============================================
-- 5. ROW LEVEL SECURITY
-- ============================================

alter table public.articles enable row level security;

alter table public.article_views enable row level security;

alter table public.site_visits enable row level security;


-- ============================================
-- 6. PUBLIC ARTICLE ACCESS
-- ============================================

create policy "Public can view published articles"
on public.articles
for select
to anon, authenticated
using (status = 'published');


-- ============================================
-- 7. ADMIN ARTICLE ACCESS
-- ============================================

create policy "Authenticated users can manage articles"
on public.articles
for all
to authenticated
using (true)
with check (true);


-- ============================================
-- 8. PUBLIC ARTICLE VIEW TRACKING
-- ============================================

create policy "Public can record article views"
on public.article_views
for insert
to anon, authenticated
with check (true);


-- ============================================
-- 9. PUBLIC SITE VISIT TRACKING
-- ============================================

create policy "Public can record site visits"
on public.site_visits
for insert
to anon, authenticated
with check (true);


-- ============================================
-- END OF INITIAL SCHEMA
-- ============================================