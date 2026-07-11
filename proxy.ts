import { type NextRequest } from "next/server";
import { updateSession } from "./lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run middleware on everything
     * except static assets.
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};