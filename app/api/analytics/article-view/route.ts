import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const articleId =
      typeof body.articleId === "string" ? body.articleId.trim() : "";

    const visitorId =
      typeof body.visitorId === "string" ? body.visitorId.trim() : "";

    if (!articleId || !visitorId) {
      return NextResponse.json(
        { error: "Missing articleId or visitorId" },
        { status: 400 }
      );
    }

    if (visitorId.length > 100) {
      return NextResponse.json(
        { error: "Invalid analytics payload" },
        { status: 400 }
      );
    }

    const country =
      request.headers.get("x-vercel-ip-country") ||
      request.headers.get("cf-ipcountry") ||
      null;

    const supabase = await createClient();

    const { error } = await supabase.rpc("record_article_view", {
      p_article_id: articleId,
      p_visitor_id: visitorId,
      p_country: country,
    });

    if (error) {
      console.error("Article view analytics error:", error);

      return NextResponse.json(
        { error: "Unable to record article view" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Article view route error:", error);

    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}