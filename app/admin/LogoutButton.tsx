"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { LogoutIcon } from "@solar-icons/react/linear";

import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      setLoading(false);
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="flex w-full items-center justify-between rounded-lg px-4 py-2.5 text-left text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span>{loading ? "Signing out..." : "Sign out"}</span>

      {!loading && (
        <LogoutIcon
          size={18}
          strokeWidth={1.8}
          aria-hidden="true"
        />
      )}
    </button>
  );
}
