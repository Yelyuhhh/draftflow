"use client";

import {
  ChangeEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
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

export default function NewFunFactPage() {
  const router = useRouter();

  const imageInputRef =
    useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [weekNumber, setWeekNumber] =
    useState("");

  const [imageFile, setImageFile] =
    useState<File | null>(null);

  const [previewUrl, setPreviewUrl] =
    useState("");

  const [error, setError] = useState("");
  const [imageError, setImageError] =
    useState("");

  const [saving, setSaving] =
    useState<SaveAction>(null);

  /*
   * Clean up the temporary browser preview
   * whenever the selected image changes.
   */
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function validateImage(file: File) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return "Please choose a JPG, PNG, or WebP image.";
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return "Image must be 5 MB or smaller.";
    }

    return null;
  }

  function handleImageChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setImageError("");

    const validationError =
      validateImage(file);

    if (validationError) {
      setImageError(validationError);

      event.target.value = "";

      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const nextPreview =
      URL.createObjectURL(file);

    setImageFile(file);
    setPreviewUrl(nextPreview);
  }

  function removeImage() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setImageFile(null);
    setPreviewUrl("");
    setImageError("");

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  }

  async function saveFunFact(
    status: "draft" | "published"
  ) {
    setError("");
    setImageError("");

    const cleanTitle = title.trim();
    const parsedWeekNumber =
      Number(weekNumber);

    if (!cleanTitle) {
      setError(
        "Please enter a Fun Fact title."
      );

      return;
    }

    if (
      !Number.isInteger(parsedWeekNumber) ||
      parsedWeekNumber < 1
    ) {
      setError(
        "Please enter a valid Weekly Fun Fact number."
      );

      return;
    }

    if (!imageFile) {
      setImageError(
        "Please upload a Fun Fact image."
      );

      return;
    }

    setSaving(status);

    const supabase = createClient();

    let uploadedPath: string | null = null;

    try {
      /*
       * 1. Upload the actual photo to
       *    Supabase Storage.
       */
      const extension =
        getImageExtension(imageFile);

      uploadedPath =
        `stories/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } =
        await supabase.storage
          .from("fun-facts")
          .upload(
            uploadedPath,
            imageFile,
            {
              cacheControl: "3600",
              upsert: false,
              contentType:
                imageFile.type,
            }
          );

      if (uploadError) {
        throw uploadError;
      }

      /*
       * 2. Save only the Storage path
       *    in the database.
       *
       * published_at is NOT sent here.
       * Supabase handles it automatically
       * through the trigger we created.
       */
      const { error: insertError } =
        await supabase
          .from("fun_facts")
          .insert({
            title: cleanTitle,
            week_number:
              parsedWeekNumber,
            image_path:
              uploadedPath,
            status,
          });

      if (insertError) {
        throw insertError;
      }

      /*
       * 3. Return to the Fun Facts page.
       */
      router.push("/admin/fun-facts");
      router.refresh();
    } catch (saveError: unknown) {
      console.error(
        "Fun Fact save error:",
        saveError
      );

      /*
       * If the image uploaded successfully
       * but the database insert failed,
       * remove the unused Storage file.
       */
      if (uploadedPath) {
        const { error: cleanupError } =
          await supabase.storage
            .from("fun-facts")
            .remove([uploadedPath]);

        if (cleanupError) {
          console.error(
            "Unable to clean up Fun Fact image:",
            cleanupError
          );
        }
      }

      const possibleError =
        saveError as {
          code?: string;
          message?: string;
        };

      if (possibleError.code === "23505") {
        setError(
          `Weekly Fun Fact #${parsedWeekNumber} already exists. Please use another number.`
        );
      } else {
        setError(
          possibleError.message ||
            "Unable to save the Fun Fact."
        );
      }
    } finally {
      setSaving(null);
    }
  }

  const busy = saving !== null;

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 lg:px-10">
      {/* Header */}
      <header className="mb-8">
        <Link
          href="/admin/fun-facts"
          className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          ← Back to Fun Facts
        </Link>

        <div className="mt-4">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Add Fun Fact
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Upload a weekly Fun Fact image
            for the website.
          </p>
        </div>
      </header>

      {error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Form */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-semibold text-slate-800"
              >
                Title
              </label>

              <input
                id="title"
                type="text"
                value={title}
                disabled={busy}
                onChange={(event) =>
                  setTitle(
                    event.target.value
                  )
                }
                placeholder="Enter Fun Fact title"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#00B2D6] focus:ring-4 focus:ring-[#CBF2F9] disabled:bg-slate-50"
              />
            </div>

            {/* Week number */}
            <div>
              <label
                htmlFor="week-number"
                className="block text-sm font-semibold text-slate-800"
              >
                Weekly Fun Fact #
              </label>

              <input
                id="week-number"
                type="number"
                min="1"
                step="1"
                value={weekNumber}
                disabled={busy}
                onChange={(event) =>
                  setWeekNumber(
                    event.target.value
                  )
                }
                placeholder="Example: 12"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#00B2D6] focus:ring-4 focus:ring-[#CBF2F9] disabled:bg-slate-50"
              />

              <p className="mt-2 text-xs text-slate-400">
                The publication date is
                automatically added when you
                publish.
              </p>
            </div>

            {/* Image upload */}
            <div>
              <label className="block text-sm font-semibold text-slate-800">
                Fun Fact Image
              </label>

              <p className="mt-1 text-xs text-slate-400">
                JPG, PNG, or WebP. Maximum 5
                MB. A vertical 9:16 image is
                recommended.
              </p>

              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={busy}
                onChange={
                  handleImageChange
                }
                className="hidden"
              />

              {!previewUrl ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    imageInputRef.current?.click()
                  }
                  className="mt-4 flex min-h-[220px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 text-center transition hover:border-[#91E0EF] hover:bg-[#F7FCFD] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-9 w-9 text-slate-400"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 16V4M12 4L7.5 8.5M12 4L16.5 8.5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    <path
                      d="M5 14V18C5 19.1046 5.89543 20 7 20H17C18.1046 20 19 19.1046 19 18V14"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>

                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    Upload photo
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Choose an image from your
                    device
                  </p>
                </button>
              ) : (
                <div className="mt-4 rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-24 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      <img
                        src={previewUrl}
                        alt="Selected Fun Fact"
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-700">
                        {imageFile?.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {imageFile
                          ? `${(
                              imageFile.size /
                              1024 /
                              1024
                            ).toFixed(
                              2
                            )} MB`
                          : ""}
                      </p>

                      <div className="mt-3 flex gap-4">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            imageInputRef.current?.click()
                          }
                          className="text-xs font-semibold text-[#007CB6] disabled:opacity-50"
                        >
                          Replace
                        </button>

                        <button
                          type="button"
                          disabled={busy}
                          onClick={removeImage}
                          className="text-xs font-semibold text-red-600 disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {imageError ? (
                <p className="mt-2 text-sm text-red-600">
                  {imageError}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        {/* Story preview */}
        <aside>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            Story Preview
          </p>

          <div className="mx-auto aspect-[9/16] w-full max-w-[300px] overflow-hidden rounded-[24px] border border-slate-200 bg-slate-100 shadow-sm">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={
                  title ||
                  "Fun Fact preview"
                }
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center px-8 text-center">
                <p className="text-sm text-slate-400">
                  Your Fun Fact image will
                  appear here.
                </p>
              </div>
            )}
          </div>

          {(title || weekNumber) && (
            <div className="mx-auto mt-4 max-w-[300px]">
              {weekNumber ? (
                <p className="text-xs font-semibold uppercase tracking-wide text-[#007CB6]">
                  Weekly Fun Fact #
                  {weekNumber}
                </p>
              ) : null}

              {title ? (
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {title}
                </p>
              ) : null}
            </div>
          )}
        </aside>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-6">
        <Link
          href="/admin/fun-facts"
          className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        >
          Cancel
        </Link>

        <button
          type="button"
          disabled={busy}
          onClick={() =>
            saveFunFact("draft")
          }
          className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving === "draft"
            ? "Saving..."
            : "Save Draft"}
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={() =>
            saveFunFact("published")
          }
          className="rounded-lg bg-[#04045E] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#007CB6] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving === "published"
            ? "Publishing..."
            : "Publish"}
        </button>
      </div>
    </div>
  );
}