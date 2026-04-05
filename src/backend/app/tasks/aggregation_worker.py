"""Background polling loop for aggregation rollups."""

from __future__ import annotations

import asyncio
import logging

logger = logging.getLogger(__name__)

AGGREGATION_INTERVAL_SECONDS = 30


async def aggregation_worker() -> None:
    """Run one aggregation cycle every 30 seconds until cancelled."""
    from app.services.aggregation_service import run_aggregation_cycle

    while True:
        try:
            await asyncio.to_thread(run_aggregation_cycle)
        except Exception:
            logger.exception("Aggregation cycle failed")
        await asyncio.sleep(AGGREGATION_INTERVAL_SECONDS)
