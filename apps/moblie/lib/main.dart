import 'package:flutter/material.dart';

import 'models/owner_models.dart';
import 'services/api_client.dart';
import 'services/owner_repository.dart';

void main() {
  runApp(PetOmiOwnerApp(repository: OwnerRepository()));
}

class PetOmiOwnerApp extends StatelessWidget {
  const PetOmiOwnerApp({required this.repository, super.key});

  final OwnerRepository repository;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'PetOmi Owner',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        scaffoldBackgroundColor: AppColors.background,
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.primary,
          primary: AppColors.primary,
          surface: AppColors.surface,
        ),
        fontFamily: 'Roboto',
        textTheme: const TextTheme(
          headlineLarge: TextStyle(
            color: AppColors.text,
            fontSize: 30,
            fontWeight: FontWeight.w900,
            height: 1.08,
          ),
          headlineMedium: TextStyle(
            color: AppColors.text,
            fontSize: 24,
            fontWeight: FontWeight.w900,
          ),
          titleLarge: TextStyle(
            color: AppColors.text,
            fontSize: 20,
            fontWeight: FontWeight.w900,
          ),
          titleMedium: TextStyle(
            color: AppColors.text,
            fontSize: 16,
            fontWeight: FontWeight.w800,
          ),
          bodyLarge: TextStyle(
            color: AppColors.textMuted,
            fontSize: 15,
            height: 1.55,
          ),
          bodyMedium: TextStyle(
            color: AppColors.textMuted,
            fontSize: 13,
            height: 1.45,
          ),
          labelLarge: TextStyle(
            color: AppColors.text,
            fontSize: 13,
            fontWeight: FontWeight.w800,
          ),
        ),
      ),
      home: AuthGate(repository: repository),
    );
  }
}

class AppColors {
  static const background = Color(0xFFFFF7ED);
  static const surface = Color(0xFFFFFFFF);
  static const surfaceMuted = Color(0xFFFFF1E6);
  static const border = Color(0xFFF0E4D8);
  static const text = Color(0xFF4A2F21);
  static const textMuted = Color(0xFF6B4A3A);
  static const textSubtle = Color(0xFF8A6A5A);
  static const primary = Color(0xFFF59E0B);
  static const primaryHover = Color(0xFFEA8A00);
  static const primarySoft = Color(0xFFFFE6C7);
  static const accentSoft = Color(0xFFD1FAE5);
  static const success = Color(0xFF16A34A);
  static const successSoft = Color(0xFFDCFCE7);
  static const warning = Color(0xFFD97706);
  static const warningSoft = Color(0xFFFEF3C7);
  static const danger = Color(0xFFDC2626);
  static const dangerSoft = Color(0xFFFEE2E2);
}

class AuthGate extends StatefulWidget {
  const AuthGate({required this.repository, super.key});

  final OwnerRepository repository;

  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  late Future<bool> _sessionFuture;
  bool _authenticated = false;

  @override
  void initState() {
    super.initState();
    _sessionFuture = widget.repository.hasSession();
  }

  void _setAuthenticated(bool value) {
    setState(() {
      _authenticated = value;
      _sessionFuture = Future.value(value);
    });
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<bool>(
      future: _sessionFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const AppSplash();
        }
        final hasSession = _authenticated || (snapshot.data ?? false);
        if (!hasSession) {
          return LoginPage(
            repository: widget.repository,
            onLoggedIn: () => _setAuthenticated(true),
          );
        }
        return OwnerDataView(
          repository: widget.repository,
          onLoggedOut: () => _setAuthenticated(false),
        );
      },
    );
  }
}

class OwnerDataView extends StatefulWidget {
  const OwnerDataView({
    required this.repository,
    required this.onLoggedOut,
    super.key,
  });

  final OwnerRepository repository;
  final VoidCallback onLoggedOut;

  @override
  State<OwnerDataView> createState() => _OwnerDataViewState();
}

class _OwnerDataViewState extends State<OwnerDataView> {
  late Future<OwnerHomeData> _homeFuture;

  @override
  void initState() {
    super.initState();
    _homeFuture = widget.repository.getOwnerHomeData();
  }

  void _refresh() {
    setState(() {
      _homeFuture = widget.repository.getOwnerHomeData();
    });
  }

  Future<void> _logout() async {
    await widget.repository.logout();
    widget.onLoggedOut();
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<OwnerHomeData>(
      future: _homeFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const AppSplash();
        }
        if (snapshot.hasError) {
          return ApiErrorPage(
            error: snapshot.error,
            onRetry: _refresh,
            onLogout: _logout,
          );
        }
        final data = snapshot.data!;
        return OwnerScope(
          data: data,
          repository: widget.repository,
          onRefresh: _refresh,
          onLogout: _logout,
          child: const OwnerShell(),
        );
      },
    );
  }
}

class OwnerScope extends InheritedWidget {
  const OwnerScope({
    required this.data,
    required this.repository,
    required this.onRefresh,
    required this.onLogout,
    required super.child,
    super.key,
  });

  final OwnerHomeData data;
  final OwnerRepository repository;
  final VoidCallback onRefresh;
  final Future<void> Function() onLogout;

  static OwnerScope of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<OwnerScope>();
    assert(scope != null, 'OwnerScope is missing');
    return scope!;
  }

  @override
  bool updateShouldNotify(OwnerScope oldWidget) => data != oldWidget.data;
}

class AppSplash extends StatelessWidget {
  const AppSplash({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: DecoratedGradient(
        child: Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
      ),
    );
  }
}

class LoginPage extends StatefulWidget {
  const LoginPage({
    required this.repository,
    required this.onLoggedIn,
    super.key,
  });

  final OwnerRepository repository;
  final VoidCallback onLoggedIn;

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _loading = false;
  bool _obscure = true;
  String? _error;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text;
    if (email.isEmpty || password.isEmpty) {
      setState(() => _error = 'Nhập email và mật khẩu để đăng nhập.');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await widget.repository.login(email: email, password: password);
      if (mounted) widget.onLoggedIn();
    } catch (error) {
      if (!mounted) return;
      setState(() => _error = error.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: DecoratedGradient(
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(22, 28, 22, 28),
            children: [
              const SizedBox(height: 28),
              SurfaceCard(
                radius: 34,
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const PetOmiAvatar(
                      label: 'PO',
                      icon: Icons.pets_rounded,
                      size: 58,
                    ),
                    const SizedBox(height: 18),
                    const Eyebrow('PetOmi Owner Mobile'),
                    const SizedBox(height: 10),
                    Text(
                      'Đăng nhập để xem dữ liệu owner thật.',
                      style: Theme.of(context).textTheme.headlineLarge,
                    ),
                    const SizedBox(height: 10),
                    Text(
                      'App sẽ gọi API backend owner: hồ sơ, thú cưng, lịch hẹn và nhắc nhở.',
                      style: Theme.of(context).textTheme.bodyLarge,
                    ),
                    const SizedBox(height: 24),
                    TextField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      textInputAction: TextInputAction.next,
                      decoration: const InputDecoration(
                        labelText: 'Email',
                        prefixIcon: Icon(Icons.mail_rounded),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.all(Radius.circular(18)),
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    TextField(
                      controller: _passwordController,
                      obscureText: _obscure,
                      textInputAction: TextInputAction.done,
                      onSubmitted: (_) => _login(),
                      decoration: InputDecoration(
                        labelText: 'Mật khẩu',
                        prefixIcon: const Icon(Icons.lock_rounded),
                        suffixIcon: IconButton(
                          onPressed: () => setState(() => _obscure = !_obscure),
                          icon: Icon(
                            _obscure
                                ? Icons.visibility_rounded
                                : Icons.visibility_off_rounded,
                          ),
                        ),
                        border: const OutlineInputBorder(
                          borderRadius: BorderRadius.all(Radius.circular(18)),
                        ),
                      ),
                    ),
                    if (_error != null) ...[
                      const SizedBox(height: 14),
                      ErrorBanner(message: _error!),
                    ],
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      child: PrimaryButton(
                        label: _loading ? 'Đang đăng nhập...' : 'Đăng nhập',
                        icon: Icons.login_rounded,
                        onTap: _loading ? null : _login,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Emulator dùng API mặc định: ${widget.repository.apiClient.baseUrl}',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.textSubtle,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class ApiErrorPage extends StatelessWidget {
  const ApiErrorPage({
    required this.error,
    required this.onRetry,
    required this.onLogout,
    super.key,
  });

  final Object? error;
  final VoidCallback onRetry;
  final Future<void> Function() onLogout;

  @override
  Widget build(BuildContext context) {
    final message = error is ApiException
        ? (error as ApiException).message
        : error.toString();
    return Scaffold(
      body: DecoratedGradient(
        child: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(22),
              child: SurfaceCard(
                radius: 30,
                padding: const EdgeInsets.all(22),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(
                      Icons.cloud_off_rounded,
                      color: AppColors.danger,
                      size: 42,
                    ),
                    const SizedBox(height: 14),
                    Text(
                      'Chưa tải được dữ liệu owner',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 8),
                    Text(message, style: Theme.of(context).textTheme.bodyLarge),
                    const SizedBox(height: 18),
                    Row(
                      children: [
                        Expanded(
                          child: PrimaryButton(
                            label: 'Thử lại',
                            icon: Icons.refresh_rounded,
                            onTap: onRetry,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: SoftButton(
                            label: 'Đăng xuất',
                            icon: Icons.logout_rounded,
                            onTap: onLogout,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class OwnerShell extends StatefulWidget {
  const OwnerShell({super.key});

  @override
  State<OwnerShell> createState() => _OwnerShellState();
}

class _OwnerShellState extends State<OwnerShell> {
  int _selectedIndex = 0;

  final List<OwnerTab> _tabs = const [
    OwnerTab(
      label: 'Tổng quan',
      icon: Icons.dashboard_rounded,
      page: OverviewPage(),
    ),
    OwnerTab(label: 'Thú cưng', icon: Icons.pets_rounded, page: PetsPage()),
    OwnerTab(
      label: 'Lịch hẹn',
      icon: Icons.event_available_rounded,
      page: AppointmentsPage(),
    ),
    OwnerTab(
      label: 'Nhắc nhở',
      icon: Icons.notifications_active_rounded,
      page: RemindersPage(),
    ),
    OwnerTab(label: 'Hồ sơ', icon: Icons.person_rounded, page: ProfilePage()),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: IndexedStack(
          index: _selectedIndex,
          children: _tabs.map((tab) => tab.page).toList(),
        ),
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        child: Container(
          margin: const EdgeInsets.fromLTRB(16, 4, 16, 12),
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: AppColors.surface.withValues(alpha: 0.96),
            borderRadius: BorderRadius.circular(26),
            border: Border.all(color: AppColors.border),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.14),
                blurRadius: 24,
                offset: const Offset(0, 12),
              ),
            ],
          ),
          child: Row(
            children: List.generate(_tabs.length, (index) {
              final tab = _tabs[index];
              return Expanded(
                child: _BottomNavItem(
                  tab: tab,
                  selected: _selectedIndex == index,
                  onTap: () => setState(() => _selectedIndex = index),
                ),
              );
            }),
          ),
        ),
      ),
    );
  }
}

class OwnerTab {
  const OwnerTab({required this.label, required this.icon, required this.page});

  final String label;
  final IconData icon;
  final Widget page;
}

class _BottomNavItem extends StatelessWidget {
  const _BottomNavItem({
    required this.tab,
    required this.selected,
    required this.onTap,
  });

  final OwnerTab tab;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      selected: selected,
      label: tab.label,
      child: InkWell(
        borderRadius: BorderRadius.circular(22),
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(vertical: 9),
          decoration: BoxDecoration(
            color: selected ? AppColors.primary : Colors.transparent,
            borderRadius: BorderRadius.circular(22),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                tab.icon,
                size: 20,
                color: selected ? Colors.white : AppColors.textSubtle,
              ),
              const SizedBox(height: 3),
              Text(
                tab.label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: selected ? Colors.white : AppColors.textSubtle,
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class OverviewPage extends StatelessWidget {
  const OverviewPage({super.key});

  @override
  Widget build(BuildContext context) {
    final data = OwnerScope.of(context).data;
    return OwnerScrollView(
      onRefresh: OwnerScope.of(context).onRefresh,
      children: [
        OwnerHeader(data: data),
        const SizedBox(height: 16),
        OverviewHero(data: data),
        const SizedBox(height: 16),
        MetricsGrid(data: data),
        const SizedBox(height: 16),
        const QuickActions(),
        const SizedBox(height: 16),
        UpcomingAppointmentsSection(data: data),
        const SizedBox(height: 16),
        PetsPreviewSection(data: data),
      ],
    );
  }
}

class PetsPage extends StatelessWidget {
  const PetsPage({super.key});

  @override
  Widget build(BuildContext context) {
    final data = OwnerScope.of(context).data;
    return OwnerScrollView(
      onRefresh: OwnerScope.of(context).onRefresh,
      children: [
        const PageHeader(
          eyebrow: 'Hồ sơ thú cưng',
          title: 'Thú cưng của bạn',
          subtitle: 'Dữ liệu lấy từ API /pets của owner đang đăng nhập.',
          trailingIcon: Icons.add_rounded,
          trailingLabel: 'Thêm',
        ),
        const SizedBox(height: 14),
        const FilterChips(
          chips: ['Tất cả', 'Chó', 'Mèo', 'Cần nhắc lịch'],
          selectedIndex: 0,
        ),
        const SizedBox(height: 14),
        if (data.pets.isEmpty)
          const EmptyOwnerState(
            icon: Icons.pets_rounded,
            title: 'Chưa có thú cưng',
            message:
                'Khi owner tạo hồ sơ thú cưng trên backend, danh sách sẽ hiện ở đây.',
          )
        else
          ...data.pets.map((pet) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: PetCard(pet: pet, detailed: true),
            );
          }),
        const SizedBox(height: 4),
        HealthSummaryCard(data: data),
      ],
    );
  }
}

class AppointmentsPage extends StatelessWidget {
  const AppointmentsPage({super.key});

  @override
  Widget build(BuildContext context) {
    final data = OwnerScope.of(context).data;
    return OwnerScrollView(
      onRefresh: OwnerScope.of(context).onRefresh,
      children: [
        const PageHeader(
          eyebrow: 'Lịch khám',
          title: 'Lịch hẹn sắp tới',
          subtitle: 'Dữ liệu lấy từ API /appointments/owner.',
          trailingIcon: Icons.add_circle_rounded,
          trailingLabel: 'Đặt lịch',
        ),
        const SizedBox(height: 14),
        const DateSelector(),
        const SizedBox(height: 14),
        if (data.appointments.isEmpty)
          const EmptyOwnerState(
            icon: Icons.event_available_rounded,
            title: 'Chưa có lịch hẹn',
            message: 'Lịch đặt khám của owner sẽ được đồng bộ từ backend.',
          )
        else
          ...data.appointments.map((appointment) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: AppointmentTile(
                appointment: appointment,
                petName: petNameFor(data, appointment.petId),
              ),
            );
          }),
        const SizedBox(height: 8),
        const SectionCard(
          title: 'Chuẩn bị trước buổi khám',
          subtitle:
              'Mang theo sổ vaccine, ghi chú triệu chứng và ảnh chụp nếu có thay đổi gần đây.',
          child: Column(
            children: [
              ChecklistRow(text: 'Cập nhật cân nặng gần nhất'),
              ChecklistRow(text: 'Kiểm tra nhắc lịch uống thuốc'),
              ChecklistRow(text: 'Chia sẻ hồ sơ sức khỏe với phòng khám'),
            ],
          ),
        ),
      ],
    );
  }
}

class RemindersPage extends StatefulWidget {
  const RemindersPage({super.key});

  @override
  State<RemindersPage> createState() => _RemindersPageState();
}

class _RemindersPageState extends State<RemindersPage> {
  String? _busyId;
  String? _error;

  Future<void> _toggle(String reminderId) async {
    final scope = OwnerScope.of(context);
    setState(() {
      _busyId = reminderId;
      _error = null;
    });
    try {
      await scope.repository.toggleReminder(reminderId);
      scope.onRefresh();
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _busyId = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final data = OwnerScope.of(context).data;
    return OwnerScrollView(
      onRefresh: OwnerScope.of(context).onRefresh,
      children: [
        const PageHeader(
          eyebrow: 'Nhắc nhở',
          title: 'Việc cần theo dõi',
          subtitle: 'Dữ liệu lấy từ API /reminders.',
          trailingIcon: Icons.tune_rounded,
          trailingLabel: 'Cài đặt',
        ),
        if (_error != null) ...[
          const SizedBox(height: 12),
          ErrorBanner(message: _error!),
        ],
        const SizedBox(height: 14),
        if (data.reminders.isEmpty)
          const EmptyOwnerState(
            icon: Icons.notifications_active_rounded,
            title: 'Chưa có nhắc nhở',
            message: 'Reminder vaccine, thuốc hoặc tái khám sẽ hiện ở đây.',
          )
        else
          ...data.reminders.map((reminder) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: ReminderTile(
                reminder: reminder,
                petName: reminder.petId == null
                    ? null
                    : petNameFor(data, reminder.petId!),
                loading: _busyId == reminder.reminderId,
                onToggle: () => _toggle(reminder.reminderId),
              ),
            );
          }),
      ],
    );
  }
}

class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    final scope = OwnerScope.of(context);
    final data = scope.data;
    final profile = data.profile;
    return OwnerScrollView(
      onRefresh: scope.onRefresh,
      children: [
        const PageHeader(
          eyebrow: 'Tài khoản owner',
          title: 'Hồ sơ cá nhân',
          subtitle: 'Dữ liệu lấy từ API /profile.',
          trailingIcon: Icons.edit_rounded,
          trailingLabel: 'Sửa',
        ),
        const SizedBox(height: 14),
        ProfileIdentityCard(data: data),
        const SizedBox(height: 14),
        SectionCard(
          title: 'Thông tin liên hệ',
          subtitle:
              'Các trường này dùng cho lịch hẹn và thông báo từ phòng khám.',
          child: Column(
            children: [
              InfoRow(
                label: 'Email',
                value: data.email.isEmpty ? 'Chưa rõ' : data.email,
              ),
              InfoRow(
                label: 'Số điện thoại',
                value: profile?.phone ?? 'Chưa cập nhật',
              ),
              InfoRow(
                label: 'Địa chỉ',
                value: profile?.address ?? 'Chưa cập nhật',
              ),
              InfoRow(
                label: 'Giới tính',
                value: profile?.gender ?? 'Chưa cập nhật',
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        SectionCard(
          title: 'Phiên đăng nhập',
          subtitle: 'Token được lưu local bằng SharedPreferences.',
          child: Column(
            children: [
              InfoRow(
                label: 'API base',
                value: scope.repository.apiClient.baseUrl,
              ),
              InfoRow(label: 'Thú cưng', value: '${data.pets.length} hồ sơ'),
              InfoRow(
                label: 'Lịch hẹn',
                value: '${data.appointments.length} lịch',
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        PrimaryButton(
          label: 'Đăng xuất',
          icon: Icons.logout_rounded,
          onTap: scope.onLogout,
        ),
      ],
    );
  }
}

class OwnerScrollView extends StatelessWidget {
  const OwnerScrollView({required this.children, this.onRefresh, super.key});

  final List<Widget> children;
  final VoidCallback? onRefresh;

  @override
  Widget build(BuildContext context) {
    final listView = ListView(
      physics: const AlwaysScrollableScrollPhysics(
        parent: BouncingScrollPhysics(),
      ),
      padding: const EdgeInsets.fromLTRB(18, 12, 18, 24),
      children: children,
    );
    return DecoratedGradient(
      child: onRefresh == null
          ? listView
          : RefreshIndicator(
              color: AppColors.primary,
              onRefresh: () async => onRefresh!(),
              child: listView,
            ),
    );
  }
}

class DecoratedGradient extends StatelessWidget {
  const DecoratedGradient({required this.child, super.key});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.background, Color(0xFFFFF4D7), Color(0xFFEFFDF5)],
        ),
      ),
      child: child,
    );
  }
}

class OwnerHeader extends StatelessWidget {
  const OwnerHeader({required this.data, super.key});

  final OwnerHomeData data;

  @override
  Widget build(BuildContext context) {
    final profile = data.profile;
    return SurfaceCard(
      radius: 30,
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          PetOmiAvatar(
            label: profile?.initials ?? 'PO',
            icon: Icons.person_rounded,
            imageUrl: profile?.avatarUrl,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'PetOmi của bạn',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSubtle,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.9,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Xin chào, ${profile?.displayName ?? data.email}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ],
            ),
          ),
          IconButton.filledTonal(
            style: IconButton.styleFrom(
              backgroundColor: AppColors.surfaceMuted,
              foregroundColor: AppColors.textMuted,
            ),
            onPressed: OwnerScope.of(context).onRefresh,
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
    );
  }
}

class OverviewHero extends StatelessWidget {
  const OverviewHero({required this.data, super.key});

  final OwnerHomeData data;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: AppColors.surface.withValues(alpha: 0.92),
        borderRadius: BorderRadius.circular(34),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.14),
            blurRadius: 28,
            offset: const Offset(0, 14),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Eyebrow('Tổng quan hôm nay'),
          const SizedBox(height: 12),
          Text(
            'Dữ liệu owner đang đồng bộ từ backend.',
            style: Theme.of(context).textTheme.headlineLarge,
          ),
          const SizedBox(height: 12),
          Text(
            'Mobile đang gọi API thật cho hồ sơ, thú cưng, lịch khám và nhắc nhở.',
            style: Theme.of(context).textTheme.bodyLarge,
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              Expanded(
                child: HeroMiniStat(
                  value: '${data.pets.length}',
                  label: 'Hồ sơ thú cưng',
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: HeroMiniStat(
                  value: '${data.upcomingAppointmentCount}',
                  label: 'Lịch sắp tới',
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: HeroMiniStat(
                  value: '${data.activeReminderCount}',
                  label: 'Nhắc nhở bật',
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class HeroMiniStat extends StatelessWidget {
  const HeroMiniStat({required this.value, required this.label, super.key});

  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: AppColors.surfaceMuted.withValues(alpha: 0.76),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            value,
            style: Theme.of(
              context,
            ).textTheme.headlineMedium?.copyWith(fontSize: 24, height: 1),
          ),
          const SizedBox(height: 6),
          Text(
            label,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textSubtle,
              fontSize: 11,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class MetricsGrid extends StatelessWidget {
  const MetricsGrid({required this.data, super.key});

  final OwnerHomeData data;

  @override
  Widget build(BuildContext context) {
    final metrics = [
      MetricData(
        label: 'Thú cưng đang quản lý',
        value: '${data.pets.length}',
        hint: 'Từ /pets',
        icon: Icons.pets_rounded,
      ),
      MetricData(
        label: 'Lịch hẹn sắp tới',
        value: '${data.upcomingAppointmentCount}',
        hint: 'Từ /appointments/owner',
        icon: Icons.event_available_rounded,
      ),
      MetricData(
        label: 'Lịch sử khám',
        value: '${data.completedAppointmentCount}',
        hint: 'Đã hoàn thành',
        icon: Icons.assignment_turned_in_rounded,
      ),
      MetricData(
        label: 'Nhắc nhở đang bật',
        value: '${data.activeReminderCount}',
        hint: 'Từ /reminders',
        icon: Icons.trending_up_rounded,
      ),
    ];
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: metrics.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 1.16,
      ),
      itemBuilder: (context, index) => MetricCard(metric: metrics[index]),
    );
  }
}

class MetricCard extends StatelessWidget {
  const MetricCard({required this.metric, super.key});

  final MetricData metric;

  @override
  Widget build(BuildContext context) {
    return SurfaceCard(
      radius: 26,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  metric.label,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(
                    context,
                  ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w800),
                ),
              ),
              IconBubble(icon: metric.icon),
            ],
          ),
          const Spacer(),
          Text(
            metric.value,
            style: Theme.of(
              context,
            ).textTheme.headlineMedium?.copyWith(fontSize: 30, height: 1),
          ),
          const SizedBox(height: 6),
          Text(
            metric.hint,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textSubtle,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}

class QuickActions extends StatelessWidget {
  const QuickActions({super.key});

  @override
  Widget build(BuildContext context) {
    return const Row(
      children: [
        Expanded(
          child: QuickActionCard(
            icon: Icons.smart_toy_rounded,
            title: 'AI Chat',
            subtitle:
                'Sẽ nối /api/chat/messages ở phase tiếp theo nếu cần owner chat.',
          ),
        ),
        SizedBox(width: 12),
        Expanded(
          child: QuickActionCard(
            icon: Icons.local_hospital_rounded,
            title: 'Phòng khám',
            subtitle: 'Đặt lịch dùng nhóm /appointments/owner.',
          ),
        ),
      ],
    );
  }
}

class QuickActionCard extends StatelessWidget {
  const QuickActionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    super.key,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return SurfaceCard(
      radius: 24,
      padding: const EdgeInsets.all(15),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          IconBubble(icon: icon),
          const SizedBox(height: 12),
          Text(title, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 6),
          Text(
            subtitle,
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(fontSize: 12),
          ),
        ],
      ),
    );
  }
}

class UpcomingAppointmentsSection extends StatelessWidget {
  const UpcomingAppointmentsSection({required this.data, super.key});

  final OwnerHomeData data;

  @override
  Widget build(BuildContext context) {
    final items = data.appointments.take(2).toList();
    return SectionCard(
      title: 'Lịch hẹn sắp tới',
      subtitle: 'Các lịch hẹn lấy từ backend.',
      child: items.isEmpty
          ? const EmptyOwnerState(
              icon: Icons.event_available_rounded,
              title: 'Chưa có lịch hẹn',
              message: 'Đặt lịch từ web hoặc backend, mobile sẽ đồng bộ.',
              compact: true,
            )
          : Column(
              children: items.map((appointment) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: AppointmentTile(
                    appointment: appointment,
                    petName: petNameFor(data, appointment.petId),
                    compact: true,
                  ),
                );
              }).toList(),
            ),
    );
  }
}

class PetsPreviewSection extends StatelessWidget {
  const PetsPreviewSection({required this.data, super.key});

  final OwnerHomeData data;

  @override
  Widget build(BuildContext context) {
    final pets = data.pets.take(2).toList();
    return SectionCard(
      title: 'Thú cưng của bạn',
      subtitle: 'Danh sách từ API /pets.',
      child: pets.isEmpty
          ? const EmptyOwnerState(
              icon: Icons.pets_rounded,
              title: 'Chưa có thú cưng',
              message: 'Hồ sơ mới sẽ hiện tại đây.',
              compact: true,
            )
          : Column(
              children: pets.map((pet) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: PetCard(pet: pet),
                );
              }).toList(),
            ),
    );
  }
}

class PageHeader extends StatelessWidget {
  const PageHeader({
    required this.eyebrow,
    required this.title,
    required this.subtitle,
    required this.trailingIcon,
    required this.trailingLabel,
    super.key,
  });

  final String eyebrow;
  final String title;
  final String subtitle;
  final IconData trailingIcon;
  final String trailingLabel;

  @override
  Widget build(BuildContext context) {
    return SurfaceCard(
      radius: 30,
      padding: const EdgeInsets.all(18),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Eyebrow(eyebrow),
                const SizedBox(height: 8),
                Text(title, style: Theme.of(context).textTheme.headlineMedium),
                const SizedBox(height: 8),
                Text(subtitle, style: Theme.of(context).textTheme.bodyMedium),
              ],
            ),
          ),
          const SizedBox(width: 12),
          FilledButton.tonalIcon(
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.primarySoft,
              foregroundColor: AppColors.primaryHover,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(22),
              ),
            ),
            onPressed: () {},
            icon: Icon(trailingIcon, size: 18),
            label: Text(trailingLabel),
          ),
        ],
      ),
    );
  }
}

class SectionCard extends StatelessWidget {
  const SectionCard({
    required this.title,
    required this.subtitle,
    required this.child,
    this.action,
    super.key,
  });

  final String title;
  final String subtitle;
  final Widget child;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    return SurfaceCard(
      radius: 24,
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: 6),
                    Text(
                      subtitle,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                ),
              ),
              ?action,
            ],
          ),
          const SizedBox(height: 14),
          child,
        ],
      ),
    );
  }
}

class AppointmentTile extends StatelessWidget {
  const AppointmentTile({
    required this.appointment,
    required this.petName,
    this.compact = false,
    super.key,
  });

  final OwnerAppointment appointment;
  final String petName;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final statusStyle = appointmentStatusStyle(appointment.status);
    return Container(
      padding: EdgeInsets.all(compact ? 12 : 14),
      decoration: BoxDecoration(
        color: AppColors.surfaceMuted.withValues(alpha: 0.65),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          DatePill(date: appointment.date),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  appointment.appointmentType,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 4),
                Text(
                  '$petName • Clinic ${shortId(appointment.clinicId)}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    StatusChip(
                      label: statusLabel(appointment.status),
                      color: statusStyle.$1,
                      background: statusStyle.$2,
                    ),
                    const SizedBox(width: 8),
                    Flexible(
                      child: Text(
                        '${shortTime(appointment.startTime)} - ${shortTime(appointment.endTime)}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.textSubtle,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          const Icon(Icons.chevron_right_rounded, color: AppColors.textSubtle),
        ],
      ),
    );
  }
}

class PetCard extends StatelessWidget {
  const PetCard({required this.pet, this.detailed = false, super.key});

  final OwnerPet pet;
  final bool detailed;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surfaceMuted.withValues(alpha: 0.6),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          Row(
            children: [
              PetOmiAvatar(
                label: pet.initials,
                icon: pet.species.toLowerCase() == 'cat'
                    ? Icons.cruelty_free_rounded
                    : Icons.pets_rounded,
                imageUrl: pet.avatarUrl,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      pet.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${pet.speciesLabel} • ${pet.breedLabel}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                ),
              ),
              const StatusChip(
                label: 'API',
                color: AppColors.success,
                background: AppColors.successSoft,
              ),
            ],
          ),
          if (detailed) ...[
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: PetStat(label: 'Tuổi', value: pet.ageLabel),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: PetStat(
                    label: 'Màu',
                    value: pet.color ?? 'Chưa cập nhật',
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: PetStat(
                    label: 'Giới tính',
                    value: pet.gender ?? 'Chưa rõ',
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class ReminderTile extends StatelessWidget {
  const ReminderTile({
    required this.reminder,
    required this.onToggle,
    this.petName,
    this.loading = false,
    super.key,
  });

  final OwnerReminder reminder;
  final String? petName;
  final bool loading;
  final VoidCallback onToggle;

  @override
  Widget build(BuildContext context) {
    final enabled = reminder.isEnabled;
    return SurfaceCard(
      radius: 24,
      padding: const EdgeInsets.all(14),
      child: Row(
        children: [
          IconBubble(
            icon: reminderIcon(reminder.reminderType),
            background: enabled
                ? AppColors.primarySoft
                : AppColors.surfaceMuted,
            foreground: enabled ? AppColors.primaryHover : AppColors.textSubtle,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  reminder.title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 4),
                Text(
                  reminder.message ??
                      (petName == null
                          ? reminder.reminderType
                          : '$petName • ${reminder.reminderType}'),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 8),
                Text(
                  formatDateTime(reminder.dueAt),
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSubtle,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          ),
          loading
              ? const SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: AppColors.primary,
                  ),
                )
              : Switch.adaptive(
                  value: enabled,
                  activeThumbColor: AppColors.primary,
                  onChanged: (_) => onToggle(),
                ),
        ],
      ),
    );
  }
}

class HealthSummaryCard extends StatelessWidget {
  const HealthSummaryCard({required this.data, super.key});

  final OwnerHomeData data;

  @override
  Widget build(BuildContext context) {
    return SectionCard(
      title: 'Hồ sơ sức khỏe',
      subtitle: 'Tổng hợp nhanh từ dữ liệu owner hiện có.',
      child: Column(
        children: [
          InfoRow(label: 'Tổng thú cưng', value: '${data.pets.length} hồ sơ'),
          InfoRow(
            label: 'Reminder đang bật',
            value: '${data.activeReminderCount} nhắc nhở',
          ),
          InfoRow(
            label: 'Lịch đã hoàn thành',
            value: '${data.completedAppointmentCount} lịch',
          ),
        ],
      ),
    );
  }
}

class DateSelector extends StatelessWidget {
  const DateSelector({super.key});

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final dates = List.generate(6, (index) => now.add(Duration(days: index)));
    return SizedBox(
      height: 88,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: dates.length,
        separatorBuilder: (_, _) => const SizedBox(width: 10),
        itemBuilder: (context, index) {
          final date = dates[index];
          final selected = index == 0;
          return Container(
            width: 72,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: selected ? AppColors.primary : AppColors.surface,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(
                color: selected ? AppColors.primary : AppColors.border,
              ),
              boxShadow: selected
                  ? [
                      BoxShadow(
                        color: AppColors.primary.withValues(alpha: 0.22),
                        blurRadius: 18,
                        offset: const Offset(0, 8),
                      ),
                    ]
                  : null,
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  weekdayLabel(date.weekday),
                  style: TextStyle(
                    color: selected ? Colors.white : AppColors.textSubtle,
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  date.day.toString().padLeft(2, '0'),
                  style: TextStyle(
                    color: selected ? Colors.white : AppColors.text,
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class ProfileIdentityCard extends StatelessWidget {
  const ProfileIdentityCard({required this.data, super.key});

  final OwnerHomeData data;

  @override
  Widget build(BuildContext context) {
    final profile = data.profile;
    return SurfaceCard(
      radius: 28,
      padding: const EdgeInsets.all(18),
      child: Row(
        children: [
          PetOmiAvatar(
            label: profile?.initials ?? 'PO',
            icon: Icons.person_rounded,
            size: 66,
            imageUrl: profile?.avatarUrl,
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  profile?.displayName ?? 'PetOmi Owner',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 4),
                Text(
                  '${data.email} • ${data.pets.length} thú cưng',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 10),
                const StatusChip(
                  label: 'Đã đăng nhập API',
                  color: AppColors.success,
                  background: AppColors.successSoft,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class FilterChips extends StatelessWidget {
  const FilterChips({
    required this.chips,
    required this.selectedIndex,
    super.key,
  });

  final List<String> chips;
  final int selectedIndex;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 42,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: chips.length,
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final selected = index == selectedIndex;
          return Container(
            padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 10),
            decoration: BoxDecoration(
              color: selected ? AppColors.primary : AppColors.surface,
              borderRadius: BorderRadius.circular(999),
              border: Border.all(
                color: selected ? AppColors.primary : AppColors.border,
              ),
            ),
            child: Text(
              chips[index],
              style: TextStyle(
                color: selected ? Colors.white : AppColors.textMuted,
                fontWeight: FontWeight.w800,
                fontSize: 13,
              ),
            ),
          );
        },
      ),
    );
  }
}

class SurfaceCard extends StatelessWidget {
  const SurfaceCard({
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.radius = 24,
    super.key,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final double radius;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: AppColors.surface.withValues(alpha: 0.9),
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.09),
            blurRadius: 18,
            offset: const Offset(0, 9),
          ),
        ],
      ),
      child: child,
    );
  }
}

class PrimaryButton extends StatelessWidget {
  const PrimaryButton({
    required this.label,
    required this.icon,
    required this.onTap,
    super.key,
  });

  final String label;
  final IconData icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return FilledButton.icon(
      style: FilledButton.styleFrom(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
      ),
      onPressed: onTap,
      icon: Icon(icon, size: 20),
      label: Text(
        label,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(fontWeight: FontWeight.w900),
      ),
    );
  }
}

class SoftButton extends StatelessWidget {
  const SoftButton({
    required this.label,
    required this.icon,
    required this.onTap,
    super.key,
  });

  final String label;
  final IconData icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return FilledButton.tonalIcon(
      style: FilledButton.styleFrom(
        backgroundColor: AppColors.surfaceMuted,
        foregroundColor: AppColors.text,
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(999),
          side: const BorderSide(color: AppColors.border),
        ),
      ),
      onPressed: onTap,
      icon: Icon(icon, size: 20),
      label: Text(
        label,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(fontWeight: FontWeight.w900),
      ),
    );
  }
}

class IconBubble extends StatelessWidget {
  const IconBubble({
    required this.icon,
    this.background = AppColors.primarySoft,
    this.foreground = AppColors.primaryHover,
    super.key,
  });

  final IconData icon;
  final Color background;
  final Color foreground;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 42,
      height: 42,
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Icon(icon, color: foreground, size: 21),
    );
  }
}

class PetOmiAvatar extends StatelessWidget {
  const PetOmiAvatar({
    required this.label,
    required this.icon,
    this.size = 48,
    this.imageUrl,
    super.key,
  });

  final String label;
  final IconData icon;
  final double size;
  final String? imageUrl;

  @override
  Widget build(BuildContext context) {
    final url = imageUrl;
    return Container(
      width: size,
      height: size,
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: AppColors.primarySoft,
        borderRadius: BorderRadius.circular(size * 0.34),
        border: Border.all(color: AppColors.primarySoft, width: 2),
      ),
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (url != null && url.isNotEmpty)
            Image.network(
              url,
              fit: BoxFit.cover,
              errorBuilder: (_, _, _) =>
                  Icon(icon, color: AppColors.primaryHover, size: size * 0.42),
            )
          else
            Icon(icon, color: AppColors.primaryHover, size: size * 0.42),
          Positioned(
            right: 5,
            bottom: 4,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text(
                label,
                style: const TextStyle(
                  color: AppColors.text,
                  fontSize: 9,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class DatePill extends StatelessWidget {
  const DatePill({required this.date, super.key});

  final DateTime? date;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 54,
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          Text(
            date == null ? '--' : date!.day.toString().padLeft(2, '0'),
            style: const TextStyle(
              color: AppColors.text,
              fontSize: 20,
              fontWeight: FontWeight.w900,
              height: 1,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            date == null ? '--' : date!.month.toString().padLeft(2, '0'),
            style: const TextStyle(
              color: AppColors.textSubtle,
              fontSize: 10,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

class PetStat extends StatelessWidget {
  const PetStat({required this.label, required this.value, super.key});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(11),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textSubtle,
              fontSize: 11,
            ),
          ),
          const SizedBox(height: 5),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(fontSize: 13),
          ),
        ],
      ),
    );
  }
}

class StatusChip extends StatelessWidget {
  const StatusChip({
    required this.label,
    required this.color,
    required this.background,
    super.key,
  });

  final String label;
  final Color color;
  final Color background;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w900,
        ),
      ),
    );
  }
}

class Eyebrow extends StatelessWidget {
  const Eyebrow(this.text, {super.key});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text.toUpperCase(),
      style: const TextStyle(
        color: AppColors.textSubtle,
        fontSize: 11,
        fontWeight: FontWeight.w900,
        letterSpacing: 1.5,
      ),
    );
  }
}

class InfoRow extends StatelessWidget {
  const InfoRow({required this.label, required this.value, super.key});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.textSubtle,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: Theme.of(context).textTheme.labelLarge,
            ),
          ),
        ],
      ),
    );
  }
}

class ChecklistRow extends StatelessWidget {
  const ChecklistRow({required this.text, super.key});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          Container(
            width: 24,
            height: 24,
            decoration: const BoxDecoration(
              color: AppColors.successSoft,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.check_rounded,
              size: 16,
              color: AppColors.success,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(text, style: Theme.of(context).textTheme.bodyMedium),
          ),
        ],
      ),
    );
  }
}

class EmptyOwnerState extends StatelessWidget {
  const EmptyOwnerState({
    required this.icon,
    required this.title,
    required this.message,
    this.compact = false,
    super.key,
  });

  final IconData icon;
  final String title;
  final String message;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(compact ? 14 : 20),
      decoration: BoxDecoration(
        color: AppColors.surfaceMuted.withValues(alpha: 0.62),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          Icon(icon, color: AppColors.primaryHover, size: compact ? 28 : 38),
          const SizedBox(height: 8),
          Text(
            title,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 4),
          Text(
            message,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ],
      ),
    );
  }
}

class ErrorBanner extends StatelessWidget {
  const ErrorBanner({required this.message, super.key});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.dangerSoft,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.danger.withValues(alpha: 0.2)),
      ),
      child: Text(
        message,
        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
          color: AppColors.danger,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}

class MetricData {
  const MetricData({
    required this.label,
    required this.value,
    required this.hint,
    required this.icon,
  });

  final String label;
  final String value;
  final String hint;
  final IconData icon;
}

String petNameFor(OwnerHomeData data, String petId) {
  for (final pet in data.pets) {
    if (pet.petId == petId) return pet.name;
  }
  return 'Thú cưng ${shortId(petId)}';
}

String shortId(String value) {
  if (value.length <= 6) return value;
  return value.substring(0, 6);
}

String shortTime(String value) {
  if (value.length >= 5) return value.substring(0, 5);
  return value;
}

String weekdayLabel(int weekday) {
  return switch (weekday) {
    DateTime.monday => 'T2',
    DateTime.tuesday => 'T3',
    DateTime.wednesday => 'T4',
    DateTime.thursday => 'T5',
    DateTime.friday => 'T6',
    DateTime.saturday => 'T7',
    _ => 'CN',
  };
}

String statusLabel(String status) {
  return switch (status.toLowerCase()) {
    'pending' => 'Chờ xác nhận',
    'confirmed' => 'Đã xác nhận',
    'checkedin' => 'Đã check-in',
    'completed' => 'Hoàn thành',
    'cancelled' => 'Đã hủy',
    'rejected' => 'Từ chối',
    _ => status,
  };
}

(Color, Color) appointmentStatusStyle(String status) {
  return switch (status.toLowerCase()) {
    'confirmed' || 'completed' => (AppColors.success, AppColors.successSoft),
    'cancelled' || 'rejected' => (AppColors.danger, AppColors.dangerSoft),
    _ => (AppColors.warning, AppColors.warningSoft),
  };
}

IconData reminderIcon(String reminderType) {
  final type = reminderType.toLowerCase();
  if (type.contains('vacc')) return Icons.vaccines_rounded;
  if (type.contains('med')) return Icons.medication_rounded;
  if (type.contains('appoint')) return Icons.event_available_rounded;
  return Icons.notifications_active_rounded;
}

String formatDateTime(DateTime? value) {
  if (value == null) return 'Chưa rõ thời gian';
  final day = value.day.toString().padLeft(2, '0');
  final month = value.month.toString().padLeft(2, '0');
  final hour = value.hour.toString().padLeft(2, '0');
  final minute = value.minute.toString().padLeft(2, '0');
  return '$day/$month/${value.year} • $hour:$minute';
}
