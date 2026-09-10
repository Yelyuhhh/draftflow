import Image from "next/image";
import Link from "next/link";

type ArticleCardArticle = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  authors: string[] | null;
  published_at: string | null;
  created_at: string;
};

type ArticleCardProps = {
  article: ArticleCardArticle;
  featured?: boolean;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getReadingTime(content: string) {
  const plainText = content
    .replace(/<[^>]*>/g, " ")
    .replace(/[#>*_`~[\]()!-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = plainText ? plainText.split(" ").length : 0;

  return Math.max(1, Math.ceil(words / 220));
}

function formatAuthors(authors: string[] | null) {
  if (!Array.isArray(authors) || authors.length === 0) {
    return null;
  }

  if (authors.length === 1) {
    return authors[0];
  }

  if (authors.length === 2) {
    return `${authors[0]} and ${authors[1]}`;
  }

  return `${authors[0]} + ${authors.length - 1} more`;
}

export default function ArticleCard({
  article,
  featured = false,
}: ArticleCardProps) {
  const date = formatDate(
    article.published_at || article.created_at
  );

  const readingTime = getReadingTime(article.content);
  const authorLine = formatAuthors(article.authors);

  if (featured) {
    return (
      <Link
        href={`/articles/${article.slug}`}
        className="group block overflow-hidden rounded-[28px] border border-[#CBF2F9] bg-white shadow-[0_18px_50px_rgba(4,4,94,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(4,4,94,0.13)]"
      >
        <article className="grid min-h-[430px] lg:grid-cols-[1.08fr_0.92fr]">
          <div className="relative min-h-[290px] overflow-hidden bg-[#EAFBFE] lg:min-h-full">
            {article.cover_image ? (
              <div
                role="img"
                aria-label={`Cover image for ${article.title}`}
                className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-[1.025]"
                style={{
                  backgroundImage: `url("${article.cover_image}")`,
                }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#04045E] via-[#007CB6] to-[#00B2D6]">
                <div className="rounded-3xl bg-white/95 p-5 shadow-xl">
                  <Image
                    src="/logo.png"
                    alt="Draftflow"
                    width={180}
                    height={72}
                    className="h-16 w-auto object-contain"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col justify-between p-7 sm:p-9 lg:p-10">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.11em] text-[#007CB6]">
                <span>Featured</span>
                <span className="text-slate-300">·</span>
                <span>{date}</span>
                <span className="text-slate-300">·</span>
                <span>{readingTime} min read</span>
              </div>

              <h2 className="mt-5 font-serif text-3xl font-semibold leading-tight tracking-[-0.02em] text-[#04045E] sm:text-4xl">
                {article.title}
              </h2>

              {article.excerpt && (
                <p className="mt-5 text-base leading-7 text-slate-600">
                  {article.excerpt}
                </p>
              )}

              {authorLine && (
                <p className="mt-5 text-sm text-slate-500">
                  By{" "}
                  <span className="font-semibold text-slate-700">
                    {authorLine}
                  </span>
                </p>
              )}
            </div>

            <div className="mt-8 inline-flex items-center gap-2 font-semibold text-[#007CB6]">
              <span>Read article</span>
              <span className="transition-transform duration-200 group-hover:translate-x-1">
                →
              </span>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link
      href={`/articles/${article.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-[#91E0EF] hover:shadow-[0_16px_40px_rgba(4,4,94,0.10)]"
    >
      <article className="flex h-full flex-col">
        <div className="relative aspect-[16/10] overflow-hidden bg-[#EAFBFE]">
          {article.cover_image ? (
            <div
              role="img"
              aria-label={`Cover image for ${article.title}`}
              className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-[1.035]"
              style={{
                backgroundImage: `url("${article.cover_image}")`,
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#04045E] via-[#007CB6] to-[#91E0EF]">
              <div className="rounded-2xl bg-white/95 p-4 shadow-lg">
                <Image
                  src="/logo.png"
                  alt="Draftflow"
                  width={135}
                  height={54}
                  className="h-12 w-auto object-contain"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-6">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#007CB6]">
            <span>{date}</span>
            <span className="text-slate-300">·</span>
            <span>{readingTime} min read</span>
          </div>

          <h2 className="mt-4 font-serif text-2xl font-semibold leading-snug text-[#04045E]">
            {article.title}
          </h2>

          {article.excerpt && (
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
              {article.excerpt}
            </p>
          )}

          {authorLine && (
            <p className="mt-4 text-xs text-slate-500">
              By{" "}
              <span className="font-semibold text-slate-700">
                {authorLine}
              </span>
            </p>
          )}

          <div className="mt-auto flex items-center gap-2 pt-6 text-sm font-semibold text-[#007CB6]">
            <span>Read article</span>
            <span className="transition-transform duration-200 group-hover:translate-x-1">
              →
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
