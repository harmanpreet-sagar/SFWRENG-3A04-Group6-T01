-- Migration: 004_create_aggregated_data
-- Time-bucketed aggregate summaries written by the aggregation subsystem.
--
-- Supports:
--   - 5-minute averages   (aggregation_window='5m', aggregation_type='avg')
--   - 5-minute maxima     (aggregation_window='5m', aggregation_type='max')
--   - hourly maxima       (aggregation_window='1h', aggregation_type='max')
--
-- The uniqueness constraint makes each aggregate bucket idempotent so the
-- background worker can safely upsert the same summary window on retries.

CREATE TABLE IF NOT EXISTS public.aggregated_data (
    id BIGSERIAL PRIMARY KEY,
    zone TEXT NOT NULL,
    metric TEXT NOT NULL,
    aggregation_window TEXT NOT NULL,
    aggregation_type TEXT NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    window_start TIMESTAMPTZ NOT NULL,
    window_end TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT aggregated_data_window_check
        CHECK (aggregation_window IN ('5m', '1h')),
    CONSTRAINT aggregated_data_type_check
        CHECK (aggregation_type IN ('avg', 'max')),
    CONSTRAINT aggregated_data_window_order_check
        CHECK (window_start < window_end),
    CONSTRAINT uq_aggregated_data_bucket
        UNIQUE (zone, metric, aggregation_window, aggregation_type, window_end)
);

CREATE INDEX IF NOT EXISTS idx_aggregated_data_zone_metric_window_type_end
    ON public.aggregated_data (
        zone,
        metric,
        aggregation_window,
        aggregation_type,
        window_end DESC
    );

CREATE INDEX IF NOT EXISTS idx_aggregated_data_window_type_end
    ON public.aggregated_data (aggregation_window, aggregation_type, window_end DESC);
