-- Fix quota/call-budget enforcement and folder-scope datasets storage.
--
-- 1. increment_turn_calls: the at-cap path previously fell through to
--    RETURN EXISTS(...), which is TRUE while capped, so the per-turn call
--    budget was never enforced. It now returns whether the increment
--    actually happened (v_updated > 0).
-- 2. claim_turn + increment_turn_calls: reject callers operating on another
--    user's quota data (both are SECURITY DEFINER and previously trusted
--    p_user_id blindly).
-- 3. datasets storage policies: require the first path segment to equal the
--    caller's uid (<userId>/<file>.parquet) in addition to the bucket check.
--
-- Does not touch table RLS policies, quota limits, or the 1/2/0 protocol.

-- ---------------------------------------------------------------------------
-- 1 + 2a. claim_turn: caller guard + unchanged 1/2/0 quota protocol.
-- ---------------------------------------------------------------------------
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
IF p_user_id IS DISTINCT FROM auth.uid() THEN
RAISE EXCEPTION 'Not authorized to claim turns for another user'
USING ERRCODE = '42501';
END IF;

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

-- ---------------------------------------------------------------------------
-- 1 + 2b. increment_turn_calls: caller guard + enforce the cap.
-- ---------------------------------------------------------------------------
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
IF p_user_id IS DISTINCT FROM auth.uid() THEN
RAISE EXCEPTION 'Not authorized to modify another user''s turn budget'
USING ERRCODE = '42501';
END IF;

UPDATE usage_turns
SET call_count = call_count + 1
WHERE user_id = p_user_id
AND turn_id = p_turn_id
AND usage_date = current_date
AND call_count < p_max_calls;

GET DIAGNOSTICS v_updated = ROW_COUNT;

-- Only an actual increment authorizes the call. At the cap (or for a
-- missing turn row) no row is updated, so this returns FALSE and the
-- caller is rejected with 429/503 instead of sailing through.
RETURN v_updated > 0;
END;
$function$;

-- ---------------------------------------------------------------------------
-- 4. datasets storage policies: bucket check AND owner-folder check.
--    Files live at <userId>/<file>.parquet.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow deletes (datasets) tlpdrv_0" ON storage.objects;
CREATE POLICY "Allow deletes (datasets) tlpdrv_0" ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'datasets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Allow deletes (datasets) tlpdrv_1" ON storage.objects;
CREATE POLICY "Allow deletes (datasets) tlpdrv_1" ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'datasets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Allow select (datasets)" ON storage.objects;
CREATE POLICY "Allow select (datasets)" ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'datasets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Allow updates (datasets)" ON storage.objects;
CREATE POLICY "Allow updates (datasets)" ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'datasets'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'datasets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Allow uploads (datasets)" ON storage.objects;
CREATE POLICY "Allow uploads (datasets)" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'datasets'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
