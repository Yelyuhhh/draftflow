"use client";

import { useEffect } from "react";

const VISITOR_STORAGE_KEY = "draftflow_visitor_id";
const ARTICLE_VIEW_PREFIX = "draftflow_article_view_";

type ArticleViewTrackerProps = {
  articleId: string;
};

function getVisitorId() {
  let visitorId = localStorage.getItem(VISITOR_STORAGE_KEY);

  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem(VISITOR_STORAGE_KEY, visitorId);
  }

  return visitorId;
}

export default function ArticleViewTracker({
  articleId,
}: ArticleViewTrackerProps) {
  useEffect(() => {
    if (!articleId) return;

    const visitorId = getVisitorId();
    const storageKey = `${ARTICLE_VIEW_PREFIX}${articleId}`;

    const lastRecorded = sessionStorage.getItem(storageKey);

    if (lastRecorded) {
      return;
    }

    sessionStorage.setItem(storageKey, "1");

    async function recordArticleView() {
      try {
        const response = await fetch("/api/analytics/article-view", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            articleId,
            visitorId,
          }),
          keepalive: true,
        });

        if (!response.ok) {
          sessionStorage.removeItem(storageKey);
        }
      } catch (error) {
        sessionStorage.removeItem(storageKey);
        console.error("Failed to record article view:", error);
      }
    }

    recordArticleView();
  }, [articleId]);

  return null;
}