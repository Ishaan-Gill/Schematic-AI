import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().split("T")[0];

  const { data: usage, error: usageError } = await supabase
    .from("daily_usage")
    .select("query_count")
    .eq("user_id", user.id)
    .eq("usage_date", today)
    .maybeSingle();

  if (usageError) {
    console.error("Failed to fetch quota usage:", usageError);

    return NextResponse.json(
      {
        error: "Failed to fetch quota usage.",
      },
      {
        status: 500,
      },
    );
  }

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);

  return NextResponse.json({
    used: usage?.query_count ?? 0,
    limit: 20,
    resetsAt: tomorrow.toISOString(),
  });
}
