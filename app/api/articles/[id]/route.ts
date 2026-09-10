import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type ContentFormat = "markdown" | "html";

function isValidContentFormat(
  value: unknown
): value is ContentFormat {
  return value === "markdown" || value === "html";
}

function cleanNames(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  const cleaned = value
    .filter(
      (name): name is string =>
        typeof name === "string"
    )
    .map((name) => name.trim())
    .filter(Boolean);

  return [...new Set(cleaned)];
}

// GET — Fetch a single article
export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const supabase =
      await createClient();

    const { data, error } =
      await supabase
        .from("articles")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !data) {
      console.error(
        "Failed to fetch article:",
        error
      );

      return NextResponse.json(
        {
          error: "Article not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      article: data,
    });
  } catch (error) {
    console.error(
      "GET article error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to fetch article",
      },
      {
        status: 500,
      }
    );
  }
}

// PATCH — Update an article
export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } =
      await context.params;

    const body =
      await request.json();

    const {
      title,
      slug,
      excerpt,
      content,
      cover_image,
      status,
      content_format,
      authors,
      editors,
    } = body;

    const cleanTitle =
      typeof title === "string"
        ? title.trim()
        : "";

    const cleanSlug =
      typeof slug === "string"
        ? slug.trim()
        : "";

    const cleanContent =
      typeof content === "string"
        ? content.trim()
        : "";

    const cleanExcerpt =
      typeof excerpt === "string"
        ? excerpt.trim()
        : "";

    const cleanCoverImage =
      typeof cover_image === "string"
        ? cover_image.trim()
        : "";

    if (
      !cleanTitle ||
      !cleanSlug ||
      !cleanContent
    ) {
      return NextResponse.json(
        {
          error:
            "Title, slug, and content are required",
        },
        {
          status: 400,
        }
      );
    }

    if (
      status !== "draft" &&
      status !== "published"
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid article status",
        },
        {
          status: 400,
        }
      );
    }

    const supabase =
      await createClient();

    /*
     * Load the current article first.
     *
     * This lets older Markdown articles
     * keep their existing content format
     * if an older client does not send
     * content_format.
     */
    const {
      data: existingArticle,
      error: existingError,
    } = await supabase
      .from("articles")
      .select(
        `
          id,
          content_format,
          authors,
          editors,
          status,
          published_at
        `
      )
      .eq("id", id)
      .single();

    if (
      existingError ||
      !existingArticle
    ) {
      console.error(
        "Failed to load existing article:",
        existingError
      );

      return NextResponse.json(
        {
          error: "Article not found",
        },
        {
          status: 404,
        }
      );
    }

    const resolvedContentFormat =
      content_format === undefined
        ? existingArticle.content_format ??
          "markdown"
        : content_format;

    if (
      !isValidContentFormat(
        resolvedContentFormat
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid content format",
        },
        {
          status: 400,
        }
      );
    }

    const resolvedAuthors =
      authors === undefined
        ? cleanNames(
            existingArticle.authors
          )
        : cleanNames(authors);

    const resolvedEditors =
      editors === undefined
        ? cleanNames(
            existingArticle.editors
          )
        : cleanNames(editors);

    /*
     * Drafts can exist without authors.
     * Published articles need at least one.
     */
    if (
      status === "published" &&
      resolvedAuthors.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "At least one author is required before publishing.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Preserve the original publish date
     * if the article is already published.
     *
     * If a draft is being published for
     * the first time, use the current time.
     *
     * If it is changed back to a draft,
     * clear published_at.
     */
    let publishedAt: string | null =
      null;

    if (status === "published") {
      publishedAt =
        existingArticle.published_at ??
        new Date().toISOString();
    }

    const { data, error } =
      await supabase
        .from("articles")
        .update({
          title: cleanTitle,
          slug: cleanSlug,

          excerpt:
            cleanExcerpt || null,

          content:
            cleanContent,

          content_format:
            resolvedContentFormat,

          cover_image:
            cleanCoverImage || null,

          authors:
            resolvedAuthors,

          editors:
            resolvedEditors,

          status,

          published_at:
            publishedAt,
        })
        .eq("id", id)
        .select("*")
        .single();

    if (error) {
      console.error(
        "Failed to update article:",
        error
      );

      if (error.code === "23505") {
        return NextResponse.json(
          {
            error:
              "An article with this slug already exists.",
          },
          {
            status: 409,
          }
        );
      }

      return NextResponse.json(
        {
          error:
            "Failed to update article",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      article: data,
    });
  } catch (error) {
    console.error(
      "PATCH article error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to update article",
      },
      {
        status: 500,
      }
    );
  }
}

// DELETE — Delete an article
export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } =
      await context.params;

    const supabase =
      await createClient();

    const { error } =
      await supabase
        .from("articles")
        .delete()
        .eq("id", id);

    if (error) {
      console.error(
        "Failed to delete article:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Failed to delete article",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "DELETE article error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to delete article",
      },
      {
        status: 500,
      }
    );
  }
}