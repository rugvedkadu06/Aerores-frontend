
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:animate_do/animate_do.dart';
import '../services/api_service.dart';
import '../models/data_models.dart';

class PassengerBridgeScreen extends StatefulWidget {
  const PassengerBridgeScreen({super.key});

  @override
  State<PassengerBridgeScreen> createState() => _PassengerBridgeScreenState();
}

class _PassengerBridgeScreenState extends State<PassengerBridgeScreen> {
  // Simulated Passenger Context (mocked PNR)
  final String _userPnr = "PNR-X7J9";
  final String _userFlightId = "AI-101"; // Hardcoded for demo
  
  Flight? _flightData;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchFlightStatus();
  }

  Future<void> _fetchFlightStatus() async {
    try {
      final api = Provider.of<ApiService>(context, listen: false);
      final data = await api.getData();
      final flights = (data['flights'] as List).map((f) => Flight.fromJson(f)).toList();
      
      // Find our flight
      final myFlight = flights.firstWhere(
        (f) => f.id == _userFlightId, 
        orElse: () => flights.first // Fallback
      );
      
      setState(() {
        _flightData = myFlight;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF030712),
      appBar: AppBar(
        title: Text('SKYCOPILOT PASSENGER', style: GoogleFonts.bebasNeue(letterSpacing: 1)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(onPressed: _fetchFlightStatus, icon: const Icon(Icons.refresh))
        ],
      ),
      body: _isLoading 
          ? const Center(child: CircularProgressIndicator()) 
          : _flightData == null 
              ? const Center(child: Text("Flight Not Found"))
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Header Card
                      FadeInDown(
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: const Color(0xFF111827),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: Colors.white10),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text("WELCOME BACK", style: GoogleFonts.inter(fontSize: 10, color: Colors.grey)),
                              Text("John Doe", style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 20),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  _flightLeg(_flightData!.origin, "10:00"), // Mock times for now
                                  const Icon(Icons.flight_takeoff, color: Colors.grey),
                                  _flightLeg(_flightData!.destination, "12:00"),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ),
                      
                      const SizedBox(height: 24),
                      
                      // Status Section
                      FadeInUp(
                        delay: const Duration(milliseconds: 200),
                        child: Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: _flightData!.status == 'CRITICAL' || _flightData!.status == 'DELAYED'
                                ? const Color(0xFF450A0A) // Red-ish
                                : const Color(0xFF064E3B), // Green-ish
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                                color: _flightData!.status == 'CRITICAL' 
                                    ? Colors.red 
                                    : Colors.green
                            ),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                  _flightData!.status == 'CRITICAL' ? Icons.warning : Icons.check_circle, 
                                  color: Colors.white, size: 32
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                        "STATUS: ${_flightData!.status}", 
                                        style: GoogleFonts.jetbrainsMono(fontWeight: FontWeight.bold)
                                    ),
                                    Text(
                                        _flightData!.delayReason ?? "On Time - Smooth Operations",
                                        style: const TextStyle(fontSize: 12, color: Colors.white70)
                                    ),
                                  ],
                                ),
                              )
                            ],
                          ),
                        ),
                      ),
                      
                      const SizedBox(height: 24),
                      
                      // Rights Card (Static for now)
                      FadeInUp(
                        delay: const Duration(milliseconds: 400),
                        child: const Card(
                           color: Color(0xFF1F2937),
                           child: Padding(
                             padding: EdgeInsets.all(16),
                             child: Column(
                               crossAxisAlignment: CrossAxisAlignment.start,
                               children: [
                                 Text("YOUR RIGHTS", style: TextStyle(fontWeight: FontWeight.bold)),
                                 SizedBox(height: 8),
                                 Text("• Right to Information (Industry 5.0 Standard)", style: TextStyle(fontSize: 12, color: Colors.grey)),
                                 Text("• Compensation for Delays > 2h", style: TextStyle(fontSize: 12, color: Colors.grey)),
                                 Text("• Care & Assistance during disruption", style: TextStyle(fontSize: 12, color: Colors.grey)),
                               ],
                             ),
                           ),
                        ),
                      ),
                    ],
                  ),
                ),
    );
  }

  Widget _flightLeg(String code, String time) {
    return Column(
      children: [
        Text(code, style: GoogleFonts.jetbrainsMono(fontSize: 24, fontWeight: FontWeight.bold)),
        Text(time, style: const TextStyle(color: Colors.grey)),
      ],
    );
  }
}
