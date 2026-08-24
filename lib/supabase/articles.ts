import { createClient } from "./client";

export type ArticleStatus = "draft" | "published";

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  status: ArticleStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function getArticles(): Promise<Article[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch articles: ${error.message}`);
  }

  return data ?? [];
}

export async function getPublishedArticles(): Promise<Article[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch published articles: ${error.message}`);
  }

  return data ?? [];
}

export async function getArticleBySlug(
  slug: string
): Promise<Article | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch article: ${error.message}`);
  }

  return data;
}

export async function getArticleById(
  id: string
): Promise<Article | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch article: ${error.message}`);
  }

  return data;
}

export async function createArticle(
  article: Omit<Article, "id" | "created_at" | "updated_at">
): Promise<Article> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("articles")
    .insert(article)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create article: ${error.message}`);
  }

  return data;
}

export async function updateArticle(
  id: string,
  updates: Partial<
    Omit<Article, "id" | "created_at" | "updated_at">
  >
): Promise<Article> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("articles")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update article: ${error.message}`);
  }

  return data;
}

export async function deleteArticle(id: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("articles")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to delete article: ${error.message}`);
  }
}