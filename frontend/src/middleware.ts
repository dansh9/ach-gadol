import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const intlMiddleware = createMiddleware(routing);

/**
 * Middleware that handles:
 * 1. i18n locale routing (for all non-API routes)
 * 2. Supabase auth check (for /volunteer/* routes except /volunteer/login)
 */
export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this is a protected volunteer route
  const isVolunteerRoute =
    pathname.includes("/volunteer/") &&
    !pathname.includes("/volunteer/login");

  if (isVolunteerRoute) {
    // Check Supabase auth
    const response = NextResponse.next();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Redirect to volunteer login
      const locale = pathname.split("/")[1] || "he";
      const loginUrl = new URL(`/${locale}/volunteer/login`, request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Run i18n middleware for all routes
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for:
  // - API routes
  // - Next.js internals (_next)
  // - Static files (files with extensions like .png, .ico, etc.)
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
