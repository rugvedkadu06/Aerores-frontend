
class Flight {
  final String id;
  final String flightNumber;
  final String origin;
  final String destination;
  final String status; // ON_TIME, DELAYED, CRITICAL, CANCELLED
  final int delayMinutes;
  final String? delayReason;
  final bool predictedFailure;
  final String? pilotName;
  final String? assignedPilotId;
  final DateTime scheduledDeparture;

  Flight({
    required this.id,
    required this.flightNumber,
    required this.origin,
    required this.destination,
    required this.status,
    required this.delayMinutes,
    this.delayReason,
    required this.predictedFailure,
    this.pilotName,
    this.assignedPilotId,
    required this.scheduledDeparture,
  });

  factory Flight.fromJson(Map<String, dynamic> json) {
    return Flight(
      id: json['_id'],
      flightNumber: json['flightNumber'],
      origin: json['origin'],
      destination: json['destination'],
      status: json['status'],
      delayMinutes: json['delayMinutes'] ?? 0,
      delayReason: json['delayReason'],
      predictedFailure: json['predictedFailure'] ?? false,
      pilotName: json['Pilot_Name'],
      assignedPilotId: json['assignedPilotId'],
      scheduledDeparture: DateTime.parse(json['scheduledDeparture']),
    );
  }
}

class Pilot {
  final String id;
  final String name;
  final String base;
  final double fatigueScore;
  final String status;
  final int remainingDutyMinutes;

  Pilot({
    required this.id,
    required this.name,
    required this.base,
    required this.fatigueScore,
    required this.status,
    required this.remainingDutyMinutes,
  });

  factory Pilot.fromJson(Map<String, dynamic> json) {
    return Pilot(
      id: json['_id'],
      name: json['name'],
      base: json['base'],
      fatigueScore: (json['fatigue_score'] ?? 0).toDouble(),
      status: json['status'],
      remainingDutyMinutes: json['remainingDutyMinutes'],
    );
  }
}
