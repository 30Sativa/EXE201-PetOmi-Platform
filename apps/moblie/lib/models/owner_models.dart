class LoginSession {
  const LoginSession({
    required this.accessToken,
    required this.refreshToken,
    required this.email,
    required this.userId,
    required this.activeRole,
    required this.roles,
    required this.isProfileCompleted,
  });

  factory LoginSession.fromJson(Map<String, dynamic> json) {
    return LoginSession(
      accessToken: json.stringValue('accessToken'),
      refreshToken: json.stringValue('refreshToken'),
      email: json.stringValue('email'),
      userId: json.stringValue('userId'),
      activeRole: json.stringValue('activeRole'),
      roles: json.stringList('roles'),
      isProfileCompleted: json.boolValue('isProfileCompleted'),
    );
  }

  final String accessToken;
  final String refreshToken;
  final String email;
  final String userId;
  final String activeRole;
  final List<String> roles;
  final bool isProfileCompleted;
}

class OwnerProfile {
  const OwnerProfile({
    required this.userId,
    required this.fullName,
    required this.phone,
    required this.avatarUrl,
    required this.dateOfBirth,
    required this.gender,
    required this.address,
  });

  factory OwnerProfile.fromJson(Map<String, dynamic> json) {
    return OwnerProfile(
      userId: json.stringValue('userId'),
      fullName: json.nullableString('fullName'),
      phone: json.nullableString('phone'),
      avatarUrl: json.nullableString('avatarUrl'),
      dateOfBirth: json.nullableString('dateOfBirth'),
      gender: json.nullableString('gender'),
      address: json.nullableString('address'),
    );
  }

  final String userId;
  final String? fullName;
  final String? phone;
  final String? avatarUrl;
  final String? dateOfBirth;
  final String? gender;
  final String? address;

  String get displayName {
    final value = fullName?.trim();
    return value == null || value.isEmpty ? 'PetOmi Owner' : value;
  }

  String get initials {
    final parts = displayName
        .split(RegExp(r'\s+'))
        .where((part) => part.trim().isNotEmpty)
        .toList();
    if (parts.isEmpty) return 'PO';
    if (parts.length == 1) return _firstRunes(parts.first, 2).toUpperCase();
    return '${_firstRunes(parts.first, 1)}${_firstRunes(parts.last, 1)}'
        .toUpperCase();
  }
}

class OwnerPet {
  const OwnerPet({
    required this.petId,
    required this.name,
    required this.species,
    required this.breed,
    required this.gender,
    required this.dateOfBirth,
    required this.avatarUrl,
    required this.color,
    this.isNeutered,
    this.isBirthDateEstimated = false,
    this.createdAt,
    this.updatedAt,
  });

  factory OwnerPet.fromJson(Map<String, dynamic> json) {
    return OwnerPet(
      petId: json.stringValue('petId'),
      name: json.stringValue('name', fallback: 'Thú cưng'),
      species: json.stringValue('species'),
      breed: json.nullableString('breed'),
      gender: json.nullableString('gender'),
      dateOfBirth: json.nullableString('dateOfBirth'),
      avatarUrl: json.nullableString('avatarUrl'),
      color: json.nullableString('color'),
      isNeutered: json.nullableString('isNeutered'),
      isBirthDateEstimated: json.boolValue('isBirthDateEstimated'),
      createdAt: json.nullableString('createdAt'),
      updatedAt: json.nullableString('updatedAt'),
    );
  }

  final String petId;
  final String name;
  final String species;
  final String? breed;
  final String? gender;
  final String? dateOfBirth;
  final String? avatarUrl;
  final String? color;
  final String? isNeutered;
  final bool isBirthDateEstimated;
  final String? createdAt;
  final String? updatedAt;

  String get genderLabel {
    switch (gender) {
      case 'Male':
        return 'Đực';
      case 'Female':
        return 'Cái';
      case 'Other':
        return 'Khác';
    }
    return gender ?? 'Chưa rõ';
  }

  String get neuteredLabel {
    switch (isNeutered) {
      case 'Yes':
        return 'Đã triệt sản';
      case 'No':
        return 'Chưa triệt sản';
      case 'Unknown':
        return 'Không rõ';
    }
    return isNeutered ?? 'Không rõ';
  }

  String get speciesEmoji {
    final normalized = species.toLowerCase();
    if (normalized == 'dog') return '🐶';
    if (normalized == 'cat') return '🐱';
    return '🐾';
  }

  String get speciesLabel {
    final normalized = species.toLowerCase();
    if (normalized == 'dog') return 'Chó';
    if (normalized == 'cat') return 'Mèo';
    return species.isEmpty ? 'Không rõ' : species;
  }

  String get breedLabel {
    final value = breed?.trim();
    return value == null || value.isEmpty ? 'Chưa cập nhật giống' : value;
  }

  String get initials => _firstRunes(name, 2).toUpperCase();

  String get ageLabel {
    final raw = dateOfBirth;
    if (raw == null || raw.isEmpty) return 'Chưa rõ tuổi';
    final dob = DateTime.tryParse(raw);
    if (dob == null) return 'Chưa rõ tuổi';
    final now = DateTime.now();
    var years = now.year - dob.year;
    if (now.month < dob.month ||
        (now.month == dob.month && now.day < dob.day)) {
      years--;
    }
    if (years <= 0) {
      final months = ((now.difference(dob).inDays / 30).floor()).clamp(1, 11);
      return '$months tháng';
    }
    return '$years tuổi';
  }
}

class OwnerAppointment {
  const OwnerAppointment({
    required this.appointmentId,
    required this.petId,
    required this.clinicId,
    required this.appointmentDate,
    required this.startTime,
    required this.endTime,
    required this.appointmentType,
    required this.status,
  });

  factory OwnerAppointment.fromJson(Map<String, dynamic> json) {
    return OwnerAppointment(
      appointmentId: json.stringValue('appointmentId'),
      petId: json.stringValue('petId'),
      clinicId: json.stringValue('clinicId'),
      appointmentDate: json.stringValue('appointmentDate'),
      startTime: json.stringValue('startTime'),
      endTime: json.stringValue('endTime'),
      appointmentType: json.stringValue('appointmentType', fallback: 'Khám'),
      status: json.stringValue('status', fallback: 'Pending'),
    );
  }

  final String appointmentId;
  final String petId;
  final String clinicId;
  final String appointmentDate;
  final String startTime;
  final String endTime;
  final String appointmentType;
  final String status;

  DateTime? get date => DateTime.tryParse(appointmentDate);
}

class OwnerClinic {
  const OwnerClinic({
    required this.clinicId,
    required this.clinicName,
    required this.address,
    required this.logoUrl,
    required this.description,
  });

  factory OwnerClinic.fromJson(Map<String, dynamic> json) {
    return OwnerClinic(
      clinicId: json.stringValue('clinicId'),
      clinicName: json.stringValue('clinicName', fallback: 'Clinic'),
      address: json.nullableString('address'),
      logoUrl: json.nullableString('logoUrl'),
      description: json.nullableString('description'),
    );
  }

  final String clinicId;
  final String clinicName;
  final String? address;
  final String? logoUrl;
  final String? description;
}

class OwnerClinicService {
  const OwnerClinicService({
    required this.serviceId,
    required this.serviceName,
    required this.description,
    required this.price,
    required this.durationMins,
    required this.isActive,
  });

  factory OwnerClinicService.fromJson(Map<String, dynamic> json) {
    return OwnerClinicService(
      serviceId: json.stringValue('serviceId'),
      serviceName: json.stringValue('serviceName', fallback: 'Service'),
      description: json.nullableString('description'),
      price: json.numberValue('price'),
      durationMins: json.intValue('durationMins', fallback: 30),
      isActive: json.boolValue('isActive', fallback: true),
    );
  }

  final String serviceId;
  final String serviceName;
  final String? description;
  final double price;
  final int durationMins;
  final bool isActive;
}

class OwnerClinicProfile {
  const OwnerClinicProfile({required this.clinic, required this.services});

  factory OwnerClinicProfile.fromJson(Map<String, dynamic> json) {
    final services = json['services'];
    return OwnerClinicProfile(
      clinic: OwnerClinic.fromJson(json),
      services: services is List
          ? services
                .whereType<Map<String, dynamic>>()
                .map(OwnerClinicService.fromJson)
                .where((service) => service.isActive)
                .toList()
          : const [],
    );
  }

  final OwnerClinic clinic;
  final List<OwnerClinicService> services;
}

class OwnerDoctor {
  const OwnerDoctor({
    required this.vetClinicId,
    required this.fullName,
    required this.avatarUrl,
    required this.specialization,
    required this.roleName,
  });

  factory OwnerDoctor.fromJson(Map<String, dynamic> json) {
    return OwnerDoctor(
      vetClinicId: json.stringValue('vetClinicId'),
      fullName: json.stringValue('fullName', fallback: 'Doctor'),
      avatarUrl: json.nullableString('avatarUrl'),
      specialization: json.nullableString('specialization'),
      roleName: json.stringValue('roleName'),
    );
  }

  final String vetClinicId;
  final String fullName;
  final String? avatarUrl;
  final String? specialization;
  final String roleName;
}

class OwnerAvailableSlot {
  const OwnerAvailableSlot({
    required this.vetClinicId,
    required this.doctorName,
    required this.startTime,
    required this.endTime,
    required this.isAvailable,
  });

  factory OwnerAvailableSlot.fromJson(Map<String, dynamic> json) {
    return OwnerAvailableSlot(
      vetClinicId: json.stringValue('vetClinicId'),
      doctorName: json.stringValue('doctorName', fallback: 'Doctor'),
      startTime: json.stringValue('startTime'),
      endTime: json.stringValue('endTime'),
      isAvailable: json.boolValue('isAvailable', fallback: true),
    );
  }

  final String vetClinicId;
  final String doctorName;
  final String startTime;
  final String endTime;
  final bool isAvailable;

  String get rangeLabel => '$startTime - $endTime';
}

class OwnerReminder {
  const OwnerReminder({
    required this.reminderId,
    required this.petId,
    required this.reminderType,
    required this.title,
    required this.message,
    required this.remindAt,
    required this.status,
    required this.isEnabled,
  });

  factory OwnerReminder.fromJson(Map<String, dynamic> json) {
    return OwnerReminder(
      reminderId: json.stringValue('reminderId'),
      petId: json.nullableString('petId'),
      reminderType: json.stringValue('reminderType'),
      title: json.stringValue('title', fallback: 'Nhắc nhở'),
      message: json.nullableString('message'),
      remindAt: json.stringValue('remindAt'),
      status: json.stringValue('status', fallback: 'Pending'),
      isEnabled: json.boolValue('isEnabled', fallback: true),
    );
  }

  final String reminderId;
  final String? petId;
  final String reminderType;
  final String title;
  final String? message;
  final String remindAt;
  final String status;
  final bool isEnabled;

  DateTime? get dueAt => DateTime.tryParse(remindAt);
}

class OwnerHomeData {
  const OwnerHomeData({
    required this.profile,
    required this.email,
    required this.pets,
    required this.appointments,
    required this.reminders,
  });

  final OwnerProfile? profile;
  final String email;
  final List<OwnerPet> pets;
  final List<OwnerAppointment> appointments;
  final List<OwnerReminder> reminders;

  int get upcomingAppointmentCount {
    final now = DateTime.now();
    return appointments.where((item) {
      final date = item.date;
      return date != null &&
          !date.isBefore(DateTime(now.year, now.month, now.day)) &&
          item.status.toLowerCase() != 'cancelled';
    }).length;
  }

  int get activeReminderCount {
    return reminders
        .where(
          (item) => item.isEnabled && item.status.toLowerCase() == 'pending',
        )
        .length;
  }

  int get completedAppointmentCount {
    return appointments
        .where((item) => item.status.toLowerCase() == 'completed')
        .length;
  }
}

class PetHealthProfile {
  const PetHealthProfile({
    required this.petHealthProfileId,
    required this.petId,
    required this.currentWeightKg,
    required this.color,
    required this.isNeutered,
    required this.allergies,
    required this.chronicConditions,
    required this.microchipNumber,
    required this.updatedAt,
  });

  factory PetHealthProfile.fromJson(Map<String, dynamic> json) {
    return PetHealthProfile(
      petHealthProfileId: json.stringValue('petHealthProfileId'),
      petId: json.stringValue('petId'),
      currentWeightKg: json['currentWeightKg'] == null
          ? null
          : json.numberValue('currentWeightKg'),
      color: json.nullableString('color'),
      isNeutered: json.nullableString('isNeutered'),
      allergies: json.nullableString('allergies'),
      chronicConditions: json.nullableString('chronicConditions'),
      microchipNumber: json.nullableString('microchipNumber'),
      updatedAt: json.nullableString('updatedAt'),
    );
  }

  final String petHealthProfileId;
  final String petId;
  final double? currentWeightKg;
  final String? color;
  final String? isNeutered;
  final String? allergies;
  final String? chronicConditions;
  final String? microchipNumber;
  final String? updatedAt;

  String get neuteredLabel {
    switch (isNeutered) {
      case 'Yes':
        return 'Đã triệt sản';
      case 'No':
        return 'Chưa triệt sản';
      case 'Unknown':
        return 'Không rõ';
    }
    return isNeutered ?? 'Không rõ';
  }
}

class PetWeightLog {
  const PetWeightLog({
    required this.weightLogId,
    required this.petId,
    required this.weightKg,
    required this.measuredAt,
    required this.source,
    required this.note,
  });

  factory PetWeightLog.fromJson(Map<String, dynamic> json) {
    return PetWeightLog(
      weightLogId: json.stringValue('weightLogId'),
      petId: json.stringValue('petId'),
      weightKg: json.numberValue('weightKg'),
      measuredAt: json.stringValue('measuredAt'),
      source: json.nullableString('source'),
      note: json.nullableString('note'),
    );
  }

  final String weightLogId;
  final String petId;
  final double weightKg;
  final String measuredAt;
  final String? source;
  final String? note;

  DateTime? get measuredDate => DateTime.tryParse(measuredAt);
}

class PetMedicalRecord {
  const PetMedicalRecord({
    required this.medicalRecordId,
    required this.petId,
    required this.recordType,
    required this.title,
    required this.description,
    required this.recordDate,
    required this.vetName,
    required this.clinicName,
    required this.medicationName,
    required this.dosage,
  });

  factory PetMedicalRecord.fromJson(Map<String, dynamic> json) {
    return PetMedicalRecord(
      medicalRecordId: json.stringValue('medicalRecordId'),
      petId: json.stringValue('petId'),
      recordType: json.stringValue('recordType'),
      title: json.stringValue('title', fallback: 'Hồ sơ y tế'),
      description: json.nullableString('description'),
      recordDate: json.stringValue('recordDate'),
      vetName: json.nullableString('vetName'),
      clinicName: json.nullableString('clinicName'),
      medicationName: json.nullableString('medicationName'),
      dosage: json.nullableString('dosage'),
    );
  }

  final String medicalRecordId;
  final String petId;
  final String recordType;
  final String title;
  final String? description;
  final String recordDate;
  final String? vetName;
  final String? clinicName;
  final String? medicationName;
  final String? dosage;

  DateTime? get date => DateTime.tryParse(recordDate);
}

class PetPhoto {
  const PetPhoto({
    required this.photoId,
    required this.petId,
    required this.imageUrl,
    required this.caption,
    required this.isAvatar,
  });

  factory PetPhoto.fromJson(Map<String, dynamic> json) {
    return PetPhoto(
      photoId: json.stringValue('photoId'),
      petId: json.stringValue('petId'),
      imageUrl: json.stringValue('imageUrl'),
      caption: json.nullableString('caption'),
      isAvatar: json.boolValue('isAvatar'),
    );
  }

  final String photoId;
  final String petId;
  final String imageUrl;
  final String? caption;
  final bool isAvatar;
}

class PetUserAccess {
  const PetUserAccess({
    required this.petUserAccessId,
    required this.petId,
    required this.userId,
    required this.accessRole,
    required this.isExpired,
  });

  factory PetUserAccess.fromJson(Map<String, dynamic> json) {
    return PetUserAccess(
      petUserAccessId: json.stringValue('petUserAccessId'),
      petId: json.stringValue('petId'),
      userId: json.stringValue('userId'),
      accessRole: json.stringValue('accessRole', fallback: 'Viewer'),
      isExpired: json.boolValue('isExpired'),
    );
  }

  final String petUserAccessId;
  final String petId;
  final String userId;
  final String accessRole;
  final bool isExpired;
}

class ChatMessage {
  const ChatMessage({
    required this.messageId,
    required this.conversationId,
    required this.senderRole,
    required this.status,
    required this.content,
    required this.createdAt,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      messageId: json.stringValue('messageId'),
      conversationId: json.stringValue('conversationId'),
      senderRole: json.stringValue('senderRole', fallback: 'User'),
      status: json.stringValue('status', fallback: 'Completed'),
      content: json.stringValue('content'),
      createdAt: json.stringValue('createdAt'),
    );
  }

  final String messageId;
  final String conversationId;
  final String senderRole;
  final String status;
  final String content;
  final String createdAt;

  bool get isAi {
    final role = senderRole.toLowerCase();
    return role == 'ai' || role == 'assistant';
  }

  bool get isPending {
    final s = status.toLowerCase();
    return s == 'pending' || s == 'processing';
  }
}

class SendChatResult {
  const SendChatResult({
    required this.messageId,
    required this.conversationId,
    required this.status,
  });

  factory SendChatResult.fromJson(Map<String, dynamic> json) {
    return SendChatResult(
      messageId: json.stringValue('messageId'),
      conversationId: json.stringValue('conversationId'),
      status: json.stringValue('status', fallback: 'Pending'),
    );
  }

  final String messageId;
  final String conversationId;
  final String status;
}

class ChatPlan {
  const ChatPlan({
    required this.code,
    required this.name,
    required this.description,
    required this.priceMonthly,
    required this.billingCycleDays,
    required this.monthlyMessageQuota,
    required this.deepRagEnabled,
    required this.imageUploadEnabled,
  });

  factory ChatPlan.fromJson(Map<String, dynamic> json) {
    return ChatPlan(
      code: json.stringValue('code'),
      name: json.stringValue('name', fallback: 'Gói'),
      description: json.nullableString('description'),
      priceMonthly: json.numberValue('priceMonthly'),
      billingCycleDays: json.intValue('billingCycleDays', fallback: 30),
      monthlyMessageQuota: json.intValue('monthlyMessageQuota'),
      deepRagEnabled: json.boolValue('deepRagEnabled'),
      imageUploadEnabled: json.boolValue('imageUploadEnabled'),
    );
  }

  final String code;
  final String name;
  final String? description;
  final double priceMonthly;
  final int billingCycleDays;
  final int monthlyMessageQuota;
  final bool deepRagEnabled;
  final bool imageUploadEnabled;
}

class ChatSubscriptionStatus {
  const ChatSubscriptionStatus({
    required this.currentPlanCode,
    required this.currentPlanName,
    required this.isPremium,
    required this.canSend,
    required this.blockReason,
    required this.usedMessages,
    required this.remainingMessages,
    required this.monthlyMessageQuota,
    required this.deepRagEnabled,
    required this.plans,
  });

  factory ChatSubscriptionStatus.fromJson(Map<String, dynamic> json) {
    final usage = json['usage'];
    final usageMap = usage is Map<String, dynamic>
        ? usage
        : <String, dynamic>{};
    final caps = json['capabilities'];
    final capsMap = caps is Map<String, dynamic>
        ? caps
        : <String, dynamic>{};
    final plansRaw = json['plans'];
    return ChatSubscriptionStatus(
      currentPlanCode: json.stringValue('currentPlanCode', fallback: 'free'),
      currentPlanName: json.stringValue('currentPlanName', fallback: 'Miễn phí'),
      isPremium: json.boolValue('isPremium'),
      canSend: json.boolValue('canSend', fallback: true),
      blockReason: json.nullableString('blockReason'),
      usedMessages: usageMap.intValue('usedMessages'),
      remainingMessages: usageMap.intValue('remainingMessages'),
      monthlyMessageQuota: usageMap.intValue('monthlyMessageQuota'),
      deepRagEnabled: capsMap.boolValue('deepRagEnabled'),
      plans: plansRaw is List
          ? plansRaw
                .whereType<Map<String, dynamic>>()
                .map(ChatPlan.fromJson)
                .toList()
          : const [],
    );
  }

  final String currentPlanCode;
  final String currentPlanName;
  final bool isPremium;
  final bool canSend;
  final String? blockReason;
  final int usedMessages;
  final int remainingMessages;
  final int monthlyMessageQuota;
  final bool deepRagEnabled;
  final List<ChatPlan> plans;
}

class ChatPayment {
  const ChatPayment({
    required this.paymentId,
    required this.planName,
    required this.status,
    required this.amount,
    required this.qrCodeUrl,
    required this.bankAccountNo,
    required this.bankCode,
    required this.paymentReference,
  });

  factory ChatPayment.fromJson(Map<String, dynamic> json) {
    return ChatPayment(
      paymentId: json.stringValue('paymentId'),
      planName: json.stringValue('planName', fallback: 'Gói Premium'),
      status: json.stringValue('status', fallback: 'Pending'),
      amount: json.numberValue('amount'),
      qrCodeUrl: json.nullableString('qrCodeUrl'),
      bankAccountNo: json.nullableString('bankAccountNo'),
      bankCode: json.nullableString('bankCode'),
      paymentReference: json.nullableString('paymentReference'),
    );
  }

  final String paymentId;
  final String planName;
  final String status;
  final double amount;
  final String? qrCodeUrl;
  final String? bankAccountNo;
  final String? bankCode;
  final String? paymentReference;
}

extension JsonMapReader on Map<String, dynamic> {
  String stringValue(String key, {String fallback = ''}) {
    final value = this[key];
    if (value == null) return fallback;
    return value.toString();
  }

  String? nullableString(String key) {
    final value = this[key];
    if (value == null) return null;
    final text = value.toString().trim();
    return text.isEmpty ? null : text;
  }

  bool boolValue(String key, {bool fallback = false}) {
    final value = this[key];
    if (value is bool) return value;
    if (value is String) return value.toLowerCase() == 'true';
    return fallback;
  }

  List<String> stringList(String key) {
    final value = this[key];
    if (value is List) return value.map((item) => item.toString()).toList();
    return const [];
  }

  int intValue(String key, {int fallback = 0}) {
    final value = this[key];
    if (value is int) return value;
    if (value is num) return value.toInt();
    if (value is String) return int.tryParse(value) ?? fallback;
    return fallback;
  }

  double numberValue(String key, {double fallback = 0}) {
    final value = this[key];
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? fallback;
    return fallback;
  }
}

String _firstRunes(String value, int count) {
  return String.fromCharCodes(value.runes.take(count));
}
