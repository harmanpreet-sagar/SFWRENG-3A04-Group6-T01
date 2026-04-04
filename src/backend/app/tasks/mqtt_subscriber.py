"""
MQTT Subscriber — FastAPI Background Task

Connects to the Mosquitto MQTT broker over TLS on startup and subscribes
to the wildcard topic scemas/sensors/#. For every incoming message, parses
the JSON payload and passes it to the validation pipeline in validation_service.py.
Runs continuously as a background asyncio task alongside the FastAPI HTTP server.

This file imports the function "process_message" from validation_service.py (which calls the functions
that contain all the validation logic)

Print statements have also been included for debugging purposes to ensure the MQTT subscriber has 
been successfully connected. 
"""


import asyncio
import json
import os
import paho.mqtt.client as mqtt

from app.services.validation_service import process_message

MQTT_HOST = os.getenv("MQTT_BROKER_HOST", "localhost")
MQTT_PORT = int(os.getenv("MQTT_BROKER_PORT", 8883))
MQTT_USERNAME = "admin"
MQTT_PASSWORD = "admin123"
CA_CERT_PATH = os.getenv("MQTT_CA_CERT_PATH", "./mosquitto/config/certs/ca.crt")

def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        asyncio.run(process_message(payload))
    except Exception as e:
        print(f"❌ Error processing message: {e}")

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("✅ MQTT subscriber connected")
        client.subscribe("scemas/sensors/#")
    else:
        print(f"❌ MQTT subscriber connection failed: {rc}")

async def run_mqtt_subscriber():
    try:
        print(f"🔌 Connecting to MQTT at {MQTT_HOST}:{MQTT_PORT}")
        print(f"🔌 Using CA cert: {CA_CERT_PATH}")
        client = mqtt.Client()
        client.on_connect = on_connect
        client.on_message = on_message
        client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
        client.tls_set(ca_certs=CA_CERT_PATH)
        client.tls_insecure_set(True)
        client.connect(MQTT_HOST, MQTT_PORT)
        client.loop_start()
    except Exception as e:
        print(f"❌ MQTT subscriber failed to start: {e}")
        return

    # Keep running forever
    while True:
        await asyncio.sleep(1)