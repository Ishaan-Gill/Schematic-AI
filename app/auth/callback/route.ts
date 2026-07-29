import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  const next = searchParams.get("next");
  const redirectPath =
    next?.startsWith("/") && !next.startsWith("//") ? next : "/workspace";

  if (code) {
    const response = NextResponse.redirect(`${origin}${redirectPath}`);
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    console.log("Callback URL:", request.url);
    console.log("Code:", code);
    console.log("Session:", data.session);
    console.log("Error:", error);

    if (error) {
      return NextResponse.json(
        {
          message: error.message,
          status: error.status,
          code,
        },
        { status: 500 },
      );
    }

    return response;
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
