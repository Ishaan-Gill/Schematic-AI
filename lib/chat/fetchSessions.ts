import { createClient } from "@/lib/supabase/client";
import type { Message, Session } from "@/types/chat";

export async function fetchSessions(): Promise<Session[]> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // Fetch sessions
  const { data: sessions, error: sessionError } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (sessionError) {
    throw sessionError;
  }

  if (!sessions || sessions.length === 0) {
    return [];
  }

  // Fetch messages
  const sessionIds = sessions.map((s) => s.id);

  const { data: messages, error: messageError } = await supabase
    .from("chat_messages")
    .select("*")
    .in("session_id", sessionIds)
    .order("timestamp", { ascending: true });

  if (messageError) {
    throw messageError;
  }

  // Group messages by session
  const messagesBySession = new Map<string, Message[]>();

  for (const message of messages ?? []) {
    const arr = messagesBySession.get(message.session_id) ?? [];

    arr.push({
      id: message.id,
      role: message.role,
      content: message.content,
      generatedSQL: message.generated_sql,
      queryResult: message.query_result ?? [],
      page: message.page ?? 0,
      hasMore: message.has_more ?? false,
      timestamp: message.timestamp,
    });

    messagesBySession.set(message.session_id, arr);
  }

  // Build Session[]
  return sessions.map((session) => ({
    id: session.id,
    title: session.title,
    messages: messagesBySession.get(session.id) ?? [],
  }));
}