import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

async function logout() {
  "use server";

  const supabase = await createClient();

  await supabase.auth.signOut();

  redirect("/login");
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Verify the authenticated user on the server.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not authenticated → send to login.
  if (!user) {
    redirect("/login?redirectTo=/admin");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-800 bg-slate-900 lg:block">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="border-b border-slate-800 px-6 py-5">
            <Link
              href="/admin"
              className="text-lg font-bold tracking-tight"
            >
              Draftflow
            </Link>

            <p className="mt-1 text-xs text-slate-500">
              Admin Dashboard
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            <Link
              href="/admin"
              className="block rounded-lg px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              Dashboard
            </Link>

            <Link
              href="/admin/articles"
              className="block rounded-lg px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              Articles
            </Link>

            <Link
              href="/admin/articles/new"
              className="block rounded-lg px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              New Article
            </Link>
          </nav>

          {/* Footer */}
          <div className="border-t border-slate-800 p-4">
            <Link
              href="/articles"
              target="_blank"
              className="block rounded-lg px-4 py-2.5 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              View Website →
            </Link>

            <form action={logout} className="mt-2">
              <button
                type="submit"
                className="block w-full rounded-lg px-4 py-2.5 text-left text-sm text-slate-400 transition hover:bg-red-950/40 hover:text-red-300"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {children}
      </div>
    </div>
  );
}