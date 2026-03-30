-- Migration: 002_create_api_keys
-- Stores hashed API keys for future public API authentication.

CREATE TABLE IF NOT EXISTS public.api_keys (
    id BIGSERIAL PRIMARY KEY,
    key_hash TEXT NOT NULL,
    label TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_used_at TIMESTAMPTZ NULL,
    CONSTRAINT api_keys_key_hash_unique UNIQUE (key_hash)
);

CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON public.api_keys (is_active);

-- Fast path: active keys only (typical validation query)
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash_active
    ON public.api_keys (key_hash)
    WHERE is_active = TRUE;
