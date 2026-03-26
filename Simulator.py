import time
import random
import argparse
import json
from datetime import datetime, timezone

ZONES = ["zone-a", "zone-b", "zone-c", "zone-d"]
METRICS = ["aqi", "temperature", "humidity", "noise"]
SENSORS = ["sensor-001", "sensor-002", "sensor-003"]

RANGES = {
    "aqi": (0, 500),
    "temperature": (-30, 50),
    "humidity": (0, 100),
    "noise": (0, 140),
}

#functions:
def generate_value(metric):
    low, high = RANGES[metric]
    return round(random.uniform(low, high), 2)


def generate_payload(zone, metric, sensor_id):
    return {
        "sensorId": sensor_id,
        "zone": zone,
        "metricType": metric,
        "value": generate_value(metric),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


def build_topic(zone, metric):
    return f"scemas/sensors/{zone}/{metric}"


#spikes. literally just command line arguments. Outputs data only once. 
def generate_spike(zone, metric, value):
    payload = {
        "sensorId": "sensor-spike",
        "zone": zone,
        "metricType": metric,
        "value": value,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

    topic = build_topic(zone, metric)

    print("\n🚨 SPIKE EVENT 🚨")
    print(f"Topic: {topic}")
    print(json.dumps(payload, indent=2))
    #note for now i think we dont care about which sensor the spike came from, we just want to test it


# -----------------------------
# Main loop
# -----------------------------
def run_simulator(selected_zone=None, rate=2.5):
    while True:
        zone = selected_zone if selected_zone else random.choice(ZONES)
        metric = random.choice(METRICS)
        sensor = random.choice(SENSORS)

        payload = generate_payload(zone, metric, sensor)
        topic = build_topic(zone, metric)

        print(f"\n📡 Publishing")
        print(f"Topic: {topic}")
        print(json.dumps(payload, indent=2))

        # Later replace this with:
        # client.publish(topic, json.dumps(payload))

        time.sleep(rate)


# -----------------------------
# CLI
# -----------------------------
def main():
    parser = argparse.ArgumentParser(description="SCEMAS Sensor Simulator")

    parser.add_argument("--zone", type=str, help="Target a specific zone")
    parser.add_argument("--rate", type=float, default=2.5, help="Publish rate in seconds")

    parser.add_argument(
        "--spike",
        nargs=3,
        metavar=("ZONE", "METRIC", "VALUE"),
        help="Trigger a spike event (e.g. --spike zone-a aqi 400)"
    )

    args = parser.parse_args()

    # Handle spike mode
    if args.spike:
        zone, metric, value = args.spike
        generate_spike(zone, metric, float(value))
        return

    # Run normal simulator
    run_simulator(selected_zone=args.zone, rate=args.rate)


if __name__ == "__main__":
    main()