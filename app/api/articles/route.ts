import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("articles")
      .select(
        "id, title, slug, excerpt, content, cover_image, status, published_at, created_at, updated_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch articles:", error);

      return NextResponse.json(
        {
          error: "Failed to load articles",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      articles: data ?? [],
    });
  } catch (error) {
    console.error("GET articles error:", error);

    return NextResponse.json(
      {
        error: "Failed to load articles",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      title,
      slug,
      excerpt,
      content,
      cover_image,
      status,
    } = body;

    if (!title || !slug || !content) {
      return NextResponse.json(
        {
          error: "Title, slug, and content are required",
        },
        { status: 400 }
      );
    }

    if (
      status !== "draft" &&
      status !== "published"
    ) {
      return NextResponse.json(
        {
          error: "Invalid article status",
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("articles")
      .insert({
        title,
        slug,
        excerpt: excerpt || null,
        content,
        cover_image: cover_image || null,
        status,
        published_at:
          status === "published"
            ? new Date().toISOString()
            : null,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Failed to create article:", error);

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
    console.error("POST article error:", error);

    return NextResponse.json(
      {
        error: "Failed to create article",
      },
      { status: 500 }
    );
  }
}