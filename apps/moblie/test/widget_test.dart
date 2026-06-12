import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:petomi_owner_mobile/main.dart';
import 'package:petomi_owner_mobile/services/owner_repository.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  testWidgets('renders owner login gate when no token is stored', (
    tester,
  ) async {
    SharedPreferences.setMockInitialValues({});

    await tester.pumpWidget(PetOmiOwnerApp(repository: OwnerRepository()));
    await tester.pumpAndSettle();

    expect(find.text('PETOMI OWNER MOBILE'), findsOneWidget);
    expect(find.text('Đăng nhập'), findsWidgets);
    expect(find.byIcon(Icons.login_rounded), findsOneWidget);
  });
}
