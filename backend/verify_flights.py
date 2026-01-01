import urllib.request
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

def get_json(url):
    with urllib.request.urlopen(url) as response:
        return json.loads(response.read().decode())

def seed_and_fetch():
    print(f"Seeding database via {BASE_URL}/seed ...")
    try:
        seed_data = get_json(f"{BASE_URL}/seed")
        print("Seed successful:", seed_data)
    except Exception as e:
        print("Error seeding:", e)
        return

    print(f"\nFetching data via {BASE_URL}/data ...")
    try:
        data = get_json(f"{BASE_URL}/data?limit=100")
        
        flights = data.get("flights", [])
        print(f"\nFound {len(flights)} flights:\n")
        print(f"{'Flight ID':<10} | {'Route':<30} | {'Date (Departure)':<20} | {'Pilot ID':<10} | {'Fatigue'}")
        print("-" * 90)
        
        for f in flights:
            f_id = f.get("Flight_ID", "N/A")
            route = f.get("Route", "N/A")
            # If Route is missing, construct from Origin/Dest
            if route == "N/A":
                route = f"{f.get('Origin', '?')} to {f.get('Destination', '?')}"
                
            dep = f.get("Departure_Time", "N/A")
            pid = f.get("Pilot_ID", "Unassigned")
            fatigue = f.get("Fatigue_Score", 0)
            
            print(f"{f_id:<10} | {route:<30} | {dep:<20} | {pid:<10} | {fatigue}")

    except Exception as e:
        print("Error fetching data:", e)

    # Write to file for checking
    try:
        with open("flights_report.txt", "w", encoding="utf-8") as f:
            f.write(f"Seed successful\n")
            if 'flights' in locals():
                f.write(f"\nFound {len(flights)} flights:\n")
                f.write(f"{'Flight ID':<10} | {'Route':<30} | {'Date (Dep)':<20} | {'Airline':<15} | {'Status'}\n")
                f.write("-" * 100 + "\n")
                
                for fl in flights:
                    f_id = fl.get("Flight_ID", "N/A")
                    route = fl.get("Route", "MISSING")
                    dep = fl.get("Departure_Time", "N/A") # Checking legacy format
                    airline = fl.get("Airline", "N/A")
                    status = fl.get("Sys_Status", "N/A")
                    
                    f.write(f"{f_id:<10} | {route:<30} | {dep:<20} | {airline:<15} | {status}\n")

                    if f_id == "FLY1010":
                         f.write(f"\n[VERIFICATION] FLY1010 Full Dump: {json.dumps(fl, indent=2, default=str)}\n")

            if 'pilot_readiness' in response_data:
                pilots = response_data['pilot_readiness']
                f.write(f"\n\nFound {len(pilots)} pilot readiness records:\n")
                f.write(f"{'Pilot ID':<10} | {'Name':<20} | {'Status':<15} | {'Cert':<10} | {'Age':<5} | {'Exp':<5}\n")
                f.write("-" * 80 + "\n")
                
                for p in pilots:
                    pid = p.get("Pilot_ID", "N/A")
                    name = p.get("Pilot_Name", "N/A")
                    status = p.get("Pilot_Status", "N/A")
                    cert = p.get("Certification", "MISSING")
                    age = p.get("Age", "MISSING")
                    exp = p.get("Experience_Years", "MISSING")
                    
                    f.write(f"{pid:<10} | {name:<20} | {status:<15} | {cert:<10} | {age:<5} | {exp:<5}\n")
                    
                    if pid == "PLT6563" or pid == "PLT5544": # Check target pilots
                        f.write(f"[VERIFICATION] {pid} Full Dump: {json.dumps(p, indent=2, default=str)}\n")

    except Exception as e:
        print("Error writing report:", e)

if __name__ == "__main__":
    seed_and_fetch()
