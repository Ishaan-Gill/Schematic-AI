import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
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
    },
  );

  // Refresh session if needed
  let user = null;

  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    user = authUser;
  } catch (error) {
    console.error("Middleware auth check failed:", error);

    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "auth_failed");

    return NextResponse.redirect(url);
  }

  const pathname = request.nextUrl.pathname;

  const systemRoutes = [
    "/robots.txt",
    "/sitemap.xml",
    "/favicon.ico",
    "/icon.svg",
  ];
  const authRoutes = ["/login", "/signup"];
  const publicRoutes = [
    "/",
    ...authRoutes,
    ...systemRoutes,
    "/reset-password",
    "/auth/callback",
    "/about",
  ];

  // If logged in
  if (user && authRoutes.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/workspace";

    return NextResponse.redirect(url);
  }

  // If not logged in
  if (!user && !publicRoutes.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";

    return NextResponse.redirect(url);
  }

  return response;
}
