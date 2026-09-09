import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const visitorId =
      typeof body.visitorId === "string" ? body.visitorId.trim() : "";

    const pagePath =
      typeof body.pagePath === "string" ? body.pagePath.trim() : "";

    if (!visitorId || !pagePath) {
      return NextResponse.json(
        { error: "Missing visitorId or pagePath" },
        { status: 400 }
      );
    }

    if (visitorId.length > 100 || pagePath.length > 500) {
      return NextResponse.json(
        { error: "Invalid analytics payload" },
        { status: 400 }
      );
    }

    // Vercel provides this automatically when deployed.
    // During local development this will usually be unavailable.
    const country =
      request.headers.get("x-vercel-ip-country") ||
      request.headers.get("cf-ipcountry") ||
      null;

    const supabase = await createClient();

    const { error } = await supabase.rpc("record_site_visit", {
      p_visitor_id: visitorId,
      p_page_path: pagePath,
      p_country: country,
    });

    if (error) {
      console.error("Analytics visit error:", error);

      return NextResponse.json(
        { error: "Unable to record visit" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Analytics route error:", error);

    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
} 