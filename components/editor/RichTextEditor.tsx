"use client";

import {
  ChangeEvent,
  type ReactNode,
  useRef,
  useState,
} from "react";

import {
  EditorContent,
  useEditor,
  useEditorState,
  type Editor,
} from "@tiptap/react";

import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";

import {
  Color,
  TextStyle,
} from "@tiptap/extension-text-style";

import {
  AltArrowLeftIcon,
  AltArrowRightIcon,
  ChatSquareIcon,
  CodeIcon,
  CodeSquareIcon,
  EraserIcon,
  GalleryAddIcon,
  LinkIcon,
  ListArrowDownIcon,
  ListIcon,
  MinusIcon,
  RefreshIcon,
  TextBoldIcon,
  TextFormatIcon,
  TextCrossIcon,
  TextItalicIcon,
  TextSelectionIcon,
  TextUnderlineIcon,
  UnlinkIcon,
} from "@solar-icons/react/linear";

import { createClient } from "@/lib/supabase/client";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

type RichTextEditorProps = {
  initialContent?: string;

  onChange?: (
    html: string
  ) => void;

  placeholder?: string;

  /*
   * Distance from the top of the browser
   * where the toolbar should remain.
   *
   * 0 = browser top
   * 76 = underneath a 76px sticky header
   */
  stickyToolbarOffset?: number;
};

type ToolbarButtonProps = {
  label: ReactNode;
  title?: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
};

function ToolbarButton({
  label,
  title,
  active = false,
  disabled = false,
  onClick,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-9 min-w-9 shrink-0 items-center justify-center rounded-lg px-2.5 text-sm font-medium transition ${
        active
          ? "bg-[#04045E] text-white"
          : "text-slate-600 hover:bg-white hover:text-[#04045E]"
      } disabled:cursor-not-allowed disabled:opacity-30`}
    >
      {label}
    </button>
  );
}

function ToolbarDivider() {
  return (
    <div className="mx-1 h-7 w-px shrink-0 bg-slate-200" />
  );
}

function normalizeUrl(
  value: string
) {
  const trimmed =
    value.trim();

  if (!trimmed) {
    return "";
  }

  if (
    trimmed.startsWith(
      "http://"
    ) ||
    trimmed.startsWith(
      "https://"
    ) ||
    trimmed.startsWith(
      "mailto:"
    ) ||
    trimmed.startsWith(
      "tel:"
    )
  ) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function EditorToolbar({
  editor,
  uploadingImage,
  onChooseImage,
  stickyToolbarOffset,
}: {
  editor: Editor;
  uploadingImage: boolean;
  onChooseImage: () => void;
  stickyToolbarOffset: number;
}) {
  const state =
    useEditorState({
      editor,

      selector: ({
        editor,
      }) => ({
        paragraph:
          editor.isActive(
            "paragraph"
          ),

        h1: editor.isActive(
          "heading",
          {
            level: 1,
          }
        ),

        h2: editor.isActive(
          "heading",
          {
            level: 2,
          }
        ),

        h3: editor.isActive(
          "heading",
          {
            level: 3,
          }
        ),

        bold:
          editor.isActive(
            "bold"
          ),

        italic:
          editor.isActive(
            "italic"
          ),

        underline:
          editor.isActive(
            "underline"
          ),

        strike:
          editor.isActive(
            "strike"
          ),

        code:
          editor.isActive(
            "code"
          ),

        link:
          editor.isActive(
            "link"
          ),

        bulletList:
          editor.isActive(
            "bulletList"
          ),

        orderedList:
          editor.isActive(
            "orderedList"
          ),

        blockquote:
          editor.isActive(
            "blockquote"
          ),

        codeBlock:
          editor.isActive(
            "codeBlock"
          ),

        highlight:
          editor.isActive(
            "highlight"
          ),

        currentTextColor:
          editor.getAttributes(
            "textStyle"
          ).color ||
          "#111827",

        currentHighlightColor:
          editor.getAttributes(
            "highlight"
          ).color ||
          "#fde68a",

        canUndo:
          editor
            .can()
            .chain()
            .focus()
            .undo()
            .run(),

        canRedo:
          editor
            .can()
            .chain()
            .focus()
            .redo()
            .run(),
      }),
    });

  function setLink() {
    const previousUrl =
      editor.getAttributes(
        "link"
      ).href || "";

    const value =
      window.prompt(
        "Enter link URL",
        previousUrl
      );

    if (
      value === null
    ) {
      return;
    }

    if (
      !value.trim()
    ) {
      editor
        .chain()
        .focus()
        .extendMarkRange(
          "link"
        )
        .unsetLink()
        .run();

      return;
    }

    const href =
      normalizeUrl(
        value
      );

    editor
      .chain()
      .focus()
      .extendMarkRange(
        "link"
      )
      .setLink({
        href,
        target:
          "_blank",
      })
      .run();
  }

  return (
    <div
      style={{
        top:
          stickyToolbarOffset,
      }}
      className="
        sticky
        z-40
        flex
        flex-nowrap
        items-center
        gap-1
        overflow-x-auto
        border-b
        border-slate-200
        bg-slate-50/95
        px-3
        py-2
        shadow-sm
        backdrop-blur
      "
    >
      {/* History */}
      <ToolbarButton
        label={<AltArrowLeftIcon size={18} strokeWidth={1.8} aria-hidden="true" />}
        title="Undo"
        disabled={
          !state.canUndo
        }
        onClick={() =>
          editor
            .chain()
            .focus()
            .undo()
            .run()
        }
      />

      <ToolbarButton
        label={<AltArrowRightIcon size={18} strokeWidth={1.8} aria-hidden="true" />}
        title="Redo"
        disabled={
          !state.canRedo
        }
        onClick={() =>
          editor
            .chain()
            .focus()
            .redo()
            .run()
        }
      />

      <ToolbarDivider />

      {/* Text styles */}
      <ToolbarButton
        label="P"
        title="Paragraph"
        active={
          state.paragraph
        }
        onClick={() =>
          editor
            .chain()
            .focus()
            .setParagraph()
            .run()
        }
      />

      <ToolbarButton
        label="H1"
        title="Heading 1"
        active={
          state.h1
        }
        onClick={() =>
          editor
            .chain()
            .focus()
            .toggleHeading({
              level: 1,
            })
            .run()
        }
      />

      <ToolbarButton
        label="H2"
        title="Heading 2"
        active={
          state.h2
        }
        onClick={() =>
          editor
            .chain()
            .focus()
            .toggleHeading({
              level: 2,
            })
            .run()
        }
      />

      <ToolbarButton
        label="H3"
        title="Heading 3"
        active={
          state.h3
        }
        onClick={() =>
          editor
            .chain()
            .focus()
            .toggleHeading({
              level: 3,
            })
            .run()
        }
      />

      <ToolbarDivider />

      {/* Formatting */}
      <ToolbarButton
        label={<TextBoldIcon size={18} strokeWidth={1.8} aria-hidden="true" />}
        title="Bold"
        active={
          state.bold
        }
        onClick={() =>
          editor
            .chain()
            .focus()
            .toggleBold()
            .run()
        }
      />

      <ToolbarButton
        label={<TextItalicIcon size={18} strokeWidth={1.8} aria-hidden="true" />}
        title="Italic"
        active={
          state.italic
        }
        onClick={() =>
          editor
            .chain()
            .focus()
            .toggleItalic()
            .run()
        }
      />

      <ToolbarButton
        label={<TextUnderlineIcon size={18} strokeWidth={1.8} aria-hidden="true" />}
        title="Underline"
        active={
          state.underline
        }
        onClick={() =>
          editor
            .chain()
            .focus()
            .toggleUnderline()
            .run()
        }
      />

      <ToolbarButton
        label={<TextCrossIcon size={18} strokeWidth={1.8} aria-hidden="true" />}
        title="Strikethrough"
        active={
          state.strike
        }
        onClick={() =>
          editor
            .chain()
            .focus()
            .toggleStrike()
            .run()
        }
      />

      <ToolbarButton
        label={<CodeIcon size={18} strokeWidth={1.8} aria-hidden="true" />}
        title="Inline code"
        active={
          state.code
        }
        onClick={() =>
          editor
            .chain()
            .focus()
            .toggleCode()
            .run()
        }
      />

      <ToolbarDivider />

      {/* Text color */}
      <label
        title="Text color"
        className="relative flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-sm font-bold text-slate-600 transition hover:bg-white"
      >
        <TextFormatIcon
          size={18}
          strokeWidth={1.8}
          aria-hidden="true"
        />

        <span
          className="absolute bottom-1 left-2 right-2 h-0.5 rounded-full"
          style={{
            backgroundColor:
              state.currentTextColor,
          }}
        />

        <input
          type="color"
          value={
            state.currentTextColor
          }
          onChange={(
            event
          ) =>
            editor
              .chain()
              .focus()
              .setColor(
                event.target
                  .value
              )
              .run()
          }
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>

      <ToolbarButton
        label={<EraserIcon size={18} strokeWidth={1.8} aria-hidden="true" />}
        title="Remove text color"
        onClick={() =>
          editor
            .chain()
            .focus()
            .unsetColor()
            .run()
        }
      />

      {/* Highlight */}
      <label
        title="Highlight color"
        className={`relative flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-sm font-semibold transition ${
          state.highlight
            ? "bg-[#04045E] text-white"
            : "text-slate-600 hover:bg-white"
        }`}
      >
        <TextSelectionIcon
          size={18}
          strokeWidth={1.8}
          aria-hidden="true"
        />

        <span
          className="absolute bottom-1 left-2 right-2 h-1 rounded-sm"
          style={{
            backgroundColor:
              state.currentHighlightColor,
          }}
        />

        <input
          type="color"
          value={
            state.currentHighlightColor
          }
          onChange={(
            event
          ) =>
            editor
              .chain()
              .focus()
              .setHighlight(
                {
                  color:
                    event
                      .target
                      .value,
                }
              )
              .run()
          }
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>

      <ToolbarButton
        label={<EraserIcon size={18} strokeWidth={1.8} aria-hidden="true" />}
        title="Remove highlight"
        onClick={() =>
          editor
            .chain()
            .focus()
            .unsetHighlight()
            .run()
        }
      />

      <ToolbarDivider />

      {/* Link */}
      <ToolbarButton
        label={<LinkIcon size={18} strokeWidth={1.8} aria-hidden="true" />}
        title={
          state.link
            ? "Edit link"
            : "Add link"
        }
        active={
          state.link
        }
        onClick={
          setLink
        }
      />

      {state.link && (
        <ToolbarButton
          label={<UnlinkIcon size={18} strokeWidth={1.8} aria-hidden="true" />}
          title="Remove link"
          onClick={() =>
            editor
              .chain()
              .focus()
              .unsetLink()
              .run()
          }
        />
      )}

      {/* Image */}
      <ToolbarButton
        label={
          uploadingImage ? (
            <RefreshIcon
              size={18}
              strokeWidth={1.8}
              className="animate-spin"
              aria-hidden="true"
            />
          ) : (
            <GalleryAddIcon
              size={18}
              strokeWidth={1.8}
              aria-hidden="true"
            />
          )
        }
        title="Insert image"
        disabled={
          uploadingImage
        }
        onClick={
          onChooseImage
        }
      />

      <ToolbarDivider />

      {/* Lists */}
      <ToolbarButton
        label={<ListIcon size={18} strokeWidth={1.8} aria-hidden="true" />}
        title="Bullet list"
        active={
          state.bulletList
        }
        onClick={() =>
          editor
            .chain()
            .focus()
            .toggleBulletList()
            .run()
        }
      />

      <ToolbarButton
        label={<ListArrowDownIcon size={18} strokeWidth={1.8} aria-hidden="true" />}
        title="Numbered list"
        active={
          state.orderedList
        }
        onClick={() =>
          editor
            .chain()
            .focus()
            .toggleOrderedList()
            .run()
        }
      />

      <ToolbarButton
        label={<ChatSquareIcon size={18} strokeWidth={1.8} aria-hidden="true" />}
        title="Blockquote"
        active={
          state.blockquote
        }
        onClick={() =>
          editor
            .chain()
            .focus()
            .toggleBlockquote()
            .run()
        }
      />

      <ToolbarButton
        label={<CodeSquareIcon size={18} strokeWidth={1.8} aria-hidden="true" />}
        title="Code block"
        active={
          state.codeBlock
        }
        onClick={() =>
          editor
            .chain()
            .focus()
            .toggleCodeBlock()
            .run()
        }
      />

      <ToolbarButton
        label={<MinusIcon size={18} strokeWidth={1.8} aria-hidden="true" />}
        title="Horizontal divider"
        onClick={() =>
          editor
            .chain()
            .focus()
            .setHorizontalRule()
            .run()
        }
      />
    </div>
  );
}

export default function RichTextEditor({
  initialContent = "",
  onChange,
  placeholder =
    "Start writing...",
  stickyToolbarOffset = 0,
}: RichTextEditorProps) {
  const imageInputRef =
    useRef<HTMLInputElement>(
      null
    );

  const [
    uploadingImage,
    setUploadingImage,
  ] = useState(false);

  const [
    imageError,
    setImageError,
  ] = useState("");

  const editor = useEditor({
    immediatelyRender:
      false,

    extensions: [
      StarterKit.configure({
        heading: {
          levels: [
            1,
            2,
            3,
          ],
        },

        /*
         * We configure Link
         * separately below.
         */
        link: false,
      }),

      Link.configure({
        openOnClick:
          false,

        autolink:
          true,

        linkOnPaste:
          true,

        defaultProtocol:
          "https",

        HTMLAttributes: {
          rel:
            "noopener noreferrer nofollow",

          target:
            "_blank",
        },
      }),

      TextStyle,

      Color.configure({
        types: [
          "textStyle",
        ],
      }),

      Highlight.configure({
        multicolor:
          true,
      }),

      Image.configure({
        inline: false,
        allowBase64:
          false,
      }),

      Placeholder.configure({
        placeholder,

        /*
         * Adds the special class
         * used by the CSS below.
         */
        emptyEditorClass:
          "is-editor-empty",

        showOnlyWhenEditable:
          true,
      }),
    ],

    content:
      initialContent,

    editorProps: {
      attributes: {
        class:
          "min-h-[700px] w-full px-8 py-7 text-base leading-8 text-slate-700 outline-none",
      },
    },

    onUpdate: ({
      editor,
    }) => {
      onChange?.(
        editor.getHTML()
      );
    },
  });

  async function uploadEditorImage(
    file: File
  ) {
    if (!editor) {
      return;
    }

    setImageError("");

    if (
      !ALLOWED_IMAGE_TYPES.includes(
        file.type
      )
    ) {
      setImageError(
        "Please choose a JPG, PNG, or WebP image."
      );

      return;
    }

    if (
      file.size >
      MAX_IMAGE_SIZE
    ) {
      setImageError(
        "Image must be 5 MB or smaller."
      );

      return;
    }

    setUploadingImage(
      true
    );

    try {
      const supabase =
        createClient();

      let extension =
        "jpg";

      if (
        file.type ===
        "image/png"
      ) {
        extension =
          "png";
      }

      if (
        file.type ===
        "image/webp"
      ) {
        extension =
          "webp";
      }

      const filePath =
        `content/${crypto.randomUUID()}.${extension}`;

      const {
        error:
          uploadError,
      } =
        await supabase.storage
          .from(
            "article-covers"
          )
          .upload(
            filePath,
            file,
            {
              cacheControl:
                "3600",

              upsert:
                false,

              contentType:
                file.type,
            }
          );

      if (
        uploadError
      ) {
        throw uploadError;
      }

      const {
        data:
          publicUrlData,
      } =
        supabase.storage
          .from(
            "article-covers"
          )
          .getPublicUrl(
            filePath
          );

      if (
        !publicUrlData
          .publicUrl
      ) {
        throw new Error(
          "Unable to get image URL."
        );
      }

      editor
        .chain()
        .focus()
        .setImage({
          src:
            publicUrlData
              .publicUrl,

          alt:
            file.name,
        })
        .run();
    } catch (
      error
    ) {
      console.error(
        "Editor image upload error:",
        error
      );

      setImageError(
        error instanceof
          Error
          ? error.message
          : "Unable to upload image."
      );
    } finally {
      setUploadingImage(
        false
      );

      if (
        imageInputRef.current
      ) {
        imageInputRef.current.value =
          "";
      }
    }
  }

  async function handleImageChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target
        .files?.[0];

    if (!file) {
      return;
    }

    await uploadEditorImage(
      file
    );
  }

  if (!editor) {
    return (
      <div className="flex min-h-[500px] items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-400">
        Loading editor...
      </div>
    );
  }

  return (
    <div>
      <input
        ref={
          imageInputRef
        }
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={
          handleImageChange
        }
        className="hidden"
      />

      <div className="relative rounded-xl border border-slate-200 bg-white shadow-sm">
        <EditorToolbar
          editor={
            editor
          }
          uploadingImage={
            uploadingImage
          }
          stickyToolbarOffset={
            stickyToolbarOffset
          }
          onChooseImage={() =>
            imageInputRef.current?.click()
          }
        />

        {imageError && (
          <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {imageError}
          </div>
        )}

        <EditorContent
          editor={
            editor
          }
          className="
            [&_.tiptap]:min-h-[700px]
            [&_.tiptap]:outline-none

            [&_.tiptap_h1]:mb-5
            [&_.tiptap_h1]:mt-8
            [&_.tiptap_h1]:text-4xl
            [&_.tiptap_h1]:font-bold
            [&_.tiptap_h1]:tracking-tight
            [&_.tiptap_h1]:text-slate-950

            [&_.tiptap_h2]:mb-4
            [&_.tiptap_h2]:mt-8
            [&_.tiptap_h2]:text-3xl
            [&_.tiptap_h2]:font-bold
            [&_.tiptap_h2]:tracking-tight
            [&_.tiptap_h2]:text-slate-950

            [&_.tiptap_h3]:mb-3
            [&_.tiptap_h3]:mt-7
            [&_.tiptap_h3]:text-2xl
            [&_.tiptap_h3]:font-semibold
            [&_.tiptap_h3]:text-slate-900

            [&_.tiptap_p]:my-4

            [&_.tiptap_a]:font-medium
            [&_.tiptap_a]:text-[#007CB6]
            [&_.tiptap_a]:underline
            [&_.tiptap_a]:underline-offset-2

            [&_.tiptap_ul]:my-5
            [&_.tiptap_ul]:list-disc
            [&_.tiptap_ul]:space-y-2
            [&_.tiptap_ul]:pl-7

            [&_.tiptap_ol]:my-5
            [&_.tiptap_ol]:list-decimal
            [&_.tiptap_ol]:space-y-2
            [&_.tiptap_ol]:pl-7

            [&_.tiptap_blockquote]:my-6
            [&_.tiptap_blockquote]:border-l-4
            [&_.tiptap_blockquote]:border-[#00B2D6]
            [&_.tiptap_blockquote]:bg-[#F0FAFC]
            [&_.tiptap_blockquote]:px-5
            [&_.tiptap_blockquote]:py-2
            [&_.tiptap_blockquote]:italic

            [&_.tiptap_code]:rounded
            [&_.tiptap_code]:bg-slate-100
            [&_.tiptap_code]:px-1.5
            [&_.tiptap_code]:py-0.5
            [&_.tiptap_code]:font-mono
            [&_.tiptap_code]:text-sm

            [&_.tiptap_pre]:my-6
            [&_.tiptap_pre]:overflow-x-auto
            [&_.tiptap_pre]:rounded-xl
            [&_.tiptap_pre]:bg-slate-950
            [&_.tiptap_pre]:p-5
            [&_.tiptap_pre]:text-slate-100

            [&_.tiptap_pre_code]:bg-transparent
            [&_.tiptap_pre_code]:p-0
            [&_.tiptap_pre_code]:text-slate-100

            [&_.tiptap_img]:my-7
            [&_.tiptap_img]:max-h-[520px]
            [&_.tiptap_img]:w-full
            [&_.tiptap_img]:rounded-xl
            [&_.tiptap_img]:object-cover

            [&_.tiptap_hr]:my-8
            [&_.tiptap_hr]:border-slate-200

            [&_.tiptap_mark]:rounded
            [&_.tiptap_mark]:px-0.5
          "
        />
      </div>

      {/*
       * Placeholder behavior:
       *
       * Empty + NOT focused:
       * "Start writing..." is visible.
       *
       * Empty + focused:
       * placeholder disappears.
       */}
      <style jsx global>{`
        .tiptap.is-editor-empty p:first-child::before {
          color: #94a3b8;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }

        .tiptap.ProseMirror-focused.is-editor-empty
          p:first-child::before {
          content: "";
        }
      `}</style>
    </div>
  );
}