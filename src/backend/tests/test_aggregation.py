"""
Aggregation endpoint tests.

Repository/service calls are mocked — no real DB required.
Run from src/backend/: pytest tests/test_aggregation.py -v
"""

from __future__ import annotations

from datetime import datetime, timezone
from unittest.mock import patch

from app.shared.aggregation import (
    AggregationHistoryPoint,
    AggregationHistoryResponse,
    AggregationPoint,
    AggregationZoneSummary,
    AggregationZonesResponse,
)

_NOW = datetime(2026, 4, 5, 12, 0, 0, tzinfo=timezone.utc)


def _auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def _sample_zone_summary(zone: str = "zone-1") -> AggregationZoneSummary:
    return AggregationZoneSummary(
        zone=zone,
        metrics=[
            AggregationPoint(
                metric="aqi",
                value=42.0,
                aggregation_window="5m",
                aggregation_type="avg",
                window_start=_NOW,
                window_end=_NOW,
            )
        ],
        updated_at=_NOW,
    )


class TestAggregationAuth:
    def test_list_requires_token(self, client):
        r = client.get("/aggregation/zones")
        assert r.status_code == 401

    def test_get_zone_requires_token(self, client):
        r = client.get("/aggregation/zones/zone-1")
        assert r.status_code == 401

    def test_history_requires_token(self, client):
        r = client.get("/aggregation/zones/zone-1/history?metric=aqi")
        assert r.status_code == 401


class TestAggregationEndpoints:
    def test_list_zones(self, client, operator_token):
        payload = AggregationZonesResponse(
            zones=[_sample_zone_summary()],
            total=1,
        )
        with patch("app.routers.aggregation.list_latest_zone_aggregates", return_value=payload):
            r = client.get("/aggregation/zones", headers=_auth(operator_token))
        assert r.status_code == 200
        body = r.json()
        assert body["total"] == 1
        assert body["zones"][0]["zone"] == "zone-1"

    def test_get_one_zone(self, client, operator_token):
        with patch(
            "app.routers.aggregation.get_latest_zone_aggregates",
            return_value=_sample_zone_summary("zone-2"),
        ):
            r = client.get("/aggregation/zones/zone-2", headers=_auth(operator_token))
        assert r.status_code == 200
        assert r.json()["zone"] == "zone-2"

    def test_get_one_zone_not_found(self, client, operator_token):
        with patch(
            "app.routers.aggregation.get_latest_zone_aggregates",
            return_value=None,
        ):
            r = client.get("/aggregation/zones/missing", headers=_auth(operator_token))
        assert r.status_code == 404
        assert r.json()["detail"]["error"] == "zone_not_found"

    def test_history(self, client, operator_token):
        payload = AggregationHistoryResponse(
            zone="zone-1",
            metric="aqi",
            aggregation_window="5m",
            aggregation_type="avg",
            points=[
                AggregationHistoryPoint(
                    value=42.0,
                    window_start=_NOW,
                    window_end=_NOW,
                )
            ],
            total=1,
        )
        with patch(
            "app.routers.aggregation.get_zone_metric_history",
            return_value=payload,
        ):
            r = client.get(
                "/aggregation/zones/zone-1/history?metric=aqi&limit=10",
                headers=_auth(operator_token),
            )
        assert r.status_code == 200
        body = r.json()
        assert body["zone"] == "zone-1"
        assert body["metric"] == "aqi"
        assert body["total"] == 1
