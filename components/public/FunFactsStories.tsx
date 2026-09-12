"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type FunFact = {
  id: string;
  title: string;
  week_number: number;
  image_url: string;
  published_at: string;
};

type FunFactsStoriesProps = {
  funFacts: FunFact[];
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function FunFactsStories({
  funFacts,
}: FunFactsStoriesProps) {
  const [activeIndex, setActiveIndex] =
    useState<number | null>(null);

  const activeStory =
    activeIndex !== null
      ? funFacts[activeIndex]
      : null;

  const latestFact = funFacts[0];

  function closeStory() {
    setActiveIndex(null);
  }

  function nextStory() {
    setActiveIndex((current) => {
      if (current === null) {
        return null;
      }

      if (current >= funFacts.length - 1) {
        return null;
      }

      return current + 1;
    });
  }

  function previousStory() {
    setActiveIndex((current) => {
      if (current === null) {
        return null;
      }

      if (current <= 0) {
        return 0;
      }

      return current - 1;
    });
  }

  useEffect(() => {
    if (activeIndex === null) {
      return;
    }

    const timer = window.setTimeout(() => {
      setActiveIndex((current) => {
        if (current === null) {
          return null;
        }

        if (current >= funFacts.length - 1) {
          return null;
        }

        return current + 1;
      });
    }, 7000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [activeIndex, funFacts.length]);

  useEffect(() => {
    if (activeIndex === null) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeStory();
      }

      if (event.key === "ArrowRight") {
        nextStory();
      }

      if (event.key === "ArrowLeft") {
        previousStory();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [activeIndex]);

  if (!latestFact) {
    return (
      <aside className="h-full rounded-xl border border-[#D8EEF5] bg-[#F7FCFD] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#007CB6]">
          Weekly Fun Fact
        </p>

        <div className="mt-5 flex min-h-[280px] items-center justify-center rounded-lg border border-dashed border-[#B9DFEA] bg-white px-6 text-center">
          <p className="text-sm text-slate-400">
            Published Fun Facts will appear here.
          </p>
        </div>
      </aside>
    );
  }

  return (
    <>
      {/* SIDEBAR FUN FACT CARD */}
      <aside className="flex h-full flex-col rounded-xl border border-[#D8EEF5] bg-[#F7FCFD] p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#B9DFEA] bg-white text-[#007CB6]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path
                d="M9 18H15"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />

              <path
                d="M10 21H14"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />

              <path
                d="M8.2 14.5C6.84 13.42 6 11.76 6 10C6 6.69 8.69 4 12 4C15.31 4 18 6.69 18 10C18 11.76 17.16 13.42 15.8 14.5C14.77 15.32 14 16.2 14 17H10C10 16.2 9.23 15.32 8.2 14.5Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#04045E]">
            Weekly Fun Fact
          </p>
        </div>

        <button
          type="button"
          onClick={() => setActiveIndex(0)}
          className="group mt-5 block w-full text-left"
        >
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-[#EAF8FC]">
            <Image
              src={latestFact.image_url}
              alt={latestFact.title}
              fill
              unoptimized
              className="object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          </div>

          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-[#007CB6]">
            Fun Fact #{latestFact.week_number}
          </p>

          <h3 className="mt-2 text-xl font-bold leading-tight text-[#04045E] transition group-hover:text-[#007CB6]">
            {latestFact.title}
          </h3>

          <p className="mt-3 text-xs text-slate-400">
            {formatDate(latestFact.published_at)}
          </p>

          <div className="mt-6 flex items-center justify-between rounded-lg border border-[#B9DFEA] bg-white px-4 py-3 text-sm font-semibold text-[#04045E] transition group-hover:bg-[#F2FBFD]">
            <span>View Story</span>
            <span aria-hidden="true">→</span>
          </div>
        </button>
      </aside>

      {/* STORY VIEWER */}
      {activeStory && activeIndex !== null ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activeStory.title}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 px-4 py-4"
        >
          <button
            type="button"
            onClick={closeStory}
            aria-label="Close Fun Fact"
            className="absolute right-5 top-5 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-2xl text-white transition hover:bg-black/60"
          >
            ×
          </button>

          <div className="relative aspect-[9/16] max-h-[92vh] w-full max-w-[420px] overflow-hidden rounded-[24px] bg-black shadow-2xl">
            <Image
              src={activeStory.image_url}
              alt={activeStory.title}
              fill
              priority
              unoptimized
              className="object-cover"
            />

            <div className="absolute left-3 right-3 top-3 z-30 flex gap-1">
              {funFacts.map((fact, index) => (
                <div
                  key={fact.id}
                  className="h-1 flex-1 overflow-hidden rounded-full bg-white/40"
                >
                  <div
                    className={`h-full bg-white ${
                      index < activeIndex
                        ? "w-full"
                        : index === activeIndex
                          ? "animate-[storyProgress_7s_linear_forwards]"
                          : "w-0"
                    }`}
                  />
                </div>
              ))}
            </div>

            <div className="pointer-events-none absolute left-0 right-0 top-7 z-30 px-4 pt-3 text-white">
              <p className="text-sm font-semibold drop-shadow">
                Weekly Fun Fact #{activeStory.week_number}
              </p>

              <p className="mt-0.5 text-xs text-white/80 drop-shadow">
                {formatDate(activeStory.published_at)}
              </p>
            </div>

            <button
              type="button"
              aria-label="Previous Fun Fact"
              onClick={previousStory}
              className="absolute bottom-0 left-0 top-0 z-20 w-1/2"
            />

            <button
              type="button"
              aria-label="Next Fun Fact"
              onClick={nextStory}
              className="absolute bottom-0 right-0 top-0 z-20 w-1/2"
            />

            <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/80 via-black/20 to-transparent px-5 pb-6 pt-24">
              <h3 className="text-lg font-semibold text-white drop-shadow">
                {activeStory.title}
              </h3>
            </div>
          </div>

          <style jsx global>{`
            @keyframes storyProgress {
              from {
                width: 0%;
              }

              to {
                width: 100%;
              }
            }
          `}</style>
        </div>
      ) : null}
    </>
  );
}