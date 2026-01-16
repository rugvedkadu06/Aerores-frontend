
import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  // Use 10.0.2.2 for Android Emulator to access localhost
  static const String baseUrl = 'http://10.0.2.2:8000';

  Future<Map<String, dynamic>> getData() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/data'));
      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to load data: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<Map<String, dynamic>> checkStatus() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/status'));
      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
         return {"status": "ERROR"};
      }
    } catch (e) {
      return {"status": "OFFLINE"};
    }
  }

  Future<void> seedDatabase() async {
    await http.get(Uri.parse('$baseUrl/seed'));
  }
  
  Future<Map<String, dynamic>> heal(String mode) async {
      try {
        final response = await http.post(
            Uri.parse('$baseUrl/heal'),
            headers: {'Content-Type': 'application/json'},
            body: json.encode({'mode': mode})
        );
        return json.decode(response.body);
      } catch (e) {
          print("Heal Error: $e");
          return {};
      }
  }

  Future<void> resolve(Map<String, dynamic> option) async {
    await http.post(
      Uri.parse('$baseUrl/resolve'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'option': option}),
    );
  }
  
  Future<void> simulate(String type, String subType, String? flightId) async {
      await http.post(
          Uri.parse('$baseUrl/simulate'),
          headers: {'Content-Type': 'application/json'},
          body: json.encode({
              'type': type,
              'subType': subType,
              'flight_id': flightId,
              'airport': 'DEL',
              'severity': 'HIGH'
          })
      );
  }
}
