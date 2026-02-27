"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { BookOpen, Loader2, Search, ExternalLink, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface KbDocument {
  id: string;
  title: string;
  source_url: string | null;
  language: string;
  content: string;
  is_active: boolean;
  verified_at: string | null;
  created_at: string;
}

export default function VolunteerKbPage() {
  const t = useTranslations("volunteer_dashboard");
  const [documents, setDocuments] = useState<KbDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchDocuments() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("kb_documents")
          .select("id, title, source_url, language, content, is_active, verified_at, created_at")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(50);

        if (!error && data) {
          setDocuments(data);
        }
      } catch (error) {
        console.error("Failed to fetch KB documents:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDocuments();
  }, []);

  const filtered = searchQuery
    ? documents.filter(
        (doc) =>
          doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : documents;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          {t("kb_title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {documents.length} {t("documents_count")}
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("search_kb")}
          className="w-full rounded-xl border border-border bg-card py-3 pe-4 ps-10 text-sm text-foreground outline-none transition-colors focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)]"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--primary))]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border/50 bg-card py-20">
          <BookOpen className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">{t("no_documents")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((doc) => (
            <div
              key={doc.id}
              className="rounded-xl border border-border/50 bg-card p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-foreground">{doc.title}</h3>
                    {doc.verified_at && (
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-500" />
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {doc.content.slice(0, 200)}...
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="rounded bg-muted px-1.5 py-0.5">
                      {doc.language.toUpperCase()}
                    </span>
                    <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                {doc.source_url && (
                  <a
                    href={doc.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
