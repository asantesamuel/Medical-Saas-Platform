-- scripts/sql/schema.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Full schema: profiles, predictions tables + RLS policies + trigger
-- Run in Supabase SQL Editor in order.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. profiles ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
    id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name   TEXT,
    role        TEXT        NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    avatar_url  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Admins can read all profiles (for admin dashboard)
CREATE POLICY "Admins read all profiles"
    ON public.profiles FOR SELECT
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- ── 2. Auto-create profile on signup ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name)
    VALUES (
        new.id,
        new.raw_user_meta_data->>'full_name'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 3. predictions ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.predictions (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    model_type       TEXT        NOT NULL CHECK (model_type IN ('tumor', 'stroke')),
    result           TEXT        NOT NULL,
    confidence_score FLOAT       NOT NULL CHECK (confidence_score BETWEEN 0 AND 1),
    top_3_results    JSONB,
    image_path       TEXT        NOT NULL,
    gradcam_path     TEXT,
    model_version    TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_predictions_user_id   ON public.predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_created_at ON public.predictions(created_at DESC);

ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own predictions"
    ON public.predictions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users delete own predictions"
    ON public.predictions FOR DELETE
    USING (auth.uid() = user_id);

-- INSERT is service-role only (FastAPI) — no RLS policy needed for INSERT

-- Admins can read all predictions
CREATE POLICY "Admins read all predictions"
    ON public.predictions FOR SELECT
    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- ── 4. Storage RLS ────────────────────────────────────────────────────────────
-- Run after creating buckets 'scan-images' and 'gradcam-maps' (private).

CREATE POLICY "Users access own scans"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'scan-images'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users access own gradcam"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'gradcam-maps'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
