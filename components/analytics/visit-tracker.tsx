"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const VISITOR_STORAGE_KEY = "draftflow_visitor_id";

function getVisitorId() {
  let visitorId = localStorage.getItem(VISITOR_STORAGE_KEY);

  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem(VISITOR_STORAGE_KEY, visitorId);
  }

  return visitorId;
}

export default function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    // Do not count admin pages or login pages as website traffic.
    if (
      pathname.startsWith("/admin") ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/api")
    ) {
      return;
    }

    const visitorId = getVisitorId();

    async function recordVisit() {
      try {
        await fetch("/api/analytics/visit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            visitorId,
            pagePath: pathname,
          }),
          keepalive: true,
        });
      } catch (error) {
        // Analytics should never break the website.
        console.error("Failed to record visit:", error);
      }
    }

    recordVisit();
  }, [pathname]);

  return null;
}