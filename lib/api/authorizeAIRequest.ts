import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/checkRateLimit";
import type { User } from "@supabase/supabase-js";

type AuthorizeResult =
  | { authorized: true; user: User; quotaRemaining: number }
  | { authorized: false; response: NextResponse };

const QUOTA_LIMIT = 20;

export async function authorizeAIRequest(
  req: Request,
  bucket: string,
  limit: number,
  windowMs: number,
  message: string,
): Promise<AuthorizeResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      ),
    };
  }

  const rateLimited = checkRateLimit(req, bucket, limit, windowMs, message);
  if (rateLimited) {
    return { authorized: false, response: rateLimited };
  }

  const today = new Date().toISOString().split("T")[0];

  const { data: usage } = await supabase
    .from("daily_usage")
    .select("query_count")
    .eq("user_id", user.id)
    .eq("usage_date", today)
    .maybeSingle();

  const queryCount = usage?.query_count ?? 0;

  if (queryCount >= QUOTA_LIMIT) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          error:
            "You've reached today's free limit of 20 queries. Please come back tomorrow.",
        },
        { status: 429 },
      ),
    };
  }

  return {
    authorized: true,
    user,
    quotaRemaining: QUOTA_LIMIT - queryCount,
  };
}
