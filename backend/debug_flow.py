import urllib.request
import json
import time

API_URL = "http://localhost:8000"

def post_json(url, data):
    req = urllib.request.Request(
        url, 
        data=json.dumps(data).encode('utf-8'), 
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req) as f:
        return json.loads(f.read().decode('utf-8'))

def get_json(url):
    with urllib.request.urlopen(url) as f:
        return json.loads(f.read().decode('utf-8'))

def test_flow():
    # 1. Seed
    print("Seeding...")
    get_json(f"{API_URL}/seed")
    time.sleep(1)
    
    # 2. Simulate
    print("Simulating SICKNESS...")
    res = post_json(f"{API_URL}/simulate", {"type": "SICKNESS"})
    print("Simulate Response:", res)
    
    # 3. Check Status
    status = get_json(f"{API_URL}/status")
    print("System Status:", status)
    
    # 4. Heal (Auto)
    print("Healing (AUTO)...")
    heal_res = post_json(f"{API_URL}/heal", {"mode": "AUTO"})
    print("Heal Response:", heal_res)
    
    # 5. Check Logs
    data = get_json(f"{API_URL}/data?limit=1")
    print("Logs:")
    for log in data['agent_logs']:
        print(log)

if __name__ == "__main__":
    test_flow()
