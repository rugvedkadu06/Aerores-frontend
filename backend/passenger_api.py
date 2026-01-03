from fastapi import APIRouter, HTTPException, Body
from database import db
from pydantic import BaseModel
import random
import datetime

router = APIRouter(prefix="/passenger", tags=["passenger"])

class FeedbackRequest(BaseModel):
    flight_id: str
    rating: int
    comment: str

class ChatRequest(BaseModel):
    message: str
    context: str = "general"

# --- Helper: Plain Language Generator ---
def get_plain_language_reason(reason: str, delay_min: int):
    if not reason: return "On Schedule", "Your flight is running on time."
    
    reason = reason.lower()
    if "fog" in reason or "weather" in reason:
        return "Weather Delays", f"We are waiting for visibility to improve. Safety is our priority."
    if "technical" in reason or "hydraulic" in reason:
        return "Aircraft Maintenance", "Our engineers are performing mandatory safety checks."
    if "doc" in reason or "crew" in reason or "fdtl" in reason or "sick" in reason:
        return "Crew Scheduling", "We are arranging a fresh crew for your flight as per regulatory safety limits."
    if "atc" in reason:
        return "Air Traffic Control", "Waiting for departure clearance from Air Traffic Control."
    
    return "Operational Delay", "We are working to minimize the delay. Thank you for your patience."

@router.get("/flight/{flight_id}")
async def get_passenger_flight_status(flight_id: str):
    flight = await db.flights.find_one({"_id": flight_id})
    if not flight:
        # Try finding by flight number if ID search fails (case insensitive)
        flight = await db.flights.find_one({"flightNumber": {"$regex": f"^{flight_id}$", "$options": "i"}})
        
    if not flight:
        raise HTTPException(status_code=404, detail="Flight not found")
        
    # Calculate mock rights based on delay
    delay_min = flight.get("delayMinutes", 0)
    rights = []
    if delay_min > 120: rights.append("Free Meal Voucher")
    if delay_min > 240: rights.append("Full Refund Option")
    if delay_min > 360: rights.append("Hotel Accommodation")
    
    plain_title, plain_desc = get_plain_language_reason(flight.get("delayReason"), delay_min)

    # Generate Mock Timeline (Static for prototype, but dynamic based on status)
    timeline = []
    sched_dep = flight.get("scheduledDeparture")
    if sched_dep:
        timeline.append({"time": (sched_dep - datetime.timedelta(minutes=120)).strftime("%H:%M"), "title": "Check-in Open", "status": "DONE"})
        
    if flight.get("status") == "DELAYED" or flight.get("status") == "CRITICAL":
         timeline.append({"time": datetime.datetime.now().strftime("%H:%M"), "title": plain_title, "description": plain_desc, "status": "CRITICAL"})
         timeline.append({"time": (sched_dep + datetime.timedelta(minutes=delay_min)).strftime("%H:%M"), "title": "New Estimated Departure", "status": "PENDING"})
    else:
         timeline.append({"time": sched_dep.strftime("%H:%M"), "title": "Boarding", "status": "PENDING"})

    return {
        "flight_id": flight["_id"],
        "flight_number": flight["flightNumber"],
        "origin": flight["origin"],
        "destination": flight["destination"],
        "status": flight["status"],
        "delay_minutes": delay_min,
        "plain_reason_title": plain_title,
        "plain_reason_desc": plain_desc,
        "rights": rights,
        "timeline": timeline,
        "vouchers": [{"type": "FOOD", "amount": "500 INR", "code": f"FOOD-{random.randint(1000,9999)}"}] if delay_min > 120 else []
    }

@router.post("/feedback")
async def submit_feedback(req: FeedbackRequest):
    # Log anonymous feedback
    print(f"FEEDBACK [Flight {req.flight_id}]: {req.rating}/5 - {req.comment}")
    return {"status": "SUBMITTED", "message": "Thank you for your feedback."}

@router.post("/support")
async def support_chat(req: ChatRequest):
    msg = req.message.lower()
    
    if "why" in msg and "delayed" in msg:
        return {"response": "The delay is primarily due to operational safety checks. See the status card for specific details."}
    if "food" in msg or "voucher" in msg:
        return {"response": "If your delay exceeds 2 hours, you are automatically eligible for a meal voucher. Refresh the page to check."}
    if "refund" in msg:
        return {"response": "Refunds are available for delays exceeding 4 hours. You can claim this at the service desk or via the 'Rights' tab."}
    if "time" in msg and "depart" in msg:
         return {"response": "Please check the 'Live Timeline' on your dashboard for the most up-to-date departure estimates."}
         
    return {"response": "I see. Could you please specify if you need help with 'Delay info', 'Vouchers', or 'Rebooking'?"}
