"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { routing } from "@/i18n/routing";
import { useRouter } from "@/i18n/routing";
import { Menu, X, Globe } from "lucide-react";
import Image from "next/image";

type Locale = (typeof routing.locales)[number];

const localeLabels: Record<Locale, string> = {
  he: "עברית",
  en: "English",
  ru: "Русский",
  am: "አማርኛ",
  fr: "Français",
  es: "Español",
  ar: "العربية",
};

export default function Navigation({ locale }: { locale: string }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: t("home") },
    { href: "/rights", label: t("rights") },
    { href: "/check", label: t("check") },
    { href: "/chat", label: t("chat") },
    { href: "/resources", label: t("resources") },
  ] as const;

  function handleLocaleChange(newLocale: Locale) {
    router.replace(pathname, { locale: newLocale });
    setLangMenuOpen(false);
    setMobileMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2"
          aria-label="Ach Gadol — Home"
        >
          {/* Icon logo for mobile */}
          <Image
            src="/favicon-192x192.png"
            alt="אח גדול"
            width={40}
            height={40}
            className="block sm:hidden"
            priority
          />
          {/* Wide logo for desktop */}
          <Image
            src="/logo-wide.png"
            alt="אח גדול למען חיילים בודדים — Big Brother Organization for Lone Soldiers"
            width={200}
            height={36}
            className="hidden h-9 w-auto sm:block"
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-primary/10 hover:text-primary ${
                pathname === link.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Language Selector & Mobile Toggle */}
        <div className="flex items-center gap-2">
          {/* Language Dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
              aria-label="Change language"
            >
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">
                {localeLabels[locale as Locale]}
              </span>
            </button>
            {langMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setLangMenuOpen(false)}
                />
                <div className="absolute end-0 top-full z-50 mt-1 min-w-[160px] rounded-lg border border-border bg-card p-1 shadow-lg">
                  {routing.locales.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => handleLocaleChange(loc)}
                      className={`flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors hover:bg-primary/10 ${
                        locale === loc
                          ? "font-semibold text-primary"
                          : "text-foreground"
                      }`}
                    >
                      {localeLabels[loc]}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-primary/10 lg:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="border-t border-border/40 bg-background lg:hidden">
          <div className="mx-auto max-w-7xl space-y-1 px-4 pb-4 pt-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block rounded-md px-3 py-2.5 text-base font-medium transition-colors hover:bg-primary/10 ${
                  pathname === link.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
