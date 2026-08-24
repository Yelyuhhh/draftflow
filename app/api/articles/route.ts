import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/articles
 * Returns all published articles.
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (error) {
      console.error("GET /api/articles error:", error);

      return NextResponse.json(
        { error: "Failed to fetch articles" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { articles: data },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/articles unexpected error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/articles
 * Creates a new article for an authenticated user.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      title,
      slug,
      excerpt,
      content,
      cover_image,
      status = "draft",
    } = body;

    // Validate required fields
    if (!title || !slug || !content) {
      return NextResponse.json(
        {
          error: "title, slug, and content are required",
        },
        { status: 400 }
      );
    }

    // Validate article status
    if (status !== "draft" && status !== "published") {
      return NextResponse.json(
        {
          error: "status must be either draft or published",
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify that the requester is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // Create the article
    const { data, error } = await supabase
      .from("articles")
      .insert({
        title,
        slug,
        excerpt: excerpt ?? null,
        content,
        cover_image: cover_image ?? null,
        status,
        published_at:
          status === "published"
            ? new Date().toISOString()
            : null,
      })
      .select()
      .single();

    if (error) {
      console.error("POST /api/articles error:", error);

      return NextResponse.json(
        {
          error: "Failed to create article",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        article: data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST /api/articles unexpected error:",
      error
    );

    return NextResponse.json(
      {
        error: "Invalid request body",
      },
      { status: 400 }
    );
  }
}