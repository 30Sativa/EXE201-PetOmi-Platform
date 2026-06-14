import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:petomi_owner_mobile/main.dart';
import 'package:petomi_owner_mobile/models/owner_models.dart';
import 'package:petomi_owner_mobile/services/owner_repository.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  testWidgets('renders owner login gate when no token is stored', (
    tester,
  ) async {
    SharedPreferences.setMockInitialValues({});

    await tester.pumpWidget(PetOmiOwnerApp(repository: OwnerRepository()));
    await tester.pumpAndSettle();

    expect(find.text('Chào mừng bạn quay lại!'), findsOneWidget);
    expect(find.byIcon(Icons.login_rounded), findsOneWidget);
  });

  testWidgets('overview quick actions open owner API sheets', (tester) async {
    SharedPreferences.setMockInitialValues({});

    await tester.pumpWidget(PetOmiOwnerApp(repository: _FakeOwnerRepository()));
    await tester.pumpAndSettle();

    final overviewScroll = find.byType(Scrollable).first;
    final addPet = find.byKey(const ValueKey('quick_add_pet'));
    await tester.scrollUntilVisible(addPet, 500, scrollable: overviewScroll);
    await tester.tap(addPet);
    await tester.pumpAndSettle();
    expect(find.text('Tên thú cưng'), findsOneWidget);
    await tester.tap(find.byIcon(Icons.close_rounded).last);
    await tester.pumpAndSettle();

    final bookAppointment = find.byKey(
      const ValueKey('quick_book_appointment'),
    );
    await tester.scrollUntilVisible(
      bookAppointment,
      500,
      scrollable: overviewScroll,
    );
    await tester.tap(bookAppointment);
    await tester.pumpAndSettle();
    expect(find.text('Đặt lịch khám'), findsOneWidget);
    await tester.tap(find.byIcon(Icons.close_rounded).last);
    await tester.pumpAndSettle();

    final addReminder = find.byKey(const ValueKey('quick_add_reminder'));
    await tester.scrollUntilVisible(
      addReminder,
      500,
      scrollable: overviewScroll,
    );
    await tester.tap(addReminder);
    await tester.pumpAndSettle();
    expect(find.text('Loại nhắc nhở'), findsOneWidget);
  });

  testWidgets('history quick action opens the owner history page', (
    tester,
  ) async {
    SharedPreferences.setMockInitialValues({});

    await tester.pumpWidget(PetOmiOwnerApp(repository: _FakeOwnerRepository()));
    await tester.pumpAndSettle();

    final overviewScroll = find.byType(Scrollable).first;
    final history = find.byKey(const ValueKey('quick_owner_history'));
    await tester.scrollUntilVisible(history, 500, scrollable: overviewScroll);
    tester.widget<QuickActionCard>(history).onTap();
    await tester.pumpAndSettle();

    expect(find.text('Lịch sử khám'), findsWidgets);
    expect(find.text('Chưa có lịch sử phù hợp'), findsOneWidget);
  });
}

class _FakeOwnerRepository extends OwnerRepository {
  _FakeOwnerRepository();

  static const _petId = '00000000-0000-0000-0000-000000000001';
  static const _clinicId = '00000000-0000-0000-0000-000000000002';
  static const _serviceId = '00000000-0000-0000-0000-000000000003';
  static const _vetClinicId = '00000000-0000-0000-0000-000000000004';

  @override
  Future<bool> hasSession() async => true;

  @override
  Future<OwnerHomeData> getOwnerHomeData() async {
    return const OwnerHomeData(
      profile: OwnerProfile(
        userId: 'owner-1',
        fullName: 'Owner Test',
        phone: '0900000000',
        avatarUrl: null,
        dateOfBirth: null,
        gender: 'Other',
        address: 'HCM',
      ),
      email: 'owner@test.local',
      pets: [
        OwnerPet(
          petId: _petId,
          name: 'Milo',
          species: 'Dog',
          breed: 'Poodle',
          gender: 'Male',
          dateOfBirth: null,
          avatarUrl: null,
          color: 'Brown',
        ),
      ],
      appointments: [],
      reminders: [],
    );
  }

  @override
  Future<List<OwnerClinic>> getPublicClinics({String? keyword}) async {
    return const [
      OwnerClinic(
        clinicId: _clinicId,
        clinicName: 'PetOmi Clinic',
        address: 'HCM',
        logoUrl: null,
        description: null,
      ),
    ];
  }

  @override
  Future<OwnerClinicProfile> getClinicProfile(String clinicId) async {
    return const OwnerClinicProfile(
      clinic: OwnerClinic(
        clinicId: _clinicId,
        clinicName: 'PetOmi Clinic',
        address: 'HCM',
        logoUrl: null,
        description: null,
      ),
      services: [
        OwnerClinicService(
          serviceId: _serviceId,
          serviceName: 'Khám tổng quát',
          description: null,
          price: 120000,
          durationMins: 30,
          isActive: true,
        ),
      ],
    );
  }

  @override
  Future<List<OwnerAvailableSlot>> getAvailableSlots({
    required String clinicId,
    required DateTime date,
    String? serviceId,
    String? vetClinicId,
  }) async {
    return const [
      OwnerAvailableSlot(
        vetClinicId: _vetClinicId,
        doctorName: 'Dr Test',
        startTime: '09:00:00',
        endTime: '09:30:00',
        isAvailable: true,
      ),
    ];
  }

  @override
  Future<PetTimeline> getPetTimeline(
    String petId, {
    int page = 1,
    int pageSize = 100,
  }) async {
    return const PetTimeline(activities: [], totalCount: 0, hasNextPage: false);
  }
}
