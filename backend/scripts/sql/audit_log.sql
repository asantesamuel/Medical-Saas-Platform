-- scripts/sql/audit_log.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- HIPAA Audit Log Table
-- Records who accessed what and when, without storing PHI payload.
-- Run this in the Supabase SQL Editor.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.audit_log (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type   TEXT         NOT NULL,   -- 'predict' | 'login' | 'admin_access' | 'data_export'
    user_id      UUID         NOT NULL,   -- FK to auth.users — UUID only, no email
    metadata     JSONB        NOT NULL DEFAULT '{}',  -- model_type, confidence_range — NO PHI
    ip_address   TEXT,                   -- hashed or partial — check your HIPAA BAA
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Index for time-based audit queries
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id    ON public.audit_log(user_id);

-- Enable RLS — only admins can read the audit log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read audit log"
    ON public.audit_log
    FOR SELECT
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

-- Only service role (FastAPI) can insert audit events
-- No INSERT policy needed for anon/authenticated — service role bypasses RLS

-- ─────────────────────────────────────────────────────────────────────────────
-- Trigger: auto-insert audit event on every prediction insert
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.log_prediction_access()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.audit_log (event_type, user_id, metadata)
    VALUES (
        'predict',
        NEW.user_id,
        jsonb_build_object(
            'model_type',   NEW.model_type,
            'model_version', NEW.model_version,
            'prediction_id', NEW.id
            -- confidence_score intentionally omitted — could be quasi-identifier
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_prediction_created
    AFTER INSERT ON public.predictions
    FOR EACH ROW EXECUTE FUNCTION public.log_prediction_access();
