import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  DocumentTextIcon,
  ExportIcon,
  HomeIcon,
  LogoutIcon,
} from "@solar-icons/react/linear";

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/admin");
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside className="fixed inset-y-0 left-0 hidden w-[272px] border-r border-slate-200 bg-white lg:block">
        <div className="flex h-full flex-col">
          <div className="px-6 pb-5 pt-8">
            <Link href="/admin" className="inline-block">
              <Image
                src="/logo.png"
                alt="Draftflow"
                width={150}
                height={80}
                priority
                className="h-auto w-[150px]"
              />
            </Link>
          </div>

          <nav className="flex-1 px-3 pt-4">
            <div className="space-y-2">
              <Link
                href="/admin"
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                <HomeIcon
                  size={20}
                  strokeWidth={1.8}
                  className="shrink-0"
                  aria-hidden="true"
                />

                <span>Dashboard</span>
              </Link>

              <Link
                href="/admin/articles"
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <DocumentTextIcon
                  size={20}
                  strokeWidth={1.8}
                  className="shrink-0"
                  aria-hidden="true"
                />

                <span>Articles</span>
              </Link>
            </div>
          </nav>

          <div className="p-3">
            <div className="rounded-xl border border-slate-200 bg-white">
              <Link
                href="/articles"
                target="_blank"
                className="flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-50"
              >
                <span>View Website</span>

                <ExportIcon
                  size={18}
                  strokeWidth={1.8}
                  className="text-slate-500"
                  aria-hidden="true"
                />
              </Link>

              <div className="mx-4 border-t border-slate-100" />

              <form action={logout}>
                <button
                  type="submit"
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-slate-900 transition hover:bg-slate-50"
                >
                  <span>Sign out</span>

                  <LogoutIcon
                    size={18}
                    strokeWidth={1.8}
                    className="text-slate-500"
                    aria-hidden="true"
                  />
                </button>
              </form>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[272px]">
        <main className="min-h-screen bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}
