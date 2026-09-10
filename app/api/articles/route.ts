import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

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

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("articles")
      .select(
        `
          id,
          title,
          slug,
          excerpt,
          content,
          content_format,
          cover_image,
          authors,
          editors,
          status,
          published_at,
          created_at,
          updated_at
        `
      )
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Failed to fetch articles:",
        error
      );

      return NextResponse.json(
        {
          error: "Failed to load articles",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      articles: data ?? [],
    });
  } catch (error) {
    console.error(
      "GET articles error:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to load articles",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  request: Request
) {
  try {
    const body = await request.json();

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

    const cleanAuthors =
      cleanNames(authors);

    const cleanEditors =
      cleanNames(editors);

    const resolvedContentFormat:
      ContentFormat =
      content_format === undefined
        ? "markdown"
        : content_format;

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
          error: "Invalid article status",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !isValidContentFormat(
        resolvedContentFormat
      )
    ) {
      return NextResponse.json(
        {
          error: "Invalid content format",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Drafts may be saved without authors.
     * Published articles require at least one.
     */
    if (
      status === "published" &&
      cleanAuthors.length === 0
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

    const supabase =
      await createClient();

    const { data, error } =
      await supabase
        .from("articles")
        .insert({
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
            cleanAuthors,

          editors:
            cleanEditors,

          status,

          published_at:
            status === "published"
              ? new Date().toISOString()
              : null,
        })
        .select("*")
        .single();

    if (error) {
      console.error(
        "Failed to create article:",
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
            "Failed to create article",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        article: data,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST article error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to create article",
      },
      {
        status: 500,
      }
    );
  }
}