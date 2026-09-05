SET local check_function_bodies = off;

CREATE TABLE "public"."chat_messages" (
  "id"                    uuid                     NOT NULL,
  "session_id"            uuid                     NOT NULL,
  "role"                  text                     NOT NULL,
  "content"               text                     NOT NULL,
  "generated_sql"         text,
  "query_result"          jsonb,
  "page"                  integer                  NOT NULL DEFAULT 0,
  "has_more"              boolean                  NOT NULL DEFAULT false,
  "timestamp"             timestamp with time zone NOT NULL,
  "displayed_row_count"   integer,
  "relevant_tables"       jsonb,
  "final_dataset_context" jsonb,
  CONSTRAINT "chat_messages_pkey" PRIMARY KEY (id),
  CONSTRAINT "chat_messages_role_check" CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text])))
);

ALTER TABLE "public"."chat_messages"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."chat_sessions" (
  "id"         uuid                     NOT NULL,
  "user_id"    uuid                     NOT NULL,
  "title"      text                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "chat_sessions_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."chat_sessions"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."daily_usage" (
  "user_id"     uuid    NOT NULL,
  "usage_date"  date    NOT NULL DEFAULT CURRENT_DATE,
  "query_count" integer NOT NULL DEFAULT 0,
  CONSTRAINT "daily_usage_pkey" PRIMARY KEY (user_id, usage_date)
);

ALTER TABLE "public"."daily_usage"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."datasets" (
  "id"            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"       uuid                     NOT NULL,
  "table_name"    text                     NOT NULL,
  "storage_path"  text                     NOT NULL,
  "row_count"     integer                  NOT NULL,
  "schema"        jsonb                    NOT NULL,
  "profile"       jsonb                    NOT NULL,
  "semantic"      jsonb                    NOT NULL,
  "relationships" jsonb                    NOT NULL,
  "created_at"    timestamp with time zone DEFAULT now(),
  "updated_at"    timestamp with time zone DEFAULT now(),
  CONSTRAINT "datasets_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."datasets"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."explanation_cache" (
  "id"          bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  "cache_key"   text                     NOT NULL,
  "schema_hash" text                     NOT NULL,
  "explanation" text                     NOT NULL,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  "expires_at"  timestamp with time zone NOT NULL DEFAULT (now() + '24:00:00'::interval),
  CONSTRAINT "explanation_cache_cache_key_key" UNIQUE (cache_key),
  CONSTRAINT "explanation_cache_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."explanation_cache"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."query_cache" (
  "id"               bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  "cache_key"        text                     NOT NULL,
  "normalized_query" text                     NOT NULL,
  "schema_hash"      text                     NOT NULL,
  "sql"              text                     NOT NULL,
  "created_at"       timestamp with time zone DEFAULT now(),
  "expires_at"       timestamp with time zone DEFAULT (now() + '1 day'::interval),
  CONSTRAINT "query_cache_cache_key_key" UNIQUE (cache_key),
  CONSTRAINT "query_cache_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."query_cache"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."usage_turns" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"    uuid                     NOT NULL,
  "usage_date" date                     NOT NULL DEFAULT CURRENT_DATE,
  "turn_id"    text                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "call_count" integer                  NOT NULL DEFAULT 0,
  CONSTRAINT "usage_turns_pkey" PRIMARY KEY (id),
  CONSTRAINT "usage_turns_user_date_turn_unique" UNIQUE (user_id, usage_date, turn_id),
  CONSTRAINT "usage_turns_user_id_usage_date_turn_id_key" UNIQUE (user_id, usage_date, turn_id)
);

ALTER TABLE "public"."usage_turns"
  ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.check_and_increment_usage (
  p_user_id uuid,
  p_limit   integer
)
  RETURNS boolean
  LANGUAGE plpgsql
  AS $function$
DECLARE
    current_count INTEGER;
BEGIN
    INSERT INTO daily_usage (user_id, usage_date, query_count)
    VALUES (p_user_id, CURRENT_DATE, 1)

    ON CONFLICT (user_id, usage_date)

    DO UPDATE
    SET query_count = daily_usage.query_count + 1

    RETURNING query_count
    INTO current_count;

    RETURN current_count <= p_limit;
END;
$function$;

CREATE OR REPLACE FUNCTION public.claim_turn (
  p_user_id uuid,
  p_turn_id text,
  p_limit   integer DEFAULT 20
)
  RETURNS integer
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
DECLARE
  v_today date := current_date;
  v_count int;
BEGIN
  INSERT INTO public.usage_turns (user_id, usage_date, turn_id)
  VALUES (p_user_id, v_today, p_turn_id)
  ON CONFLICT DO NOTHING;

  IF found THEN
    SELECT count(*)
    INTO v_count
    FROM public.usage_turns
    WHERE user_id = p_user_id
      AND usage_date = v_today;

    IF v_count > p_limit THEN
      DELETE FROM public.usage_turns
      WHERE user_id = p_user_id
        AND usage_date = v_today
        AND turn_id = p_turn_id;

      RETURN 0;
    END IF;

    RETURN 1;
  END IF;

  RETURN 2;
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_turn_calls (
  p_user_id   uuid,
  p_turn_id   text,
  p_max_calls integer
)
  RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
DECLARE
  v_updated int;
BEGIN
  UPDATE usage_turns
     SET call_count = call_count + 1
   WHERE user_id = p_user_id
     AND turn_id = p_turn_id
     AND usage_date = current_date
     AND call_count < p_max_calls;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  -- Row already at/over cap (update matched nothing)
  IF v_updated = 0 THEN
    RETURN EXISTS (
      SELECT 1 FROM usage_turns
       WHERE user_id = p_user_id
         AND turn_id = p_turn_id
         AND usage_date = current_date
    );
  END IF;

  RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
  RETURNS event_trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog'
  AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

ALTER TABLE "public"."chat_messages"
  ADD CONSTRAINT "chat_messages_session_id_fkey" FOREIGN KEY (session_id) REFERENCES public.chat_sessions(id) ON DELETE CASCADE;

ALTER TABLE "public"."chat_sessions"
  ADD CONSTRAINT "chat_sessions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."daily_usage"
  ADD CONSTRAINT "daily_usage_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."datasets"
  ADD CONSTRAINT "datasets_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."usage_turns"
  ADD CONSTRAINT "usage_turns_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX idx_chat_messages_session ON public.chat_messages USING btree (session_id);

CREATE INDEX idx_chat_messages_timestamp ON public.chat_messages USING btree ("timestamp");

CREATE INDEX idx_chat_sessions_user ON public.chat_sessions USING btree (user_id);

CREATE POLICY "users_own_messages" ON "public"."chat_messages"
  FOR ALL
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM public.chat_sessions
  WHERE ((chat_sessions.id = chat_messages.session_id) AND (chat_sessions.user_id = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.chat_sessions
  WHERE ((chat_sessions.id = chat_messages.session_id) AND (chat_sessions.user_id = auth.uid())))));

CREATE POLICY "users_own_sessions" ON "public"."chat_sessions"
  FOR ALL
  TO "authenticated"
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "users_own_message" ON "public"."daily_usage"
  FOR ALL
  TO "authenticated"
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Users can delete their own datasets" ON "public"."datasets"
  FOR DELETE
  TO "authenticated"
  USING ((auth.uid() = user_id));

CREATE POLICY "Users can insert own datasets" ON "public"."datasets"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Users can update their own datasets" ON "public"."datasets"
  FOR UPDATE
  TO "authenticated"
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Users can view their own datasets" ON "public"."datasets"
  FOR SELECT
  TO "authenticated"
  USING ((auth.uid() = user_id));

CREATE POLICY "Allow public insert" ON "public"."explanation_cache"
  FOR INSERT
  TO PUBLIC
  WITH CHECK (true);

CREATE POLICY "Allow public select" ON "public"."explanation_cache"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Allow public insert" ON "public"."query_cache"
  FOR INSERT
  TO PUBLIC
  WITH CHECK (true);

CREATE POLICY "allow public select" ON "public"."query_cache"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "users can insert own turns" ON "public"."usage_turns"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "users can read own turns" ON "public"."usage_turns"
  FOR SELECT
  TO "authenticated"
  USING ((auth.uid() = user_id));

CREATE POLICY "Allow deletes (datasets) tlpdrv_0" ON "storage"."objects"
  FOR DELETE
  TO "authenticated"
  USING ((bucket_id = 'datasets'::text));

CREATE POLICY "Allow deletes (datasets) tlpdrv_1" ON "storage"."objects"
  FOR SELECT
  TO "authenticated"
  USING ((bucket_id = 'datasets'::text));

CREATE POLICY "Allow select (datasets)" ON "storage"."objects"
  FOR SELECT
  TO "authenticated"
  USING ((bucket_id = 'datasets'::text));

CREATE POLICY "Allow updates (datasets)" ON "storage"."objects"
  FOR UPDATE
  TO "authenticated"
  USING ((bucket_id = 'datasets'::text))
  WITH CHECK ((bucket_id = 'datasets'::text));

CREATE POLICY "Allow uploads (datasets)" ON "storage"."objects"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((bucket_id = 'datasets'::text));

CREATE EVENT TRIGGER "ensure_rls"
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  EXECUTE FUNCTION "public"."rls_auto_enable"();

GRANT EXECUTE ON FUNCTION "public"."check_and_increment_usage"(uuid, integer) TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."claim_turn"(uuid, text, integer) TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."increment_turn_calls"(uuid, text, integer) TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."rls_auto_enable"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."chat_messages" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."chat_sessions" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."daily_usage" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."datasets" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."explanation_cache" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."query_cache" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."usage_turns" TO "anon", "authenticated", "postgres", "service_role";

