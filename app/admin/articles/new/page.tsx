"use client";

import {
  ChangeEvent,
  DragEvent,
  FormEvent,
  KeyboardEvent,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import RichTextEditor from "@/components/editor/RichTextEditor";
import { createClient } from "@/lib/supabase/client";

const MAX_COVER_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_COVER_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

type SaveAction = "draft" | "published" | null;

function getImageExtension(file: File) {
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";

  return "jpg";
}

function hasMeaningfulContent(html: string) {
  const text = html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();

  if (text) return true;

  return /<(img|hr|pre|blockquote|ul|ol)\b/i.test(html);
}

export default function NewArticlePage() {
  const coverInputRef = useRef<HTMLInputElement>(null);
  const detailsContentRef = useRef<HTMLElement>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");

  const [authors, setAuthors] = useState<string[]>([]);
  const [editors, setEditors] = useState<string[]>([]);
  const [authorInput, setAuthorInput] = useState("");
  const [editorInput, setEditorInput] = useState("");

  const [coverImage, setCoverImage] = useState("");
  const [coverFileName, setCoverFileName] = useState("");
  const [uploadedCoverPath, setUploadedCoverPath] =
    useState<string | null>(null);

  const [detailsOpen, setDetailsOpen] = useState(true);

  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);

  const [savingAction, setSavingAction] =
    useState<SaveAction>(null);

  const [attemptedAction, setAttemptedAction] =
    useState<SaveAction>(null);

  const [error, setError] = useState("");
  const [imageError, setImageError] = useState("");

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

  function addContributor(
    type: "author" | "editor"
  ) {
    const input =
      type === "author"
        ? authorInput
        : editorInput;

    const name = input.trim();

    if (!name) return;

    const current =
      type === "author"
        ? authors
        : editors;

    const alreadyExists = current.some(
      (person) =>
        person.toLowerCase() ===
        name.toLowerCase()
    );

    if (!alreadyExists) {
      if (type === "author") {
        setAuthors((current) => [
          ...current,
          name,
        ]);
      } else {
        setEditors((current) => [
          ...current,
          name,
        ]);
      }
    }

    if (type === "author") {
      setAuthorInput("");
    } else {
      setEditorInput("");
    }
  }

  function removeContributor(
    type: "author" | "editor",
    name: string
  ) {
    if (type === "author") {
      setAuthors((current) =>
        current.filter(
          (person) => person !== name
        )
      );
    } else {
      setEditors((current) =>
        current.filter(
          (person) => person !== name
        )
      );
    }
  }

  function handleContributorKeyDown(
    event: KeyboardEvent<HTMLInputElement>,
    type: "author" | "editor"
  ) {
    if (
      event.key === "Enter" ||
      event.key === ","
    ) {
      event.preventDefault();
      addContributor(type);
    }
  }

  function getContributorList(
    people: string[],
    pendingValue: string
  ) {
    const pending = pendingValue.trim();

    if (!pending) {
      return people;
    }

    const alreadyExists = people.some(
      (person) =>
        person.toLowerCase() ===
        pending.toLowerCase()
    );

    if (alreadyExists) {
      return people;
    }

    return [...people, pending];
  }

  function handleDetailsToggle() {
    if (detailsOpen) {
      setDetailsOpen(false);
      return;
    }

    setDetailsOpen(true);

    /*
     * The details section is inserted above the editor.
     * If the user is already far down the page, the browser
     * can keep their current scroll position and the newly
     * expanded content can appear above the viewport.
     *
     * Wait until React has rendered the section, then bring
     * its beginning directly underneath the two sticky bars.
     */
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        detailsContentRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    });
  }

  function validateCoverImage(file: File) {
    if (!ALLOWED_COVER_IMAGE_TYPES.includes(file.type)) {
      return "Please choose a JPG, PNG, or WebP image.";
    }

    if (file.size > MAX_COVER_IMAGE_SIZE) {
      return "Cover image must be 5 MB or smaller.";
    }

    return null;
  }

  async function uploadCoverImage(file: File) {
    setImageError("");

    const validationError = validateCoverImage(file);

    if (validationError) {
      setImageError(validationError);
      return;
    }

    setUploadingImage(true);

    try {
      const supabase = createClient();

      const extension = getImageExtension(file);

      const filePath =
        `covers/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } =
        await supabase.storage
          .from("article-covers")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
          });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } =
        supabase.storage
          .from("article-covers")
          .getPublicUrl(filePath);

      if (!publicUrlData.publicUrl) {
        throw new Error(
          "Unable to get the uploaded image URL."
        );
      }

      /*
       * If an image was already uploaded for this
       * unsaved article, remove the old one after
       * the new upload succeeds.
       */
      if (uploadedCoverPath) {
        const { error: removeOldError } =
          await supabase.storage
            .from("article-covers")
            .remove([uploadedCoverPath]);

        if (removeOldError) {
          console.error(
            "Failed to remove previous cover:",
            removeOldError
          );
        }
      }

      setUploadedCoverPath(filePath);
      setCoverFileName(file.name);
      setCoverImage(publicUrlData.publicUrl);
    } catch (error) {
      console.error(
        "Cover image upload error:",
        error
      );

      setImageError(
        error instanceof Error
          ? error.message
          : "Unable to upload cover image."
      );
    } finally {
      setUploadingImage(false);

      if (coverInputRef.current) {
        coverInputRef.current.value = "";
      }
    }
  }

  async function handleCoverInputChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    await uploadCoverImage(file);
  }

  async function handleCoverDrop(
    event: DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();

    setIsDraggingImage(false);

    if (uploadingImage) return;

    const file = event.dataTransfer.files?.[0];

    if (!file) return;

    await uploadCoverImage(file);
  }

  async function handleRemoveCoverImage() {
    setImageError("");

    if (uploadedCoverPath) {
      try {
        const supabase = createClient();

        const { error: removeError } =
          await supabase.storage
            .from("article-covers")
            .remove([uploadedCoverPath]);

        if (removeError) {
          throw removeError;
        }
      } catch (error) {
        console.error(
          "Cover image deletion error:",
          error
        );

        setImageError(
          "The cover was removed from the form, but Storage cleanup failed."
        );
      }
    }

    setCoverImage("");
    setCoverFileName("");
    setUploadedCoverPath(null);

    if (coverInputRef.current) {
      coverInputRef.current.value = "";
    }
  }

  async function createArticle(
    status: "draft" | "published"
  ) {
    setAttemptedAction(status);
    setError("");

    if (uploadingImage) {
      setError(
        "Please wait for the cover image to finish uploading."
      );
      return;
    }

    if (!title.trim()) {
      setError("Please enter an article title.");
      return;
    }

    if (!slug.trim()) {
      setError("Please enter an article slug.");
      return;
    }

    if (!hasMeaningfulContent(content)) {
      setError("Please write some article content.");
      return;
    }

    const resolvedAuthors =
      getContributorList(
        authors,
        authorInput
      );

    const resolvedEditors =
      getContributorList(
        editors,
        editorInput
      );

    if (
      status === "published" &&
      resolvedAuthors.length === 0
    ) {
      setError(
        "Please add at least one author before publishing."
      );
      return;
    }

    setSavingAction(status);

    try {
      const response = await fetch("/api/articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim(),
          excerpt: excerpt.trim() || null,
          content,
          content_format: "html",
          cover_image: coverImage || null,
          authors: resolvedAuthors,
          editors: resolvedEditors,
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
      setSavingAction(null);
    }
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
  }

  const isSaving = savingAction !== null;

  const titleMissing = !title.trim();
  const slugMissing = !slug.trim();
  const authorsMissing =
    authors.length === 0 &&
    !authorInput.trim();
  const contentMissing =
    !hasMeaningfulContent(content);

  const showTitleError =
    attemptedAction !== null &&
    titleMissing;

  const showSlugError =
    attemptedAction !== null &&
    slugMissing;

  const showContentError =
    attemptedAction !== null &&
    contentMissing;

  const showAuthorsError =
    attemptedAction === "published" &&
    authorsMissing;

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <form onSubmit={handleSubmit}>
        {/* Top Header */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-[76px] flex-col gap-4 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
            {/* Left */}
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <Link
                href="/admin/articles"
                className="flex shrink-0 items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-950"
              >
                <span>←</span>
                <span>Articles</span>
              </Link>

              <div className="hidden h-7 w-px bg-slate-200 sm:block" />

              <div
                className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1 transition ${
                  showTitleError
                    ? "bg-red-50 ring-1 ring-inset ring-red-200"
                    : "bg-transparent"
                }`}
              >
                <input
                  type="text"
                  value={title}
                  onChange={(event) =>
                    handleTitleChange(event.target.value)
                  }
                  placeholder="Untitled article"
                  aria-label="Article title"
                  aria-required="true"
                  required
                  className="min-w-0 flex-1 border-none bg-transparent text-xl font-semibold tracking-tight text-slate-900 outline-none placeholder:text-slate-400 sm:text-2xl"
                />

                {showTitleError && (
                  <span className="shrink-0 rounded-full bg-red-100 px-2 py-1 text-[11px] font-semibold text-red-700">
                    Required
                  </span>
                )}
              </div>
            </div>

            {/* Right */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                Draft
              </div>

              <span className="text-sm text-slate-400">
                Not saved yet
              </span>

              <button
                type="button"
                disabled={isSaving || uploadingImage}
                onClick={() => createArticle("draft")}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingAction === "draft"
                  ? "Saving..."
                  : "Save Draft"}
              </button>

              <button
                type="button"
                disabled={isSaving || uploadingImage}
                onClick={() =>
                  createArticle("published")
                }
                className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingAction === "published"
                  ? "Publishing..."
                  : "Publish"}
              </button>
            </div>
          </div>
        </header>

        {/* Main Article Error */}
        {error && (
          <div className="border-b border-red-200 bg-red-50 px-6 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Sticky Article Details Bar */}
        <div className="sticky top-[76px] z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <h2 className="font-semibold text-slate-950">
                Article details
              </h2>

              <p className="text-sm text-slate-400">
                slug · excerpt · credits · cover image
              </p>
            </div>

            <button
              type="button"
              onClick={handleDetailsToggle}
              className="flex items-center gap-2 text-sm font-medium text-indigo-600 transition hover:text-indigo-700"
            >
              {detailsOpen ? "Collapse" : "Expand"}

              <span
                className={`transition-transform ${
                  detailsOpen ? "rotate-180" : ""
                }`}
              >
                ⌄
              </span>
            </button>
          </div>
        </div>

        {/* Article Details Content */}
        {detailsOpen && (
          <section
            ref={detailsContentRef}
            className="scroll-mt-[133px] border-b border-slate-200 bg-white"
          >
            <div className="px-5 py-6">
              {/* Top row: details + cover */}
              <div className="grid items-start gap-8 lg:grid-cols-2">
                {/* Slug + Excerpt */}
                <div className="space-y-6">
                  {/* Slug */}
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label
                        htmlFor="slug"
                        className="text-sm font-semibold text-slate-900"
                      >
                        Slug{" "}
                        <span className="text-red-500">
                          *
                        </span>
                      </label>

                      {showSlugError && (
                        <span className="rounded-full bg-red-100 px-2 py-1 text-[11px] font-semibold text-red-700">
                          Required
                        </span>
                      )}
                    </div>

                    <input
                      id="slug"
                      type="text"
                      value={slug}
                      onChange={(event) =>
                        setSlug(
                          generateSlug(event.target.value)
                        )
                      }
                      placeholder="article-slug"
                      aria-required="true"
                      required
                      className={`w-full rounded-xl border px-4 py-3 font-mono text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                        showSlugError
                          ? "border-red-300 bg-red-50/60 focus:border-red-400 focus:ring-red-50"
                          : "border-slate-200 bg-white focus:border-indigo-400 focus:ring-indigo-50"
                      }`}
                    />

                    <p className="mt-2 text-sm text-slate-400">
                      Public URL:{" "}
                      <span className="font-mono text-slate-600">
                        /articles/{slug || "article-slug"}
                      </span>
                    </p>
                  </div>

                  {/* Excerpt */}
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <label
                          htmlFor="excerpt"
                          className="text-sm font-semibold text-slate-900"
                        >
                          Excerpt
                        </label>

                        <span className="text-xs text-slate-400">
                          Optional
                        </span>
                      </div>

                      <span
                        className={`text-xs ${
                          excerpt.length > 160
                            ? "text-amber-600"
                            : "text-slate-400"
                        }`}
                      >
                        {excerpt.length} / 160 recommended
                      </span>
                    </div>

                    <textarea
                      id="excerpt"
                      value={excerpt}
                      onChange={(event) =>
                        setExcerpt(event.target.value)
                      }
                      placeholder="One or two sentences summarising the article."
                      rows={6}
                      className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                    />

                    <p className="mt-2 text-sm text-slate-400">
                      Shown on the article list and at the
                      top of the article.
                    </p>
                  </div>
                </div>

                {/* Cover Image */}
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <label className="block text-sm font-semibold text-slate-900">
                      Cover image
                    </label>

                    <span className="text-xs text-slate-400">
                      Optional
                    </span>
                  </div>

                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleCoverInputChange}
                    className="hidden"
                  />

                  {!coverImage ? (
                    <div
                      onDragEnter={(event) => {
                        event.preventDefault();
                        setIsDraggingImage(true);
                      }}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setIsDraggingImage(true);
                      }}
                      onDragLeave={(event) => {
                        event.preventDefault();
                        setIsDraggingImage(false);
                      }}
                      onDrop={handleCoverDrop}
                      className={`flex min-h-[225px] flex-col items-center justify-center rounded-xl border border-dashed px-6 py-8 text-center transition ${
                        isDraggingImage
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-slate-300 bg-slate-50/50"
                      }`}
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-xl text-slate-500">
                        ▧
                      </div>

                      <p className="mt-4 font-medium text-slate-900">
                        {uploadingImage
                          ? "Uploading image..."
                          : "Drag an image here"}
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        JPG, PNG or WebP · up to 5 MB
                      </p>

                      <button
                        type="button"
                        disabled={uploadingImage}
                        onClick={() =>
                          coverInputRef.current?.click()
                        }
                        className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {uploadingImage
                          ? "Uploading..."
                          : "Browse files"}
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                      <div className="relative bg-slate-100">
                        <img
                          src={coverImage}
                          alt="Article cover preview"
                          className="h-[225px] w-full object-cover"
                        />

                        {uploadingImage && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <div className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900">
                              Uploading...
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-4 border-t border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-800">
                            {coverFileName ||
                              "Article cover"}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            Uploaded to Supabase Storage
                          </p>
                        </div>

                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            disabled={uploadingImage}
                            onClick={() =>
                              coverInputRef.current?.click()
                            }
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                          >
                            Replace
                          </button>

                          <button
                            type="button"
                            disabled={uploadingImage}
                            onClick={handleRemoveCoverImage}
                            className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {imageError && (
                    <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {imageError}
                    </div>
                  )}

                  <p className="mt-2 text-sm text-slate-400">
                    Used on the article list and at the top
                    of the published article.
                  </p>
                </div>
              </div>

              {/* Article Credits */}
              <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Article credits
                  </h3>

                  <p className="mt-1 text-sm text-slate-400">
                    Add everyone who should be credited
                    for writing or editing this article.
                  </p>
                </div>

                <div className="mt-5 grid gap-6 lg:grid-cols-2">
                  {/* Authors */}
                  <div
                    className={`rounded-xl p-3 transition ${
                      showAuthorsError
                        ? "bg-red-50/70 ring-1 ring-inset ring-red-200"
                        : "bg-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <label
                        htmlFor="author-name"
                        className="text-sm font-semibold text-slate-900"
                      >
                        Authors{" "}
                        <span
                          aria-hidden="true"
                          className="text-red-500"
                        >
                          *
                        </span>
                      </label>

                      {showAuthorsError ? (
                        <span className="rounded-full bg-red-100 px-2 py-1 text-[11px] font-semibold text-red-700">
                          Required to publish
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">
                          Required to publish
                        </span>
                      )}
                    </div>

                    {authors.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {authors.map((author) => (
                          <span
                            key={author}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700"
                          >
                            {author}

                            <button
                              type="button"
                              aria-label={`Remove ${author}`}
                              onClick={() =>
                                removeContributor(
                                  "author",
                                  author
                                )
                              }
                              className="flex h-4 w-4 items-center justify-center rounded-full text-xs text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 flex gap-2">
                      <input
                        id="author-name"
                        type="text"
                        value={authorInput}
                        onChange={(event) =>
                          setAuthorInput(
                            event.target.value
                          )
                        }
                        onKeyDown={(event) =>
                          handleContributorKeyDown(
                            event,
                            "author"
                          )
                        }
                        placeholder="Author name"
                        className={`min-w-0 flex-1 rounded-xl border px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                          showAuthorsError
                            ? "border-red-300 bg-white focus:border-red-400 focus:ring-red-50"
                            : "border-slate-200 bg-white focus:border-indigo-400 focus:ring-indigo-50"
                        }`}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          addContributor("author")
                        }
                        className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        + Add
                      </button>
                    </div>

                    <p className="mt-2 text-xs text-slate-400">
                      Press Enter or comma to add another
                      author.
                    </p>
                  </div>

                  {/* Editors */}
                  <div className="border-t border-slate-200 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                    <div className="flex items-center justify-between gap-3">
                      <label
                        htmlFor="editor-name"
                        className="text-sm font-semibold text-slate-900"
                      >
                        Editors
                      </label>

                      <span className="text-xs text-slate-400">
                        Optional
                      </span>
                    </div>

                    {editors.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {editors.map((editor) => (
                          <span
                            key={editor}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700"
                          >
                            {editor}

                            <button
                              type="button"
                              aria-label={`Remove ${editor}`}
                              onClick={() =>
                                removeContributor(
                                  "editor",
                                  editor
                                )
                              }
                              className="flex h-4 w-4 items-center justify-center rounded-full text-xs text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 flex gap-2">
                      <input
                        id="editor-name"
                        type="text"
                        value={editorInput}
                        onChange={(event) =>
                          setEditorInput(
                            event.target.value
                          )
                        }
                        onKeyDown={(event) =>
                          handleContributorKeyDown(
                            event,
                            "editor"
                          )
                        }
                        placeholder="Editor name"
                        className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          addContributor("editor")
                        }
                        className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        + Add
                      </button>
                    </div>

                    <p className="mt-2 text-xs text-slate-400">
                      Add as many editors as the article
                      needs.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Rich Text Editor */}
        <section className="bg-white px-5 py-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-3 flex items-center justify-between gap-4">
              <label className="text-sm font-semibold text-slate-900">
                Article content{" "}
                <span
                  aria-hidden="true"
                  className="text-red-500"
                >
                  *
                </span>
              </label>

              {showContentError ? (
                <span className="rounded-full bg-red-100 px-2 py-1 text-[11px] font-semibold text-red-700">
                  Required
                </span>
              ) : (
                <span className="text-xs text-slate-400">
                  Required to save or publish
                </span>
              )}
            </div>

            <div
              className={`rounded-xl transition ${
                showContentError
                  ? "ring-2 ring-red-200"
                  : ""
              }`}
            >
              <RichTextEditor
                initialContent=""
                placeholder="Start writing..."
                stickyToolbarOffset={133}
                onChange={setContent}
              />
            </div>
          </div>
        </section>
      </form>
    </div>
  );
}