from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class Pilot(BaseModel):
    id: str = Field(..., alias="_id")
    name: str
    base: str
    fatigue_score: int
    last_night_duty: bool
    hours_last_7_days: int
    last_rest_end: datetime
    status: str  # AVAILABLE, ROSTERED, SICK, FATIGUED

class Flight(BaseModel):
    id: str = Field(..., alias="_id")
    origin: str
    destination: str
    departure: datetime
    arrival: datetime
    landings: int
    is_night_duty: bool
    assigned_pilot: Optional[str] = None
    status: str  # SCHEDULED, COMPLETED, CANCELLED, UNASSIGNED

class Disruption(BaseModel):
    type: str  # PILOT_SICKNESS, DELAY, etc.
    reference_id: str
    timestamp: datetime
    resolved: bool = False

class RosterStatus(BaseModel):
    status: str  # VALID, INFEASIBLE, HEALING
    unassigned_flights: List[str] = []
    message: Optional[str] = None
