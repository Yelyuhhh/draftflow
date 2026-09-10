"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

import { LoginIcon } from "@solar-icons/react/linear";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      const { error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (signInError) {
        setError("Invalid email or password.");
        return;
      }

      const params = new URLSearchParams(
        window.location.search
      );

      const requestedRedirect =
        params.get("redirectTo");

      const redirectTo =
        requestedRedirect &&
        requestedRedirect.startsWith("/admin")
          ? requestedRedirect
          : "/admin";

      window.location.href = redirectTo;
    } catch (loginError) {
      console.error(
        "Login error:",
        loginError
      );

      setError(
        "Unable to sign in right now. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F7FCFD] px-6 py-12">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -left-28 -top-28 h-80 w-80 rounded-full bg-[#CBF2F9]/80 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-[#91E0EF]/40 blur-3xl" />

      <div className="relative w-full max-w-[460px]">
        {/* Brand */}
        <div className="mb-8 text-center">
          <Link
            href="/"
            aria-label="Draftflow home"
            className="inline-flex items-center"
          >
            <span className="text-2xl font-extrabold tracking-[-0.045em] text-[#04045E]">
              Draft
              <span className="text-[#00B2D6]">
                flow
              </span>
            </span>
          </Link>

          <p className="mt-3 text-sm font-medium text-[#007CB6]">
            Admin CMS
          </p>
        </div>

        {/* Login card */}
        <section className="rounded-[24px] border border-[#D8EEF5] bg-white p-7 shadow-[0_24px_70px_rgba(4,4,94,0.10)] sm:p-9">
          <div>
            <h1 className="text-3xl font-bold tracking-[-0.03em] text-[#04045E]">
              Welcome back
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Sign in to access your Draftflow dashboard
              and manage published content.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
          >
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                autoComplete="email"
                placeholder="admin@example.com"
                disabled={loading}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#00B2D6] focus:ring-4 focus:ring-[#CBF2F9] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70"
              />
            </div>

            {/* Password */}
            <div>
              <div className="mb-2 flex items-center justify-between gap-4">
                <label
                  htmlFor="password"
                  className="text-sm font-semibold text-slate-700"
                >
                  Password
                </label>

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current
                    )
                  }
                  disabled={loading}
                  className="text-xs font-semibold text-[#007CB6] transition hover:text-[#04045E] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {showPassword
                    ? "Hide password"
                    : "Show password"}
                </button>
              </div>

              <input
                id="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                autoComplete="current-password"
                placeholder="Enter your password"
                disabled={loading}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#00B2D6] focus:ring-4 focus:ring-[#CBF2F9] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70"
              />
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700"
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#04045E] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#007CB6] focus:outline-none focus:ring-4 focus:ring-[#CBF2F9] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {!loading && (
                <LoginIcon
                  size={18}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
              )}

              <span>
                {loading
                  ? "Signing in..."
                  : "Sign in"}
              </span>
            </button>
          </form>
        </section>

        {/* Footer action */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm font-medium text-slate-500 transition hover:text-[#007CB6]"
          >
            ← Back to Draftflow
          </Link>

          <p className="mt-4 text-xs text-slate-400">
            Authorized admin access only.
          </p>
        </div>
      </div>
    </main>
  );
}
