
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../models/data_models.dart';
import '../widgets/flight_table_widget.dart'; // We'll create this next

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  List<Flight> _flights = [];
  bool _isLoading = true;
  String _systemStatus = "VALID";

  @override
  void initState() {
    super.initState();
    _refreshData();
  }

  Future<void> _refreshData() async {
    setState(() => _isLoading = true);
    try {
      debugPrint("Fetching data from API...");
      final api = Provider.of<ApiService>(context, listen: false);
      final data = await api.getData();
      
      final flightsList = (data['flights'] as List).map((f) => Flight.fromJson(f)).toList();
      
      // Get Status
      final statusRes = await api.checkStatus();
      
      if (mounted) {
        setState(() {
          _flights = flightsList;
          _systemStatus = statusRes['status'] ?? 'VALID';
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint("Error fetching data: $e");
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF030712),
      appBar: AppBar(
        title: Text('OPS DASHBOARD', style: GoogleFonts.jetbrainsMono()),
        backgroundColor: const Color(0xFF111827),
        actions: [
          IconButton(onPressed: _refreshData, icon: const Icon(Icons.refresh))
        ],
      ),
      body: Column(
        children: [
          // Status Bar
          Container(
            padding: const EdgeInsets.all(12),
            color: _systemStatus == 'CRITICAL' ? const Color(0xFF7F1D1D) : const Color(0xFF064E3B),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  "SYSTEM STATE: $_systemStatus",
                  style: GoogleFonts.mono(fontWeight: FontWeight.bold, color: Colors.white),
                ),
                if (_systemStatus == 'CRITICAL')
                  const Text("⚠ ACTION REQUIRED", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 10))
              ],
            ),
          ),

          // Content
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : FlightTableWidget(flights: _flights),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // Simulation Trigger Short-cut
          showModalBottomSheet(context: context, builder: (_) => _buildSimSheet());
        },
        backgroundColor: Colors.redAccent,
        child: const Icon(Icons.bolt),
      ),
    );
  }

  Widget _buildSimSheet() {
      return Container(
          padding: const EdgeInsets.all(20),
          color: const Color(0xFF1F2937),
          height: 250,
          child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                  const Text("Inject Disruption", style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 20),
                  Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                          _simBtn("Fog", Icons.cloud),
                          _simBtn("Technical", Icons.build),
                          _simBtn("Medical", Icons.local_hospital),
                      ],
                  )
              ],
          ),
      );
  }
  
  Widget _simBtn(String type, IconData icon) {
      return InkWell(
          onTap: () async {
             Navigator.pop(context);
             final api = Provider.of<ApiService>(context, listen: false);
             // Simple hardcoded sim for demo
             await api.simulate(type == "Fog" ? "WEATHER" : "TECHNICAL", type, null);
             _refreshData();
          },
          child: Column(
              children: [
                  CircleAvatar(radius: 30, child: Icon(icon)),
                  const SizedBox(height: 8),
                  Text(type, style: const TextStyle(color: Colors.white))
              ],
          ),
      );
  }
}
