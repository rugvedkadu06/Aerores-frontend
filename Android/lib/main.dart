
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/passenger_bridge_screen.dart';
import 'services/api_service.dart';

void main() {
  runApp(const SkyCoPilotApp());
}

class SkyCoPilotApp extends StatelessWidget {
  const SkyCoPilotApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        Provider<ApiService>(create: (_) => ApiService()),
      ],
      child: MaterialApp(
        title: 'SkyCoPilot',
        debugShowCheckedModeBanner: false,
        theme: ThemeData.dark().copyWith(
          scaffoldBackgroundColor: const Color(0xFF030712), // bg-void
          primaryColor: const Color(0xFF38BDF8), // accent sky-400
          cardColor: const Color(0xFF111827), // bg-panel
          colorScheme: const ColorScheme.dark(
            primary: Color(0xFF38BDF8),
            secondary: Color(0xFF10B981), // status-success
            error: Color(0xFFEF4444), // status-danger
            surface: Color(0xFF1F2937), // surface
          ),
          textTheme: GoogleFonts.interTextTheme(ThemeData.dark().textTheme),
        ),
        home: const LoginScreen(),
        routes: {
          '/admin': (context) => const DashboardScreen(),
          '/passenger': (context) => const PassengerBridgeScreen(),
        },
      ),
    );
  }
}
