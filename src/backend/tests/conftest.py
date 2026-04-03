"""
Shared pytest fixtures.

Environment variables are set before any app module is imported because auth.py
and db.py read os.getenv() at module load time, not on first call.  Setting them
after the import would cause RuntimeError or connection failures before any test
function runs.

All startup side-effects (DB seeds, background workers) are patched out so the
test suite runs without a real database or MQTT broker.
"""

import asyncio
import os

# Must come before any `from main import ...` or `from app import ...` call.
os.environ.setdefault("JWT_SECRET", "test-secret-for-pytest-do-not-use-in-prod")
os.environ.setdefault("SUPABASE_DB_URL", "postgresql://fake:fake@localhost:5432/fake")

import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient


async def _noop_worker() -> None:
    """Stand-in for any long-running async worker (evaluator, MQTT subscriber).

    Sleeps until cancelled so it behaves like the real workers — a coroutine
    that lives for the entire app lifespan rather than returning immediately.
    """
    await asyncio.sleep(9999)


@pytest.fixture(scope="session")
def app():
    """Build one FastAPI app instance shared across the whole test session.

    scope="session" avoids re-importing and re-wiring the app for every test
    class.  All five startup side-effects are patched so no real I/O occurs:
      seed_demo_public_api_key  — would hit the DB
      seed_default_thresholds   — would hit the DB
      seed_demo_accounts        — Jason's seed, would hit the DB
      threshold_evaluator_worker — long-running polling loop
      run_mqtt_subscriber        — opens a TLS connection to Mosquitto
    """
    with (
        patch("app.shared.api_key_seed.seed_demo_public_api_key"),
        patch("app.shared.threshold_seed.seed_default_thresholds"),
        patch("app.shared.seed_accounts.seed_demo_accounts"),
        patch(
            "app.tasks.threshold_evaluator_worker.threshold_evaluator_worker",
            _noop_worker,
        ),
        patch(
            "app.tasks.mqtt_subscriber.run_mqtt_subscriber",
            _noop_worker,
        ),
    ):
        from main import app as fastapi_app  # noqa: PLC0415
        return fastapi_app


@pytest.fixture(scope="session")
def client(app):
    """Wrap the shared app in an HTTPX TestClient.

    The context manager ensures the FastAPI lifespan (startup/shutdown) runs
    exactly once per session, matching production behaviour.
    """
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="session")
def admin_token():
    """Signed JWT for an admin test account."""
    from app.shared.auth import create_access_token
    from app.shared.enums import UserRole

    return create_access_token(1, "admin@test.com", UserRole.admin)


@pytest.fixture(scope="session")
def operator_token():
    """Signed JWT for an operator test account.

    Used to verify that operator tokens are rejected on admin-only endpoints.
    """
    from app.shared.auth import create_access_token
    from app.shared.enums import UserRole

    return create_access_token(2, "operator@test.com", UserRole.operator)
