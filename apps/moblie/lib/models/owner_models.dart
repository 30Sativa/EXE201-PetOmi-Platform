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
}

String _firstRunes(String value, int count) {
  return String.fromCharCodes(value.runes.take(count));
}
