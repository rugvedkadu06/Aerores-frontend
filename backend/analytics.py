
import random
import datetime

# DEMO: Seed random to ensure consistent "Video Ready" results on every reload
random.seed(42) 

def calculate_future_fatigue(pilot):
    """
    Project fatigue score for the next 7 days.
    DEMO MODE: Highlighting specific pilots for the video.
    """
    pilot_id = pilot.get('_id', '')
    current_score = pilot.get('fatigue_score', 0)
    
    trend = []
    
    # SCENARIO 1: The "Crisp" Pilot (Low Fatigue)
    if current_score < 20: 
        base_scores = [10, 12, 15, 8, 10, 25, 40]
        
    # SCENARIO 2: The "Overworked" Pilot (High Risk Demo)
    elif current_score > 70:
        # Show specific dangerous upward trend
        base_scores = [75, 82, 88, 60, 75, 90, 95]
        
    # SCENARIO 3: Average Pilot
    else:
        base_scores = [current_score]
        for _ in range(6):
            change = random.choice([-15, 10, 15])
            next_val = base_scores[-1] + change
            base_scores.append(max(10, min(90, next_val)))
            
    for i, score in enumerate(base_scores):
        date_label = (datetime.datetime.now() + datetime.timedelta(days=i)).strftime("%a")
        trend.append({
            "day": date_label,
            "score": score,
            "risk": "HIGH" if score > 80 else ("MEDIUM" if score > 50 else "LOW")
        })
        
    return trend

def estimate_disruption_cost(flights):
    """
    Calculate estimated cost of disruptions and potential savings.
    DEMO: Hardcoded for impressive video presentation.
    """
    # Fake specific numbers for the video
    current_cost = 45250  # "Current Waste"
    savings = 18900       # "Projected Savings"
    
    return {
        "current_waste": current_cost,
        "projected_savings": savings,
        "efficiency_score": 92 # High score for demo
    }

def get_disruption_predictions():
    """
    Mock prediction of future disruptions.
    DEMO: Ensure specific locations show high risk for the map/list.
    """
    risks = [
        {
            "location": "DEL", 
            "probability": 89, 
            "type": "Dense Fog (Visibility < 50m)", 
            "impact": "HIGH",
            "root_cause": "Weather Front moving from North",
            "recommendation": "Divert incoming flights to JAI",
            "details": "Visibility expected to drop below CAT-III limits."
        },
        {
            "location": "MUM", 
            "probability": 65, 
            "type": "Airspace Congestion", 
            "impact": "MEDIUM",
            "root_cause": "Peak Hour Traffic + Runway Maintenance",
            "recommendation": "Delay departures by 20m slots",
            "details": "Runway 09/27 operating at 50% capacity."
        },
        {
            "location": "BLR", 
            "probability": 12, 
            "type": "Clear", 
            "impact": "LOW",
            "root_cause": "N/A",
            "recommendation": "N/A",
            "details": "Optimum Flight Conditions."
        },
        {
            "location": "DXB", 
            "probability": 45, 
            "type": "Sandstorm Warning", 
            "impact": "MEDIUM",
            "root_cause": "Desert Winds > 40 knots",
            "recommendation": "Fuel up for potential holding pattern",
            "details": "Gusts affecting approach path."
        },
        {
            "location": "LHR", 
            "probability": 78, 
            "type": "ATC Staff Shortage", 
            "impact": "HIGH",
            "root_cause": "Industrial Action Notification",
            "recommendation": "Reduce daily slots by 15%",
            "details": "ATC throughput reduced to 30 movements/hr."
        }
    ]
            
    return sorted(risks, key=lambda x: x['probability'], reverse=True)
