"use client";

import {
  ChangeEvent,
  DragEvent,
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import {
  AddCircleIcon,
  AltArrowDownIcon,
  AltArrowLeftIcon,
  CloseCircleIcon,
  DisketteIcon,
  GalleryAddIcon,
  RefreshIcon,
  TrashBin2Icon,
} from "@solar-icons/react/linear";

import RichTextEditor from "@/components/editor/RichTextEditor";
import { createClient } from "@/lib/supabase/client";

const MAX_COVER_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_COVER_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

type ContentFormat = "markdown" | "html";
type ArticleStatus = "draft" | "published";

type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  content_format: ContentFormat | null;
  cover_image: string | null;
  authors: string[] | null;
  editors: string[] | null;
  status: ArticleStatus;
};

function getImageExtension(file: File) {
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";

  return "jpg";
}

function hasMeaningfulHtmlContent(html: string) {
  const text = html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();

  if (text) return true;

  return /<(img|hr|pre|blockquote|ul|ol)\b/i.test(html);
}

function hasMeaningfulContent(
  content: string,
  contentFormat: ContentFormat
) {
  if (contentFormat === "html") {
    return hasMeaningfulHtmlContent(content);
  }

  return content.trim().length > 0;
}

export default function EditArticlePage() {
  const params = useParams();
  const id = params.id as string;

  const coverInputRef = useRef<HTMLInputElement>(null);
  const detailsContentRef = useRef<HTMLElement>(null);

  const [article, setArticle] = useState<Article | null>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [contentFormat, setContentFormat] =
    useState<ContentFormat>("markdown");
  const [status, setStatus] =
    useState<ArticleStatus>("draft");

  const [authors, setAuthors] = useState<string[]>([]);
  const [editors, setEditors] = useState<string[]>([]);
  const [authorInput, setAuthorInput] = useState("");
  const [editorInput, setEditorInput] = useState("");

  const [coverImage, setCoverImage] = useState("");
  const [coverFileName, setCoverFileName] = useState("");
  const [uploadedCoverPath, setUploadedCoverPath] =
    useState<string | null>(null);

  const [detailsOpen, setDetailsOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [attemptedSave, setAttemptedSave] = useState(false);

  const [error, setError] = useState("");
  const [imageError, setImageError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadArticle() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/articles/${id}`, {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load article");
        }

        if (cancelled) return;

        const loadedArticle = data.article as Article;
        const resolvedFormat: ContentFormat =
          loadedArticle.content_format === "html"
            ? "html"
            : "markdown";

        setArticle(loadedArticle);
        setTitle(loadedArticle.title || "");
        setSlug(loadedArticle.slug || "");
        setExcerpt(loadedArticle.excerpt || "");
        setContent(loadedArticle.content || "");
        setContentFormat(resolvedFormat);
        setCoverImage(loadedArticle.cover_image || "");
        setCoverFileName("");
        setStatus(loadedArticle.status);
        setAuthors(
          Array.isArray(loadedArticle.authors)
            ? loadedArticle.authors
            : []
        );
        setEditors(
          Array.isArray(loadedArticle.editors)
            ? loadedArticle.editors
            : []
        );
      } catch (loadError) {
        if (cancelled) return;

        setError(
          loadError instanceof Error
            ? loadError.message
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

  function addContributor(type: "author" | "editor") {
    const input = type === "author" ? authorInput : editorInput;
    const name = input.trim();

    if (!name) return;

    const current = type === "author" ? authors : editors;
    const alreadyExists = current.some(
      (person) => person.toLowerCase() === name.toLowerCase()
    );

    if (!alreadyExists) {
      if (type === "author") {
        setAuthors((currentAuthors) => [...currentAuthors, name]);
      } else {
        setEditors((currentEditors) => [...currentEditors, name]);
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
        current.filter((person) => person !== name)
      );
    } else {
      setEditors((current) =>
        current.filter((person) => person !== name)
      );
    }
  }

  function handleContributorKeyDown(
    event: KeyboardEvent<HTMLInputElement>,
    type: "author" | "editor"
  ) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addContributor(type);
    }
  }

  function getContributorList(
    people: string[],
    pendingValue: string
  ) {
    const pending = pendingValue.trim();

    if (!pending) return people;

    const alreadyExists = people.some(
      (person) => person.toLowerCase() === pending.toLowerCase()
    );

    if (alreadyExists) return people;

    return [...people, pending];
  }

  function handleDetailsToggle() {
    if (detailsOpen) {
      setDetailsOpen(false);
      return;
    }

    setDetailsOpen(true);

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
      const filePath = `covers/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("article-covers")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from("article-covers")
        .getPublicUrl(filePath);

      if (!publicUrlData.publicUrl) {
        throw new Error("Unable to get the uploaded image URL.");
      }

      if (uploadedCoverPath) {
        const { error: removeOldError } = await supabase.storage
          .from("article-covers")
          .remove([uploadedCoverPath]);

        if (removeOldError) {
          console.error(
            "Failed to remove previous new cover:",
            removeOldError
          );
        }
      }

      setUploadedCoverPath(filePath);
      setCoverFileName(file.name);
      setCoverImage(publicUrlData.publicUrl);
    } catch (uploadError) {
      console.error("Cover image upload error:", uploadError);

      setImageError(
        uploadError instanceof Error
          ? uploadError.message
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

  async function handleCoverDrop(event: DragEvent<HTMLDivElement>) {
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

        const { error: removeError } = await supabase.storage
          .from("article-covers")
          .remove([uploadedCoverPath]);

        if (removeError) {
          throw removeError;
        }
      } catch (removeError) {
        console.error("Cover image deletion error:", removeError);

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setAttemptedSave(true);
    setError("");

    if (uploadingImage) {
      setError("Please wait for the cover image to finish uploading.");
      return;
    }

    const resolvedAuthors = getContributorList(authors, authorInput);
    const resolvedEditors = getContributorList(editors, editorInput);

    if (!title.trim()) {
      setError("Please enter an article title.");
      return;
    }

    if (!slug.trim()) {
      setError("Please enter an article slug.");
      return;
    }

    if (!hasMeaningfulContent(content, contentFormat)) {
      setError("Please write some article content.");
      return;
    }

    if (status === "published" && resolvedAuthors.length === 0) {
      setError(
        "Please add at least one author before saving a published article."
      );
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/articles/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim(),
          excerpt: excerpt.trim() || null,
          content,
          content_format: contentFormat,
          cover_image: coverImage || null,
          authors: resolvedAuthors,
          editors: resolvedEditors,
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update article");
      }

      window.location.href = "/admin/articles";
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Something went wrong"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white px-6 py-10 text-slate-950">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-slate-400">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-white px-6 py-10 text-slate-950">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error || "Article not found."}
          </div>

          <Link
            href="/admin/articles"
            className="mt-5 inline-flex rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <AltArrowLeftIcon
              size={17}
              strokeWidth={1.8}
              aria-hidden="true"
            />
            <span>Back to Articles</span>
          </Link>
        </div>
      </div>
    );
  }

  const titleMissing = !title.trim();
  const slugMissing = !slug.trim();
  const contentMissing = !hasMeaningfulContent(content, contentFormat);
  const authorsMissing = authors.length === 0 && !authorInput.trim();

  const showTitleError = attemptedSave && titleMissing;
  const showSlugError = attemptedSave && slugMissing;
  const showContentError = attemptedSave && contentMissing;
  const showAuthorsError =
    attemptedSave && status === "published" && authorsMissing;

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <form onSubmit={handleSubmit}>
        {/* Top Header */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-[76px] flex-col gap-4 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <Link
                href="/admin/articles"
                className="flex shrink-0 items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-950"
              >
                <AltArrowLeftIcon
                  size={17}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
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
                  className="min-w-0 flex-1 border-none bg-transparent text-xl font-semibold tracking-tight text-slate-900 outline-none placeholder:text-slate-400 sm:text-2xl"
                />

                {showTitleError && (
                  <span className="shrink-0 rounded-full bg-red-100 px-2 py-1 text-[11px] font-semibold text-red-700">
                    Required
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as ArticleStatus)
                }
                aria-label="Article status"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition hover:bg-slate-50 focus:border-[#00B2D6] focus:ring-4 focus:ring-[#CBF2F9]"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>

              <button
                type="submit"
                disabled={saving || uploadingImage}
                className="inline-flex items-center gap-2 rounded-xl bg-[#04045E] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#007CB6] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <RefreshIcon
                    size={18}
                    strokeWidth={1.8}
                    className="animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <DisketteIcon
                    size={18}
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                )}

                <span>{saving ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </div>
        </header>

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
              className="flex items-center gap-2 text-sm font-medium text-[#007CB6] transition hover:text-[#04045E]"
            >
              {detailsOpen ? "Collapse" : "Expand"}

              <AltArrowDownIcon
                size={17}
                strokeWidth={1.8}
                className={`transition-transform ${
                  detailsOpen ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        {detailsOpen && (
          <section
            ref={detailsContentRef}
            className="scroll-mt-[133px] border-b border-slate-200 bg-white"
          >
            <div className="px-5 py-6">
              <div className="grid items-start gap-8 lg:grid-cols-2">
                {/* Slug + Excerpt */}
                <div className="space-y-6">
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label
                        htmlFor="slug"
                        className="text-sm font-semibold text-slate-900"
                      >
                        Slug <span className="text-red-500">*</span>
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
                        setSlug(generateSlug(event.target.value))
                      }
                      placeholder="article-slug"
                      aria-required="true"
                      className={`w-full rounded-xl border px-4 py-3 font-mono text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                        showSlugError
                          ? "border-red-300 bg-red-50/60 focus:border-red-400 focus:ring-red-50"
                          : "border-slate-200 bg-white focus:border-[#00B2D6] focus:ring-[#CBF2F9]"
                      }`}
                    />

                    <p className="mt-2 text-sm text-slate-400">
                      Public URL:{" "}
                      <span className="font-mono text-slate-600">
                        /articles/{slug || "article-slug"}
                      </span>
                    </p>
                  </div>

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
                      onChange={(event) => setExcerpt(event.target.value)}
                      placeholder="One or two sentences summarising the article."
                      rows={6}
                      className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#00B2D6] focus:ring-4 focus:ring-[#CBF2F9]"
                    />

                    <p className="mt-2 text-sm text-slate-400">
                      Shown on the article list and at the top of the article.
                    </p>
                  </div>
                </div>

                {/* Cover Image */}
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <label className="block text-sm font-semibold text-slate-900">
                      Cover image
                    </label>

                    <span className="text-xs text-slate-400">Optional</span>
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
                          ? "border-[#00B2D6] bg-[#F0FAFC]"
                          : "border-slate-300 bg-slate-50/50"
                      }`}
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#CBF2F9] text-[#007CB6]">
                        {uploadingImage ? (
                          <RefreshIcon
                            size={24}
                            strokeWidth={1.8}
                            className="animate-spin"
                            aria-hidden="true"
                          />
                        ) : (
                          <GalleryAddIcon
                            size={24}
                            strokeWidth={1.8}
                            aria-hidden="true"
                          />
                        )}
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
                        onClick={() => coverInputRef.current?.click()}
                        className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span className="inline-flex items-center gap-2">
                          <GalleryAddIcon
                            size={16}
                            strokeWidth={1.8}
                            aria-hidden="true"
                          />
                          Browse files
                        </span>
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                      <div
                        role="img"
                        aria-label="Article cover preview"
                        className="h-[225px] w-full bg-slate-100 bg-cover bg-center"
                        style={{
                          backgroundImage: `url("${coverImage}")`,
                        }}
                      />

                      <div className="flex flex-col gap-4 border-t border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-800">
                            {coverFileName || "Current article cover"}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {coverFileName
                              ? "New cover uploaded to Supabase Storage"
                              : "Existing article cover"}
                          </p>
                        </div>

                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            disabled={uploadingImage}
                            onClick={() => coverInputRef.current?.click()}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                          >
                            <span className="inline-flex items-center gap-1.5">
                              <GalleryAddIcon
                                size={15}
                                strokeWidth={1.8}
                                aria-hidden="true"
                              />
                              Replace
                            </span>
                          </button>

                          <button
                            type="button"
                            disabled={uploadingImage}
                            onClick={handleRemoveCoverImage}
                            className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            <span className="inline-flex items-center gap-1.5">
                              <TrashBin2Icon
                                size={15}
                                strokeWidth={1.8}
                                aria-hidden="true"
                              />
                              Remove
                            </span>
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
                    Used on the article list and at the top of the published article.
                  </p>
                </div>
              </div>

              {/* Credits */}
              <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Article credits
                  </h3>

                  <p className="mt-1 text-sm text-slate-400">
                    Add everyone who should be credited for writing or editing this article.
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
                        Authors <span className="text-red-500">*</span>
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
                                removeContributor("author", author)
                              }
                              className="flex h-4 w-4 items-center justify-center rounded-full text-xs text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            >
                              <CloseCircleIcon
                                size={14}
                                strokeWidth={1.8}
                                aria-hidden="true"
                              />
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
                          setAuthorInput(event.target.value)
                        }
                        onKeyDown={(event) =>
                          handleContributorKeyDown(event, "author")
                        }
                        placeholder="Author name"
                        className={`min-w-0 flex-1 rounded-xl border px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                          showAuthorsError
                            ? "border-red-300 bg-white focus:border-red-400 focus:ring-red-50"
                            : "border-slate-200 bg-white focus:border-[#00B2D6] focus:ring-[#CBF2F9]"
                        }`}
                      />

                      <button
                        type="button"
                        onClick={() => addContributor("author")}
                        className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <AddCircleIcon
                            size={16}
                            strokeWidth={1.8}
                            aria-hidden="true"
                          />
                          Add
                        </span>
                      </button>
                    </div>

                    <p className="mt-2 text-xs text-slate-400">
                      Press Enter or comma to add another author.
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
                                removeContributor("editor", editor)
                              }
                              className="flex h-4 w-4 items-center justify-center rounded-full text-xs text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            >
                              <CloseCircleIcon
                                size={14}
                                strokeWidth={1.8}
                                aria-hidden="true"
                              />
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
                          setEditorInput(event.target.value)
                        }
                        onKeyDown={(event) =>
                          handleContributorKeyDown(event, "editor")
                        }
                        placeholder="Editor name"
                        className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#00B2D6] focus:ring-4 focus:ring-[#CBF2F9]"
                      />

                      <button
                        type="button"
                        onClick={() => addContributor("editor")}
                        className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <AddCircleIcon
                            size={16}
                            strokeWidth={1.8}
                            aria-hidden="true"
                          />
                          Add
                        </span>
                      </button>
                    </div>

                    <p className="mt-2 text-xs text-slate-400">
                      Add as many editors as the article needs.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Content */}
        <section className="bg-white px-5 py-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-3 flex items-center justify-between gap-4">
              <label className="text-sm font-semibold text-slate-900">
                Article content <span className="text-red-500">*</span>
              </label>

              {showContentError ? (
                <span className="rounded-full bg-red-100 px-2 py-1 text-[11px] font-semibold text-red-700">
                  Required
                </span>
              ) : (
                <span className="text-xs text-slate-400">
                  {contentFormat === "html"
                    ? "Rich text article"
                    : "Legacy Markdown article"}
                </span>
              )}
            </div>

            {contentFormat === "html" ? (
              <div
                className={`rounded-xl transition ${
                  showContentError ? "ring-2 ring-red-200" : ""
                }`}
              >
                <RichTextEditor
                  key={id}
                  initialContent={content}
                  placeholder="Start writing..."
                  stickyToolbarOffset={133}
                  onChange={setContent}
                />
              </div>
            ) : (
              <div
                className={`overflow-hidden rounded-xl border ${
                  showContentError
                    ? "border-red-300 ring-2 ring-red-100"
                    : "border-slate-200"
                }`}
              >
                <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  This is an older Markdown article. It stays in Markdown format when saved, so the original content is not converted or damaged.
                </div>

                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  rows={24}
                  placeholder="Write your article content..."
                  className="min-h-[560px] w-full resize-y border-none bg-white px-5 py-5 font-mono text-sm leading-7 text-slate-700 outline-none"
                />
              </div>
            )}
          </div>
        </section>
      </form>
    </div>
  );
}
