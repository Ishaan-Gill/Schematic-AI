import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/checkRateLimit";
import { rateLimit } from "@/lib/rateLimiter";
import type { User } from "@supabase/supabase-js";

type AuthorizeOptions = {
  turnId?: string;
};

type AuthorizeResult =
  | { authorized: true; user: User; quotaRemaining: number }
  | { authorized: false; response: NextResponse };

const QUOTA_LIMIT = 20;
const TURN_LIMIT = 5;
const TURN_WINDOW_MS = 60000;

export async function authorizeAIRequest(
  req: Request,
  bucket: string,
  limit: number,
  windowMs: number,
  message: string,
  options?: AuthorizeOptions,
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

  const today = new Date().toISOString().split("T")[0];

  if (options?.turnId) {
    const { data: turn, error: turnError } = await supabase
      .from("usage_turns")
      .select("turn_id")
      .eq("user_id", user.id)
      .eq("usage_date", today)
      .eq("turn_id", options.turnId)
      .maybeSingle();

    if (turnError) {
      console.error("Failed to check turn:", turnError);

      return {
        authorized: false,
        response: NextResponse.json(
          { error: "Unable to verify your request. Please try again." },
          { status: 503 },
        ),
      };
    }

    // Internal calls within an already-claimed turn are not new turns,
    // so they skip the short-term limiter and the daily quota check.
    if (turn) {
      return {
        authorized: true,
        user,
        quotaRemaining: QUOTA_LIMIT,
      };
    }

    const turnLimited = rateLimit(
      user.id,
      `turn:${bucket}`,
      TURN_LIMIT,
      TURN_WINDOW_MS,
    );

    if (!turnLimited) {
      return {
        authorized: false,
        response: NextResponse.json({ error: message }, { status: 429 }),
      };
    }

    const { count, error: usageError } = await supabase
      .from("usage_turns")
      .select("turn_id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("usage_date", today);

    if (usageError) {
      console.error("Failed to fetch daily usage:", usageError);

      return {
        authorized: false,
        response: NextResponse.json(
          {
            error:
              "Unable to verify your daily quota. Please try again in a moment.",
          },
          { status: 503 },
        ),
      };
    }

    const queryCount = count ?? 0;

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

  const rateLimited = checkRateLimit(req, bucket, limit, windowMs, message);
  if (rateLimited) {
    return { authorized: false, response: rateLimited };
  }

  const { count, error: usageError } = await supabase
    .from("usage_turns")
    .select("turn_id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("usage_date", today);

  if (usageError) {
    console.error("Failed to fetch daily usage:", usageError);

    return {
      authorized: false,
      response: NextResponse.json(
        {
          error:
            "Unable to verify your daily quota. Please try again in a moment.",
        },
        { status: 503 },
      ),
    };
  }

  const queryCount = count ?? 0;

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