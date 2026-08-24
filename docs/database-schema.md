# Draftflow Database Schema

## Overview

Draftflow uses Supabase PostgreSQL as its database.

The database supports:

- Article management
- Draft and published articles
- Featured article delivery
- Website visit analytics
- Article view analytics
- Geographic visitor analytics
- Anonymous visitor tracking
- Admin authentication

---

## Tables

### 1. articles

Stores all articles created through the CMS.

| Column | Type | Description |
|---|---|---|
| id | uuid | Unique article identifier |
| title | text | Article title |
| slug | text | Unique URL-friendly identifier |
| excerpt | text | Short article summary |
| content | text | Main article content |
| cover_image | text | Article cover image or storage path |
| status | text | `draft` or `published` |
| published_at | timestamptz | When the article was published |
| created_at | timestamptz | When the article was created |
| updated_at | timestamptz | When the article was last updated |

### Article Rules

- `id` is automatically generated as a UUID.
- `title` is required.
- `slug` is required and must be unique.
- `content` is required.
- `status` can only be `draft` or `published`.
- `published_at` remains `NULL` while an article is a draft.
- `published_at` is set when an article is published.
- `created_at` is automatically generated.
- `updated_at` is automatically updated whenever the article changes.

---

### 2. article_views

Stores individual article view events.

| Column | Type | Description |
|---|---|---|
| id | uuid | Unique view identifier |
| article_id | uuid | Article that was viewed |
| visitor_id | text | Anonymous visitor identifier |
| country | text | Visitor country |
| visited_at | timestamptz | When the article was viewed |

### Article View Rules

- Each view creates a new record.
- `article_id` references `articles.id`.
- `visitor_id` is an anonymous identifier and does not contain personally identifiable information.
- `country` stores the visitor's country.
- `visited_at` records when the view occurred.

This allows Draftflow to calculate:

- Total article views
- Views per article
- Unique visitors per article
- Views over time
- Views by country
- Most viewed articles

---

### 3. site_visits

Stores general website visit events.

| Column | Type | Description |
|---|---|---|
| id | uuid | Unique visit identifier |
| visitor_id | text | Anonymous visitor identifier |
| page_path | text | Page visited |
| country | text | Visitor country |
| visited_at | timestamptz | When the page was visited |

### Site Visit Rules

- Each tracked page visit creates a new record.
- `visitor_id` identifies an anonymous visitor.
- `page_path` records the page that was visited.
- `country` stores the visitor's country.
- `visited_at` records when the visit occurred.

This allows Draftflow to calculate:

- Total website visits
- Unique visitors
- Visits over time
- Visits by country
- Most visited pages
- Traffic to individual pages

---

## Authentication

Admin authentication is handled by **Supabase Auth**.

Draftflow does not store admin passwords in its own database tables.

The CMS will initially have one authorized admin account.

The authentication flow will be:

```text
Admin
  ↓
Draftflow Login
  ↓
Supabase Auth
  ↓
Authenticated Session
  ↓
Admin Dashboard