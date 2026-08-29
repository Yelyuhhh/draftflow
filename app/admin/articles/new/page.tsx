"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function NewArticlePage() {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  function generateSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  function handleTitleChange(value: string) {
    setTitle(value);

    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(value));
    }
  }

  function insertMarkdown(
    before: string,
    after: string = "",
    placeholder: string = "text"
  ) {
    const textarea = document.getElementById(
      "content"
    ) as HTMLTextAreaElement | null;

    if (!textarea) {
      setContent((current) => current + `${before}${placeholder}${after}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const selectedText = content.slice(start, end);
    const text = selectedText || placeholder;

    const newText =
      content.slice(0, start) +
      before +
      text +
      after +
      content.slice(end);

    setContent(newText);

    requestAnimationFrame(() => {
      textarea.focus();

      const selectionStart = start + before.length;
      const selectionEnd =
        selectionStart + text.length;

      textarea.setSelectionRange(
        selectionStart,
        selectionEnd
      );
    });
  }

  function insertLineMarkdown(prefix: string, placeholder: string) {
    const textarea = document.getElementById(
      "content"
    ) as HTMLTextAreaElement | null;

    if (!textarea) {
      setContent((current) => `${current}\n${prefix}${placeholder}`);
      return;
    }

    const start = textarea.selectionStart;

    const before = content.slice(0, start);
    const after = content.slice(start);

    const needsNewLine =
      before.length > 0 && !before.endsWith("\n");

    const insertion =
      `${needsNewLine ? "\n" : ""}${prefix}${placeholder}`;

    const newContent =
      before + insertion + after;

    setContent(newContent);

    requestAnimationFrame(() => {
      textarea.focus();

      const cursorPosition =
        start +
        insertion.length;

      textarea.setSelectionRange(
        cursorPosition,
        cursorPosition
      );
    });
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          slug,
          excerpt: excerpt || null,
          content,
          cover_image: coverImage || null,
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to create article"
        );
      }

      window.location.href = "/admin/articles";
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/articles"
            className="text-sm text-slate-400 transition hover:text-white"
          >
            ← Back to Articles
          </Link>

          <h1 className="mt-4 text-3xl font-bold">
            Create Article
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Create and publish a new article.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Article Details */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="mb-5 text-lg font-semibold">
              Article Details
            </h2>

            <div className="space-y-5">
              {/* Title */}
              <div>
                <label
                  htmlFor="title"
                  className="mb-2 block text-sm font-medium"
                >
                  Title
                </label>

                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) =>
                    handleTitleChange(e.target.value)
                  }
                  placeholder="Enter article title"
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                />
              </div>

              {/* Slug */}
              <div>
                <label
                  htmlFor="slug"
                  className="mb-2 block text-sm font-medium"
                >
                  Slug
                </label>

                <input
                  id="slug"
                  type="text"
                  value={slug}
                  onChange={(e) =>
                    setSlug(e.target.value)
                  }
                  placeholder="article-slug"
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                />

                <p className="mt-2 text-xs text-slate-500">
                  Used in the article URL.
                </p>
              </div>

              {/* Excerpt */}
              <div>
                <label
                  htmlFor="excerpt"
                  className="mb-2 block text-sm font-medium"
                >
                  Excerpt
                </label>

                <textarea
                  id="excerpt"
                  value={excerpt}
                  onChange={(e) =>
                    setExcerpt(e.target.value)
                  }
                  placeholder="Write a short description of the article..."
                  rows={3}
                  className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                />
              </div>

              {/* Content Editor */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="content"
                    className="block text-sm font-medium"
                  >
                    Content
                  </label>

                  <button
                    type="button"
                    onClick={() =>
                      setShowPreview(!showPreview)
                    }
                    className="rounded-md border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
                  >
                    {showPreview
                      ? "Edit Content"
                      : "Preview"}
                  </button>
                </div>

                {/* Toolbar */}
                {!showPreview && (
                  <div className="flex flex-wrap gap-2 rounded-t-lg border border-slate-700 bg-slate-900 px-3 py-2">
                    <button
                      type="button"
                      onClick={() =>
                        insertMarkdown(
                          "**",
                          "**",
                          "Bold text"
                        )
                      }
                      className="rounded-md border border-slate-700 px-3 py-1.5 text-xs font-bold transition hover:bg-slate-800"
                    >
                      B
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        insertMarkdown(
                          "*",
                          "*",
                          "Italic text"
                        )
                      }
                      className="rounded-md border border-slate-700 px-3 py-1.5 text-xs italic transition hover:bg-slate-800"
                    >
                      I
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        insertLineMarkdown(
                          "## ",
                          "Heading"
                        )
                      }
                      className="rounded-md border border-slate-700 px-3 py-1.5 text-xs font-semibold transition hover:bg-slate-800"
                    >
                      H2
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        insertLineMarkdown(
                          "### ",
                          "Heading"
                        )
                      }
                      className="rounded-md border border-slate-700 px-3 py-1.5 text-xs font-semibold transition hover:bg-slate-800"
                    >
                      H3
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        insertLineMarkdown(
                          "> ",
                          "Quote"
                        )
                      }
                      className="rounded-md border border-slate-700 px-3 py-1.5 text-xs transition hover:bg-slate-800"
                    >
                      Quote
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        insertLineMarkdown(
                          "- ",
                          "List item"
                        )
                      }
                      className="rounded-md border border-slate-700 px-3 py-1.5 text-xs transition hover:bg-slate-800"
                    >
                      • List
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        insertLineMarkdown(
                          "1. ",
                          "List item"
                        )
                      }
                      className="rounded-md border border-slate-700 px-3 py-1.5 text-xs transition hover:bg-slate-800"
                    >
                      1. List
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        insertMarkdown(
                          "[",
                          "](https://example.com)",
                          "Link text"
                        )
                      }
                      className="rounded-md border border-slate-700 px-3 py-1.5 text-xs transition hover:bg-slate-800"
                    >
                      Link
                    </button>
                  </div>
                )}

                {/* Editor / Preview */}
                {showPreview ? (
                  <div className="min-h-[360px] rounded-lg border border-slate-700 bg-slate-950 p-6">
                    {content.trim() ? (
                      <article className="prose prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {content}
                        </ReactMarkdown>
                      </article>
                    ) : (
                      <p className="text-sm text-slate-500">
                        Nothing to preview yet.
                      </p>
                    )}
                  </div>
                ) : (
                  <textarea
                    id="content"
                    value={content}
                    onChange={(e) =>
                      setContent(e.target.value)
                    }
                    placeholder={`Write your article here...

You can use the toolbar above to format your content.

Example:

## Introduction

Write your opening paragraph here.

### Why it matters

- First point
- Second point
- Third point

> This is a quote.

You can also add **bold text** and *italic text*.`}
                    rows={18}
                    required
                    className="w-full resize-y rounded-b-lg border border-t-0 border-slate-700 bg-slate-950 px-4 py-4 text-sm leading-7 outline-none transition focus:border-slate-400"
                  />
                )}

                <p className="mt-2 text-xs text-slate-500">
                  Supports Markdown formatting, headings,
                  lists, quotes, links, bold, and italic text.
                </p>
              </div>

              {/* Cover Image */}
              <div>
                <label
                  htmlFor="coverImage"
                  className="mb-2 block text-sm font-medium"
                >
                  Cover Image URL
                </label>

                <input
                  id="coverImage"
                  type="url"
                  value={coverImage}
                  onChange={(e) =>
                    setCoverImage(e.target.value)
                  }
                  placeholder="https://example.com/image.jpg"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                />

                <p className="mt-2 text-xs text-slate-500">
                  Add a public image URL for the article
                  cover.
                </p>

                {coverImage && (
                  <div className="mt-4 overflow-hidden rounded-lg border border-slate-800">
                    <img
                      src={coverImage}
                      alt="Cover preview"
                      className="max-h-72 w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display =
                          "none";
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Publishing */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="mb-5 text-lg font-semibold">
              Publishing
            </h2>

            <div>
              <label
                htmlFor="status"
                className="mb-2 block text-sm font-medium"
              >
                Status
              </label>

              <select
                id="status"
                value={status}
                onChange={(e) =>
                  setStatus(
                    e.target.value as
                      | "draft"
                      | "published"
                  )
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              >
                <option value="draft">
                  Draft
                </option>

                <option value="published">
                  Published
                </option>
              </select>

              <p className="mt-2 text-xs text-slate-500">
                Draft articles remain hidden from the
                public articles page.
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Link
              href="/admin/articles"
              className="rounded-lg border border-slate-700 px-5 py-3 text-sm font-medium transition hover:bg-slate-900"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : "Create Article"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}