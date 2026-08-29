"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  status: "draft" | "published";
};

type EditorAction =
  | "bold"
  | "italic"
  | "h2"
  | "h3"
  | "quote"
  | "bullet"
  | "number"
  | "link";

export default function EditArticlePage() {
  const params = useParams();
  const id = params.id as string;

  const contentRef = useRef<HTMLTextAreaElement>(null);

  const [article, setArticle] = useState<Article | null>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [status, setStatus] =
    useState<"draft" | "published">("draft");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadArticle() {
      try {
        const response = await fetch(`/api/articles/${id}`, {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Failed to load article"
          );
        }

        if (cancelled) return;

        const loadedArticle = data.article as Article;

        setArticle(loadedArticle);
        setTitle(loadedArticle.title);
        setSlug(loadedArticle.slug);
        setExcerpt(loadedArticle.excerpt || "");
        setContent(loadedArticle.content);
        setCoverImage(loadedArticle.cover_image || "");
        setStatus(loadedArticle.status);
      } catch (error) {
        if (cancelled) return;

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load article"
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadArticle();

    return () => {
      cancelled = true;
    };
  }, [id]);

  function generateSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  function handleTitleChange(value: string) {
    const previousGeneratedSlug = generateSlug(title);

    setTitle(value);

    if (!slug || slug === previousGeneratedSlug) {
      setSlug(generateSlug(value));
    }
  }

  function insertMarkdown(action: EditorAction) {
    const textarea = contentRef.current;

    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const selectedText = content.slice(start, end);

    let replacement = "";
    let cursorStart = start;
    let cursorEnd = start;

    switch (action) {
      case "bold":
        replacement = selectedText
          ? `**${selectedText}**`
          : "**bold text**";

        cursorStart = start + 2;
        cursorEnd = start + 2 + (
          selectedText ? selectedText.length : 9
        );
        break;

      case "italic":
        replacement = selectedText
          ? `*${selectedText}*`
          : "*italic text*";

        cursorStart = start + 1;
        cursorEnd = start + 1 + (
          selectedText ? selectedText.length : 11
        );
        break;

      case "h2":
        replacement = selectedText
          ? `## ${selectedText}`
          : "## Heading";

        cursorStart = start + 3;
        cursorEnd = start + 3 + (
          selectedText ? selectedText.length : 7
        );
        break;

      case "h3":
        replacement = selectedText
          ? `### ${selectedText}`
          : "### Heading";

        cursorStart = start + 4;
        cursorEnd = start + 4 + (
          selectedText ? selectedText.length : 7
        );
        break;

      case "quote":
        replacement = selectedText
          ? selectedText
              .split("\n")
              .map((line) => `> ${line}`)
              .join("\n")
          : "> Quote";

        cursorStart = start;
        cursorEnd =
          start + replacement.length;
        break;

      case "bullet":
        replacement = selectedText
          ? selectedText
              .split("\n")
              .map((line) => `- ${line}`)
              .join("\n")
          : "- List item";

        cursorStart = start;
        cursorEnd =
          start + replacement.length;
        break;

      case "number":
        replacement = selectedText
          ? selectedText
              .split("\n")
              .map((line, index) => `${index + 1}. ${line}`)
              .join("\n")
          : "1. List item";

        cursorStart = start;
        cursorEnd =
          start + replacement.length;
        break;

      case "link":
        replacement = selectedText
          ? `[${selectedText}](https://example.com)`
          : "[Link text](https://example.com)";

        cursorStart = start;
        cursorEnd =
          start + replacement.length;
        break;

      default:
        return;
    }

    const newContent =
      content.slice(0, start) +
      replacement +
      content.slice(end);

    setContent(newContent);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(
        cursorStart,
        cursorEnd
      );
    });
  }

  function renderInlineMarkdown(text: string) {
    const parts = text.split(
      /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*)/g
    );

    return parts.map((part, index) => {
      if (
        part.startsWith("[") &&
        part.includes("](") &&
        part.endsWith(")")
      ) {
        const match = part.match(
          /^\[([^\]]+)\]\(([^)]+)\)$/
        );

        if (match) {
          return (
            <a
              key={index}
              href={match[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline underline-offset-2 hover:text-blue-300"
            >
              {match[1]}
            </a>
          );
        }
      }

      if (
        part.startsWith("**") &&
        part.endsWith("**")
      ) {
        return (
          <strong key={index}>
            {part.slice(2, -2)}
          </strong>
        );
      }

      if (
        part.startsWith("*") &&
        part.endsWith("*")
      ) {
        return (
          <em key={index}>
            {part.slice(1, -1)}
          </em>
        );
      }

      return (
        <span key={index}>
          {part}
        </span>
      );
    });
  }

  function renderMarkdown(markdown: string) {
    const lines = markdown.split("\n");
    const elements: React.ReactNode[] = [];

    let index = 0;

    while (index < lines.length) {
      const line = lines[index];

      if (!line.trim()) {
        elements.push(
          <div
            key={`space-${index}`}
            className="h-4"
          />
        );

        index++;
        continue;
      }

      if (line.startsWith("### ")) {
        elements.push(
          <h3
            key={index}
            className="mt-6 text-xl font-bold text-white"
          >
            {renderInlineMarkdown(line.slice(4))}
          </h3>
        );

        index++;
        continue;
      }

      if (line.startsWith("## ")) {
        elements.push(
          <h2
            key={index}
            className="mt-8 text-2xl font-bold text-white"
          >
            {renderInlineMarkdown(line.slice(3))}
          </h2>
        );

        index++;
        continue;
      }

      if (line.startsWith("# ")) {
        elements.push(
          <h1
            key={index}
            className="mt-8 text-3xl font-bold text-white"
          >
            {renderInlineMarkdown(line.slice(2))}
          </h1>
        );

        index++;
        continue;
      }

      if (line.startsWith("> ")) {
        elements.push(
          <blockquote
            key={index}
            className="my-4 border-l-4 border-slate-600 pl-4 italic text-slate-400"
          >
            {renderInlineMarkdown(line.slice(2))}
          </blockquote>
        );

        index++;
        continue;
      }

      if (
        line.startsWith("- ") ||
        line.startsWith("* ")
      ) {
        const listItems: React.ReactNode[] = [];

        while (
          index < lines.length &&
          (lines[index].startsWith("- ") ||
            lines[index].startsWith("* "))
        ) {
          listItems.push(
            <li key={index}>
              {renderInlineMarkdown(
                lines[index].slice(2)
              )}
            </li>
          );

          index++;
        }

        elements.push(
          <ul
            key={`ul-${index}`}
            className="my-4 list-disc space-y-2 pl-6 text-slate-300"
          >
            {listItems}
          </ul>
        );

        continue;
      }

      if (/^\d+\.\s/.test(line)) {
        const listItems: React.ReactNode[] = [];

        while (
          index < lines.length &&
          /^\d+\.\s/.test(lines[index])
        ) {
          const itemText =
            lines[index].replace(
              /^\d+\.\s/,
              ""
            );

          listItems.push(
            <li key={index}>
              {renderInlineMarkdown(itemText)}
            </li>
          );

          index++;
        }

        elements.push(
          <ol
            key={`ol-${index}`}
            className="my-4 list-decimal space-y-2 pl-6 text-slate-300"
          >
            {listItems}
          </ol>
        );

        continue;
      }

      const paragraphLines = [line];

      index++;

      while (
        index < lines.length &&
        lines[index].trim() &&
        !lines[index].startsWith("# ") &&
        !lines[index].startsWith("## ") &&
        !lines[index].startsWith("### ") &&
        !lines[index].startsWith("> ") &&
        !lines[index].startsWith("- ") &&
        !lines[index].startsWith("* ") &&
        !/^\d+\.\s/.test(lines[index])
      ) {
        paragraphLines.push(lines[index]);
        index++;
      }

      elements.push(
        <p
          key={`p-${index}`}
          className="my-4 leading-7 text-slate-300"
        >
          {paragraphLines.map(
            (paragraphLine, lineIndex) => (
              <span key={lineIndex}>
                {lineIndex > 0 && <br />}
                {renderInlineMarkdown(
                  paragraphLine
                )}
              </span>
            )
          )}
        </p>
      );
    }

    return elements;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        `/api/articles/${id}`,
        {
          method: "PATCH",
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
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to update article"
        );
      }

      window.location.href =
        "/admin/articles";
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

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <p className="text-sm text-slate-400">
            Loading article...
          </p>
        </div>
      </main>
    );
  }

  if (!article && error) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <div className="rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            {error}
          </div>

          <Link
            href="/admin/articles"
            className="mt-5 inline-flex rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium transition hover:bg-slate-900"
          >
            ← Back to Articles
          </Link>
        </div>
      </main>
    );
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
            Edit Article
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Update and manage your article.
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
                    handleTitleChange(
                      e.target.value
                    )
                  }
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
                  rows={3}
                  className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                />
              </div>

              {/* Content */}
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
                      setPreviewMode(
                        !previewMode
                      )
                    }
                    className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
                  >
                    {previewMode
                      ? "Edit Content"
                      : "Preview"}
                  </button>
                </div>

                <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
                  {!previewMode ? (
                    <>
                      {/* Toolbar */}
                      <div className="flex flex-wrap gap-2 border-b border-slate-800 p-2">
                        <button
                          type="button"
                          onClick={() =>
                            insertMarkdown(
                              "bold"
                            )
                          }
                          className="rounded-md border border-slate-700 px-3 py-2 text-sm font-bold transition hover:bg-slate-800"
                        >
                          B
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            insertMarkdown(
                              "italic"
                            )
                          }
                          className="rounded-md border border-slate-700 px-3 py-2 text-sm italic transition hover:bg-slate-800"
                        >
                          I
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            insertMarkdown(
                              "h2"
                            )
                          }
                          className="rounded-md border border-slate-700 px-3 py-2 text-sm font-semibold transition hover:bg-slate-800"
                        >
                          H2
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            insertMarkdown(
                              "h3"
                            )
                          }
                          className="rounded-md border border-slate-700 px-3 py-2 text-sm font-semibold transition hover:bg-slate-800"
                        >
                          H3
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            insertMarkdown(
                              "quote"
                            )
                          }
                          className="rounded-md border border-slate-700 px-3 py-2 text-sm transition hover:bg-slate-800"
                        >
                          Quote
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            insertMarkdown(
                              "bullet"
                            )
                          }
                          className="rounded-md border border-slate-700 px-3 py-2 text-sm transition hover:bg-slate-800"
                        >
                          • List
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            insertMarkdown(
                              "number"
                            )
                          }
                          className="rounded-md border border-slate-700 px-3 py-2 text-sm transition hover:bg-slate-800"
                        >
                          1. List
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            insertMarkdown(
                              "link"
                            )
                          }
                          className="rounded-md border border-slate-700 px-3 py-2 text-sm transition hover:bg-slate-800"
                        >
                          Link
                        </button>
                      </div>

                      {/* Editor */}
                      <textarea
                        ref={contentRef}
                        id="content"
                        value={content}
                        onChange={(e) =>
                          setContent(
                            e.target.value
                          )
                        }
                        placeholder="Write your article content..."
                        rows={18}
                        required
                        className="w-full resize-y bg-slate-950 px-4 py-4 text-sm leading-7 outline-none"
                      />
                    </>
                  ) : (
                    /* Preview */
                    <div className="min-h-[460px] px-6 py-6">
                      {content.trim() ? (
                        renderMarkdown(
                          content
                        )
                      ) : (
                        <p className="text-sm text-slate-500">
                          Nothing to preview yet.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Supports Markdown formatting,
                  headings, lists, quotes, links,
                  bold, and italic text.
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
                    setCoverImage(
                      e.target.value
                    )
                  }
                  placeholder="https://example.com/image.jpg"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                />

                {coverImage && (
                  <div className="mt-4 overflow-hidden rounded-lg border border-slate-800">
                    <img
                      src={coverImage}
                      alt="Cover preview"
                      className="max-h-80 w-full object-cover"
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
                : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}