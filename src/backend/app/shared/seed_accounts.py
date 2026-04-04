"""
Seed script: insert one ADMIN and one OPERATOR account on startup
Called from main.py lifespan with other seeds
"""
from __future__ import annotations
 
import bcrypt
from app.shared.db import db_connection
 
 
DEMO_ACCOUNTS = [
    {
        "name":      "Demo Admin",
        "email":     "admin@demo.com",
        "password":  "admin123",
        "clearance": "admin",
    },
    {
        "name":      "Demo Operator",
        "email":     "operator@demo.com",
        "password":  "operator123",
        "clearance": "operator",
    },
]
 
 
def seed_demo_accounts() -> None:
    """
    Upsert demo accounts on every startup.

    ON CONFLICT DO UPDATE ensures the password is always reset to the value
    defined above, so a stale hash from a previous run never locks out the demo.
    """
    with db_connection() as conn:
        cursor = conn.cursor()
        for account in DEMO_ACCOUNTS:
            password_hash = bcrypt.hashpw(
                account["password"].encode(), bcrypt.gensalt()
            ).decode()
            cursor.execute(
                """
                INSERT INTO accounts (name, email, password, clearance)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (email) DO UPDATE
                    SET password  = EXCLUDED.password,
                        clearance = EXCLUDED.clearance,
                        is_active = TRUE
                """,
                (account["name"], account["email"], password_hash, account["clearance"]),
            )
        conn.commit()
 