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

  Future<void> register({
    required String email,
    required String password,
    required String confirmPassword,
  }) async {
    await _apiClient.postMap(
      // client=mobile để backend gửi link xác minh dạng petomi:// (deep link).
      '/auth/register?client=mobile',
      authorized: false,
      body: {
        'email': email,
        'password': password,
        'confirmPassword': confirmPassword,
      },
    );
  }

  /// Xác minh email bằng token từ deep link (petomi://verify-email?token=...).
  Future<void> verifyEmail(String token) async {
    await _apiClient.getMap(
      '/auth/verify-email?token=${Uri.encodeComponent(token)}',
    );
  }

  /// Lưu session khi đăng nhập Google trả token qua deep link callback.
  Future<void> saveSessionFromTokens({
    required String accessToken,
    required String refreshToken,
    required String email,
  }) async {
    await _apiClient.tokenStore.saveTokens(
      accessToken: accessToken,
      refreshToken: refreshToken,
    );
    await _apiClient.tokenStore.saveEmail(email);
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
      '/appointments/owner?page=1&pageSize=50',
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

  // ==================== PET DETAIL ====================

  Future<OwnerPet> getPetById(String petId) async {
    final data = await _apiClient.getMap('/pets/$petId');
    return OwnerPet.fromJson(data);
  }

  Future<void> deletePet(String petId) async {
    await _apiClient.delete('/pets/$petId');
  }

  Future<PetHealthProfile?> getPetHealthProfile(String petId) async {
    try {
      final data = await _apiClient.getMap('/pets/$petId/health-profile');
      if (data.isEmpty) return null;
      return PetHealthProfile.fromJson(data);
    } on ApiException catch (error) {
      // Backend trả 404 khi pet chưa có hồ sơ sức khỏe — coi như null.
      if (error.statusCode == 404) return null;
      rethrow;
    }
  }

  Future<List<PetWeightLog>> getPetWeightLogs(String petId) async {
    final data = await _apiClient.getList('/pets/$petId/weight-logs');
    return data
        .whereType<Map<String, dynamic>>()
        .map(PetWeightLog.fromJson)
        .toList();
  }

  Future<PetWeightLog> createWeightLog({
    required String petId,
    required double weightKg,
    required DateTime measuredAt,
    String? note,
  }) async {
    final data = await _apiClient.postMap(
      '/pets/$petId/weight-logs',
      body: {
        'weightKg': weightKg,
        'measuredAt': measuredAt.toIso8601String(),
        'source': 'Owner',
        'note': note,
      },
    );
    return PetWeightLog.fromJson(data);
  }

  Future<List<PetMedicalRecord>> getPetMedicalRecords(String petId) async {
    final data = await _apiClient.getList('/pets/$petId/medical-records');
    return data
        .whereType<Map<String, dynamic>>()
        .map(PetMedicalRecord.fromJson)
        .toList();
  }

  Future<List<PetPhoto>> getPetPhotos(String petId) async {
    final data = await _apiClient.getList('/pets/$petId/photos');
    return data
        .whereType<Map<String, dynamic>>()
        .map(PetPhoto.fromJson)
        .toList();
  }

  Future<void> setPetAvatar({
    required String petId,
    required String photoId,
  }) async {
    await _apiClient.patchMap(
      '/pets/$petId/avatar',
      body: {'photoId': photoId},
    );
  }

  Future<List<PetUserAccess>> getPetAccess(String petId) async {
    final data = await _apiClient.getList('/pets/$petId/access');
    return data
        .whereType<Map<String, dynamic>>()
        .map(PetUserAccess.fromJson)
        .toList();
  }

  Future<PetUserAccess> grantPetAccess({
    required String petId,
    required String userEmail,
    required String accessRole,
    DateTime? expiresAt,
  }) async {
    final data = await _apiClient.postMap(
      '/pets/$petId/access',
      body: {
        'userEmail': userEmail,
        'accessRole': accessRole,
        'expiresAt': expiresAt?.toIso8601String(),
      },
    );
    return PetUserAccess.fromJson(data);
  }

  Future<PetUserAccess> updatePetAccess({
    required String petId,
    required String accessId,
    required String accessRole,
    DateTime? expiresAt,
  }) async {
    final data = await _apiClient.putMap(
      '/pets/$petId/access/$accessId',
      body: {
        'accessRole': accessRole,
        'expiresAt': expiresAt?.toIso8601String(),
      },
    );
    return PetUserAccess.fromJson(data);
  }

  Future<void> revokePetAccess({
    required String petId,
    required String accessId,
  }) async {
    await _apiClient.delete('/pets/$petId/access/$accessId');
  }

  Future<List<OwnerReminder>> getPetReminders(String petId) async {
    final all = await getReminders();
    return all.where((reminder) => reminder.petId == petId).toList();
  }

  Future<PetTimeline> getPetTimeline(
    String petId, {
    int page = 1,
    int pageSize = 100,
  }) async {
    final data = await _apiClient.getMap(
      '/pets/$petId/timeline?page=$page&pageSize=$pageSize',
    );
    return PetTimeline.fromJson(data);
  }

  Future<List<PetHealthShare>> getPetHealthShares(String petId) async {
    final data = await _apiClient.getList('/pets/$petId/health-shares');
    return data
        .whereType<Map<String, dynamic>>()
        .map(PetHealthShare.fromJson)
        .toList();
  }

  Future<PetHealthShare> createPetHealthShare({
    required String petId,
    required String scope,
    required String accessMode,
    required DateTime expiresAt,
    int? maxUses,
    String? note,
  }) async {
    final data = await _apiClient.postMap(
      '/pets/$petId/health-shares',
      body: {
        'scope': scope,
        'accessMode': accessMode,
        'expiresAt': expiresAt.toUtc().toIso8601String(),
        'maxUses': maxUses,
        'note': note,
      },
    );
    return PetHealthShare.fromJson(data);
  }

  Future<void> revokePetHealthShare({
    required String petId,
    required String shareTokenId,
  }) async {
    await _apiClient.delete('/pets/$petId/health-shares/$shareTokenId');
  }

  Future<List<ReminderPreference>> getReminderPreferences() async {
    final data = await _apiClient.getList('/reminders/preferences');
    return data
        .whereType<Map<String, dynamic>>()
        .map(ReminderPreference.fromJson)
        .toList();
  }

  Future<ReminderPreference> updateReminderPreference({
    required String reminderType,
    required bool isEnabled,
    required int? remindBeforeMinutes,
    required String channel,
  }) async {
    final data = await _apiClient.putMap(
      '/reminders/preferences',
      body: {
        'reminderType': reminderType,
        'isEnabled': isEnabled,
        'remindBeforeMinutes': remindBeforeMinutes,
        'channel': channel,
      },
    );
    return ReminderPreference.fromJson(data);
  }

  // ==================== CHAT AI ====================

  Future<SendChatResult> sendChatMessage({
    required String content,
    String? conversationId,
    String? petId,
  }) async {
    final data = await _apiClient.postMap(
      '/chat/messages',
      body: {
        'content': content,
        'conversationId': conversationId,
        'petId': petId,
      },
    );
    return SendChatResult.fromJson(data);
  }

  Future<List<ChatMessage>> getConversationMessages(
    String conversationId, {
    int take = 50,
  }) async {
    final data = await _apiClient.getList(
      '/chat/conversations/$conversationId/messages?skip=0&take=$take',
    );
    return data
        .whereType<Map<String, dynamic>>()
        .map(ChatMessage.fromJson)
        .toList();
  }

  Future<ChatSubscriptionStatus> getChatSubscriptionStatus({
    String? petId,
  }) async {
    final path = petId == null || petId.isEmpty
        ? '/chat/subscription/status'
        : '/chat/subscription/status?petId=$petId';
    final data = await _apiClient.getMap(path);
    return ChatSubscriptionStatus.fromJson(data);
  }

  Future<ChatPayment> createChatSubscriptionPayment({
    required String planCode,
    required String petId,
  }) async {
    final data = await _apiClient.postMap(
      '/chat/subscription/payments',
      body: {'planCode': planCode, 'petId': petId},
    );
    return ChatPayment.fromJson(data);
  }

  Future<ChatPayment> getChatPaymentStatus(String paymentId) async {
    final data = await _apiClient.getMap(
      '/chat/subscription/payments/$paymentId',
    );
    return ChatPayment.fromJson(data);
  }

  Future<List<OwnerClinic>> getPublicClinics({String? keyword}) async {
    final data = await _apiClient.getMap(
      _pathWithQuery('/public/clinics', {
        'keyword': keyword,
        'page': '1',
        'pageSize': '30',
      }),
    );
    final items = data['Items'] ?? data['items'];
    if (items is! List) return const [];
    return items
        .whereType<Map<String, dynamic>>()
        .map(OwnerClinic.fromJson)
        .toList();
  }

  Future<OwnerClinicProfile> getClinicProfile(String clinicId) async {
    final data = await _apiClient.getMap('/public/clinics/$clinicId/profile');
    return OwnerClinicProfile.fromJson(data);
  }

  Future<List<OwnerDoctor>> getClinicDoctors(String clinicId) async {
    final data = await _apiClient.getList(
      _pathWithQuery('/appointments/owner/doctors', {'clinicId': clinicId}),
    );
    return data
        .whereType<Map<String, dynamic>>()
        .map(OwnerDoctor.fromJson)
        .toList();
  }

  Future<List<OwnerAvailableSlot>> getAvailableSlots({
    required String clinicId,
    required DateTime date,
    String? serviceId,
    String? vetClinicId,
  }) async {
    final data = await _apiClient.getList(
      _pathWithQuery('/appointments/owner/available-slots', {
        'clinicId': clinicId,
        'date': _dateOnly(date),
        'serviceId': serviceId,
        'vetClinicId': vetClinicId,
      }),
    );
    return data
        .whereType<Map<String, dynamic>>()
        .map(OwnerAvailableSlot.fromJson)
        .where((slot) => slot.isAvailable)
        .toList();
  }

  Future<OwnerProfile> updateProfile({
    required String fullName,
    String? phone,
    String? gender,
    String? address,
    bool create = false,
  }) async {
    final body = {
      'fullName': fullName,
      'phone': phone,
      'gender': gender,
      'address': address,
    };
    final data = create
        ? await _apiClient.postMap('/profile', body: body)
        : await _apiClient.putMap('/profile', body: body);
    return OwnerProfile.fromJson(data);
  }

  Future<OwnerPet> createPet({
    required String name,
    required String species,
    String? breed,
    String? gender,
    String? color,
  }) async {
    final data = await _apiClient.postMap(
      '/pets',
      body: {
        'name': name,
        'species': species,
        'breed': breed,
        'gender': gender,
        'isNeutered': 'Unknown',
        'isBirthDateEstimated': true,
        'color': color,
      },
    );
    return OwnerPet.fromJson(data);
  }

  Future<OwnerReminder> createReminder({
    required String title,
    required String reminderType,
    required DateTime remindAt,
    String? petId,
    String? message,
  }) async {
    final data = await _apiClient.postMap(
      '/reminders',
      body: {
        'reminderType': reminderType,
        'petId': petId,
        'sourceType': 'Manual',
        'title': title,
        'message': message,
        'remindAt': remindAt.toIso8601String(),
      },
    );
    return OwnerReminder.fromJson(data);
  }

  Future<OwnerAppointment> bookAppointment({
    required String clinicId,
    required String petId,
    required DateTime appointmentDate,
    required String startTime,
    String? vetClinicId,
    String? serviceId,
    String appointmentType = 'Checkup',
    String? notes,
  }) async {
    final data = await _apiClient.postMap(
      '/appointments/owner/book',
      body: {
        'clinicId': clinicId,
        'vetClinicId': vetClinicId,
        'petId': petId,
        'serviceId': serviceId,
        'appointmentDate': _dateOnly(appointmentDate),
        'startTime': _timeOnly(startTime),
        'appointmentType': appointmentType,
        'notes': notes,
      },
    );
    return OwnerAppointment.fromJson(data);
  }

  Future<OwnerReminder> toggleReminder(String reminderId) async {
    final data = await _apiClient.postMap('/reminders/$reminderId/toggle');
    return OwnerReminder.fromJson(data);
  }

  Future<OwnerReminder> dismissReminder(String reminderId) async {
    final data = await _apiClient.postMap('/reminders/$reminderId/dismiss');
    return OwnerReminder.fromJson(data);
  }

  Future<void> cancelAppointment(String appointmentId, {String? reason}) async {
    await _apiClient.postMap(
      '/appointments/owner/$appointmentId/cancel',
      body: {'reason': reason ?? 'Hủy từ ứng dụng mobile'},
    );
  }

  Future<OwnerAppointment> rescheduleAppointment({
    required String appointmentId,
    required DateTime newDate,
    required String newStartTime,
    required String newEndTime,
  }) async {
    final data = await _apiClient.postMap(
      '/appointments/owner/$appointmentId/reschedule',
      body: {
        'newDate': _dateOnly(newDate),
        'newStartTime': _timeOnly(newStartTime),
        'newEndTime': _timeOnly(newEndTime),
      },
    );
    return OwnerAppointment.fromJson(data);
  }

  String _pathWithQuery(String path, Map<String, String?> values) {
    final query = Map<String, String>.fromEntries(
      values.entries
          .where((entry) => entry.value != null && entry.value!.isNotEmpty)
          .map((entry) => MapEntry(entry.key, entry.value!)),
    );
    if (query.isEmpty) return path;
    return '$path?${Uri(queryParameters: query).query}';
  }

  String _dateOnly(DateTime date) {
    final month = date.month.toString().padLeft(2, '0');
    final day = date.day.toString().padLeft(2, '0');
    return '${date.year}-$month-$day';
  }

  String _timeOnly(String value) {
    if (value.length >= 8) return value.substring(0, 8);
    if (value.length == 5) return '$value:00';
    return value;
  }
}
