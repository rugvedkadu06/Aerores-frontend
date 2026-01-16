
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../models/data_models.dart';

class FlightTableWidget extends StatelessWidget {
  final List<Flight> flights;

  const FlightTableWidget({super.key, required this.flights});

  @override
  Widget build(BuildContext context) {
    if (flights.isEmpty) {
        return const Center(child: Text("No Active Flights", style: TextStyle(color: Colors.grey)));
    }
  
    return ListView.builder(
      itemCount: flights.length,
      itemBuilder: (context, index) {
        final flight = flights[index];
        final isCritical = flight.status == 'CRITICAL';
        final isDelayed = flight.status == 'DELAYED';
        
        Color statusColor = Colors.green;
        if (isCritical) statusColor = Colors.red;
        if (isDelayed) statusColor = Colors.orange;

        return Container(
          margin: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(
            color: const Color(0xFF111827),
            borderRadius: BorderRadius.circular(8),
            border: Border(left: BorderSide(color: statusColor, width: 4)),
          ),
          child: ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            leading: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(flight.flightNumber, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                Text("${flight.origin}→${flight.destination}", style: const TextStyle(fontSize: 10, color: Colors.grey)),
              ],
            ),
            title: Text(
                flight.pilotName ?? "Unassigned", 
                style: const TextStyle(fontSize: 14)
            ),
            subtitle: isCritical || isDelayed 
                ? Text(flight.delayReason ?? "Delayed", style: TextStyle(color: statusColor, fontSize: 12))
                : const Text("On Time", style: TextStyle(color: Colors.green, fontSize: 12)),
            trailing: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                    Text(
                        "${flight.scheduledDeparture.hour}:${flight.scheduledDeparture.minute.toString().padLeft(2, '0')}",
                        style: GoogleFonts.mono(fontSize: 14)
                    ),
                    if (flight.predictedFailure)
                        const Icon(Icons.warning, color: Colors.red, size: 16)
                ],
            ),
          ),
        );
      },
    );
  }
}
