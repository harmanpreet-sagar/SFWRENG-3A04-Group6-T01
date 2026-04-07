"""Pydantic models for aggregation endpoints and worker outputs."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class AggregationPoint(BaseModel):
    metric: str = Field(..., min_length=1)
    value: float
    aggregation_window: str
    aggregation_type: str
    window_start: datetime
    window_end: datetime


class AggregationZoneSummary(BaseModel):
    zone: str = Field(..., min_length=1)
    metrics: list[AggregationPoint]
    updated_at: datetime


class AggregationZonesResponse(BaseModel):
    zones: list[AggregationZoneSummary]
    total: int


class AggregationHistoryPoint(BaseModel):
    value: float
    window_start: datetime
    window_end: datetime


class AggregationHistoryResponse(BaseModel):
    zone: str = Field(..., min_length=1)
    metric: str = Field(..., min_length=1)
    aggregation_window: str
    aggregation_type: str
    points: list[AggregationHistoryPoint]
    total: int
