from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import datetime
import traceback
import random
import math

import csv
import os

from database import (
    db, get_pilots, get_flights, get_disruptions, 
    seed_db, update_pilot_status, assign_pilot_to_flight, create_disruption
)
from solver import solve_roster_optimization
from agents import AgentSystem
from models import Pilot, Flight, Disruption

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory logs
LATEST_AGENT_LOGS = []

# Models
class SimulationRequest(BaseModel):
    type: str

class HealRequest(BaseModel):
    mode: str

class ResolveRequest(BaseModel):
    option: dict

class CreatePilotRequest(BaseModel):
    name: str
    base: str
    fatigue_score: int = 0

class CreateFlightRequest(BaseModel):
    origin: str
    destination: str
    departure_delay_hours: float

@app.get("/")
def read_root():
    return {"message": "Aero-Resilience Backend Online"}

@app.get("/seed")
async def seed_data():
    """Resets DB and seeds with data from pilot.csv and aero.csv."""
    await db.flights.drop()
    await db.pilots.drop() 
    await db.pilot_readiness.drop()
    
    base_path = "e:\\ARes\\backend"
    pilot_csv_path = os.path.join(base_path, "pilot.csv")
    aero_csv_path = os.path.join(base_path, "aero.csv")
    
    # 1. Load Aero Data (Disruptions/Context)
    aero_map = {}
    if os.path.exists(aero_csv_path):
        with open(aero_csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Normalize ID: FLxxxx -> FLYxxxx
                clean_id = row.get('flight_id', '').strip()
                if clean_id.startswith('FL') and not clean_id.startswith('FLY'):
                    clean_id = clean_id.replace('FL', 'FLY', 1)
                aero_map[clean_id] = row

    flights = []
    readiness_records = []
    
    # 2. Iterate Pilot Data (Primary Roster)
    if os.path.exists(pilot_csv_path):
        with open(pilot_csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                f_id = row.get('Flight_ID', '').strip()
                
                # Merge with Aero Data
                aero_info = aero_map.get(f_id, {})
                
                # Construct Flight Document
                # Use pilot.csv as base, overwrite/enrich with aero.csv
                # Generate Dynamic Timestamps for Gantt
                now = datetime.datetime.now()
                # Random offset 0-12 hours
                offset_mins = random.randint(30, 720) 
                duration_mins = random.randint(60, 240) # 1-4 hours
                
                dep_time = now + datetime.timedelta(minutes=offset_mins)
                arr_time = dep_time + datetime.timedelta(minutes=duration_mins)

                flight_doc = {
                    "Flight_ID": f_id, 
                    "Origin": row.get('Origin', 'DEL'),
                    "Destination": row.get('Destination', 'BOM'),
                    "Route": row.get('Route') if row.get('Route') else f"{row.get('Origin', 'DEL')} to {row.get('Destination', 'BOM')}",
                    "Departure_Time": dep_time.strftime("%Y-%m-%d %H:%M"), 
                    "Arrival_Time": arr_time.strftime("%Y-%m-%d %H:%M"),
                    "Departure": dep_time.isoformat(), 
                    "Arrival": arr_time.isoformat(),
                    "Aircraft_Type": row.get('Aircraft_Type'),
                    "Flight_Duration": f"{duration_mins // 60}h {duration_mins % 60}m",
                    
                    # Pilot Info
                    "Pilot_ID": row.get('Pilot_ID'),
                    "Name": row.get('Name'),
                    "Rank": row.get('Rank'),
                    "Certification": row.get('Certification'),
                    "Age": row.get('Age'), 
                    "Experience_Years": row.get('Experience_Years'),
                    "Rest_Hours": row.get('Rest_Hours'),
                    "Fatigue_Score": int(row.get('Fatigue_Score', 0) or 0),
                    "Last_Flight_Time": row.get('Last_Flight_Time'),
                    
                    # Aero / Status Info
                    "Sys_Status": "SCHEDULED", 
                    "Airline": row.get('Airline', aero_info.get('airline', 'IndiGo')), 
                    "Disruption_Type": None,
                    "Delay_Minutes": 0,
                    "Recovery_Action": None,
                    "Weather_Conditions": aero_info.get('weather_conditions')
                }
                
                # Convert numeric fields if possible
                try: flight_doc["Age"] = int(flight_doc["Age"])
                except: pass
                
                flights.append(flight_doc)
                
                # Construct Readiness Document
                readiness_doc = {
                    "Flight_ID": f_id,
                    "Pilot_ID": flight_doc["Pilot_ID"],
                    "Fatigue_Risk_Score": flight_doc["Fatigue_Score"],
                    "Pilot_Status": "ROSTERED" if flight_doc["Sys_Status"] not in ["CANCELLED", "COMPLETED"] else "AVAILABLE",
                    "Pilot_Name": flight_doc["Name"],
                    "Rank": flight_doc["Rank"],
                    "Certification": flight_doc["Certification"],
                    "Age": flight_doc["Age"],
                    "Experience_Years": flight_doc["Experience_Years"]
                }
                readiness_records.append(readiness_doc)
    
    # OVERRIDE FOR FLY1001
    for f in flights:
        if f.get("Flight_ID") == "FLY1001":
            f.update({
                "Route": "Guwahati to Pune",
                "Departure_Time": "2025-12-31 03:00",
                "Arrival_Time": "2025-12-31 04:56",
                "Aircraft_Type": "A320",
                "Flight_Duration": "1h 56m",
                "Pilot_ID": "PLT6563",
                "Name": "FO_49",
                "Rank": "First Officer",
                "Certification": "A320",
                "Age": 28,
                "Experience_Years": 7,
                "Rest_Hours": 15,
                "Fatigue_Score": 3,
                "Last_Flight_Time": "2025-12-30 12:00"
            })
            break
            
    for r in readiness_records:
        if r.get("Flight_ID") == "FLY1001":
            r.update({
                "Pilot_ID": "PLT6563",
                "Fatigue_Risk_Score": 81.1,
                "Pilot_Status": "NEEDS_REST",
                "Suggested_Alternative_Pilot": "PLT8279",
                "Pilot_Name": "FO_49", 
                "Rank": "First Officer",
                "Certification": "A320",
                "Age": 28,
                "Experience_Years": 7
            })
            break

    # Generate Reserve Pilots (to ensure healing options exist)
    for i in range(1, 6):
        readiness_records.append({
            "Flight_ID": None,
            "Pilot_ID": f"RES-{i:03d}",
            "Fatigue_Risk_Score": 5 * i, # Low fatigue
            "Pilot_Status": "AVAILABLE",
            "Pilot_Name": f"Reserve Pilot {i}",
            "Rank": "CAPTAIN" if i % 2 == 0 else "FIRST OFFICER"
        })
    
    if flights:
        await db.flights.insert_many(flights)
    if readiness_records:
        await db.pilot_readiness.insert_many(readiness_records)
    
    global LATEST_AGENT_LOGS
    LATEST_AGENT_LOGS = []
    
    return {
        "status": "SEEDED", 
        "message": f"Database populated from CSVs. Flights: {len(flights)}, Readiness: {len(readiness_records)}"
    }

@app.get("/status")
async def check_system_status():
    try:
         # Check for critical issues
         # CANCELLED is not critical (resolved). DELAYED is critical until acknowledged/rescheduled.
         critical = await db.flights.count_documents({
             "$or": [
                 {"Fatigue_Score": {"$gt": 80}}, 
                 {"Sys_Status": {"$in": ["DELAYED", "UNASSIGNED", "RISK_HIGH"]}}
             ]
         })
         
         if critical > 0:
             return {"status": "INFEASIBLE", "details": f"{critical} Critical Events"}
         return {"status": "VALID"}
    except:
        return {"status": "UNKNOWN"}

@app.post("/simulate")
async def simulate_disruption(req: SimulationRequest):
    try:
        # Target assigned flights for realistic simulation
        flights = await db.flights.find({"Sys_Status": "SCHEDULED"}).to_list(100)
        
        # Filter for assigned if needed or just pick one valid
        # Ideally we pick one that has a pilot
        valid_flights = [f for f in flights if f.get("Pilot_ID")]
        if not valid_flights: return {"status": "ERROR", "message": "No assigned flights found."}
        
        target = valid_flights[0] 
        message = ""
        
        if req.type == "CREW": 
             await db.flights.update_one({"_id": target["_id"]}, {
                 "$set": {
                     "Name": "UNASSIGNED", 
                     "Pilot_ID": None,
                     "Sys_Status": "UNASSIGNED",
                     "Disruption_Type": "CREW_SICKNESS",
                     "Delay_Minutes": 0
                 }
             })
             await db.pilot_readiness.update_one({"Pilot_ID": target["Pilot_ID"]}, {
                 "$set": {"Pilot_Status": "SICK", "Fatigue_Risk_Score": 0}
             })
             message = f"Pilot for {target['Flight_ID']} reported SICK."

        elif req.type == "TECHNICAL":
             await db.flights.update_one({"_id": target["_id"]}, {
                 "$set": {"Sys_Status": "DELAYED", "Delay_Minutes": 120, "Disruption_Type": "TECHNICAL"}
             })
             message = f"Technical Fault on {target['Flight_ID']}."

        elif req.type == "ATC":
             await db.flights.update_one({"_id": target["_id"]}, {
                 "$set": {"Sys_Status": "DELAYED", "Delay_Minutes": 45, "Disruption_Type": "ATC"}
             })
             message = f"ATC Restriction for {target['Flight_ID']}."
             
        elif req.type == "WEATHER":
             await db.flights.update_many({"Route": {"$regex": "DEL"}}, {
                 "$set": {"Sys_Status": "DELAYED", "Disruption_Type": "WEATHER"}
             })
             message = "Weather Delays at DEL."

        # Log
        await create_disruption({"type": req.type, "timestamp": datetime.datetime.now(), "resolved": False})
        
        LATEST_AGENT_LOGS.append(f"LOG: Crisis Detected -> {message}")
        LATEST_AGENT_LOGS.append(f"LOG: Agent Triggered -> {req.type} Protocol Initiated")
        
        return {"status": "CRISIS_INJECTED", "message": message}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))



@app.post("/heal")
async def heal_system(req: HealRequest):
    try:
        # Check Critical Flights
        flight = await db.flights.find_one({"Sys_Status": {"$in": ["UNASSIGNED", "RISK_HIGH", "DELAYED"]}})
        
        if not flight:
             LATEST_AGENT_LOGS.append("LOG: Monitoring... No critical anomalies detected.")
             return {"status": "NO_ACTION", "message": "No critical flights found."}
        
        options = []
        readiness_recs = []

        if flight.get('Sys_Status') == 'DELAYED': 
             delay = flight.get('Delay_Minutes', 0)
             options.append({
                 "id": "OPT_RESCHEDULE", 
                 "title": f"Reschedule {flight['Flight_ID']}",
                 "description": f"Update ETD by {delay} mins. Restore VALID Logic.",
                 "action_type": "RESCHEDULE",
                 "payload": {"flight_id": flight['Flight_ID'], "delay_minutes": delay}
             })
        else:
             # Get Available Pilots from Readiness
             readiness_recs = await db.pilot_readiness.find({"Pilot_Status": "AVAILABLE"}).to_list(100)
        
        # Option 1: Best Available (Lowest Fatigue)
        if readiness_recs:
             best = min(readiness_recs, key=lambda x: x['Fatigue_Risk_Score'])
             # Get Pilot Name from flight or a Pilot Lookup (for simplicity assume we can get name or just use ID)
             # But wait, readiness doesn't have Name. We might need to fetch a flight where this pilot was assigned or just use ID.
             # Actually, since we dropped 'pilots' collection, we only have names in 'flights'.
             # Let's simple use "Pilot <ID>" for now or fetch a valid name.
             
             options.append({
                "id": "OPT_1",
                "title": f"Assign {best['Pilot_ID']}",
                "description": f"Fatigue Risk: {best['Fatigue_Risk_Score']}%. Immediate Availability.",
                "action_type": "ASSIGN",
                "payload": {"flight_id": flight['Flight_ID'], "pilot_id": best['Pilot_ID']}
             })
             
             # Option 2
             if len(readiness_recs) > 1:
                  p2 = readiness_recs[1]
                  options.append({
                    "id": "OPT_2",
                    "title": f"Assign {p2['Pilot_ID']} (Standby)",
                    "description": f"Fatigue Risk: {p2['Fatigue_Risk_Score']}%. Swapping form standby.",
                    "action_type": "ASSIGN",
                    "payload": {"flight_id": flight['Flight_ID'], "pilot_id": p2['Pilot_ID']}
                 })

        # Option 3: Cancel
        options.append({
            "id": "OPT_3",
            "title": f"Cancel Flight {flight['Flight_ID']}",
            "description": "Operational constraints exceeded. Prevent cascading delay.",
            "action_type": "CANCEL",
            "payload": {"flight_id": flight['Flight_ID']}
        })
        
        LATEST_AGENT_LOGS.append(f"LOG: Analysis complete. Risk assessment for Flight {flight['Flight_ID']}.")
        
        if req.mode == "MANUAL":
            LATEST_AGENT_LOGS.append("LOG: Options Generated. Awaiting User Approval (HITL).")
            return {
                "status": "OPTIONS_GENERATED", 
                "options": options,
                "agent_nodes": [
                    {"id": "detect", "label": "Anomaly Detected", "status": "active"},
                    {"id": "analyze", "label": "Analyzing Constraints", "status": "active"},
                    {"id": "negotiate", "label": "Negotiating Crew", "status": "pending"},
                    {"id": "resolve", "label": "Awaiting Approval", "status": "pending"}
                ]
            }
        
        else:
             # Auto Heal
             best = options[0]
             LATEST_AGENT_LOGS.append(f"LOG: Auto-Negotiation successful. Selected option: {best['title']}")
             
             if best['action_type'] == 'ASSIGN':
                 # update flight
                 await db.flights.update_one({"Flight_ID": best['payload']['flight_id']}, {
                     "$set": {"Pilot_ID": best['payload']['pilot_id'], "Sys_Status": "SCHEDULED", "Name": f"Pilot {best['payload']['pilot_id']}"}
                 })
                 # update readiness
                 await db.pilot_readiness.update_one({"Pilot_ID": best['payload']['pilot_id']}, {
                     "$set": {"Pilot_Status": "ROSTERED"}
                 })
             elif best['action_type'] == 'RESCHEDULE':
                 await db.flights.update_one({"Flight_ID": best['payload']['flight_id']}, {
                     "$set": {"Sys_Status": "SCHEDULED", "Disruption_Type": None}
                 })
                 
             LATEST_AGENT_LOGS.append(f"LOG: HEALED -> Applied Fix: {best['title']}")
             return {"status": "HEALED", "message": f"Applied {best['title']}"}

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

class ResolveRequest(BaseModel):
    option: dict

@app.post("/resolve")
async def resolve_crisis(req: ResolveRequest):
    try:
        opt = req.option
        if opt['action_type'] == 'ASSIGN':
             await db.flights.update_one({"Flight_ID": opt['payload']['flight_id']}, {
                 "$set": {"Pilot_ID": opt['payload']['pilot_id'], "Sys_Status": "SCHEDULED", "Name": f"Capt. {opt['payload']['pilot_id']}"}
             })
             # Restore readiness
             await db.pilot_readiness.update_one({"Pilot_ID": opt['payload']['pilot_id']}, {
                 "$set": {"Pilot_Status": "ROSTERED"}
             })
             
        elif opt['action_type'] == 'CANCEL':
             await db.flights.update_one({"Flight_ID": opt['payload']['flight_id']}, {
                 "$set": {"Sys_Status": "CANCELLED"}
             })
             
        elif opt['action_type'] == 'RESCHEDULE':
             # Simply acknowledge delay and set status to SCHEDULED (Valid)
             await db.flights.update_one({"Flight_ID": opt['payload']['flight_id']}, {
                 "$set": {"Sys_Status": "SCHEDULED", "Disruption_Type": None}
             })

        LATEST_AGENT_LOGS.append(f"LOG: User Approved -> {opt['title']}")
        LATEST_AGENT_LOGS.append("LOG: Execution Component -> Changes Committed to DB.")
        
        return {"status": "RESOLVED", "message": f"Executed {opt['title']}"}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/data")
async def get_data(page: int = 1, limit: int = 20):
    try:
        # Get Readiness for Dashboard
        readiness = await db.pilot_readiness.find().to_list(100)
        
        # Get Flights Paginated
        current_skip = (page - 1) * limit
        flights_cursor = db.flights.find().skip(current_skip).limit(limit)
        flights = await flights_cursor.to_list(length=limit)
        
        total = await db.flights.count_documents({})
        
        # Convert _id to string
        for f in flights: f['_id'] = str(f['_id'])
        for r in readiness: r['_id'] = str(r['_id'])

        return {
            "pilot_readiness": readiness,
            "flights": flights,
            "total_flights": total,
            "agent_logs": LATEST_AGENT_LOGS
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))



@app.post("/pilots")
async def create_pilot(req: CreatePilotRequest):
    try:
        # Generate ID
        pilots = await get_pilots()
        next_id = f"P{len(pilots) + 1:03d}"
        
        new_pilot = {
            "_id": next_id,
            "name": req.name,
            "base": req.base,
            "fatigue_score": req.fatigue_score,
            "last_night_duty": False,
            "hours_last_7_days": 0,
            "last_rest_end": datetime.datetime.now(),
            "status": "AVAILABLE"
        }
        await db.pilots.insert_one(new_pilot)
        return {"status": "CREATED", "pilot_id": next_id}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))



@app.post("/flights")
async def create_flight(req: CreateFlightRequest):
    try:
        flights = await get_flights()
        next_id = f"6E-{100 + len(flights) + 1}"
        
        dep = datetime.datetime.now() + datetime.timedelta(hours=req.departure_delay_hours)
        arr = dep + datetime.timedelta(hours=2) # Default 2hr flight
        
        new_flight = {
            "_id": next_id,
            "origin": req.origin,
            "destination": req.destination,
            "departure": dep,
            "arrival": arr,
            "landings": 1,
            "is_night_duty": (dep.hour > 22 or dep.hour < 5),
            "assigned_pilot": None,
            "status": "UNASSIGNED"
        }
        await db.flights.insert_one(new_flight)
        return {"status": "CREATED", "flight_id": next_id}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

