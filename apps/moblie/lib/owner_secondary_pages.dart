part of 'main.dart';

Future<void> _openOwnerPage(BuildContext context, Widget page) {
  final scope = OwnerScope.of(context);
  return Navigator.of(context).push(
    MaterialPageRoute<void>(
      builder: (_) => OwnerScope(
        data: scope.data,
        repository: scope.repository,
        onRefresh: scope.onRefresh,
        onLogout: scope.onLogout,
        child: page,
      ),
    ),
  );
}

Future<void> openOwnerHistoryPage(BuildContext context) =>
    _openOwnerPage(context, const OwnerHistoryPage());

Future<void> openOwnerSharingPage(
  BuildContext context, {
  String? initialPetId,
}) => _openOwnerPage(context, OwnerSharingPage(initialPetId: initialPetId));

Future<void> openAiPlanPage(BuildContext context) =>
    _openOwnerPage(context, const OwnerAiPlanPage());

Future<void> openReminderPreferencesPage(BuildContext context) =>
    _openOwnerPage(context, const ReminderPreferencesPage());

Future<void> openNotificationsPage(BuildContext context) =>
    _openOwnerPage(context, const OwnerNotificationsPage());

Future<void> openReviewsPage(BuildContext context) =>
    _openOwnerPage(context, const OwnerReviewsPage());

class _OwnerSecondaryScaffold extends StatelessWidget {
  const _OwnerSecondaryScaffold({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        backgroundColor: AppColors.background,
        foregroundColor: AppColors.text,
        surfaceTintColor: Colors.transparent,
      ),
      body: SafeArea(top: false, child: child),
    );
  }
}

class OwnerFeatureMenu extends StatelessWidget {
  const OwnerFeatureMenu({super.key});

  @override
  Widget build(BuildContext context) {
    return SectionCard(
      title: 'Tiện ích PetOmi',
      subtitle: 'Các chức năng bổ sung dành cho chủ nuôi.',
      child: Column(
        children: [
          _OwnerMenuTile(
            icon: Icons.history_rounded,
            title: 'Lịch sử khám',
            subtitle: 'Các lần khám hoàn thành và lịch đã hủy',
            onTap: () => openOwnerHistoryPage(context),
          ),
          _OwnerMenuTile(
            icon: Icons.link_rounded,
            title: 'Chia sẻ thú cưng',
            subtitle: 'Quyền người thân và mã hồ sơ sức khỏe',
            onTap: () => openOwnerSharingPage(context),
          ),
          _OwnerMenuTile(
            icon: Icons.workspace_premium_rounded,
            title: 'Gói trợ lý AI',
            subtitle: 'Xem quota và nâng cấp theo thú cưng',
            onTap: () => openAiPlanPage(context),
          ),
          _OwnerMenuTile(
            icon: Icons.tune_rounded,
            title: 'Cài đặt nhắc nhở',
            subtitle: 'Thời gian báo trước và kênh nhận',
            onTap: () => openReminderPreferencesPage(context),
          ),
          _OwnerMenuTile(
            icon: Icons.notifications_rounded,
            title: 'Thông báo',
            subtitle: 'Đang phát triển',
            onTap: () => openNotificationsPage(context),
          ),
          _OwnerMenuTile(
            icon: Icons.star_rounded,
            title: 'Đánh giá phòng khám',
            subtitle: 'Đang phát triển',
            onTap: () => openReviewsPage(context),
            showDivider: false,
          ),
        ],
      ),
    );
  }
}

class _OwnerMenuTile extends StatelessWidget {
  const _OwnerMenuTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.showDivider = true,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  final bool showDivider;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        ListTile(
          contentPadding: EdgeInsets.zero,
          leading: IconBubble(icon: icon),
          title: Text(title, style: Theme.of(context).textTheme.titleMedium),
          subtitle: Text(subtitle),
          trailing: const Icon(Icons.chevron_right_rounded),
          onTap: onTap,
        ),
        if (showDivider) const Divider(color: AppColors.border, height: 12),
      ],
    );
  }
}

enum _HistoryFilter { all, completed, cancelled }

class OwnerHistoryPage extends StatefulWidget {
  const OwnerHistoryPage({super.key});

  @override
  State<OwnerHistoryPage> createState() => _OwnerHistoryPageState();
}

class _OwnerHistoryPageState extends State<OwnerHistoryPage> {
  bool _loading = true;
  String? _error;
  _HistoryFilter _filter = _HistoryFilter.all;
  String? _petId;
  List<_OwnerHistoryItem> _items = const [];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final scope = OwnerScope.of(context);
    setState(() {
      _loading = true;
      _error = null;
    });
    final items = <_OwnerHistoryItem>[];
    var failedPets = 0;
    for (final pet in scope.data.pets) {
      try {
        final timeline = await scope.repository.getPetTimeline(pet.petId);
        items.addAll(
          timeline.activities
              .where(
                (activity) =>
                    activity.activityType == 'MedicalRecord' ||
                    activity.activityType == 'ClinicExamination',
              )
              .map(
                (activity) => _OwnerHistoryItem(
                  petId: pet.petId,
                  petName: pet.name,
                  title: activity.title,
                  description: _historyDescription(activity),
                  occurredAt: activity.date,
                  cancelled: false,
                ),
              ),
        );
      } catch (_) {
        failedPets++;
      }
    }
    items.addAll(
      scope.data.appointments
          .where((item) => item.status.toLowerCase() == 'cancelled')
          .map(
            (item) => _OwnerHistoryItem(
              petId: item.petId,
              petName: petNameFor(scope.data, item.petId),
              title: item.appointmentType,
              description: 'Clinic ${shortId(item.clinicId)}',
              occurredAt: item.date,
              cancelled: true,
            ),
          ),
    );
    items.sort(
      (a, b) => (b.occurredAt ?? DateTime(1970)).compareTo(
        a.occurredAt ?? DateTime(1970),
      ),
    );
    if (!mounted) return;
    setState(() {
      _items = items;
      _loading = false;
      if (failedPets > 0) {
        _error = 'Chưa tải được lịch sử của $failedPets thú cưng.';
      }
    });
  }

  String? _historyDescription(PetActivity activity) {
    final metadata = activity.metadata;
    if (metadata != null) {
      try {
        final parsed = jsonDecode(metadata);
        if (parsed is Map<String, dynamic>) {
          final diagnosis = parsed.nullableString('diagnosis');
          final clinic = parsed.nullableString('clinicName');
          if (diagnosis != null && clinic != null) {
            return '$diagnosis • $clinic';
          }
          if (diagnosis != null) return diagnosis;
          if (clinic != null) return clinic;
        }
      } catch (_) {
        // Use the activity description below.
      }
    }
    return activity.description;
  }

  List<_OwnerHistoryItem> get _visibleItems {
    return _items.where((item) {
      if (_petId != null && item.petId != _petId) return false;
      return switch (_filter) {
        _HistoryFilter.completed => !item.cancelled,
        _HistoryFilter.cancelled => item.cancelled,
        _HistoryFilter.all => true,
      };
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final pets = OwnerScope.of(context).data.pets;
    final visible = _visibleItems;
    return _OwnerSecondaryScaffold(
      title: 'Lịch sử khám',
      child: OwnerScrollView(
        onRefresh: _load,
        children: [
          PageHeader(
            eyebrow: 'Hồ sơ chăm sóc',
            title: 'Lịch sử khám',
            subtitle: 'Các lần khám hoàn thành và lịch đã hủy của thú cưng.',
            trailingIcon: Icons.refresh_rounded,
            trailingLabel: 'Tải lại',
            onAction: _load,
          ),
          const SizedBox(height: 14),
          FilterChips(
            chips: const ['Tất cả', 'Hoàn thành', 'Đã hủy'],
            selectedIndex: _filter.index,
            onSelect: (index) =>
                setState(() => _filter = _HistoryFilter.values[index]),
          ),
          if (pets.length > 1) ...[
            const SizedBox(height: 12),
            DropdownButtonFormField<String?>(
              initialValue: _petId,
              decoration: const InputDecoration(
                labelText: 'Lọc theo thú cưng',
                filled: true,
                fillColor: AppColors.surface,
                border: OutlineInputBorder(),
              ),
              items: [
                const DropdownMenuItem<String?>(
                  value: null,
                  child: Text('Tất cả thú cưng'),
                ),
                ...pets.map(
                  (pet) => DropdownMenuItem<String?>(
                    value: pet.petId,
                    child: Text(pet.name),
                  ),
                ),
              ],
              onChanged: (value) => setState(() => _petId = value),
            ),
          ],
          if (_error != null) ...[
            const SizedBox(height: 12),
            ErrorBanner(message: _error!),
          ],
          const SizedBox(height: 14),
          if (_loading)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(32),
                child: CircularProgressIndicator(color: AppColors.primary),
              ),
            )
          else if (visible.isEmpty)
            const EmptyOwnerState(
              icon: Icons.history_toggle_off_rounded,
              title: 'Chưa có lịch sử phù hợp',
              message: 'Các lần khám và lịch đã hủy sẽ xuất hiện tại đây.',
            )
          else
            ...visible.map(
              (item) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _HistoryCard(item: item),
              ),
            ),
        ],
      ),
    );
  }
}

class _OwnerHistoryItem {
  const _OwnerHistoryItem({
    required this.petId,
    required this.petName,
    required this.title,
    required this.description,
    required this.occurredAt,
    required this.cancelled,
  });

  final String petId;
  final String petName;
  final String title;
  final String? description;
  final DateTime? occurredAt;
  final bool cancelled;
}

class _HistoryCard extends StatelessWidget {
  const _HistoryCard({required this.item});

  final _OwnerHistoryItem item;

  @override
  Widget build(BuildContext context) {
    return SurfaceCard(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          IconBubble(
            icon: item.cancelled
                ? Icons.event_busy_rounded
                : Icons.medical_information_rounded,
            background: item.cancelled
                ? AppColors.dangerSoft
                : AppColors.successSoft,
            foreground: item.cancelled ? AppColors.danger : AppColors.success,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.title,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 4),
                Text(
                  '${item.petName} • ${item.occurredAt == null ? "Chưa rõ ngày" : formatDateOnly(item.occurredAt!)}',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                if (item.description != null &&
                    item.description!.trim().isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(item.description!),
                ],
                const SizedBox(height: 8),
                StatusChip(
                  label: item.cancelled ? 'Đã hủy' : 'Đã hoàn thành',
                  color: item.cancelled ? AppColors.danger : AppColors.success,
                  background: item.cancelled
                      ? AppColors.dangerSoft
                      : AppColors.successSoft,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class OwnerSharingPage extends StatefulWidget {
  const OwnerSharingPage({this.initialPetId, super.key});

  final String? initialPetId;

  @override
  State<OwnerSharingPage> createState() => _OwnerSharingPageState();
}

class _OwnerSharingPageState extends State<OwnerSharingPage> {
  String? _petId;
  bool _loading = false;
  String? _error;
  List<PetUserAccess> _access = const [];
  List<PetHealthShare> _shares = const [];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final pets = OwnerScope.of(context).data.pets;
      _petId = widget.initialPetId ?? (pets.isEmpty ? null : pets.first.petId);
      _load();
    });
  }

  Future<void> _load() async {
    final petId = _petId;
    if (petId == null) {
      setState(() => _loading = false);
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final repo = OwnerScope.of(context).repository;
      final values = await Future.wait<dynamic>([
        repo.getPetAccess(petId),
        repo.getPetHealthShares(petId),
      ]);
      if (!mounted) return;
      setState(() {
        _access = values[0] as List<PetUserAccess>;
        _shares = values[1] as List<PetHealthShare>;
      });
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _invite() async {
    final petId = _petId;
    if (petId == null) return;
    final changed = await showOwnerActionSheet<bool>(
      context: context,
      child: _GrantAccessSheet(
        repository: OwnerScope.of(context).repository,
        petId: petId,
      ),
    );
    if (changed == true) _load();
  }

  Future<void> _createShare() async {
    final petId = _petId;
    if (petId == null) return;
    final share = await showOwnerActionSheet<PetHealthShare>(
      context: context,
      child: _CreateHealthShareSheet(
        repository: OwnerScope.of(context).repository,
        petId: petId,
      ),
    );
    if (share != null) {
      await Clipboard.setData(ClipboardData(text: share.displayCode));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Đã tạo và sao chép mã chia sẻ.')),
        );
      }
      _load();
    }
  }

  Future<void> _editAccess(PetUserAccess access) async {
    final changed = await showOwnerActionSheet<bool>(
      context: context,
      child: _EditAccessSheet(
        repository: OwnerScope.of(context).repository,
        access: access,
      ),
    );
    if (changed == true) _load();
  }

  Future<bool> _confirmDestructive({
    required String title,
    required String message,
  }) async {
    return await showDialog<bool>(
          context: context,
          builder: (dialogContext) => AlertDialog(
            title: Text(title),
            content: Text(message),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(dialogContext).pop(false),
                child: const Text('Đóng'),
              ),
              FilledButton(
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.danger,
                ),
                onPressed: () => Navigator.of(dialogContext).pop(true),
                child: const Text('Thu hồi'),
              ),
            ],
          ),
        ) ??
        false;
  }

  Future<void> _revokeAccess(PetUserAccess access) async {
    final repository = OwnerScope.of(context).repository;
    final confirmed = await _confirmDestructive(
      title: 'Thu hồi quyền truy cập?',
      message: 'Người dùng này sẽ không còn truy cập hồ sơ thú cưng.',
    );
    if (!confirmed) return;
    try {
      await repository.revokePetAccess(
        petId: access.petId,
        accessId: access.petUserAccessId,
      );
      _load();
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    }
  }

  Future<void> _revokeShare(PetHealthShare share) async {
    final repository = OwnerScope.of(context).repository;
    final confirmed = await _confirmDestructive(
      title: 'Thu hồi mã chia sẻ?',
      message: 'Mã ${share.displayCode} sẽ ngừng hoạt động ngay lập tức.',
    );
    if (!confirmed) return;
    try {
      await repository.revokePetHealthShare(
        petId: share.petId,
        shareTokenId: share.shareTokenId,
      );
      _load();
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    final pets = OwnerScope.of(context).data.pets;
    return _OwnerSecondaryScaffold(
      title: 'Chia sẻ thú cưng',
      child: OwnerScrollView(
        onRefresh: _load,
        children: [
          PageHeader(
            eyebrow: 'Quyền truy cập',
            title: 'Chia sẻ thú cưng',
            subtitle: 'Mời người thân hoặc tạo mã hồ sơ sức khỏe tạm thời.',
            trailingIcon: Icons.person_add_alt_1_rounded,
            trailingLabel: 'Mời',
            onAction: _petId == null ? null : _invite,
          ),
          const SizedBox(height: 14),
          if (pets.isEmpty)
            const EmptyOwnerState(
              icon: Icons.pets_rounded,
              title: 'Chưa có thú cưng',
              message: 'Thêm thú cưng trước khi thiết lập chia sẻ.',
            )
          else ...[
            DropdownButtonFormField<String>(
              initialValue: _petId,
              decoration: const InputDecoration(
                labelText: 'Thú cưng',
                filled: true,
                fillColor: AppColors.surface,
                border: OutlineInputBorder(),
              ),
              items: pets
                  .map(
                    (pet) => DropdownMenuItem(
                      value: pet.petId,
                      child: Text(pet.name),
                    ),
                  )
                  .toList(),
              onChanged: (value) {
                setState(() => _petId = value);
                _load();
              },
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              ErrorBanner(message: _error!),
            ],
            const SizedBox(height: 14),
            if (_loading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(32),
                  child: CircularProgressIndicator(color: AppColors.primary),
                ),
              )
            else ...[
              SectionCard(
                title: 'Người được chia sẻ',
                subtitle: '${_access.length} quyền truy cập',
                action: IconButton(
                  tooltip: 'Mời người dùng',
                  onPressed: _invite,
                  icon: const Icon(Icons.person_add_alt_1_rounded),
                ),
                child: _access.isEmpty
                    ? const EmptyOwnerState(
                        icon: Icons.group_off_rounded,
                        title: 'Chưa chia sẻ với ai',
                        message: 'Mời người thân bằng email để cùng chăm sóc.',
                        compact: true,
                      )
                    : Column(
                        children: _access
                            .map(
                              (access) => ListTile(
                                contentPadding: EdgeInsets.zero,
                                leading: const IconBubble(
                                  icon: Icons.person_rounded,
                                ),
                                title: Text('User ${shortId(access.userId)}'),
                                subtitle: Text(
                                  access.expiresAt == null
                                      ? 'Không hết hạn'
                                      : 'Hết hạn ${formatDateOnly(DateTime.tryParse(access.expiresAt!) ?? DateTime.now())}',
                                ),
                                trailing: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    StatusChip(
                                      label: access.accessRole,
                                      color: access.isExpired
                                          ? AppColors.danger
                                          : AppColors.primaryHover,
                                      background: access.isExpired
                                          ? AppColors.dangerSoft
                                          : AppColors.primarySoft,
                                    ),
                                    IconButton(
                                      tooltip: 'Sửa quyền',
                                      onPressed: access.isExpired
                                          ? null
                                          : () => _editAccess(access),
                                      icon: const Icon(Icons.edit_rounded),
                                    ),
                                    IconButton(
                                      tooltip: 'Thu hồi',
                                      onPressed: access.isExpired
                                          ? null
                                          : () => _revokeAccess(access),
                                      icon: const Icon(
                                        Icons.delete_outline_rounded,
                                        color: AppColors.danger,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            )
                            .toList(),
                      ),
              ),
              const SizedBox(height: 14),
              SectionCard(
                title: 'Mã hồ sơ sức khỏe',
                subtitle: 'Mã tạm thời dành cho phòng khám hoặc cấp cứu.',
                action: IconButton(
                  tooltip: 'Tạo mã',
                  onPressed: _createShare,
                  icon: const Icon(Icons.add_link_rounded),
                ),
                child: _shares.isEmpty
                    ? const EmptyOwnerState(
                        icon: Icons.qr_code_2_rounded,
                        title: 'Chưa có mã chia sẻ',
                        message: 'Tạo mã có hạn dùng tối đa 7 ngày.',
                        compact: true,
                      )
                    : Column(
                        children: _shares
                            .map(
                              (share) => _HealthShareTile(
                                share: share,
                                onCopy: () async {
                                  await Clipboard.setData(
                                    ClipboardData(text: share.displayCode),
                                  );
                                  if (context.mounted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                        content: Text(
                                          'Đã sao chép mã chia sẻ.',
                                        ),
                                      ),
                                    );
                                  }
                                },
                                onRevoke: share.isActive
                                    ? () => _revokeShare(share)
                                    : null,
                              ),
                            )
                            .toList(),
                      ),
              ),
            ],
          ],
        ],
      ),
    );
  }
}

class _GrantAccessSheet extends StatefulWidget {
  const _GrantAccessSheet({required this.repository, required this.petId});

  final OwnerRepository repository;
  final String petId;

  @override
  State<_GrantAccessSheet> createState() => _GrantAccessSheetState();
}

class _GrantAccessSheetState extends State<_GrantAccessSheet> {
  final _email = TextEditingController();
  String _role = 'Viewer';
  DateTime? _expiresAt;
  bool _saving = false;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_email.text.contains('@')) {
      setState(() => _error = 'Nhập email hợp lệ.');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await widget.repository.grantPetAccess(
        petId: widget.petId,
        userEmail: _email.text.trim(),
        accessRole: _role,
        expiresAt: _expiresAt,
      );
      if (mounted) Navigator.of(context).pop(true);
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return OwnerSheetFrame(
      title: 'Mời người cùng chăm sóc',
      subtitle: 'Người nhận cần có tài khoản PetOmi với email này.',
      icon: Icons.person_add_alt_1_rounded,
      error: _error,
      children: [
        SheetTextField(
          controller: _email,
          label: 'Email người nhận',
          icon: Icons.email_rounded,
        ),
        const SizedBox(height: 12),
        SheetChoiceField(
          label: 'Quyền truy cập',
          icon: Icons.admin_panel_settings_rounded,
          value: _role,
          options: const [('Viewer', 'Chỉ xem'), ('Editor', 'Được chỉnh sửa')],
          onChanged: _saving ? null : (value) => setState(() => _role = value),
        ),
        const SizedBox(height: 12),
        SoftButton(
          label: _expiresAt == null
              ? 'Không đặt hạn dùng'
              : 'Hết hạn ${formatDateOnly(_expiresAt!)}',
          icon: Icons.event_rounded,
          onTap: _saving
              ? null
              : () async {
                  final value = await showDatePicker(
                    context: context,
                    firstDate: DateTime.now().add(const Duration(days: 1)),
                    lastDate: DateTime.now().add(const Duration(days: 365)),
                    initialDate:
                        _expiresAt ??
                        DateTime.now().add(const Duration(days: 30)),
                  );
                  if (value != null) setState(() => _expiresAt = value);
                },
        ),
        const SizedBox(height: 16),
        PrimaryButton(
          label: _saving ? 'Đang mời...' : 'Gửi lời mời',
          icon: Icons.send_rounded,
          onTap: _saving ? null : _submit,
        ),
      ],
    );
  }
}

class _EditAccessSheet extends StatefulWidget {
  const _EditAccessSheet({required this.repository, required this.access});

  final OwnerRepository repository;
  final PetUserAccess access;

  @override
  State<_EditAccessSheet> createState() => _EditAccessSheetState();
}

class _EditAccessSheetState extends State<_EditAccessSheet> {
  late String _role;
  DateTime? _expiresAt;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _role = widget.access.accessRole;
    _expiresAt = DateTime.tryParse(widget.access.expiresAt ?? '');
  }

  Future<void> _submit() async {
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await widget.repository.updatePetAccess(
        petId: widget.access.petId,
        accessId: widget.access.petUserAccessId,
        accessRole: _role,
        expiresAt: _expiresAt,
      );
      if (mounted) Navigator.of(context).pop(true);
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return OwnerSheetFrame(
      title: 'Cập nhật quyền truy cập',
      subtitle: 'User ${shortId(widget.access.userId)}',
      icon: Icons.manage_accounts_rounded,
      error: _error,
      children: [
        SheetChoiceField(
          label: 'Quyền truy cập',
          icon: Icons.admin_panel_settings_rounded,
          value: _role,
          options: const [('Viewer', 'Chỉ xem'), ('Editor', 'Được chỉnh sửa')],
          onChanged: _saving ? null : (value) => setState(() => _role = value),
        ),
        const SizedBox(height: 12),
        SoftButton(
          label: _expiresAt == null
              ? 'Không đặt hạn dùng'
              : 'Hết hạn ${formatDateOnly(_expiresAt!)}',
          icon: Icons.event_rounded,
          onTap: _saving
              ? null
              : () async {
                  final value = await showDatePicker(
                    context: context,
                    firstDate: DateTime.now().add(const Duration(days: 1)),
                    lastDate: DateTime.now().add(const Duration(days: 365)),
                    initialDate: _expiresAt?.isAfter(DateTime.now()) == true
                        ? _expiresAt!
                        : DateTime.now().add(const Duration(days: 30)),
                  );
                  if (value != null) setState(() => _expiresAt = value);
                },
        ),
        if (_expiresAt != null) ...[
          const SizedBox(height: 8),
          TextButton.icon(
            onPressed: _saving ? null : () => setState(() => _expiresAt = null),
            icon: const Icon(Icons.event_busy_rounded),
            label: const Text('Bỏ hạn dùng'),
          ),
        ],
        const SizedBox(height: 16),
        PrimaryButton(
          label: _saving ? 'Đang lưu...' : 'Lưu thay đổi',
          icon: Icons.save_rounded,
          onTap: _saving ? null : _submit,
        ),
      ],
    );
  }
}

class _CreateHealthShareSheet extends StatefulWidget {
  const _CreateHealthShareSheet({
    required this.repository,
    required this.petId,
  });

  final OwnerRepository repository;
  final String petId;

  @override
  State<_CreateHealthShareSheet> createState() =>
      _CreateHealthShareSheetState();
}

class _CreateHealthShareSheetState extends State<_CreateHealthShareSheet> {
  String _scope = 'ClinicVisit';
  String _accessMode = 'Temporary';
  int _days = 1;
  bool _saving = false;
  String? _error;

  Future<void> _submit() async {
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final share = await widget.repository.createPetHealthShare(
        petId: widget.petId,
        scope: _scope,
        accessMode: _accessMode,
        expiresAt: DateTime.now().toUtc().add(Duration(days: _days)),
        maxUses: _accessMode == 'OneTime' ? 1 : null,
      );
      if (mounted) Navigator.of(context).pop(share);
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return OwnerSheetFrame(
      title: 'Tạo mã hồ sơ sức khỏe',
      subtitle: 'Mã hết hạn tối đa sau 7 ngày.',
      icon: Icons.add_link_rounded,
      error: _error,
      children: [
        SheetChoiceField(
          label: 'Phạm vi',
          icon: Icons.health_and_safety_rounded,
          value: _scope,
          options: const [
            ('EmergencySummary', 'Tóm tắt cấp cứu'),
            ('ClinicVisit', 'Dùng khi khám'),
            ('FullHealthProfile', 'Toàn bộ hồ sơ'),
          ],
          onChanged: _saving ? null : (value) => setState(() => _scope = value),
        ),
        const SizedBox(height: 12),
        SheetChoiceField(
          label: 'Cách sử dụng',
          icon: Icons.lock_clock_rounded,
          value: _accessMode,
          options: const [
            ('Temporary', 'Dùng trong thời hạn'),
            ('OneTime', 'Chỉ dùng một lần'),
          ],
          onChanged: _saving
              ? null
              : (value) => setState(() => _accessMode = value),
        ),
        const SizedBox(height: 12),
        SheetChoiceField(
          label: 'Thời hạn',
          icon: Icons.event_rounded,
          value: '$_days',
          options: const [('1', '1 ngày'), ('3', '3 ngày'), ('7', '7 ngày')],
          onChanged: _saving
              ? null
              : (value) => setState(() => _days = int.parse(value)),
        ),
        const SizedBox(height: 16),
        PrimaryButton(
          label: _saving ? 'Đang tạo...' : 'Tạo và sao chép mã',
          icon: Icons.qr_code_2_rounded,
          onTap: _saving ? null : _submit,
        ),
      ],
    );
  }
}

class _HealthShareTile extends StatelessWidget {
  const _HealthShareTile({
    required this.share,
    required this.onCopy,
    required this.onRevoke,
  });

  final PetHealthShare share;
  final VoidCallback onCopy;
  final VoidCallback? onRevoke;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surfaceMuted,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: SelectableText(
                  share.displayCode,
                  style: Theme.of(context).textTheme.titleLarge,
                ),
              ),
              IconButton(
                onPressed: onCopy,
                icon: const Icon(Icons.copy_rounded),
              ),
              IconButton(
                onPressed: onRevoke,
                icon: const Icon(
                  Icons.delete_outline_rounded,
                  color: AppColors.danger,
                ),
              ),
            ],
          ),
          Text('${share.scope} • ${share.accessMode}'),
          const SizedBox(height: 8),
          StatusChip(
            label: share.isActive ? 'Đang hoạt động' : 'Không còn hiệu lực',
            color: share.isActive ? AppColors.success : AppColors.danger,
            background: share.isActive
                ? AppColors.successSoft
                : AppColors.dangerSoft,
          ),
        ],
      ),
    );
  }
}

class OwnerAiPlanPage extends StatefulWidget {
  const OwnerAiPlanPage({super.key});

  @override
  State<OwnerAiPlanPage> createState() => _OwnerAiPlanPageState();
}

class _OwnerAiPlanPageState extends State<OwnerAiPlanPage> {
  String? _petId;
  ChatSubscriptionStatus? _status;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final pets = OwnerScope.of(context).data.pets;
      _petId = pets.isEmpty ? null : pets.first.petId;
      _load();
    });
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final status = await OwnerScope.of(
        context,
      ).repository.getChatSubscriptionStatus(petId: _petId);
      if (mounted) setState(() => _status = status);
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final pets = OwnerScope.of(context).data.pets;
    final status = _status;
    return _OwnerSecondaryScaffold(
      title: 'Gói trợ lý AI',
      child: OwnerScrollView(
        onRefresh: _load,
        children: [
          PageHeader(
            eyebrow: 'PetOmi AI',
            title: 'Gói trợ lý AI',
            subtitle: 'Theo dõi quota và nâng cấp riêng cho từng thú cưng.',
            trailingIcon: Icons.refresh_rounded,
            trailingLabel: 'Tải lại',
            onAction: _load,
          ),
          const SizedBox(height: 14),
          if (pets.isNotEmpty)
            DropdownButtonFormField<String>(
              initialValue: _petId,
              decoration: const InputDecoration(
                labelText: 'Áp dụng cho thú cưng',
                filled: true,
                fillColor: AppColors.surface,
                border: OutlineInputBorder(),
              ),
              items: pets
                  .map(
                    (pet) => DropdownMenuItem(
                      value: pet.petId,
                      child: Text(pet.name),
                    ),
                  )
                  .toList(),
              onChanged: (value) {
                setState(() => _petId = value);
                _load();
              },
            ),
          if (_error != null) ...[
            const SizedBox(height: 12),
            ErrorBanner(message: _error!),
          ],
          const SizedBox(height: 14),
          if (_loading)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(32),
                child: CircularProgressIndicator(color: AppColors.primary),
              ),
            )
          else if (pets.isEmpty)
            const EmptyOwnerState(
              icon: Icons.pets_rounded,
              title: 'Chưa có thú cưng',
              message: 'Thêm thú cưng trước khi đăng ký gói AI.',
            )
          else if (status != null) ...[
            SectionCard(
              title: 'Gói hiện tại: ${status.currentPlanName}',
              subtitle: status.isPremium
                  ? 'Premium đang hoạt động cho thú cưng đã chọn.'
                  : 'Bạn đang sử dụng gói miễn phí.',
              child: Column(
                children: [
                  InfoRow(
                    label: 'Đã dùng',
                    value:
                        '${status.usedMessages}/${status.monthlyMessageQuota} tin nhắn',
                  ),
                  InfoRow(
                    label: 'Còn lại',
                    value: '${status.remainingMessages} tin nhắn',
                  ),
                  InfoRow(
                    label: 'Reset quota',
                    value: formatDateTime(
                      DateTime.tryParse(status.resetAt ?? ''),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            ...status.plans.map(
              (plan) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: SurfaceCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              plan.name,
                              style: Theme.of(context).textTheme.titleLarge,
                            ),
                          ),
                          if (plan.code.toLowerCase() ==
                              status.currentPlanCode.toLowerCase())
                            const StatusChip(
                              label: 'Đang dùng',
                              color: AppColors.success,
                              background: AppColors.successSoft,
                            ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        plan.priceMonthly <= 0
                            ? 'Miễn phí'
                            : '${_formatPlanMoney(plan.priceMonthly)} / ${plan.billingCycleDays} ngày',
                        style: Theme.of(context).textTheme.headlineMedium,
                      ),
                      const SizedBox(height: 8),
                      Text('${plan.monthlyMessageQuota} tin nhắn mỗi tháng'),
                    ],
                  ),
                ),
              ),
            ),
            PrimaryButton(
              label: 'Xem và nâng cấp gói',
              icon: Icons.workspace_premium_rounded,
              onTap: () async {
                await showChatPlansSheet(
                  context: context,
                  status: status,
                  petId: _petId,
                  onChanged: _load,
                );
                _load();
              },
            ),
          ],
        ],
      ),
    );
  }

  String _formatPlanMoney(double value) {
    final digits = value.toStringAsFixed(0);
    return '${digits.replaceAllMapped(RegExp(r'(?<=\d)(?=(\d{3})+$)'), (_) => '.')}đ';
  }
}

class _PreferenceDraft {
  _PreferenceDraft({
    required this.type,
    required this.label,
    required this.description,
    required this.enabled,
    required this.minutes,
    required this.channel,
  });

  final String type;
  final String label;
  final String description;
  bool enabled;
  int minutes;
  String channel;
  bool dirty = false;
}

class ReminderPreferencesPage extends StatefulWidget {
  const ReminderPreferencesPage({super.key});

  @override
  State<ReminderPreferencesPage> createState() =>
      _ReminderPreferencesPageState();
}

class _ReminderPreferencesPageState extends State<ReminderPreferencesPage> {
  static const _definitions = [
    ('Vaccine', 'Tiêm phòng', 'Nhắc lịch vaccine cho thú cưng.'),
    ('Medication', 'Thuốc', 'Nhắc uống thuốc đúng giờ theo toa.'),
    ('FollowUp', 'Tái khám', 'Nhắc lịch tái khám định kỳ.'),
    ('Deworming', 'Tẩy giun', 'Nhắc lịch tẩy giun.'),
    ('Grooming', 'Vệ sinh', 'Nhắc tắm, cắt tỉa và chăm sóc lông.'),
    ('WeightTracking', 'Cân nặng', 'Nhắc ghi nhận cân nặng.'),
    ('Custom', 'Tùy chỉnh', 'Các reminder do bạn tự tạo.'),
  ];

  bool _loading = true;
  bool _saving = false;
  String? _error;
  List<_PreferenceDraft> _drafts = const [];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final existing = await OwnerScope.of(
        context,
      ).repository.getReminderPreferences();
      final drafts = _definitions.map((definition) {
        final found = existing.where(
          (item) =>
              item.reminderType.toLowerCase() == definition.$1.toLowerCase(),
        );
        final value = found.isEmpty ? null : found.first;
        return _PreferenceDraft(
          type: definition.$1,
          label: definition.$2,
          description: definition.$3,
          enabled: value?.isEnabled ?? true,
          minutes: value?.remindBeforeMinutes ?? 60,
          channel: value?.channel ?? 'PushEmail',
        );
      }).toList();
      if (mounted) setState(() => _drafts = drafts);
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _save() async {
    final dirty = _drafts.where((item) => item.dirty).toList();
    if (dirty.isEmpty) return;
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final repo = OwnerScope.of(context).repository;
      for (final item in dirty) {
        await repo.updateReminderPreference(
          reminderType: item.type,
          isEnabled: item.enabled,
          remindBeforeMinutes: item.minutes,
          channel: item.channel,
        );
      }
      if (!mounted) return;
      setState(() {
        for (final item in dirty) {
          item.dirty = false;
        }
      });
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Đã lưu cài đặt nhắc nhở.')));
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasChanges = _drafts.any((item) => item.dirty);
    return _OwnerSecondaryScaffold(
      title: 'Cài đặt nhắc nhở',
      child: OwnerScrollView(
        onRefresh: _load,
        children: [
          PageHeader(
            eyebrow: 'Thông báo chăm sóc',
            title: 'Cài đặt nhắc nhở',
            subtitle: 'Chọn loại, thời gian báo trước và kênh nhận.',
            trailingIcon: Icons.save_rounded,
            trailingLabel: _saving ? 'Đang lưu' : 'Lưu',
            onAction: hasChanges && !_saving ? _save : null,
          ),
          if (_error != null) ...[
            const SizedBox(height: 12),
            ErrorBanner(message: _error!),
          ],
          const SizedBox(height: 14),
          if (_loading)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(32),
                child: CircularProgressIndicator(color: AppColors.primary),
              ),
            )
          else
            ..._drafts.map(
              (item) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: SurfaceCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SwitchListTile.adaptive(
                        contentPadding: EdgeInsets.zero,
                        title: Text(
                          item.label,
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        subtitle: Text(item.description),
                        value: item.enabled,
                        activeThumbColor: AppColors.primary,
                        onChanged: _saving
                            ? null
                            : (value) => setState(() {
                                item.enabled = value;
                                item.dirty = true;
                              }),
                      ),
                      const SizedBox(height: 8),
                      DropdownButtonFormField<int>(
                        initialValue: item.minutes,
                        decoration: const InputDecoration(
                          labelText: 'Báo trước',
                          border: OutlineInputBorder(),
                        ),
                        items: const [
                          DropdownMenuItem(value: 15, child: Text('15 phút')),
                          DropdownMenuItem(value: 30, child: Text('30 phút')),
                          DropdownMenuItem(value: 60, child: Text('1 giờ')),
                          DropdownMenuItem(value: 120, child: Text('2 giờ')),
                          DropdownMenuItem(value: 1440, child: Text('1 ngày')),
                        ],
                        onChanged: !item.enabled || _saving
                            ? null
                            : (value) => setState(() {
                                item.minutes = value ?? 60;
                                item.dirty = true;
                              }),
                      ),
                      const SizedBox(height: 10),
                      DropdownButtonFormField<String>(
                        initialValue: item.channel,
                        decoration: const InputDecoration(
                          labelText: 'Kênh nhận',
                          border: OutlineInputBorder(),
                        ),
                        items: const [
                          DropdownMenuItem(value: 'Push', child: Text('Push')),
                          DropdownMenuItem(
                            value: 'Email',
                            child: Text('Email'),
                          ),
                          DropdownMenuItem(
                            value: 'PushEmail',
                            child: Text('Push + Email'),
                          ),
                          DropdownMenuItem(
                            value: 'PushEmailSMS',
                            child: Text('Push + Email + SMS'),
                          ),
                        ],
                        onChanged: !item.enabled || _saving
                            ? null
                            : (value) => setState(() {
                                item.channel = value ?? 'PushEmail';
                                item.dirty = true;
                              }),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          if (!_loading)
            PrimaryButton(
              label: _saving ? 'Đang lưu...' : 'Lưu thay đổi',
              icon: Icons.save_rounded,
              onTap: hasChanges && !_saving ? _save : null,
            ),
        ],
      ),
    );
  }
}

class OwnerNotificationsPage extends StatelessWidget {
  const OwnerNotificationsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const _DevelopmentPage(
      title: 'Thông báo',
      icon: Icons.notifications_rounded,
      description:
          'Thông báo real-time trên mobile đang được phát triển. Dữ liệu giả sẽ không được hiển thị.',
      dependency:
          'Cần hoàn thiện SignalR mobile. Lịch sử thông báo persistent vẫn cần backend REST API.',
    );
  }
}

class OwnerReviewsPage extends StatelessWidget {
  const OwnerReviewsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const _DevelopmentPage(
      title: 'Đánh giá phòng khám',
      icon: Icons.star_rounded,
      description:
          'Gửi đánh giá đang bị khóa để tránh tạo cảm giác đã lưu dữ liệu khi backend chưa hỗ trợ.',
      dependency:
          'Cần owner review API để kiểm tra appointment đủ điều kiện, tạo review và chống gửi trùng.',
    );
  }
}

class _DevelopmentPage extends StatelessWidget {
  const _DevelopmentPage({
    required this.title,
    required this.icon,
    required this.description,
    required this.dependency,
  });

  final String title;
  final IconData icon;
  final String description;
  final String dependency;

  @override
  Widget build(BuildContext context) {
    return _OwnerSecondaryScaffold(
      title: title,
      child: OwnerScrollView(
        children: [
          const SizedBox(height: 40),
          SurfaceCard(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                IconBubble(
                  icon: icon,
                  background: AppColors.warningSoft,
                  foreground: AppColors.warning,
                ),
                const SizedBox(height: 16),
                Text(title, style: Theme.of(context).textTheme.headlineMedium),
                const SizedBox(height: 10),
                const StatusChip(
                  label: 'Đang phát triển',
                  color: AppColors.warning,
                  background: AppColors.warningSoft,
                ),
                const SizedBox(height: 14),
                Text(description, textAlign: TextAlign.center),
                const SizedBox(height: 14),
                Text(
                  dependency,
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 18),
                PrimaryButton(
                  label: 'Đang phát triển',
                  icon: Icons.lock_clock_rounded,
                  onTap: null,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
