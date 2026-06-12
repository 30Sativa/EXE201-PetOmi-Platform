import '../models/owner_models.dart';
import 'api_client.dart';

class OwnerRepository {
  OwnerRepository({ApiClient? apiClient})
    : _apiClient = apiClient ?? ApiClient();

  final ApiClient _apiClient;

  ApiClient get apiClient => _apiClient;

  Future<LoginSession> login({
    required String email,
    required String password,
  }) async {
    final fingerprint = await _apiClient.tokenStore
        .getOrCreateDeviceFingerprint();
    final data = await _apiClient.postMap(
      '/auth/login',
      authorized: false,
      body: {
        'email': email,
        'password': password,
        'deviceFingerprint': fingerprint,
        'deviceName': 'PetOmi Flutter Mobile',
        'deviceType': 'android',
      },
    );
    final session = LoginSession.fromJson(data);
    await _apiClient.tokenStore.saveSession(session);
    return session;
  }

  Future<void> logout() async {
    final refreshToken = await _apiClient.tokenStore.getRefreshToken();
    if (refreshToken != null && refreshToken.isNotEmpty) {
      try {
        await _apiClient.postMap(
          '/auth/logout',
          body: {'refreshToken': refreshToken},
        );
      } catch (_) {
        // Local logout should still clear tokens even if backend is offline.
      }
    }
    await _apiClient.tokenStore.clear();
  }

  Future<bool> hasSession() async {
    final token = await _apiClient.tokenStore.getAccessToken();
    return token != null && token.isNotEmpty;
  }

  Future<String> savedEmail() async {
    return await _apiClient.tokenStore.getEmail() ?? '';
  }

  Future<OwnerHomeData> getOwnerHomeData() async {
    final email = await savedEmail();
    final results = await Future.wait<dynamic>([
      getProfile(),
      getPets(),
      getOwnerAppointments(),
      getReminders(),
    ]);
    return OwnerHomeData(
      profile: results[0] as OwnerProfile?,
      email: email,
      pets: results[1] as List<OwnerPet>,
      appointments: results[2] as List<OwnerAppointment>,
      reminders: results[3] as List<OwnerReminder>,
    );
  }

  Future<OwnerProfile?> getProfile() async {
    final data = await _apiClient.getMap('/profile');
    if (data.isEmpty) return null;
    return OwnerProfile.fromJson(data);
  }

  Future<List<OwnerPet>> getPets() async {
    final data = await _apiClient.getList('/pets');
    return data
        .whereType<Map<String, dynamic>>()
        .map(OwnerPet.fromJson)
        .toList();
  }

  Future<List<OwnerAppointment>> getOwnerAppointments() async {
    final data = await _apiClient.getMap(
      '/appointments/owner?pageNumber=1&pageSize=50',
    );
    final items = data['Items'] ?? data['items'];
    if (items is! List) return const [];
    return items
        .whereType<Map<String, dynamic>>()
        .map(OwnerAppointment.fromJson)
        .toList();
  }

  Future<List<OwnerReminder>> getReminders() async {
    final data = await _apiClient.getList('/reminders');
    return data
        .whereType<Map<String, dynamic>>()
        .map(OwnerReminder.fromJson)
        .toList();
  }

  Future<OwnerReminder> toggleReminder(String reminderId) async {
    final data = await _apiClient.postMap('/reminders/$reminderId/toggle');
    return OwnerReminder.fromJson(data);
  }

  Future<OwnerReminder> dismissReminder(String reminderId) async {
    final data = await _apiClient.postMap('/reminders/$reminderId/dismiss');
    return OwnerReminder.fromJson(data);
  }
}
