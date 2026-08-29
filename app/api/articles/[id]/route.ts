import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET — Fetch a single article
export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Failed to fetch article:", error);

      return NextResponse.json(
        {
          error: "Article not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      article: data,
    });
  } catch (error) {
    console.error("GET article error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch article",
      },
      { status: 500 }
    );
  }
}

// PATCH — Update an article
export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

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
      .update({
        title,
        slug,
        excerpt: excerpt || null,
        content,
        cover_image: cover_image || null,
        status,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("Failed to update article:", error);

      return NextResponse.json(
        {
          error: "Failed to update article",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      article: data,
    });
  } catch (error) {
    console.error("PATCH article error:", error);

    return NextResponse.json(
      {
        error: "Failed to update article",
      },
      { status: 500 }
    );
  }
}

// DELETE — Delete an article
export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const supabase = await createClient();

    const { error } = await supabase
      .from("articles")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Failed to delete article:", error);

      return NextResponse.json(
        {
          error: "Failed to delete article",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("DELETE article error:", error);

    return NextResponse.json(
      {
        error: "Failed to delete article",
      },
      { status: 500 }
    );
  }
}