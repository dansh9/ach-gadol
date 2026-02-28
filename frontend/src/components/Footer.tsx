"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/routing";
import { Heart } from "lucide-react";
import Image from "next/image";

export default function Footer() {
  const t = useTranslations("footer");
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();

  // Hide footer on chat page — it has its own full-height layout
  if (pathname.endsWith("/chat")) return null;

  return (
    <footer className="border-t border-border/40 bg-[hsl(var(--primary))]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          {/* About Section with logo */}
          <div className="space-y-4">
            <Image
              src="/logo-transparent.png"
              alt="אח גדול למען חיילים בודדים"
              width={120}
              height={110}
              className="h-24 w-auto brightness-0 invert"
            />
            <p className="text-sm leading-relaxed text-primary-foreground/80">
              {t("about")}
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-primary-foreground">
              {t("contact")}
            </h3>
            <div className="flex flex-col gap-2">
              <Link
                href="/about"
                className="text-sm text-primary-foreground/80 transition-colors hover:text-[hsl(var(--accent))]"
              >
                {t("privacy")}
              </Link>
              <Link
                href="/about"
                className="text-sm text-primary-foreground/80 transition-colors hover:text-[hsl(var(--accent))]"
              >
                {t("accessibility")}
              </Link>
              <Link
                href="/about"
                className="text-sm text-primary-foreground/80 transition-colors hover:text-[hsl(var(--accent))]"
              >
                {t("contact")}
              </Link>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="space-y-4">
            <p className="text-xs leading-relaxed text-primary-foreground/60">
              {t("disclaimer")}
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 flex flex-col items-center gap-2 border-t border-primary-foreground/10 pt-8 text-center">
          <p className="text-sm text-primary-foreground/70">
            {t("rights_reserved")} &copy; {currentYear}
          </p>
          <div className="flex items-center gap-1 text-xs text-primary-foreground/50">
            <span>{t("built_with")}</span>
            <Heart className="h-3 w-3 fill-[hsl(var(--accent))] text-[hsl(var(--accent))]" />
            <span>{t("built_for")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
