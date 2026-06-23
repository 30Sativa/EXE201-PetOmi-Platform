import 'dart:async';
import 'dart:convert';

import 'package:app_links/app_links.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import 'app_config.dart';
import 'chat_page.dart';
import 'models/owner_models.dart';
import 'pet_detail_page.dart';
import 'services/api_client.dart';
import 'services/notification_center.dart';
import 'services/owner_repository.dart';

part 'owner_secondary_pages.dart';

/// Hiển thị snackbar toàn cục (dùng khi xử lý deep link).
final GlobalKey<ScaffoldMessengerState> rootMessengerKey =
    GlobalKey<ScaffoldMessengerState>();

void main() {
  runApp(PetOmiOwnerApp(repository: OwnerRepository()));
}

class PetOmiOwnerApp extends StatelessWidget {
  const PetOmiOwnerApp({required this.repository, super.key});

  final OwnerRepository repository;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'PetOmi',
      scaffoldMessengerKey: rootMessengerKey,
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        splashFactory: InkRipple.splashFactory,
        scaffoldBackgroundColor: AppColors.background,
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.primary,
          primary: AppColors.primary,
          surface: AppColors.surface,
        ),
        fontFamily: 'Roboto',
        dropdownMenuTheme: DropdownMenuThemeData(
          menuStyle: MenuStyle(
            backgroundColor: const WidgetStatePropertyAll(AppColors.surface),
            shape: WidgetStatePropertyAll(
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            ),
          ),
        ),
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
  String? _resetToken;

  final _appLinks = AppLinks();
  StreamSubscription<Uri>? _linkSub;

  @override
  void initState() {
    super.initState();
    _sessionFuture = widget.repository.hasSession();
    _initDeepLinks();
  }

  @override
  void dispose() {
    _linkSub?.cancel();
    super.dispose();
  }

  Future<void> _initDeepLinks() async {
    // Link mở app từ trạng thái đã đóng.
    try {
      final initial = await _appLinks.getInitialLink();
      if (initial != null) _handleUri(initial);
    } catch (_) {
      // Bỏ qua nếu không có link khởi tạo.
    }
    // Link đến khi app đang mở.
    _linkSub = _appLinks.uriLinkStream.listen(_handleUri);
  }

  Future<void> _handleUri(Uri uri) async {
    final messenger = rootMessengerKey.currentState;
    // petomi://verify-email?token=...
    final isVerify =
        uri.host == 'verify-email' || uri.path.contains('verify-email');
    final isCallback =
        uri.host == 'auth' && uri.pathSegments.contains('callback') ||
        uri.host == 'callback';
    final isReset =
        uri.host == 'reset-password' || uri.path.contains('reset-password');

    if (isReset) {
      final token = uri.queryParameters['token'];
      if (token != null && token.isNotEmpty && mounted) {
        setState(() => _resetToken = token);
      }
      return;
    }

    if (isVerify) {
      final token = uri.queryParameters['token'];
      if (token == null || token.isEmpty) return;
      try {
        await widget.repository.verifyEmail(token);
        messenger?.showSnackBar(
          const SnackBar(
            content: Text('Xác minh email thành công! Bạn có thể đăng nhập.'),
          ),
        );
      } catch (error) {
        messenger?.showSnackBar(
          SnackBar(content: Text('Xác minh thất bại: ${error.toString()}')),
        );
      }
      return;
    }

    if (isCallback) {
      final accessToken = uri.queryParameters['accessToken'];
      final refreshToken = uri.queryParameters['refreshToken'];
      final email = uri.queryParameters['email'] ?? '';
      if (accessToken == null ||
          accessToken.isEmpty ||
          refreshToken == null ||
          refreshToken.isEmpty) {
        messenger?.showSnackBar(
          const SnackBar(content: Text('Đăng nhập Google thất bại.')),
        );
        return;
      }
      await widget.repository.saveSessionFromTokens(
        accessToken: accessToken,
        refreshToken: refreshToken,
        email: email,
      );
      _setAuthenticated(true);
      messenger?.showSnackBar(
        const SnackBar(content: Text('Đăng nhập Google thành công!')),
      );
    }
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
          final resetToken = _resetToken;
          if (resetToken != null) {
            return ResetPasswordPage(
              repository: widget.repository,
              token: resetToken,
              onCompleted: () => setState(() => _resetToken = null),
            );
          }
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
  late final OwnerNotificationCenter _notificationCenter;
  OwnerHomeData? _data;
  Object? _error;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _notificationCenter = widget.repository.createNotificationCenter();
    _load();
  }

  Future<void> _load({bool isRefresh = false}) async {
    // Look up the messenger before the await so we never use context across an
    // async gap, and only for refreshes (context isn't ready during initState).
    final messenger = isRefresh ? ScaffoldMessenger.maybeOf(context) : null;
    setState(() {
      _loading = true;
      if (_data == null) _error = null;
    });
    try {
      final data = await widget.repository.getOwnerHomeData();
      if (!mounted) return;
      setState(() {
        _data = data;
        _error = null;
        _loading = false;
      });
      final userId = data.profile?.userId;
      if (userId != null && userId.isNotEmpty) {
        unawaited(_notificationCenter.connect(userId));
      }
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error;
        _loading = false;
      });
      // If we already have data on screen, keep it mounted and just warn —
      // don't tear the whole dashboard down to an error page on a failed refresh.
      if (_data != null) {
        messenger?.showSnackBar(
          const SnackBar(
            content: Text('Không làm mới được dữ liệu. Kéo xuống để thử lại.'),
          ),
        );
      }
    }
  }

  Future<void> _refresh() => _load(isRefresh: true);

  Future<void> _logout() async {
    await _notificationCenter.disconnect(clearItems: true);
    await widget.repository.logout();
    widget.onLoggedOut();
  }

  @override
  void dispose() {
    _notificationCenter.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final data = _data;
    // Keep the loaded dashboard mounted across refreshes so the selected tab and
    // scroll position survive every create/toggle/cancel/book and pull-to-refresh.
    if (data == null) {
      if (_loading) return const AppSplash();
      return ApiErrorPage(error: _error, onRetry: _refresh, onLogout: _logout);
    }
    if (!data.isProfileCompleted) {
      return CompleteProfilePage(
        repository: widget.repository,
        onCompleted: _refresh,
        onLogout: _logout,
      );
    }
    return OwnerScope(
      data: data,
      repository: widget.repository,
      notificationCenter: _notificationCenter,
      onRefresh: _refresh,
      onLogout: _logout,
      child: const OwnerShell(),
    );
  }
}

class OwnerScope extends InheritedWidget {
  const OwnerScope({
    required this.data,
    required this.repository,
    required this.notificationCenter,
    required this.onRefresh,
    required this.onLogout,
    required super.child,
    super.key,
  });

  final OwnerHomeData data;
  final OwnerRepository repository;
  final OwnerNotificationCenter notificationCenter;
  final Future<void> Function() onRefresh;
  final Future<void> Function() onLogout;

  static OwnerScope of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<OwnerScope>();
    assert(scope != null, 'OwnerScope is missing');
    return scope!;
  }

  @override
  bool updateShouldNotify(OwnerScope oldWidget) =>
      data != oldWidget.data ||
      notificationCenter != oldWidget.notificationCenter;
}

class AppSplash extends StatelessWidget {
  const AppSplash({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: DecoratedGradient(
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 96,
                height: 96,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(28),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.18),
                      blurRadius: 26,
                      offset: const Offset(0, 12),
                    ),
                  ],
                ),
                child: Image.asset(
                  'assets/logo.png',
                  fit: BoxFit.contain,
                  errorBuilder: (_, _, _) => const Icon(
                    Icons.pets_rounded,
                    color: AppColors.primaryHover,
                    size: 44,
                  ),
                ),
              ),
              const SizedBox(height: 22),
              const Text(
                'PetOmi',
                style: TextStyle(
                  color: AppColors.text,
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 0.5,
                ),
              ),
              const SizedBox(height: 18),
              const CircularProgressIndicator(color: AppColors.primary),
            ],
          ),
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
  final _confirmController = TextEditingController();
  bool _loading = false;
  bool _obscure = true;
  bool _register = false; // false = đăng nhập, true = đăng ký
  String? _error;
  String? _success;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  void _switchMode() {
    setState(() {
      _register = !_register;
      _error = null;
      _success = null;
    });
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

  Future<void> _doRegister() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text;
    final confirm = _confirmController.text;
    if (email.isEmpty || password.isEmpty) {
      setState(() => _error = 'Nhập email và mật khẩu để đăng ký.');
      return;
    }
    if (password.length < 6) {
      setState(() => _error = 'Mật khẩu cần ít nhất 6 ký tự.');
      return;
    }
    if (password != confirm) {
      setState(() => _error = 'Mật khẩu xác nhận không khớp.');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
      _success = null;
    });
    try {
      await widget.repository.register(
        email: email,
        password: password,
        confirmPassword: confirm,
      );
      if (!mounted) return;
      setState(() {
        _success =
            'Đăng ký thành công! Kiểm tra email để xác minh, rồi đăng nhập.';
        _register = false;
        _passwordController.clear();
        _confirmController.clear();
      });
    } catch (error) {
      if (!mounted) return;
      setState(() => _error = error.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _loginWithGoogle() async {
    // Mở luồng OAuth của backend trong trình duyệt. Sau khi xác thực,
    // backend redirect về petomi://auth/callback?... và AuthGate bắt deep link.
    final base = widget.repository.apiClient.baseUrl;
    // client=mobile để backend redirect callback về petomi://auth/callback.
    final uri = Uri.parse('$base/auth/google/login?client=mobile');
    try {
      final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!ok && mounted) {
        setState(() => _error = 'Không mở được trình duyệt đăng nhập Google.');
      }
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
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
                    Container(
                      width: 76,
                      height: 76,
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppColors.primarySoft,
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: Image.asset(
                        'assets/logo.png',
                        fit: BoxFit.contain,
                        errorBuilder: (_, _, _) => const Icon(
                          Icons.pets_rounded,
                          color: AppColors.primaryHover,
                          size: 34,
                        ),
                      ),
                    ),
                    const SizedBox(height: 18),
                    const Eyebrow('PetOmi'),
                    const SizedBox(height: 10),
                    Text(
                      _register
                          ? 'Tạo tài khoản mới'
                          : 'Chào mừng bạn quay lại!',
                      style: Theme.of(context).textTheme.headlineLarge,
                    ),
                    const SizedBox(height: 10),
                    Text(
                      _register
                          ? 'Đăng ký để bắt đầu quản lý hồ sơ và chăm sóc thú cưng.'
                          : 'Đăng nhập để quản lý hồ sơ, thú cưng, lịch hẹn và nhắc nhở chăm sóc.',
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
                      textInputAction: _register
                          ? TextInputAction.next
                          : TextInputAction.done,
                      onSubmitted: (_) => _register ? null : _login(),
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
                    if (_register) ...[
                      const SizedBox(height: 14),
                      TextField(
                        controller: _confirmController,
                        obscureText: _obscure,
                        textInputAction: TextInputAction.done,
                        onSubmitted: (_) => _doRegister(),
                        decoration: const InputDecoration(
                          labelText: 'Xác nhận mật khẩu',
                          prefixIcon: Icon(Icons.lock_outline_rounded),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.all(Radius.circular(18)),
                          ),
                        ),
                      ),
                    ],
                    if (!_register)
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          TextButton(
                            onPressed: _loading
                                ? null
                                : () => showOwnerActionSheet<void>(
                                    context: context,
                                    child: ManualResetPasswordSheet(
                                      repository: widget.repository,
                                    ),
                                  ),
                            child: const Text('Đã có mã reset'),
                          ),
                          TextButton(
                            onPressed: _loading
                                ? null
                                : () => showOwnerActionSheet<void>(
                                    context: context,
                                    child: ForgotPasswordSheet(
                                      repository: widget.repository,
                                      initialEmail: _emailController.text
                                          .trim(),
                                    ),
                                  ),
                            child: const Text('Quên mật khẩu?'),
                          ),
                        ],
                      ),
                    if (_success != null) ...[
                      const SizedBox(height: 14),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.successSoft,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: AppColors.success.withValues(alpha: 0.2),
                          ),
                        ),
                        child: Text(
                          _success!,
                          style: Theme.of(context).textTheme.bodyMedium
                              ?.copyWith(
                                color: AppColors.success,
                                fontWeight: FontWeight.w800,
                              ),
                        ),
                      ),
                    ],
                    if (_error != null) ...[
                      const SizedBox(height: 14),
                      ErrorBanner(message: _error!),
                    ],
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      child: PrimaryButton(
                        label: _loading
                            ? (_register
                                  ? 'Đang tạo tài khoản...'
                                  : 'Đang đăng nhập...')
                            : (_register ? 'Tạo tài khoản' : 'Đăng nhập'),
                        icon: _register
                            ? Icons.person_add_rounded
                            : Icons.login_rounded,
                        onTap: _loading
                            ? null
                            : (_register ? _doRegister : _login),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        const Expanded(child: Divider(color: AppColors.border)),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 10),
                          child: Text(
                            'hoặc',
                            style: Theme.of(context).textTheme.bodyMedium
                                ?.copyWith(
                                  color: AppColors.textSubtle,
                                  fontSize: 12,
                                ),
                          ),
                        ),
                        const Expanded(child: Divider(color: AppColors.border)),
                      ],
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.text,
                          side: const BorderSide(color: AppColors.border),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(999),
                          ),
                        ),
                        onPressed: _loading ? null : _loginWithGoogle,
                        icon: const Icon(
                          Icons.g_mobiledata_rounded,
                          size: 26,
                          color: Color(0xFFEA4335),
                        ),
                        label: const Text(
                          'Tiếp tục với Google',
                          style: TextStyle(fontWeight: FontWeight.w800),
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    Center(
                      child: GestureDetector(
                        onTap: _loading ? null : _switchMode,
                        child: Text.rich(
                          TextSpan(
                            text: _register
                                ? 'Đã có tài khoản? '
                                : 'Chưa có tài khoản? ',
                            style: Theme.of(context).textTheme.bodyMedium,
                            children: [
                              TextSpan(
                                text: _register ? 'Đăng nhập' : 'Đăng ký ngay',
                                style: const TextStyle(
                                  color: AppColors.primaryHover,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                            ],
                          ),
                        ),
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

class ForgotPasswordSheet extends StatefulWidget {
  const ForgotPasswordSheet({
    required this.repository,
    required this.initialEmail,
    super.key,
  });

  final OwnerRepository repository;
  final String initialEmail;

  @override
  State<ForgotPasswordSheet> createState() => _ForgotPasswordSheetState();
}

class _ForgotPasswordSheetState extends State<ForgotPasswordSheet> {
  late final TextEditingController _email;
  bool _saving = false;
  bool _sent = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _email = TextEditingController(text: widget.initialEmail);
  }

  @override
  void dispose() {
    _email.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final email = _email.text.trim();
    if (!email.contains('@')) {
      setState(() => _error = 'Nhập email hợp lệ.');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await widget.repository.forgotPassword(email);
      if (mounted) setState(() => _sent = true);
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return OwnerSheetFrame(
      title: 'Khôi phục mật khẩu',
      subtitle: _sent
          ? 'Kiểm tra hộp thư và mở link đặt lại mật khẩu.'
          : 'PetOmi sẽ gửi link đặt lại mật khẩu nếu email tồn tại.',
      icon: Icons.lock_reset_rounded,
      error: _error,
      children: _sent
          ? [
              const EmptyOwnerState(
                icon: Icons.mark_email_read_rounded,
                title: 'Đã gửi yêu cầu',
                message: 'Bạn có thể đóng cửa sổ này và kiểm tra email.',
                compact: true,
              ),
              const SizedBox(height: 16),
              PrimaryButton(
                label: 'Đóng',
                icon: Icons.check_rounded,
                onTap: () => Navigator.of(context).pop(),
              ),
            ]
          : [
              SheetTextField(
                controller: _email,
                label: 'Email tài khoản',
                icon: Icons.email_rounded,
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 18),
              PrimaryButton(
                label: _saving ? 'Đang gửi...' : 'Gửi link khôi phục',
                icon: Icons.send_rounded,
                onTap: _saving ? null : _submit,
              ),
            ],
    );
  }
}

class ResetPasswordPage extends StatefulWidget {
  const ResetPasswordPage({
    required this.repository,
    required this.token,
    required this.onCompleted,
    super.key,
  });

  final OwnerRepository repository;
  final String token;
  final VoidCallback onCompleted;

  @override
  State<ResetPasswordPage> createState() => _ResetPasswordPageState();
}

class ManualResetPasswordSheet extends StatefulWidget {
  const ManualResetPasswordSheet({required this.repository, super.key});

  final OwnerRepository repository;

  @override
  State<ManualResetPasswordSheet> createState() =>
      _ManualResetPasswordSheetState();
}

class _ManualResetPasswordSheetState extends State<ManualResetPasswordSheet> {
  final _token = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  bool _saving = false;
  String? _error;

  @override
  void dispose() {
    _token.dispose();
    _password.dispose();
    _confirm.dispose();
    super.dispose();
  }

  String _normalizedToken() {
    final raw = _token.text.trim();
    final uri = Uri.tryParse(raw);
    return uri?.queryParameters['token'] ?? raw;
  }

  Future<void> _submit() async {
    final token = _normalizedToken();
    if (token.isEmpty) {
      setState(() => _error = 'Dán mã hoặc link đặt lại mật khẩu.');
      return;
    }
    if (_password.text.length < 6 || _password.text != _confirm.text) {
      setState(() => _error = 'Mật khẩu cần ít nhất 6 ký tự và phải khớp.');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await widget.repository.resetPassword(
        token: token,
        newPassword: _password.text,
        confirmPassword: _confirm.text,
      );
      if (!mounted) return;
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Đặt lại mật khẩu thành công.')),
      );
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return OwnerSheetFrame(
      title: 'Đặt lại bằng mã',
      subtitle: 'Dán token hoặc toàn bộ link nhận được trong email.',
      icon: Icons.password_rounded,
      error: _error,
      children: [
        SheetTextField(
          controller: _token,
          label: 'Token hoặc link reset',
          icon: Icons.link_rounded,
          maxLines: 2,
        ),
        const SizedBox(height: 12),
        SheetTextField(
          controller: _password,
          label: 'Mật khẩu mới',
          icon: Icons.lock_rounded,
          obscureText: true,
        ),
        const SizedBox(height: 12),
        SheetTextField(
          controller: _confirm,
          label: 'Xác nhận mật khẩu',
          icon: Icons.lock_outline_rounded,
          obscureText: true,
        ),
        const SizedBox(height: 18),
        PrimaryButton(
          label: _saving ? 'Đang lưu...' : 'Đặt lại mật khẩu',
          icon: Icons.save_rounded,
          onTap: _saving ? null : _submit,
        ),
      ],
    );
  }
}

class _ResetPasswordPageState extends State<ResetPasswordPage> {
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  bool _saving = false;
  bool _obscure = true;
  String? _error;

  @override
  void dispose() {
    _password.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_password.text.length < 6) {
      setState(() => _error = 'Mật khẩu cần ít nhất 6 ký tự.');
      return;
    }
    if (_password.text != _confirm.text) {
      setState(() => _error = 'Mật khẩu xác nhận không khớp.');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await widget.repository.resetPassword(
        token: widget.token,
        newPassword: _password.text,
        confirmPassword: _confirm.text,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Đặt lại mật khẩu thành công.')),
      );
      widget.onCompleted();
    } catch (error) {
      if (mounted) {
        setState(
          () => _error =
              'Link có thể đã hết hạn hoặc không hợp lệ. ${error.toString()}',
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: DecoratedGradient(
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.all(22),
            children: [
              const SizedBox(height: 50),
              SurfaceCard(
                radius: 30,
                child: Column(
                  children: [
                    const IconBubble(icon: Icons.lock_reset_rounded),
                    const SizedBox(height: 16),
                    Text(
                      'Đặt lại mật khẩu',
                      style: Theme.of(context).textTheme.headlineMedium,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Tạo mật khẩu mới cho tài khoản PetOmi.',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    const SizedBox(height: 20),
                    TextField(
                      controller: _password,
                      obscureText: _obscure,
                      decoration: InputDecoration(
                        labelText: 'Mật khẩu mới',
                        prefixIcon: const Icon(Icons.lock_rounded),
                        suffixIcon: IconButton(
                          onPressed: () => setState(() => _obscure = !_obscure),
                          icon: Icon(
                            _obscure
                                ? Icons.visibility_rounded
                                : Icons.visibility_off_rounded,
                          ),
                        ),
                        border: const OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _confirm,
                      obscureText: _obscure,
                      decoration: const InputDecoration(
                        labelText: 'Xác nhận mật khẩu',
                        prefixIcon: Icon(Icons.lock_outline_rounded),
                        border: OutlineInputBorder(),
                      ),
                    ),
                    if (_error != null) ...[
                      const SizedBox(height: 12),
                      ErrorBanner(message: _error!),
                    ],
                    const SizedBox(height: 18),
                    PrimaryButton(
                      label: _saving ? 'Đang lưu...' : 'Đặt lại mật khẩu',
                      icon: Icons.save_rounded,
                      onTap: _saving ? null : _submit,
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

class CompleteProfilePage extends StatefulWidget {
  const CompleteProfilePage({
    required this.repository,
    required this.onCompleted,
    required this.onLogout,
    super.key,
  });

  final OwnerRepository repository;
  final Future<void> Function() onCompleted;
  final Future<void> Function() onLogout;

  @override
  State<CompleteProfilePage> createState() => _CompleteProfilePageState();
}

class _CompleteProfilePageState extends State<CompleteProfilePage> {
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _address = TextEditingController();
  String _gender = 'Other';
  bool _saving = false;
  String? _error;

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    _address.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_name.text.trim().isEmpty) {
      setState(() => _error = 'Nhập họ tên để tiếp tục.');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await widget.repository.completeProfile(
        fullName: _name.text.trim(),
        phone: optionalInput(_phone),
        gender: _gender,
        address: optionalInput(_address),
      );
      await widget.onCompleted();
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: DecoratedGradient(
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.all(22),
            children: [
              PageHeader(
                eyebrow: 'Bước cuối',
                title: 'Hoàn thiện hồ sơ',
                subtitle: 'Thông tin này được dùng cho lịch hẹn và liên hệ.',
                trailingIcon: Icons.logout_rounded,
                trailingLabel: 'Đăng xuất',
                onAction: widget.onLogout,
              ),
              const SizedBox(height: 16),
              SurfaceCard(
                child: Column(
                  children: [
                    SheetTextField(
                      controller: _name,
                      label: 'Họ tên',
                      icon: Icons.person_rounded,
                    ),
                    const SizedBox(height: 12),
                    SheetTextField(
                      controller: _phone,
                      label: 'Số điện thoại',
                      icon: Icons.phone_rounded,
                      keyboardType: TextInputType.phone,
                    ),
                    const SizedBox(height: 12),
                    SheetChoiceField(
                      label: 'Giới tính',
                      icon: Icons.transgender_rounded,
                      value: _gender,
                      options: const [
                        ('Other', 'Khác'),
                        ('Male', 'Nam'),
                        ('Female', 'Nữ'),
                      ],
                      onChanged: _saving
                          ? null
                          : (v) => setState(() => _gender = v),
                    ),
                    const SizedBox(height: 12),
                    SheetTextField(
                      controller: _address,
                      label: 'Địa chỉ',
                      icon: Icons.location_on_rounded,
                      maxLines: 2,
                    ),
                    if (_error != null) ...[
                      const SizedBox(height: 12),
                      ErrorBanner(message: _error!),
                    ],
                    const SizedBox(height: 18),
                    PrimaryButton(
                      label: _saving ? 'Đang lưu...' : 'Hoàn tất và tiếp tục',
                      icon: Icons.check_circle_rounded,
                      onTap: _saving ? null : _submit,
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
                      'Chưa tải được dữ liệu',
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
    OwnerTab(label: 'Trợ lý', icon: Icons.smart_toy_rounded, page: ChatPage()),
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
    return Tooltip(
      message: tab.label,
      child: Semantics(
        button: true,
        selected: selected,
        label: tab.label,
        child: InkWell(
          borderRadius: BorderRadius.circular(22),
          onTap: onTap,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            constraints: const BoxConstraints(minHeight: 52),
            padding: EdgeInsets.symmetric(vertical: selected ? 8 : 12),
            decoration: BoxDecoration(
              color: selected ? AppColors.primary : Colors.transparent,
              borderRadius: BorderRadius.circular(22),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  tab.icon,
                  size: 21,
                  color: selected ? Colors.white : AppColors.textSubtle,
                ),
                if (selected) ...[
                  const SizedBox(height: 3),
                  Text(
                    tab.label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ],
            ),
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

class PetsPage extends StatefulWidget {
  const PetsPage({super.key});

  @override
  State<PetsPage> createState() => _PetsPageState();
}

class _PetsPageState extends State<PetsPage> {
  static const _filters = ['Tất cả', 'Chó', 'Mèo', 'Cần nhắc lịch'];
  int _filterIndex = 0;

  List<OwnerPet> _applyFilter(OwnerHomeData data) {
    switch (_filterIndex) {
      case 1:
        return data.pets
            .where((p) => p.species.toLowerCase() == 'dog')
            .toList();
      case 2:
        return data.pets
            .where((p) => p.species.toLowerCase() == 'cat')
            .toList();
      case 3:
        final petIds = data.reminders
            .where((r) => r.isEnabled && r.status.toLowerCase() == 'pending')
            .map((r) => r.petId)
            .whereType<String>()
            .toSet();
        return data.pets.where((p) => petIds.contains(p.petId)).toList();
      default:
        return data.pets;
    }
  }

  @override
  Widget build(BuildContext context) {
    final scope = OwnerScope.of(context);
    final data = scope.data;
    final filteredPets = _applyFilter(data);
    return OwnerScrollView(
      onRefresh: scope.onRefresh,
      children: [
        PageHeader(
          eyebrow: 'Hồ sơ thú cưng',
          title: 'Thú cưng của bạn',
          subtitle: 'Tất cả hồ sơ thú cưng bạn đang chăm sóc.',
          trailingIcon: Icons.add_rounded,
          trailingLabel: 'Thêm',
          onAction: () => showCreatePetSheet(context),
        ),
        const SizedBox(height: 14),
        FilterChips(
          chips: _filters,
          selectedIndex: _filterIndex,
          onSelect: (index) => setState(() => _filterIndex = index),
        ),
        const SizedBox(height: 14),
        if (data.pets.isEmpty)
          const EmptyOwnerState(
            icon: Icons.pets_rounded,
            title: 'Chưa có thú cưng',
            message:
                'Thêm thú cưng đầu tiên để bắt đầu theo dõi sức khỏe và lịch chăm sóc.',
          )
        else if (filteredPets.isEmpty)
          EmptyOwnerState(
            icon: Icons.filter_alt_off_rounded,
            title: 'Không có thú cưng phù hợp',
            message:
                'Không có thú cưng nào khớp bộ lọc "${_filters[_filterIndex]}".',
            compact: true,
          )
        else
          ...filteredPets.map((pet) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: PetCard(
                pet: pet,
                detailed: true,
                onTap: () => openPetDetail(context, pet),
              ),
            );
          }),
        const SizedBox(height: 4),
        HealthSummaryCard(data: data),
      ],
    );
  }
}

class AppointmentsPage extends StatefulWidget {
  const AppointmentsPage({super.key});

  @override
  State<AppointmentsPage> createState() => _AppointmentsPageState();
}

class _AppointmentsPageState extends State<AppointmentsPage> {
  DateTime? _selectedDate; // null = tất cả ngày

  bool _matchesDate(OwnerAppointment appointment) {
    final selected = _selectedDate;
    if (selected == null) return true;
    final date = appointment.date;
    if (date == null) return false;
    return date.year == selected.year &&
        date.month == selected.month &&
        date.day == selected.day;
  }

  @override
  Widget build(BuildContext context) {
    final scope = OwnerScope.of(context);
    final data = scope.data;
    final visible = data.appointments.where(_matchesDate).toList();
    return OwnerScrollView(
      onRefresh: scope.onRefresh,
      children: [
        PageHeader(
          eyebrow: 'Lịch khám',
          title: 'Lịch hẹn sắp tới',
          subtitle: 'Các buổi khám đã đặt cho thú cưng của bạn.',
          trailingIcon: Icons.add_circle_rounded,
          trailingLabel: 'Đặt lịch',
          onAction: () => showBookAppointmentSheet(context),
        ),
        const SizedBox(height: 14),
        DateSelector(
          selectedDate: _selectedDate,
          onSelect: (date) => setState(() => _selectedDate = date),
        ),
        const SizedBox(height: 14),
        if (data.appointments.isEmpty)
          const EmptyOwnerState(
            icon: Icons.event_available_rounded,
            title: 'Chưa có lịch hẹn',
            message: 'Đặt lịch khám đầu tiên cho thú cưng của bạn nhé.',
          )
        else if (visible.isEmpty)
          const EmptyOwnerState(
            icon: Icons.event_busy_rounded,
            title: 'Không có lịch trong ngày này',
            message: 'Chọn "Tất cả" hoặc ngày khác để xem lịch hẹn.',
            compact: true,
          )
        else
          ...visible.map((appointment) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: AppointmentTile(
                appointment: appointment,
                petName: petNameFor(data, appointment.petId),
                onCancel: canCancelAppointment(appointment)
                    ? () => confirmCancelAppointment(context, appointment)
                    : null,
                onReschedule: canRescheduleAppointment(appointment)
                    ? () => showRescheduleAppointmentSheet(context, appointment)
                    : null,
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

  Future<void> _dismiss(String reminderId) async {
    final scope = OwnerScope.of(context);
    setState(() {
      _busyId = reminderId;
      _error = null;
    });
    try {
      await scope.repository.dismissReminder(reminderId);
      scope.onRefresh();
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _busyId = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final scope = OwnerScope.of(context);
    final data = scope.data;
    return OwnerScrollView(
      onRefresh: scope.onRefresh,
      children: [
        PageHeader(
          eyebrow: 'Nhắc nhở',
          title: 'Việc cần theo dõi',
          subtitle: 'Nhắc lịch tiêm phòng, uống thuốc và tái khám.',
          trailingIcon: Icons.tune_rounded,
          trailingLabel: 'Thêm',
          onAction: () => showCreateReminderSheet(context),
        ),
        const SizedBox(height: 14),
        SurfaceCard(
          child: ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const IconBubble(icon: Icons.tune_rounded),
            title: Text(
              'Cài đặt nhắc nhở',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            subtitle: const Text(
              'Chọn loại thông báo, thời gian báo trước và kênh nhận.',
            ),
            trailing: const Icon(Icons.chevron_right_rounded),
            onTap: () => openReminderPreferencesPage(context),
          ),
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
                onDismiss: () => _dismiss(reminder.reminderId),
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
        PageHeader(
          eyebrow: 'Tài khoản owner',
          title: 'Hồ sơ cá nhân',
          subtitle: 'Thông tin tài khoản và liên hệ của bạn.',
          trailingIcon: Icons.edit_rounded,
          trailingLabel: 'Sửa',
          onAction: () => showEditProfileSheet(context),
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
          title: 'Thống kê nhanh',
          subtitle: 'Tổng quan hoạt động chăm sóc của bạn.',
          child: Column(
            children: [
              InfoRow(label: 'Thú cưng', value: '${data.pets.length} hồ sơ'),
              InfoRow(
                label: 'Lịch hẹn',
                value: '${data.appointments.length} lịch',
              ),
              InfoRow(
                label: 'Nhắc nhở đang bật',
                value: '${data.activeReminderCount} nhắc nhở',
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        const OwnerFeatureMenu(),
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
  final Future<void> Function()? onRefresh;

  @override
  Widget build(BuildContext context) {
    final listView = ListView(
      physics: const AlwaysScrollableScrollPhysics(
        parent: BouncingScrollPhysics(),
      ),
      padding: const EdgeInsets.fromLTRB(18, 12, 18, 24),
      children: children,
    );
    final refresh = onRefresh;
    return DecoratedGradient(
      child: refresh == null
          ? listView
          : RefreshIndicator(
              color: AppColors.primary,
              onRefresh: refresh,
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
      child: Material(type: MaterialType.transparency, child: child),
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
          NotificationBellButton(
            center: OwnerScope.of(context).notificationCenter,
          ),
          const SizedBox(width: 4),
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

class NotificationBellButton extends StatelessWidget {
  const NotificationBellButton({required this.center, super.key});

  final OwnerNotificationCenter center;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: center,
      builder: (context, _) {
        final unread = center.unreadCount;
        return Stack(
          clipBehavior: Clip.none,
          children: [
            IconButton.filledTonal(
              key: const ValueKey('owner_notifications'),
              style: IconButton.styleFrom(
                backgroundColor: AppColors.primarySoft,
                foregroundColor: AppColors.primaryHover,
              ),
              tooltip: 'Thông báo',
              onPressed: () => openNotificationsPage(context),
              icon: const Icon(Icons.notifications_rounded),
            ),
            if (unread > 0)
              Positioned(
                right: -2,
                top: -4,
                child: Container(
                  constraints: const BoxConstraints(
                    minWidth: 20,
                    minHeight: 20,
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 5),
                  decoration: BoxDecoration(
                    color: AppColors.danger,
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(color: AppColors.surface, width: 2),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    unread > 99 ? '99+' : '$unread',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
              ),
          ],
        );
      },
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
            'Chăm sóc thú cưng dễ dàng hơn mỗi ngày.',
            style: Theme.of(context).textTheme.headlineLarge,
          ),
          const SizedBox(height: 12),
          Text(
            'Theo dõi hồ sơ, lịch khám và nhắc nhở chăm sóc — tất cả ở một nơi.',
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
        hint: 'hồ sơ',
        icon: Icons.pets_rounded,
      ),
      MetricData(
        label: 'Lịch hẹn sắp tới',
        value: '${data.upcomingAppointmentCount}',
        hint: 'buổi khám',
        icon: Icons.event_available_rounded,
      ),
      MetricData(
        label: 'Lịch sử khám',
        value: '${data.completedAppointmentCount}',
        hint: 'đã hoàn thành',
        icon: Icons.assignment_turned_in_rounded,
      ),
      MetricData(
        label: 'Nhắc nhở đang bật',
        value: '${data.activeReminderCount}',
        hint: 'đang theo dõi',
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
    final actions = [
      QuickActionData(
        key: const ValueKey('quick_add_pet'),
        icon: Icons.add_rounded,
        title: 'Thêm thú cưng',
        subtitle: 'Tạo hồ sơ cho bé cưng mới.',
        onTap: () => showCreatePetSheet(context),
      ),
      QuickActionData(
        key: const ValueKey('quick_book_appointment'),
        icon: Icons.event_available_rounded,
        title: 'Đặt lịch',
        subtitle: 'Chọn phòng khám, dịch vụ và giờ trống.',
        onTap: () => showBookAppointmentSheet(context),
      ),
      QuickActionData(
        key: const ValueKey('quick_add_reminder'),
        icon: Icons.notifications_active_rounded,
        title: 'Thêm nhắc nhở',
        subtitle: 'Đừng quên lịch chăm sóc quan trọng.',
        onTap: () => showCreateReminderSheet(context),
      ),
      QuickActionData(
        key: const ValueKey('quick_edit_profile'),
        icon: Icons.person_rounded,
        title: 'Sửa hồ sơ',
        subtitle: 'Cập nhật thông tin cá nhân của bạn.',
        onTap: () => showEditProfileSheet(context),
      ),
      QuickActionData(
        key: const ValueKey('quick_owner_history'),
        icon: Icons.history_rounded,
        title: 'Lịch sử khám',
        subtitle: 'Xem lại các lần khám và hoạt động y tế.',
        onTap: () => openOwnerHistoryPage(context),
      ),
      QuickActionData(
        key: const ValueKey('quick_owner_sharing'),
        icon: Icons.badge_rounded,
        title: 'Hộ chiếu thú cưng',
        subtitle: 'Một QR để phòng khám nhận diện pet khi tái khám.',
        onTap: () => openOwnerSharingPage(context),
      ),
    ];

    return LayoutBuilder(
      builder: (context, constraints) {
        final compact = constraints.maxWidth < 340;
        return GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: actions.length,
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: compact ? 1 : 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            mainAxisExtent: compact ? 126 : 154,
          ),
          itemBuilder: (context, index) {
            final action = actions[index];
            return QuickActionCard(
              key: action.key,
              icon: action.icon,
              title: action.title,
              subtitle: action.subtitle,
              onTap: action.onTap,
            );
          },
        );
      },
    );
  }
}

class QuickActionData {
  const QuickActionData({
    required this.key,
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final Key key;
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
}

class QuickActionCard extends StatelessWidget {
  const QuickActionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
    super.key,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(24),
      onTap: onTap,
      child: SurfaceCard(
        radius: 24,
        padding: const EdgeInsets.all(15),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            IconBubble(icon: icon),
            const SizedBox(height: 12),
            Text(
              title,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 6),
            Expanded(
              child: Text(
                subtitle,
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(
                  context,
                ).textTheme.bodyMedium?.copyWith(fontSize: 12),
              ),
            ),
          ],
        ),
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
      subtitle: 'Những buổi khám gần nhất của bạn.',
      child: items.isEmpty
          ? const EmptyOwnerState(
              icon: Icons.event_available_rounded,
              title: 'Chưa có lịch hẹn',
              message: 'Bạn chưa có lịch hẹn nào sắp tới.',
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
      subtitle: 'Những bé cưng bạn đang chăm sóc.',
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
                  child: PetCard(
                    pet: pet,
                    onTap: () => openPetDetail(context, pet),
                  ),
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
    this.onAction,
    super.key,
  });

  final String eyebrow;
  final String title;
  final String subtitle;
  final IconData trailingIcon;
  final String trailingLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return SurfaceCard(
      radius: 30,
      padding: const EdgeInsets.all(18),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final compact = constraints.maxWidth < 330;
          final textBlock = Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Eyebrow(eyebrow),
              const SizedBox(height: 8),
              Text(title, style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: 8),
              Text(subtitle, style: Theme.of(context).textTheme.bodyMedium),
            ],
          );

          if (compact) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                textBlock,
                const SizedBox(height: 14),
                SizedBox(width: double.infinity, child: _buildActionButton()),
              ],
            );
          }

          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: textBlock),
              const SizedBox(width: 12),
              _buildActionButton(),
            ],
          );
        },
      ),
    );
  }

  Widget _buildActionButton() {
    return FilledButton.tonalIcon(
      style: FilledButton.styleFrom(
        backgroundColor: AppColors.primarySoft,
        foregroundColor: AppColors.primaryHover,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
      ),
      onPressed: onAction,
      icon: Icon(trailingIcon, size: 18),
      label: Text(trailingLabel, maxLines: 1, overflow: TextOverflow.ellipsis),
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
              if (action != null) ...[const SizedBox(width: 12), action!],
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
    this.onCancel,
    this.onReschedule,
    this.compact = false,
    super.key,
  });

  final OwnerAppointment appointment;
  final String petName;
  final bool compact;
  final VoidCallback? onCancel;
  final VoidCallback? onReschedule;

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
      child: Column(
        children: [
          Row(
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
                            style: Theme.of(context).textTheme.bodyMedium
                                ?.copyWith(
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
              const Icon(
                Icons.chevron_right_rounded,
                color: AppColors.textSubtle,
              ),
            ],
          ),
          if (!compact && (onReschedule != null || onCancel != null)) ...[
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                if (onReschedule != null)
                  TextButton.icon(
                    onPressed: onReschedule,
                    icon: const Icon(Icons.event_repeat_rounded, size: 18),
                    label: const Text('Đổi lịch'),
                  ),
                if (onReschedule != null && onCancel != null)
                  const SizedBox(width: 4),
                if (onCancel != null)
                  TextButton.icon(
                    onPressed: onCancel,
                    style: TextButton.styleFrom(
                      foregroundColor: AppColors.danger,
                    ),
                    icon: const Icon(Icons.cancel_outlined, size: 18),
                    label: const Text('Hủy lịch'),
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class PetCard extends StatelessWidget {
  const PetCard({
    required this.pet,
    this.detailed = false,
    this.onTap,
    super.key,
  });

  final OwnerPet pet;
  final bool detailed;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(22),
      onTap: onTap,
      child: Container(
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
                if (onTap != null)
                  const Icon(
                    Icons.chevron_right_rounded,
                    color: AppColors.textSubtle,
                  )
                else
                  StatusChip(
                    label: pet.speciesLabel,
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
                    child: PetStat(label: 'Giới tính', value: pet.genderLabel),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class ReminderTile extends StatelessWidget {
  const ReminderTile({
    required this.reminder,
    required this.onToggle,
    required this.onDismiss,
    this.petName,
    this.loading = false,
    super.key,
  });

  final OwnerReminder reminder;
  final String? petName;
  final bool loading;
  final VoidCallback onToggle;
  final VoidCallback onDismiss;

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
              : Column(
                  children: [
                    Switch.adaptive(
                      value: enabled,
                      activeThumbColor: AppColors.primary,
                      onChanged: (_) => onToggle(),
                    ),
                    IconButton(
                      tooltip: 'Hoàn tất',
                      onPressed: onDismiss,
                      icon: const Icon(Icons.done_all_rounded),
                    ),
                  ],
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
      subtitle: 'Tổng hợp nhanh tình hình chăm sóc.',
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
  const DateSelector({
    required this.selectedDate,
    required this.onSelect,
    super.key,
  });

  /// null = "Tất cả ngày".
  final DateTime? selectedDate;
  final ValueChanged<DateTime?> onSelect;

  bool _isSameDay(DateTime a, DateTime b) =>
      a.year == b.year && a.month == b.month && a.day == b.day;

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final dates = List.generate(7, (index) => now.add(Duration(days: index)));
    return SizedBox(
      height: 88,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: dates.length + 1,
        separatorBuilder: (_, _) => const SizedBox(width: 10),
        itemBuilder: (context, index) {
          if (index == 0) {
            final selected = selectedDate == null;
            return _DateChip(
              selected: selected,
              onTap: () => onSelect(null),
              top: 'TẤT',
              bottom: 'CẢ',
            );
          }
          final date = dates[index - 1];
          final selected =
              selectedDate != null && _isSameDay(date, selectedDate!);
          return _DateChip(
            selected: selected,
            onTap: () => onSelect(date),
            top: weekdayLabel(date.weekday),
            bottom: date.day.toString().padLeft(2, '0'),
            bottomLarge: true,
          );
        },
      ),
    );
  }
}

class _DateChip extends StatelessWidget {
  const _DateChip({
    required this.selected,
    required this.onTap,
    required this.top,
    required this.bottom,
    this.bottomLarge = false,
  });

  final bool selected;
  final VoidCallback onTap;
  final String top;
  final String bottom;
  final bool bottomLarge;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
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
              top,
              style: TextStyle(
                color: selected ? Colors.white : AppColors.textSubtle,
                fontSize: 11,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              bottom,
              style: TextStyle(
                color: selected ? Colors.white : AppColors.text,
                fontSize: bottomLarge ? 22 : 16,
                fontWeight: FontWeight.w900,
              ),
            ),
          ],
        ),
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
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 4),
                Text(
                  '${data.email} • ${data.pets.length} thú cưng',
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 10),
                const StatusChip(
                  label: 'Đang hoạt động',
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
    this.onSelect,
    super.key,
  });

  final List<String> chips;
  final int selectedIndex;
  final ValueChanged<int>? onSelect;

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
          return GestureDetector(
            onTap: onSelect == null ? null : () => onSelect!(index),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 15),
              alignment: Alignment.center,
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
      child: Material(type: MaterialType.transparency, child: child),
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

void openPetDetail(BuildContext context, OwnerPet pet) {
  final scope = OwnerScope.of(context);
  Navigator.of(context).push(
    MaterialPageRoute<void>(
      builder: (_) => PetDetailPage(
        petId: pet.petId,
        repository: scope.repository,
        initialPet: pet,
        onChanged: scope.onRefresh,
      ),
    ),
  );
}

Future<void> showCreatePetSheet(BuildContext context) {
  final scope = OwnerScope.of(context);
  return showOwnerActionSheet(
    context: context,
    child: CreatePetSheet(scope: scope),
  );
}

Future<void> showEditProfileSheet(BuildContext context) {
  final scope = OwnerScope.of(context);
  return showOwnerActionSheet(
    context: context,
    child: EditProfileSheet(scope: scope),
  );
}

Future<void> showCreateReminderSheet(BuildContext context, {String? petId}) {
  final scope = OwnerScope.of(context);
  return showOwnerActionSheet(
    context: context,
    child: CreateReminderSheet(scope: scope, initialPetId: petId),
  );
}

Future<void> showBookAppointmentSheet(BuildContext context) {
  final scope = OwnerScope.of(context);
  if (scope.data.pets.isEmpty) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Tạo hồ sơ thú cưng trước khi đặt lịch.')),
    );
    return Future.value();
  }
  return showOwnerActionSheet(
    context: context,
    child: BookAppointmentSheet(scope: scope),
  );
}

Future<void> showRescheduleAppointmentSheet(
  BuildContext context,
  OwnerAppointment appointment,
) {
  final scope = OwnerScope.of(context);
  return showOwnerActionSheet(
    context: context,
    child: RescheduleAppointmentSheet(scope: scope, appointment: appointment),
  );
}

Future<void> confirmCancelAppointment(
  BuildContext context,
  OwnerAppointment appointment,
) async {
  final scope = OwnerScope.of(context);
  final messenger = ScaffoldMessenger.of(context);
  final confirmed = await showDialog<bool>(
    context: context,
    builder: (dialogContext) {
      return AlertDialog(
        title: const Text('Hủy lịch hẹn?'),
        content: const Text('Lịch hẹn này sẽ được hủy. Bạn có chắc chắn?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Đóng'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: const Text('Hủy lịch'),
          ),
        ],
      );
    },
  );
  if (confirmed != true || !context.mounted) return;

  try {
    await scope.repository.cancelAppointment(appointment.appointmentId);
    scope.onRefresh();
    messenger.showSnackBar(
      const SnackBar(content: Text('Đã gửi yêu cầu hủy lịch.')),
    );
  } catch (error) {
    messenger.showSnackBar(SnackBar(content: Text(error.toString())));
  }
}

bool canCancelAppointment(OwnerAppointment appointment) {
  final status = appointment.status.toLowerCase();
  if (status == 'cancelled' || status == 'completed' || status == 'rejected') {
    return false;
  }
  final date = appointment.date;
  if (date == null) return true;
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);
  return !date.isBefore(today);
}

bool canRescheduleAppointment(OwnerAppointment appointment) {
  // Backend only allows owners to move a slot that is still awaiting service.
  final status = appointment.status.toLowerCase();
  if (status != 'pending' && status != 'confirmed') return false;
  final date = appointment.date;
  if (date == null) return true;
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);
  return !date.isBefore(today);
}

Future<T?> showOwnerActionSheet<T>({
  required BuildContext context,
  required Widget child,
}) {
  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: Colors.transparent,
    builder: (sheetContext) {
      final media = MediaQuery.of(sheetContext);
      // Co theo nội dung, nhưng không vượt quá 90% chiều cao màn hình.
      final maxHeight = media.size.height * 0.9;
      return Padding(
        padding: EdgeInsets.only(bottom: media.viewInsets.bottom),
        child: ConstrainedBox(
          constraints: BoxConstraints(maxHeight: maxHeight),
          child: Material(
            color: AppColors.surface,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(30)),
            clipBehavior: Clip.antiAlias,
            child: child,
          ),
        ),
      );
    },
  );
}

class OwnerSheetFrame extends StatelessWidget {
  const OwnerSheetFrame({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.children,
    this.error,
    super.key,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final String? error;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return ListView(
      shrinkWrap: true,
      padding: const EdgeInsets.fromLTRB(20, 14, 20, 24),
      children: [
        Center(
          child: Container(
            width: 42,
            height: 5,
            decoration: BoxDecoration(
              color: AppColors.border,
              borderRadius: BorderRadius.circular(999),
            ),
          ),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            IconBubble(icon: icon),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 4),
                  Text(subtitle, style: Theme.of(context).textTheme.bodyMedium),
                ],
              ),
            ),
            IconButton(
              onPressed: () => Navigator.of(context).pop(),
              icon: const Icon(Icons.close_rounded),
            ),
          ],
        ),
        if (error != null) ...[
          const SizedBox(height: 14),
          ErrorBanner(message: error!),
        ],
        const SizedBox(height: 18),
        ...children,
      ],
    );
  }
}

class SheetTextField extends StatelessWidget {
  const SheetTextField({
    required this.controller,
    required this.label,
    required this.icon,
    this.keyboardType,
    this.textInputAction,
    this.maxLines = 1,
    this.obscureText = false,
    super.key,
  });

  final TextEditingController controller;
  final String label;
  final IconData icon;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final int maxLines;
  final bool obscureText;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      textInputAction: textInputAction,
      maxLines: maxLines,
      obscureText: obscureText,
      decoration: sheetInputDecoration(label: label, icon: icon),
    );
  }
}

/// Bộ chọn dạng chip ngang cho 2-4 lựa chọn — thay cho dropdown bị che màn.
class SheetChoiceField extends StatelessWidget {
  const SheetChoiceField({
    required this.label,
    required this.icon,
    required this.options,
    required this.value,
    required this.onChanged,
    super.key,
  });

  final String label;
  final IconData icon;

  /// (giá trị, nhãn hiển thị)
  final List<(String, String)> options;
  final String value;
  final ValueChanged<String>? onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 18, color: AppColors.textSubtle),
            const SizedBox(width: 8),
            Text(
              label,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w800,
                color: AppColors.textMuted,
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: options.map((opt) {
            final selected = opt.$1 == value;
            return GestureDetector(
              onTap: onChanged == null ? null : () => onChanged!(opt.$1),
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 11,
                ),
                decoration: BoxDecoration(
                  color: selected ? AppColors.primary : AppColors.surfaceMuted,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: selected ? AppColors.primary : AppColors.border,
                  ),
                ),
                child: Text(
                  opt.$2,
                  style: TextStyle(
                    color: selected ? Colors.white : AppColors.textMuted,
                    fontWeight: FontWeight.w800,
                    fontSize: 14,
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }
}

InputDecoration sheetInputDecoration({
  required String label,
  required IconData icon,
}) {
  return InputDecoration(
    labelText: label,
    prefixIcon: Icon(icon, color: AppColors.textSubtle),
    filled: true,
    fillColor: AppColors.surfaceMuted.withValues(alpha: 0.5),
    isDense: true,
    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(18),
      borderSide: const BorderSide(color: AppColors.border),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(18),
      borderSide: const BorderSide(color: AppColors.border),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(18),
      borderSide: const BorderSide(color: AppColors.primary, width: 1.6),
    ),
  );
}

String cleanInput(TextEditingController controller) {
  return controller.text.trim();
}

String? optionalInput(TextEditingController controller) {
  final value = controller.text.trim();
  return value.isEmpty ? null : value;
}

String formatDateOnly(DateTime value) {
  final day = value.day.toString().padLeft(2, '0');
  final month = value.month.toString().padLeft(2, '0');
  return '$day/$month/${value.year}';
}

String formatMoney(double value) {
  if (value <= 0) return 'Chưa có giá';
  return '${value.toStringAsFixed(0)} VND';
}

class CreatePetSheet extends StatefulWidget {
  const CreatePetSheet({required this.scope, super.key});

  final OwnerScope scope;

  @override
  State<CreatePetSheet> createState() => _CreatePetSheetState();
}

class _CreatePetSheetState extends State<CreatePetSheet> {
  final _nameController = TextEditingController();
  final _breedController = TextEditingController();
  final _colorController = TextEditingController();

  String _species = 'Dog';
  String _gender = 'Unknown';
  String _neutered = 'Unknown';
  DateTime? _birthDate;
  bool _estimated = false;
  String? _error;
  bool _saving = false;

  @override
  void dispose() {
    _nameController.dispose();
    _breedController.dispose();
    _colorController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final name = cleanInput(_nameController);
    if (name.isEmpty) {
      setState(() => _error = 'Nhập tên thú cưng trước.');
      return;
    }

    final navigator = Navigator.of(context);
    final messenger = ScaffoldMessenger.of(context);
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await widget.scope.repository.createPet(
        name: name,
        species: _species,
        breed: optionalInput(_breedController),
        gender: _gender,
        color: optionalInput(_colorController),
        isNeutered: _neutered,
        dateOfBirth: _birthDate,
        isBirthDateEstimated: _estimated,
      );
      if (!mounted) return;
      widget.scope.onRefresh();
      navigator.pop();
      messenger.showSnackBar(
        const SnackBar(content: Text('Đã tạo hồ sơ thú cưng.')),
      );
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return OwnerSheetFrame(
      title: 'Thêm thú cưng',
      subtitle: 'Tạo hồ sơ cho bé cưng của bạn.',
      icon: Icons.pets_rounded,
      error: _error,
      children: [
        SheetTextField(
          controller: _nameController,
          label: 'Tên thú cưng',
          icon: Icons.badge_rounded,
          textInputAction: TextInputAction.next,
        ),
        const SizedBox(height: 12),
        SheetChoiceField(
          label: 'Loài',
          icon: Icons.category_rounded,
          value: _species,
          options: const [('Dog', 'Chó'), ('Cat', 'Mèo')],
          onChanged: _saving
              ? null
              : (value) => setState(() => _species = value),
        ),
        const SizedBox(height: 16),
        SheetChoiceField(
          label: 'Giới tính',
          icon: Icons.transgender_rounded,
          value: _gender,
          options: const [
            ('Unknown', 'Không rõ'),
            ('Male', 'Đực'),
            ('Female', 'Cái'),
          ],
          onChanged: _saving
              ? null
              : (value) => setState(() => _gender = value),
        ),
        const SizedBox(height: 12),
        SheetChoiceField(
          label: 'Triệt sản',
          icon: Icons.health_and_safety_rounded,
          value: _neutered,
          options: const [
            ('Unknown', 'Không rõ'),
            ('Yes', 'Đã triệt sản'),
            ('No', 'Chưa triệt sản'),
          ],
          onChanged: _saving
              ? null
              : (value) => setState(() => _neutered = value),
        ),
        const SizedBox(height: 12),
        SheetTextField(
          controller: _breedController,
          label: 'Giống (tuỳ chọn)',
          icon: Icons.cruelty_free_rounded,
          textInputAction: TextInputAction.next,
        ),
        const SizedBox(height: 12),
        SheetTextField(
          controller: _colorController,
          label: 'Màu lông / đặc điểm',
          icon: Icons.palette_rounded,
        ),
        const SizedBox(height: 12),
        SoftButton(
          label: _birthDate == null
              ? 'Chọn ngày sinh'
              : 'Ngày sinh ${formatDateOnly(_birthDate!)}',
          icon: Icons.cake_rounded,
          onTap: _saving
              ? null
              : () async {
                  final date = await showDatePicker(
                    context: context,
                    initialDate: _birthDate ?? DateTime.now(),
                    firstDate: DateTime(1990),
                    lastDate: DateTime.now(),
                  );
                  if (date != null) setState(() => _birthDate = date);
                },
        ),
        SwitchListTile.adaptive(
          contentPadding: EdgeInsets.zero,
          title: const Text('Ngày sinh ước tính'),
          value: _estimated,
          onChanged: _saving ? null : (v) => setState(() => _estimated = v),
        ),
        const SizedBox(height: 20),
        PrimaryButton(
          label: _saving ? 'Đang lưu...' : 'Tạo thú cưng',
          icon: Icons.add_rounded,
          onTap: _saving ? null : _submit,
        ),
      ],
    );
  }
}

class EditProfileSheet extends StatefulWidget {
  const EditProfileSheet({required this.scope, super.key});

  final OwnerScope scope;

  @override
  State<EditProfileSheet> createState() => _EditProfileSheetState();
}

class _EditProfileSheetState extends State<EditProfileSheet> {
  late final TextEditingController _nameController;
  late final TextEditingController _phoneController;
  late final TextEditingController _addressController;
  String _gender = 'Other';
  String? _error;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final profile = widget.scope.data.profile;
    _nameController = TextEditingController(text: profile?.fullName ?? '');
    _phoneController = TextEditingController(text: profile?.phone ?? '');
    _addressController = TextEditingController(text: profile?.address ?? '');
    final gender = profile?.gender;
    if (gender == 'Male' || gender == 'Female' || gender == 'Other') {
      _gender = gender!;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final name = cleanInput(_nameController);
    if (name.isEmpty) {
      setState(() => _error = 'Nhập họ tên trước.');
      return;
    }

    final navigator = Navigator.of(context);
    final messenger = ScaffoldMessenger.of(context);
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await widget.scope.repository.updateProfile(
        fullName: name,
        phone: optionalInput(_phoneController),
        gender: _gender,
        address: optionalInput(_addressController),
        create: widget.scope.data.profile == null,
      );
      if (!mounted) return;
      widget.scope.onRefresh();
      navigator.pop();
      messenger.showSnackBar(
        const SnackBar(content: Text('Đã cập nhật hồ sơ owner.')),
      );
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return OwnerSheetFrame(
      title: 'Sửa hồ sơ',
      subtitle: 'Cập nhật thông tin cá nhân của bạn.',
      icon: Icons.person_rounded,
      error: _error,
      children: [
        SheetTextField(
          controller: _nameController,
          label: 'Họ tên',
          icon: Icons.person_outline_rounded,
          textInputAction: TextInputAction.next,
        ),
        const SizedBox(height: 12),
        SheetTextField(
          controller: _phoneController,
          label: 'Số điện thoại',
          icon: Icons.phone_rounded,
          keyboardType: TextInputType.phone,
          textInputAction: TextInputAction.next,
        ),
        const SizedBox(height: 12),
        SheetChoiceField(
          label: 'Giới tính',
          icon: Icons.transgender_rounded,
          value: _gender,
          options: const [('Other', 'Khác'), ('Male', 'Nam'), ('Female', 'Nữ')],
          onChanged: _saving
              ? null
              : (value) => setState(() => _gender = value),
        ),
        const SizedBox(height: 12),
        SheetTextField(
          controller: _addressController,
          label: 'Địa chỉ',
          icon: Icons.location_on_rounded,
          maxLines: 2,
        ),
        const SizedBox(height: 20),
        PrimaryButton(
          label: _saving ? 'Đang lưu...' : 'Lưu hồ sơ',
          icon: Icons.save_rounded,
          onTap: _saving ? null : _submit,
        ),
      ],
    );
  }
}

class CreateReminderSheet extends StatefulWidget {
  const CreateReminderSheet({
    required this.scope,
    this.initialPetId,
    super.key,
  });

  final OwnerScope scope;
  final String? initialPetId;

  @override
  State<CreateReminderSheet> createState() => _CreateReminderSheetState();
}

class _CreateReminderSheetState extends State<CreateReminderSheet> {
  final _titleController = TextEditingController();
  final _messageController = TextEditingController();

  String _type = 'Custom';
  String _petId = '';
  DateTime _remindAt = DateTime.now().add(const Duration(days: 1));
  String? _error;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _petId = widget.initialPetId ?? '';
  }

  @override
  void dispose() {
    _titleController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _remindAt,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (date == null || !mounted) return;
    setState(() {
      _remindAt = DateTime(
        date.year,
        date.month,
        date.day,
        _remindAt.hour,
        _remindAt.minute,
      );
    });
  }

  Future<void> _pickTime() async {
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(_remindAt),
    );
    if (time == null || !mounted) return;
    setState(() {
      _remindAt = DateTime(
        _remindAt.year,
        _remindAt.month,
        _remindAt.day,
        time.hour,
        time.minute,
      );
    });
  }

  Future<void> _submit() async {
    final title = cleanInput(_titleController);
    if (title.isEmpty) {
      setState(() => _error = 'Nhập tiêu đề reminder trước.');
      return;
    }
    if (!_remindAt.isAfter(DateTime.now())) {
      setState(() => _error = 'Thời gian nhắc phải ở tương lai.');
      return;
    }

    final navigator = Navigator.of(context);
    final messenger = ScaffoldMessenger.of(context);
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await widget.scope.repository.createReminder(
        title: title,
        reminderType: _type,
        remindAt: _remindAt,
        petId: _petId.isEmpty ? null : _petId,
        message: optionalInput(_messageController),
      );
      if (!mounted) return;
      widget.scope.onRefresh();
      navigator.pop();
      messenger.showSnackBar(const SnackBar(content: Text('Đã tạo reminder.')));
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final pets = widget.scope.data.pets;
    return OwnerSheetFrame(
      title: 'Thêm nhắc nhở',
      subtitle: 'Đặt nhắc lịch chăm sóc cho thú cưng.',
      icon: Icons.notifications_active_rounded,
      error: _error,
      children: [
        SheetTextField(
          controller: _titleController,
          label: 'Tiêu đề',
          icon: Icons.title_rounded,
          textInputAction: TextInputAction.next,
        ),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          initialValue: _type,
          isExpanded: true,
          borderRadius: BorderRadius.circular(16),
          decoration: sheetInputDecoration(
            label: 'Loại nhắc nhở',
            icon: Icons.tune_rounded,
          ),
          items: const [
            DropdownMenuItem(value: 'Custom', child: Text('Tùy chỉnh')),
            DropdownMenuItem(value: 'Vaccine', child: Text('Vaccine')),
            DropdownMenuItem(value: 'Medication', child: Text('Thuốc')),
            DropdownMenuItem(value: 'FollowUp', child: Text('Tái khám')),
            DropdownMenuItem(value: 'Deworming', child: Text('Tẩy giun')),
            DropdownMenuItem(value: 'Grooming', child: Text('Grooming')),
            DropdownMenuItem(
              value: 'WeightTracking',
              child: Text('Theo dõi cân nặng'),
            ),
          ],
          onChanged: _saving ? null : (value) => setState(() => _type = value!),
        ),
        const SizedBox(height: 12),
        DropdownButtonFormField<String>(
          initialValue: _petId,
          isExpanded: true,
          decoration: sheetInputDecoration(
            label: 'Thú cưng liên quan',
            icon: Icons.pets_rounded,
          ),
          items: [
            const DropdownMenuItem(value: '', child: Text('Không gắn pet')),
            ...pets.map(
              (pet) =>
                  DropdownMenuItem(value: pet.petId, child: Text(pet.name)),
            ),
          ],
          onChanged: _saving
              ? null
              : (value) => setState(() => _petId = value!),
        ),
        const SizedBox(height: 12),
        SheetTextField(
          controller: _messageController,
          label: 'Ghi chú',
          icon: Icons.notes_rounded,
          maxLines: 3,
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: SoftButton(
                label: formatDateOnly(_remindAt),
                icon: Icons.calendar_today_rounded,
                onTap: _saving ? null : _pickDate,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: SoftButton(
                label: TimeOfDay.fromDateTime(_remindAt).format(context),
                icon: Icons.schedule_rounded,
                onTap: _saving ? null : _pickTime,
              ),
            ),
          ],
        ),
        const SizedBox(height: 20),
        PrimaryButton(
          label: _saving ? 'Đang lưu...' : 'Tạo reminder',
          icon: Icons.add_alert_rounded,
          onTap: _saving ? null : _submit,
        ),
      ],
    );
  }
}

class BookAppointmentSheet extends StatefulWidget {
  const BookAppointmentSheet({required this.scope, super.key});

  final OwnerScope scope;

  @override
  State<BookAppointmentSheet> createState() => _BookAppointmentSheetState();
}

class _BookAppointmentSheetState extends State<BookAppointmentSheet> {
  final _notesController = TextEditingController();

  List<OwnerClinic> _clinics = const [];
  OwnerClinicProfile? _clinicProfile;
  List<OwnerAvailableSlot> _slots = const [];

  String? _clinicId;
  String? _serviceId;
  String? _petId;
  String _appointmentType = 'Checkup';
  OwnerAvailableSlot? _slot;
  DateTime _date = DateTime.now().add(const Duration(days: 1));
  bool _loadingClinics = true;
  bool _loadingDetails = false;
  bool _loadingSlots = false;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final pets = widget.scope.data.pets;
    _petId = pets.isEmpty ? null : pets.first.petId;
    _loadClinics();
  }

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _loadClinics() async {
    setState(() {
      _loadingClinics = true;
      _error = null;
    });
    try {
      final clinics = await widget.scope.repository.getPublicClinics();
      if (!mounted) return;
      setState(() {
        _clinics = clinics;
        _loadingClinics = false;
      });
      if (clinics.isNotEmpty) {
        await _selectClinic(clinics.first.clinicId);
      }
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _loadingClinics = false;
        _error = error.toString();
      });
    }
  }

  Future<void> _selectClinic(String? clinicId) async {
    setState(() {
      _clinicId = clinicId;
      _clinicProfile = null;
      _serviceId = null;
      _slots = const [];
      _slot = null;
      _error = null;
      _loadingDetails = clinicId != null;
    });
    if (clinicId == null) return;

    try {
      final profile = await widget.scope.repository.getClinicProfile(clinicId);
      if (!mounted) return;
      setState(() {
        _clinicProfile = profile;
        _serviceId = profile.services.isEmpty
            ? null
            : profile.services.first.serviceId;
        _loadingDetails = false;
      });
      await _loadSlots();
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _loadingDetails = false;
        _error = error.toString();
      });
    }
  }

  Future<void> _loadSlots() async {
    final clinicId = _clinicId;
    if (clinicId == null) return;
    setState(() {
      _loadingSlots = true;
      _slots = const [];
      _slot = null;
      _error = null;
    });
    try {
      final slots = await widget.scope.repository.getAvailableSlots(
        clinicId: clinicId,
        date: _date,
        serviceId: _serviceId,
      );
      if (!mounted) return;
      setState(() {
        _slots = slots;
        _slot = slots.isEmpty ? null : slots.first;
        _loadingSlots = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _loadingSlots = false;
        _error = error.toString();
      });
    }
  }

  Future<void> _pickDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _date,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 60)),
    );
    if (date == null || !mounted) return;
    setState(() => _date = date);
    await _loadSlots();
  }

  Future<void> _submit() async {
    final clinicId = _clinicId;
    final petId = _petId;
    final slot = _slot;
    if (petId == null || petId.isEmpty) {
      setState(() => _error = 'Chọn thú cưng trước.');
      return;
    }
    if (clinicId == null || clinicId.isEmpty) {
      setState(() => _error = 'Chọn phòng khám trước.');
      return;
    }
    if (slot == null) {
      setState(() => _error = 'Chọn giờ trống trước.');
      return;
    }

    final navigator = Navigator.of(context);
    final messenger = ScaffoldMessenger.of(context);
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await widget.scope.repository.bookAppointment(
        clinicId: clinicId,
        petId: petId,
        appointmentDate: _date,
        startTime: slot.startTime,
        vetClinicId: slot.vetClinicId,
        serviceId: _serviceId,
        appointmentType: _appointmentType,
        notes: optionalInput(_notesController),
      );
      if (!mounted) return;
      widget.scope.onRefresh();
      navigator.pop();
      messenger.showSnackBar(
        const SnackBar(content: Text('Đã đặt lịch, chờ phòng khám xác nhận.')),
      );
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final pets = widget.scope.data.pets;
    final services = _clinicProfile?.services ?? const <OwnerClinicService>[];
    return OwnerSheetFrame(
      title: 'Đặt lịch khám',
      subtitle: 'Chọn phòng khám, dịch vụ và giờ trống.',
      icon: Icons.event_available_rounded,
      error: _error,
      children: [
        if (_loadingClinics)
          const Center(
            child: CircularProgressIndicator(color: AppColors.primary),
          )
        else if (_clinics.isEmpty)
          const EmptyOwnerState(
            icon: Icons.local_hospital_rounded,
            title: 'Chưa có phòng khám',
            message:
                'Hiện chưa có phòng khám nào để đặt lịch. Vui lòng thử lại sau.',
            compact: true,
          )
        else ...[
          DropdownButtonFormField<String>(
            initialValue: _petId,
            isExpanded: true,
            decoration: sheetInputDecoration(
              label: 'Thú cưng',
              icon: Icons.pets_rounded,
            ),
            items: pets
                .map(
                  (pet) =>
                      DropdownMenuItem(value: pet.petId, child: Text(pet.name)),
                )
                .toList(),
            onChanged: _saving
                ? null
                : (value) => setState(() => _petId = value),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: _clinicId,
            isExpanded: true,
            decoration: sheetInputDecoration(
              label: 'Phòng khám',
              icon: Icons.local_hospital_rounded,
            ),
            items: _clinics
                .map(
                  (clinic) => DropdownMenuItem(
                    value: clinic.clinicId,
                    child: Text(
                      clinic.clinicName,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                )
                .toList(),
            onChanged: _saving ? null : _selectClinic,
          ),
          const SizedBox(height: 12),
          if (_loadingDetails)
            const LinearProgressIndicator(color: AppColors.primary)
          else
            DropdownButtonFormField<String>(
              initialValue: _serviceId ?? '',
              isExpanded: true,
              decoration: sheetInputDecoration(
                label: 'Dịch vụ',
                icon: Icons.medical_services_rounded,
              ),
              items: [
                const DropdownMenuItem(
                  value: '',
                  child: Text('Khám mặc định 30 phút'),
                ),
                ...services.map(
                  (service) => DropdownMenuItem(
                    value: service.serviceId,
                    child: Text(
                      '${service.serviceName} - ${formatMoney(service.price)}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ),
              ],
              onChanged: _saving
                  ? null
                  : (value) {
                      setState(() {
                        _serviceId = value == null || value.isEmpty
                            ? null
                            : value;
                      });
                      _loadSlots();
                    },
            ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: _appointmentType,
            isExpanded: true,
            decoration: sheetInputDecoration(
              label: 'Loại lịch',
              icon: Icons.assignment_rounded,
            ),
            items: const [
              DropdownMenuItem(value: 'Checkup', child: Text('Khám tổng quát')),
              DropdownMenuItem(
                value: 'Vaccination',
                child: Text('Tiêm vaccine'),
              ),
              DropdownMenuItem(value: 'Grooming', child: Text('Grooming')),
              DropdownMenuItem(value: 'Followup', child: Text('Tái khám')),
              DropdownMenuItem(value: 'Emergency', child: Text('Khẩn cấp')),
            ],
            onChanged: _saving
                ? null
                : (value) => setState(() => _appointmentType = value!),
          ),
          const SizedBox(height: 12),
          SoftButton(
            label: formatDateOnly(_date),
            icon: Icons.calendar_today_rounded,
            onTap: _saving ? null : _pickDate,
          ),
          const SizedBox(height: 12),
          if (_loadingSlots)
            const LinearProgressIndicator(color: AppColors.primary)
          else if (_slots.isEmpty)
            const EmptyOwnerState(
              icon: Icons.schedule_rounded,
              title: 'Chưa có giờ trống',
              message: 'Thử chọn ngày hoặc dịch vụ khác.',
              compact: true,
            )
          else
            DropdownButtonFormField<OwnerAvailableSlot>(
              initialValue: _slot,
              isExpanded: true,
              decoration: sheetInputDecoration(
                label: 'Giờ trống',
                icon: Icons.schedule_rounded,
              ),
              items: _slots
                  .map(
                    (slot) => DropdownMenuItem(
                      value: slot,
                      child: Text(
                        '${shortTime(slot.startTime)} - ${shortTime(slot.endTime)} • ${slot.doctorName}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  )
                  .toList(),
              onChanged: _saving
                  ? null
                  : (value) => setState(() => _slot = value),
            ),
          const SizedBox(height: 12),
          SheetTextField(
            controller: _notesController,
            label: 'Ghi chú cho phòng khám',
            icon: Icons.notes_rounded,
            maxLines: 3,
          ),
          const SizedBox(height: 20),
          PrimaryButton(
            label: _saving ? 'Đang đặt lịch...' : 'Đặt lịch',
            icon: Icons.send_rounded,
            onTap: _saving ? null : _submit,
          ),
        ],
      ],
    );
  }
}

class RescheduleAppointmentSheet extends StatefulWidget {
  const RescheduleAppointmentSheet({
    required this.scope,
    required this.appointment,
    super.key,
  });

  final OwnerScope scope;
  final OwnerAppointment appointment;

  @override
  State<RescheduleAppointmentSheet> createState() =>
      _RescheduleAppointmentSheetState();
}

class _RescheduleAppointmentSheetState
    extends State<RescheduleAppointmentSheet> {
  List<OwnerAvailableSlot> _slots = const [];
  OwnerAvailableSlot? _slot;
  late DateTime _date;
  bool _loadingSlots = false;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final current = widget.appointment.date;
    final tomorrow = DateTime.now().add(const Duration(days: 1));
    _date = (current != null && current.isAfter(DateTime.now()))
        ? current
        : tomorrow;
    _loadSlots();
  }

  Future<void> _loadSlots() async {
    setState(() {
      _loadingSlots = true;
      _slots = const [];
      _slot = null;
      _error = null;
    });
    try {
      final slots = await widget.scope.repository.getAvailableSlots(
        clinicId: widget.appointment.clinicId,
        date: _date,
      );
      if (!mounted) return;
      setState(() {
        _slots = slots;
        _slot = slots.isEmpty ? null : slots.first;
        _loadingSlots = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _loadingSlots = false;
        _error = error.toString();
      });
    }
  }

  Future<void> _pickDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _date,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 60)),
    );
    if (date == null || !mounted) return;
    setState(() => _date = date);
    await _loadSlots();
  }

  Future<void> _submit() async {
    final slot = _slot;
    if (slot == null) {
      setState(() => _error = 'Chọn giờ trống trước.');
      return;
    }

    final navigator = Navigator.of(context);
    final messenger = ScaffoldMessenger.of(context);
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await widget.scope.repository.rescheduleAppointment(
        appointmentId: widget.appointment.appointmentId,
        newDate: _date,
        newStartTime: slot.startTime,
        newEndTime: slot.endTime,
      );
      if (!mounted) return;
      widget.scope.onRefresh();
      navigator.pop();
      messenger.showSnackBar(
        const SnackBar(
          content: Text('Đã đổi lịch, chờ phòng khám xác nhận lại.'),
        ),
      );
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return OwnerSheetFrame(
      title: 'Đổi lịch hẹn',
      subtitle: 'Chọn ngày và slot mới — lịch sẽ về trạng thái chờ xác nhận.',
      icon: Icons.event_repeat_rounded,
      error: _error,
      children: [
        SoftButton(
          label: formatDateOnly(_date),
          icon: Icons.calendar_today_rounded,
          onTap: _saving ? null : _pickDate,
        ),
        const SizedBox(height: 12),
        if (_loadingSlots)
          const LinearProgressIndicator(color: AppColors.primary)
        else if (_slots.isEmpty)
          const EmptyOwnerState(
            icon: Icons.schedule_rounded,
            title: 'Chưa có giờ trống',
            message: 'Thử chọn ngày khác.',
            compact: true,
          )
        else
          DropdownButtonFormField<OwnerAvailableSlot>(
            initialValue: _slot,
            isExpanded: true,
            decoration: sheetInputDecoration(
              label: 'Giờ trống',
              icon: Icons.schedule_rounded,
            ),
            items: _slots
                .map(
                  (slot) => DropdownMenuItem(
                    value: slot,
                    child: Text(
                      '${shortTime(slot.startTime)} - ${shortTime(slot.endTime)} • ${slot.doctorName}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                )
                .toList(),
            onChanged: _saving
                ? null
                : (value) => setState(() => _slot = value),
          ),
        const SizedBox(height: 20),
        PrimaryButton(
          label: _saving ? 'Đang đổi lịch...' : 'Đổi lịch',
          icon: Icons.event_repeat_rounded,
          onTap: _saving ? null : _submit,
        ),
      ],
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
