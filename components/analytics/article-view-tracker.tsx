"use client";

import { useEffect } from "react";

const VISITOR_STORAGE_KEY = "draftflow_visitor_id";

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

    async function recordArticleView() {
      try {
        await fetch("/api/analytics/article-view", {
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
      } catch (error) {
        console.error("Failed to record article view:", error);
      }
    }

    recordArticleView();
  }, [articleId]);

  return null;
}