import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:petomi_owner_mobile/main.dart';
import 'package:petomi_owner_mobile/models/owner_models.dart';
import 'package:petomi_owner_mobile/services/api_client.dart';
import 'package:petomi_owner_mobile/services/owner_repository.dart';
import 'package:petomi_owner_mobile/services/notification_center.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  test('notification center deduplicates reminder events by ID', () {
    final center = OwnerNotificationCenter.disabled();
    final payload = <String, dynamic>{
      'reminderId': 'reminder-1',
      'title': 'Lịch tiêm của Milo',
      'message': 'Đã đến giờ chuẩn bị.',
      'reminderType': 'Vaccine',
      'entityType': 'Pet',
      'remindAt': '2026-06-15T10:00:00Z',
    };

    center.ingestReminder(payload);
    center.ingestReminder(payload);

    expect(center.items, hasLength(1));
    expect(center.unreadCount, 1);
    center.markRead('reminder-1');
    expect(center.unreadCount, 0);
    center.dispose();
  });

  test('clinic review model parses backend contract', () {
    final review = OwnerClinicReview.fromJson(const {
      'reviewId': 'review-1',
      'clinicId': 'clinic-1',
      'ownerUserId': 'owner-1',
      'appointmentId': 'appointment-1',
      'rating': 5,
      'reviewContent': 'Dịch vụ tốt',
      'status': 'Pending',
      'createdAt': '2026-06-16T10:00:00Z',
      'updatedAt': null,
    });

    expect(review.clinicId, 'clinic-1');
    expect(review.rating, 5);
    expect(review.appointmentId, 'appointment-1');
    expect(review.createdDate, isNotNull);
  });

  test('chat messages are normalized oldest first', () async {
    SharedPreferences.setMockInitialValues({});
    final apiClient = ApiClient(
      baseUrl: 'https://api.test/api',
      httpClient: MockClient((request) async {
        expect(
          request.url.path,
          '/api/chat/conversations/conversation-1/messages',
        );
        return http.Response(
          '''
{
  "data": [
    {
      "messageId": "message-2",
      "conversationId": "conversation-1",
      "senderRole": "AI",
      "status": "Completed",
      "content": "second",
      "createdAt": "2026-06-18T10:01:00Z"
    },
    {
      "messageId": "message-1",
      "conversationId": "conversation-1",
      "senderRole": "User",
      "status": "Completed",
      "content": "first",
      "createdAt": "2026-06-18T10:00:00Z"
    }
  ]
}
''',
          200,
          headers: {'content-type': 'application/json'},
        );
      }),
    );
    final repository = OwnerRepository(apiClient: apiClient);

    final messages = await repository.getConversationMessages('conversation-1');

    expect(messages.map((message) => message.content), ['first', 'second']);
  });

  testWidgets('renders owner login gate when no token is stored', (
    tester,
  ) async {
    SharedPreferences.setMockInitialValues({});

    await tester.pumpWidget(PetOmiOwnerApp(repository: OwnerRepository()));
    await tester.pumpAndSettle();

    expect(find.text('Chào mừng bạn quay lại!'), findsOneWidget);
    expect(find.byIcon(Icons.login_rounded), findsOneWidget);
  });

  testWidgets('forgot password entry opens recovery sheet', (tester) async {
    SharedPreferences.setMockInitialValues({});

    await tester.pumpWidget(PetOmiOwnerApp(repository: OwnerRepository()));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Quên mật khẩu?'));
    await tester.pumpAndSettle();

    expect(find.text('Khôi phục mật khẩu'), findsOneWidget);
    expect(find.text('Email tài khoản'), findsOneWidget);
  });

  testWidgets('incomplete profile is gated before owner dashboard', (
    tester,
  ) async {
    SharedPreferences.setMockInitialValues({});

    await tester.pumpWidget(
      PetOmiOwnerApp(repository: _FakeOwnerRepository(profileCompleted: false)),
    );
    await tester.pumpAndSettle();

    expect(find.text('Hoàn thiện hồ sơ'), findsOneWidget);
    expect(find.text('Hoàn tất và tiếp tục'), findsOneWidget);
  });

  testWidgets('owner shell fits a compact mobile viewport', (tester) async {
    SharedPreferences.setMockInitialValues({});
    tester.view.physicalSize = const Size(320, 720);
    tester.view.devicePixelRatio = 1;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    await tester.pumpWidget(PetOmiOwnerApp(repository: _FakeOwnerRepository()));
    await tester.pumpAndSettle();

    expect(find.byType(OwnerShell), findsOneWidget);
    expect(tester.takeException(), isNull);
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
  _FakeOwnerRepository({this.profileCompleted = true});

  final bool profileCompleted;

  static const _petId = '00000000-0000-0000-0000-000000000001';
  static const _clinicId = '00000000-0000-0000-0000-000000000002';
  static const _serviceId = '00000000-0000-0000-0000-000000000003';
  static const _vetClinicId = '00000000-0000-0000-0000-000000000004';

  @override
  OwnerNotificationCenter createNotificationCenter() =>
      OwnerNotificationCenter.disabled();

  @override
  Future<bool> hasSession() async => true;

  @override
  Future<OwnerHomeData> getOwnerHomeData() async {
    return OwnerHomeData(
      profile: const OwnerProfile(
        userId: 'owner-1',
        fullName: 'Owner Test',
        phone: '0900000000',
        avatarUrl: null,
        dateOfBirth: null,
        gender: 'Other',
        address: 'HCM',
      ),
      email: 'owner@test.local',
      pets: const [
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
      isProfileCompleted: profileCompleted,
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
