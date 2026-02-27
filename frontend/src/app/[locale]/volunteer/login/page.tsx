"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Mail, Loader2, CheckCircle2, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function VolunteerLoginPage() {
  const t = useTranslations("volunteer_dashboard");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/he/volunteer/dashboard`,
        },
      });

      if (authError) {
        setError(authError.message);
      } else {
        setSent(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="mx-auto max-w-md text-center">
          <div className="mb-4 inline-flex rounded-full bg-emerald-100 p-4 dark:bg-emerald-900/30">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {t("check_email")}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t("magic_link_sent")} <strong>{email}</strong>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-2xl border border-border/50 bg-card p-8 shadow-lg">
          <div className="mb-6 text-center">
            <div className="mb-4 inline-flex rounded-full bg-[hsl(var(--primary)/0.1)] p-3">
              <Shield className="h-8 w-8 text-[hsl(var(--primary))]" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              {t("volunteer_login")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("login_subtitle")}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                {t("email")}
              </label>
              <div className="relative">
                <Mail className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="volunteer@achgadol.org"
                  required
                  className="w-full rounded-xl border border-border bg-background py-3 pe-4 ps-10 text-sm text-foreground outline-none transition-colors focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)]"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-4 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:brightness-110 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              {t("send_magic_link")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
