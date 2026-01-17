
import random
import datetime
from collections import Counter

def calculate_future_fatigue(pilot, days=7):
    """
    Project fatigue score for the next 'days' based on current state.
    Scale: Returns 0-100 for chart visualization.
    """
    # Normalize input (0.0 - 1.0) to (0 - 100)
    current_raw = pilot.get('fatigue_score', 0)
    current_score = current_raw * 100
    
    trend = []
    
    # Simulation Logic
    # specific_trend: Accumulates if working, drops if resting
    # We simulate a "mock roster" for the future
    
    running_score = current_score
    
    for i in range(days):
        date_label = (datetime.datetime.now() + datetime.timedelta(days=i)).strftime("%a")
        
        # Simple heuristic:
        # If score is high (>70), likely to get rest soon -> Drop
        # If score is low (<30), likely to fly -> Increase
        
        daily_change = 0
        
        if running_score > 80:
            daily_change = -30 # Mandatory Rest
        elif running_score < 40:
             daily_change = random.randint(10, 25) # Duty Day
        else:
             daily_change = random.choice([-15, 15, 20]) # Random assignment
             
        running_score += daily_change
        
        # Clamp 0-100
        running_score = max(5, min(95, running_score))
        
        trend.append({
            "day": date_label,
            "score": round(running_score, 1),
            "risk": "HIGH" if running_score > 70 else ("MEDIUM" if running_score > 40 else "LOW")
        })
        
    return trend

def estimate_disruption_cost(flights):
    """
    Calculate estimated cost based on actual delays.
    """
    total_delay_minutes = sum(f.get('delayMinutes', 0) for f in flights)
    
    # Assumptions per Industry Standards (India)
    # COST_PER_MINUTE_DELAY = Fuel ($50) + Crew ($30) + Pax Comp ($20) ~ $100
    cost_per_min = 100 
    
    current_waste = total_delay_minutes * cost_per_min
    
    # We estimate SkyCoPilot saves ~25% through optimization
    projected_savings = current_waste * 0.25
    
    # Efficiency Score: 100 - (Delay Impact)
    # If 0 delay -> 100.
    efficiency = max(0, 100 - (total_delay_minutes / 100)) # Arbitrary scaling
    
    return {
        "current_waste": int(current_waste),
        "projected_savings": int(projected_savings),
        "efficiency_score": int(efficiency)
    }

def get_disruption_predictions(flights, pilots):
    """
    Generate predictions based on actual DB patterns.
    """
    risks = []
    
    # 1. Analyze Airport Congestion (by Origin)
    delayed_flights = [f for f in flights if f.get('status') in ['DELAYED', 'CRITICAL']]
    origin_counts = Counter(f.get('origin') for f in delayed_flights)
    
    for airport, count in origin_counts.items():
        if count >= 2: # Low threshold for demo since total flights is small
            risks.append({
                "location": airport,
                "probability": min(95, 40 + (count * 10)),
                "type": "Airport Congestion",
                "impact": "HIGH" if count > 5 else "MEDIUM",
                "root_cause": f"Accumulation of {count} delayed flights",
                "recommendation": "Initiate Ground Stop Program",
                "details": f"Congestion detected at {airport}."
            })

    # 2. Analyze Weather Patterns (from reasons)
    reasons = [f.get('delayReason', '') for f in delayed_flights if f.get('delayReason')]
    weather_keywords = ['Fog', 'Rain', 'Storm', 'Wind']
    weather_count = sum(1 for r in reasons if any(w in r for w in weather_keywords))
    
    if weather_count > 2:
        risks.append({
            "location": "REGION-NORTH", 
            "probability": 85,
            "type": "Weather Front",
            "impact": "HIGH",
            "root_cause": "Multiple weather delays detected",
            "recommendation": "Activate Winter Ops Protocol",
            "details": "Correlated weather disruptions across network."
        })

    # 3. Analyze Crew Fatigue Pools
    fatigued_pilots = [p for p in pilots if p.get('fatigue_score', 0) > 0.7]
    if len(fatigued_pilots) > 3:
        risks.append({
            "location": "NETWORK",
            "probability": 75,
            "type": "Crew Depth Risk",
            "impact": "HIGH",
            "root_cause": f"{len(fatigued_pilots)} pilots near duty limits",
            "recommendation": "Call in Reserve Crew 24h early",
            "details": "High probability of crew timeout cascades."
        })
        
    # 4. Default "Clear" if empty
    if not risks:
        risks.append({
            "location": "SYSTEM",
            "probability": 5,
            "type": "Stable Operations",
            "impact": "LOW",
            "root_cause": "N/A",
            "recommendation": "Continue Standard Monitoring",
            "details": "No major risks detected in current telemetry."
        })
            
    return sorted(risks, key=lambda x: x['probability'], reverse=True)
