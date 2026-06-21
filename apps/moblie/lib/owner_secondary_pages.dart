part of 'main.dart';

Future<void> _openOwnerPage(BuildContext context, Widget page) {
  final scope = OwnerScope.of(context);
  return Navigator.of(context).push(
    MaterialPageRoute<void>(
      builder: (_) => OwnerScope(
        data: scope.data,
        repository: scope.repository,
        notificationCenter: scope.notificationCenter,
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

String buildPetHealthShareLink(String displayCode) {
  final baseUrl = AppConfig.webBaseUrl.replaceFirst(RegExp(r'/+$'), '');
  final encodedCode = Uri.encodeQueryComponent(displayCode);
  return '$baseUrl/dashboard/clinic/pet-intake?shareCode=$encodedCode';
}

String buildPetPassportLink(String publicPetCode) {
  final baseUrl = AppConfig.webBaseUrl.replaceFirst(RegExp(r'/+$'), '');
  final encodedCode = Uri.encodeQueryComponent(publicPetCode);
  return '$baseUrl/dashboard/clinic/pet-intake?petCode=$encodedCode';
}

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
            icon: Icons.badge_rounded,
            title: 'Hộ chiếu thú cưng',
            subtitle: 'Một QR để phòng khám nhận diện pet khi tái khám',
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
          AnimatedBuilder(
            animation: OwnerScope.of(context).notificationCenter,
            builder: (context, _) {
              final center = OwnerScope.of(context).notificationCenter;
              final unread = center.unreadCount;
              return _OwnerMenuTile(
                icon: Icons.notifications_rounded,
                title: 'Thông báo',
                subtitle: unread == 0
                    ? 'Nhắc nhở nhận trong phiên hiện tại'
                    : '$unread thông báo chưa đọc',
                onTap: () => openNotificationsPage(context),
              );
            },
          ),
          _OwnerMenuTile(
            icon: Icons.star_rounded,
            title: 'Đánh giá phòng khám',
            subtitle: 'Sẵn sàng khi API review được deploy',
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
          const SnackBar(
            content: Text(
              'Đã cấp quyền sức khỏe tạm thời và sao chép mã dự phòng.',
            ),
          ),
        );
      }
      if (mounted) _load();
    }
  }

  OwnerPet? _selectedPet(List<OwnerPet> pets) {
    final petId = _petId;
    if (petId == null) return null;
    for (final pet in pets) {
      if (pet.petId == petId) return pet;
    }
    return null;
  }

  Future<void> _showPetPassport(OwnerPet pet, String publicPetCode) {
    return showOwnerActionSheet<void>(
      context: context,
      child: _OwnerPetPassportSheet(pet: pet, publicPetCode: publicPetCode),
    );
  }

  Widget _buildPassportCard(OwnerPet? pet, String? publicPetCode) {
    final hasPassport =
        pet != null && publicPetCode != null && publicPetCode.isNotEmpty;

    return SectionCard(
      title: 'Hộ chiếu thú cưng',
      subtitle:
          'Một QR dùng khi tái khám để phòng khám nhận diện pet và mở đúng hồ sơ được cấp quyền.',
      action: IconButton(
        tooltip: 'Xem QR hộ chiếu',
        onPressed: hasPassport
            ? () => _showPetPassport(pet, publicPetCode)
            : null,
        icon: const Icon(Icons.badge_rounded),
      ),
      child: hasPassport
          ? Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    PetOmiAvatar(
                      label: pet.initials,
                      icon: Icons.pets_rounded,
                      size: 54,
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
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${pet.speciesLabel} • ${pet.genderLabel} • ${pet.ageLabel}',
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                          const SizedBox(height: 8),
                          StatusChip(
                            label: publicPetCode,
                            color: AppColors.primaryHover,
                            background: AppColors.primarySoft,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    _ShareActionButton(
                      label: 'Xem QR',
                      icon: Icons.qr_code_2_rounded,
                      onPressed: () => _showPetPassport(pet, publicPetCode),
                    ),
                    _ShareActionButton(
                      label: 'Cấp quyền sức khỏe',
                      icon: Icons.health_and_safety_rounded,
                      onPressed: _createShare,
                    ),
                    _ShareActionButton(
                      label: 'Copy link',
                      icon: Icons.link_rounded,
                      onPressed: () async {
                        await Clipboard.setData(
                          ClipboardData(
                            text: buildPetPassportLink(publicPetCode),
                          ),
                        );
                        if (!mounted) return;
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Đã sao chép link hộ chiếu.'),
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ],
            )
          : const EmptyOwnerState(
              icon: Icons.badge_outlined,
              title: 'Chưa có PetOmi ID',
              message:
                  'Thú cưng cần có mã định danh công khai trước khi tạo hộ chiếu QR.',
              compact: true,
            ),
    );
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
    final selectedPet = _selectedPet(pets);
    final selectedPublicPetCode = selectedPet?.publicPetCode?.trim();
    return _OwnerSecondaryScaffold(
      title: 'Hộ chiếu thú cưng',
      child: OwnerScrollView(
        onRefresh: _load,
        children: [
          PageHeader(
            eyebrow: 'Pet passport QR',
            title: 'Hộ chiếu thú cưng',
            subtitle:
                'Một mã QR để phòng khám nhận diện thú cưng khi tái khám; quyền xem sức khỏe được cấp riêng khi cần.',
            trailingIcon: Icons.badge_rounded,
            trailingLabel: 'Xem QR',
            onAction:
                selectedPet != null &&
                    selectedPublicPetCode != null &&
                    selectedPublicPetCode.isNotEmpty
                ? () => _showPetPassport(selectedPet, selectedPublicPetCode)
                : null,
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
              _buildPassportCard(selectedPet, selectedPublicPetCode),
              const SizedBox(height: 14),
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
                title: 'Quyền xem hồ sơ sức khỏe',
                subtitle:
                    'Cấp quyền tạm thời phía sau QR hộ chiếu khi phòng khám cần xem dữ liệu riêng tư.',
                action: IconButton(
                  tooltip: 'Cấp quyền sức khỏe',
                  onPressed: _createShare,
                  icon: const Icon(Icons.health_and_safety_rounded),
                ),
                child: _shares.isEmpty
                    ? const EmptyOwnerState(
                        icon: Icons.health_and_safety_rounded,
                        title: 'Chưa cấp quyền sức khỏe',
                        message:
                            'QR hộ chiếu vẫn dùng để nhận diện pet. Khi cần, hãy cấp quyền sức khỏe tạm thời tối đa 7 ngày.',
                        compact: true,
                      )
                    : Column(
                        children: _shares
                            .map(
                              (share) => _HealthShareTile(
                                share: share,
                                onCopyLink: () async {
                                  await Clipboard.setData(
                                    ClipboardData(
                                      text: buildPetHealthShareLink(
                                        share.displayCode,
                                      ),
                                    ),
                                  );
                                  if (context.mounted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                        content: Text(
                                          'Đã sao chép link dự phòng.',
                                        ),
                                      ),
                                    );
                                  }
                                },
                                onCopyCode: () async {
                                  await Clipboard.setData(
                                    ClipboardData(text: share.displayCode),
                                  );
                                  if (context.mounted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                        content: Text(
                                          'Đã sao chép mã dự phòng.',
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
      title: 'Cấp quyền sức khỏe',
      subtitle:
          'Quyền này bổ sung cho QR hộ chiếu và hết hạn tối đa sau 7 ngày.',
      icon: Icons.health_and_safety_rounded,
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
          label: _saving ? 'Đang cấp quyền...' : 'Cấp quyền và copy mã',
          icon: Icons.verified_user_rounded,
          onTap: _saving ? null : _submit,
        ),
      ],
    );
  }
}

class _HealthShareTile extends StatelessWidget {
  const _HealthShareTile({
    required this.share,
    required this.onCopyLink,
    required this.onCopyCode,
    required this.onRevoke,
  });

  final PetHealthShare share;
  final VoidCallback onCopyLink;
  final VoidCallback onCopyCode;
  final VoidCallback? onRevoke;

  @override
  Widget build(BuildContext context) {
    final link = buildPetHealthShareLink(share.displayCode);
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
              const IconBubble(icon: Icons.health_and_safety_rounded),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SelectableText(
                      share.displayCode,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${_shareScopeLabel(share.scope)} • ${_shareModeLabel(share.accessMode)}',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              IconButton(
                tooltip: 'Thu hồi',
                onPressed: onRevoke,
                icon: const Icon(
                  Icons.delete_outline_rounded,
                  color: AppColors.danger,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          SelectableText(
            link,
            style: Theme.of(
              context,
            ).textTheme.bodySmall?.copyWith(color: AppColors.textMuted),
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              StatusChip(
                label: share.isActive ? 'Đang hoạt động' : 'Không còn hiệu lực',
                color: share.isActive ? AppColors.success : AppColors.danger,
                background: share.isActive
                    ? AppColors.successSoft
                    : AppColors.dangerSoft,
              ),
              StatusChip(
                label: _shareUsageText(share),
                color: AppColors.textMuted,
                background: AppColors.surface,
              ),
              StatusChip(
                label: _shareExpiryText(share.expiresAt),
                color: AppColors.textMuted,
                background: AppColors.surface,
              ),
            ],
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _ShareActionButton(
                label: 'Copy link dự phòng',
                icon: Icons.link_rounded,
                onPressed: onCopyLink,
              ),
              _ShareActionButton(
                label: 'Copy mã',
                icon: Icons.copy_rounded,
                onPressed: onCopyCode,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ShareActionButton extends StatelessWidget {
  const _ShareActionButton({
    required this.label,
    required this.icon,
    required this.onPressed,
  });

  final String label;
  final IconData icon;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return OutlinedButton.icon(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.text,
        side: const BorderSide(color: AppColors.border),
        visualDensity: VisualDensity.compact,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
      ),
      onPressed: onPressed,
      icon: Icon(icon, size: 17),
      label: Text(label, style: const TextStyle(fontWeight: FontWeight.w800)),
    );
  }
}

class _OwnerPetPassportSheet extends StatelessWidget {
  const _OwnerPetPassportSheet({
    required this.pet,
    required this.publicPetCode,
  });

  final OwnerPet pet;
  final String publicPetCode;

  Future<void> _copy(
    BuildContext context, {
    required String value,
    required String message,
  }) async {
    await Clipboard.setData(ClipboardData(text: value));
    if (!context.mounted) return;
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  Future<void> _openLink(BuildContext context, String link) async {
    final uri = Uri.parse(link);
    try {
      final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!ok && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Không mở được link hộ chiếu.')),
        );
      }
    } catch (error) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error.toString())));
    }
  }

  @override
  Widget build(BuildContext context) {
    final link = buildPetPassportLink(publicPetCode);
    return OwnerSheetFrame(
      title: 'Hộ chiếu thú cưng',
      subtitle:
          'Một QR dùng khi tái khám để phòng khám nhận diện thú cưng và mở hồ sơ được cấp quyền.',
      icon: Icons.badge_rounded,
      children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.surfaceMuted,
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            children: [
              PetOmiAvatar(
                label: pet.initials,
                icon: Icons.pets_rounded,
                size: 58,
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
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${pet.speciesLabel} • ${pet.genderLabel} • ${pet.ageLabel}',
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    const SizedBox(height: 8),
                    StatusChip(
                      label: publicPetCode,
                      color: AppColors.primaryHover,
                      background: AppColors.primarySoft,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        Center(
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(22),
              border: Border.all(color: AppColors.border),
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withValues(alpha: 0.12),
                  blurRadius: 22,
                  offset: const Offset(0, 12),
                ),
              ],
            ),
            child: LayoutBuilder(
              builder: (context, constraints) {
                final qrSize = constraints.maxWidth < 240
                    ? constraints.maxWidth
                    : 240.0;
                return QrImageView(
                  data: link,
                  version: QrVersions.auto,
                  size: qrSize,
                  backgroundColor: Colors.white,
                  eyeStyle: const QrEyeStyle(
                    eyeShape: QrEyeShape.square,
                    color: AppColors.text,
                  ),
                  dataModuleStyle: const QrDataModuleStyle(
                    dataModuleShape: QrDataModuleShape.square,
                    color: AppColors.text,
                  ),
                );
              },
            ),
          ),
        ),
        const SizedBox(height: 14),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.surfaceMuted,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Mã hộ chiếu',
                style: Theme.of(context).textTheme.labelLarge,
              ),
              const SizedBox(height: 6),
              SelectableText(
                publicPetCode,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 12),
              Text('Link web', style: Theme.of(context).textTheme.labelLarge),
              const SizedBox(height: 6),
              SelectableText(
                link,
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: AppColors.textMuted),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.primarySoft,
            borderRadius: BorderRadius.circular(18),
          ),
          child: const Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.verified_user_rounded, color: AppColors.primary),
              SizedBox(width: 10),
              Expanded(
                child: Text(
                  'QR mở trang Clinic Intake trên web. Bác sĩ cần đăng nhập tài khoản phòng khám để xem hồ sơ theo quyền được cấp.',
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: [
            PrimaryButton(
              label: 'Copy link',
              icon: Icons.link_rounded,
              onTap: () => _copy(
                context,
                value: link,
                message: 'Đã sao chép link hộ chiếu.',
              ),
            ),
            SoftButton(
              label: 'Copy mã',
              icon: Icons.copy_rounded,
              onTap: () => _copy(
                context,
                value: publicPetCode,
                message: 'Đã sao chép mã hộ chiếu.',
              ),
            ),
            SoftButton(
              label: 'Mở link',
              icon: Icons.open_in_new_rounded,
              onTap: () => _openLink(context, link),
            ),
          ],
        ),
      ],
    );
  }
}

String _shareScopeLabel(String value) {
  switch (value) {
    case 'EmergencySummary':
      return 'Tóm tắt cấp cứu';
    case 'FullHealthProfile':
      return 'Toàn bộ hồ sơ';
    case 'ClinicVisit':
      return 'Dùng khi khám';
    default:
      return value;
  }
}

String _shareModeLabel(String value) {
  switch (value) {
    case 'OneTime':
      return 'Một lần';
    case 'Temporary':
      return 'Tạm thời';
    default:
      return value;
  }
}

String _shareUsageText(PetHealthShare share) {
  final limit = share.maxUses;
  if (limit == null) return 'Đã dùng ${share.usedCount} lần';
  return 'Đã dùng ${share.usedCount}/$limit lần';
}

String _shareExpiryText(String value) {
  final parsed = DateTime.tryParse(value);
  if (parsed == null) return 'Có thời hạn';
  return 'Hết hạn ${formatDateOnly(parsed.toLocal())}';
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
    final center = OwnerScope.of(context).notificationCenter;
    return _OwnerSecondaryScaffold(
      title: 'Thông báo',
      child: AnimatedBuilder(
        animation: center,
        builder: (context, _) {
          final items = center.items;
          return OwnerScrollView(
            children: [
              PageHeader(
                eyebrow: 'SignalR theo thời gian thực',
                title: 'Thông báo của bạn',
                subtitle:
                    'Nhắc nhở mới được nhận khi ứng dụng đang mở trong phiên đăng nhập này.',
                trailingIcon: Icons.done_all_rounded,
                trailingLabel: 'Đọc hết',
                onAction: center.unreadCount == 0 ? null : center.markAllRead,
              ),
              const SizedBox(height: 14),
              _NotificationConnectionCard(center: center),
              const SizedBox(height: 14),
              SurfaceCard(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(
                      Icons.info_outline_rounded,
                      color: AppColors.primaryHover,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Backend chưa có API lịch sử và trạng thái đã đọc. Danh sách này không được đồng bộ qua thiết bị hoặc giữ lại sau khi đăng xuất.',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              if (items.isEmpty)
                const EmptyOwnerState(
                  icon: Icons.notifications_none_rounded,
                  title: 'Chưa có thông báo trong phiên',
                  message:
                      'Các reminder đến hạn sẽ xuất hiện tại đây ngay khi backend gửi sự kiện ReceiveReminder.',
                )
              else
                ...items.map(
                  (item) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _OwnerNotificationCard(
                      item: item,
                      onTap: () => center.markRead(item.id),
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}

class _NotificationConnectionCard extends StatelessWidget {
  const _NotificationConnectionCard({required this.center});

  final OwnerNotificationCenter center;

  @override
  Widget build(BuildContext context) {
    final (icon, title, message, color) = switch (center.status) {
      NotificationConnectionStatus.connected => (
        Icons.wifi_rounded,
        'Đang kết nối',
        'Sẵn sàng nhận reminder mới.',
        AppColors.success,
      ),
      NotificationConnectionStatus.connecting => (
        Icons.sync_rounded,
        'Đang kết nối',
        'PetOmi đang mở kênh thông báo.',
        AppColors.primaryHover,
      ),
      NotificationConnectionStatus.reconnecting => (
        Icons.sync_problem_rounded,
        'Đang kết nối lại',
        'Kết nối bị gián đoạn, ứng dụng đang thử lại.',
        AppColors.warning,
      ),
      NotificationConnectionStatus.disabled => (
        Icons.notifications_off_rounded,
        'Đã tắt trong môi trường này',
        'Kênh thông báo không được khởi chạy.',
        AppColors.textSubtle,
      ),
      NotificationConnectionStatus.disconnected => (
        Icons.cloud_off_rounded,
        'Chưa kết nối',
        center.errorMessage == null
            ? 'Nhấn thử lại để kết nối kênh thông báo.'
            : 'Không thể kết nối. Kiểm tra mạng rồi thử lại.',
        AppColors.danger,
      ),
    };
    return SurfaceCard(
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(icon, color: color),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 3),
                Text(message, style: Theme.of(context).textTheme.bodyMedium),
              ],
            ),
          ),
          if (center.status == NotificationConnectionStatus.disconnected)
            TextButton(onPressed: center.retry, child: const Text('Thử lại')),
        ],
      ),
    );
  }
}

class _OwnerNotificationCard extends StatelessWidget {
  const _OwnerNotificationCard({required this.item, required this.onTap});

  final OwnerNotification item;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return SurfaceCard(
      padding: EdgeInsets.zero,
      child: InkWell(
        borderRadius: BorderRadius.circular(24),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: item.isRead
                      ? AppColors.surfaceMuted
                      : AppColors.primarySoft,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(
                  Icons.notifications_active_rounded,
                  color: item.isRead
                      ? AppColors.textSubtle
                      : AppColors.primaryHover,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            item.title,
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                        ),
                        if (!item.isRead)
                          Container(
                            width: 9,
                            height: 9,
                            decoration: const BoxDecoration(
                              color: AppColors.primary,
                              shape: BoxShape.circle,
                            ),
                          ),
                      ],
                    ),
                    if (item.message.isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Text(
                        item.message,
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ],
                    const SizedBox(height: 8),
                    Text(
                      '${item.reminderType} • ${formatDateTime(item.remindAt ?? item.receivedAt)}',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSubtle,
                        fontWeight: FontWeight.w700,
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

class OwnerReviewsPage extends StatefulWidget {
  const OwnerReviewsPage({super.key});

  @override
  State<OwnerReviewsPage> createState() => _OwnerReviewsPageState();
}

class _OwnerReviewsPageState extends State<OwnerReviewsPage> {
  final _search = TextEditingController();
  bool _loading = true;
  bool _apiMissing = false;
  Object? _error;
  List<OwnerClinicReview> _reviews = const [];
  List<OwnerClinic> _clinics = const [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
      _apiMissing = false;
    });
    try {
      final repo = OwnerScope.of(context).repository;
      final results = await Future.wait<dynamic>([
        repo.getMyClinicReviews(),
        repo.getPublicClinics(),
      ]);
      if (!mounted) return;
      setState(() {
        _reviews = results[0] as List<OwnerClinicReview>;
        _clinics = results[1] as List<OwnerClinic>;
        _loading = false;
      });
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() {
        _apiMissing = error.statusCode == 404;
        _error = error;
        _loading = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error;
        _loading = false;
      });
    }
  }

  List<OwnerAppointment> _eligibleAppointments(OwnerHomeData data) {
    final reviewedClinics = _reviews.map((item) => item.clinicId).toSet();
    return data.appointments
        .where(
          (item) =>
              item.status.toLowerCase() == 'completed' &&
              item.clinicId.isNotEmpty &&
              !reviewedClinics.contains(item.clinicId),
        )
        .toList();
  }

  List<OwnerAppointment> _completedAppointments(OwnerHomeData data) {
    return data.appointments
        .where((item) => item.status.toLowerCase() == 'completed')
        .toList();
  }

  List<OwnerAppointment> _filterAppointments(
    OwnerHomeData data,
    List<OwnerAppointment> appointments,
  ) {
    final query = _search.text.trim().toLowerCase();
    if (query.isEmpty) return appointments;
    return appointments.where((appointment) {
      return _petName(data, appointment.petId).toLowerCase().contains(query) ||
          _clinicName(appointment.clinicId).toLowerCase().contains(query) ||
          appointment.appointmentType.toLowerCase().contains(query);
    }).toList();
  }

  double? get _averageRating {
    if (_reviews.isEmpty) return null;
    final sum = _reviews.fold<int>(0, (total, item) => total + item.rating);
    return (sum / _reviews.length * 10).round() / 10;
  }

  String _clinicName(String clinicId) {
    for (final clinic in _clinics) {
      if (clinic.clinicId == clinicId) return clinic.clinicName;
    }
    if (clinicId.length <= 8) return clinicId;
    return 'Phòng khám ${clinicId.substring(0, 8)}';
  }

  String _petName(OwnerHomeData data, String petId) {
    for (final pet in data.pets) {
      if (pet.petId == petId) return pet.name;
    }
    return 'Thú cưng';
  }

  Future<void> _openReviewSheet(OwnerAppointment appointment) async {
    final refreshHome = OwnerScope.of(context).onRefresh;
    final changed = await showOwnerActionSheet<bool>(
      context: context,
      child: _CreateClinicReviewSheet(
        appointment: appointment,
        clinicName: _clinicName(appointment.clinicId),
      ),
    );
    if (changed == true) {
      await refreshHome();
      await _load();
    }
  }

  @override
  Widget build(BuildContext context) {
    final data = OwnerScope.of(context).data;
    final eligible = _eligibleAppointments(data);
    final filteredEligible = _filterAppointments(data, eligible);
    final completed = _completedAppointments(data);
    final averageRating = _averageRating;
    return _OwnerSecondaryScaffold(
      title: 'Đánh giá phòng khám',
      child: OwnerScrollView(
        onRefresh: _load,
        children: [
          PageHeader(
            eyebrow: 'Sau buổi khám',
            title: 'Đánh giá phòng khám',
            subtitle:
                'Gửi phản hồi cho phòng khám sau lịch hẹn đã hoàn thành. Mobile sẽ tự khóa khi API deploy chưa sẵn sàng.',
            trailingIcon: Icons.refresh_rounded,
            trailingLabel: 'Tải lại',
            onAction: _loading ? null : _load,
          ),
          const SizedBox(height: 14),
          if (_loading)
            const SurfaceCard(child: Center(child: CircularProgressIndicator()))
          else if (_apiMissing)
            _ReviewApiBlockedCard(onRetry: _load)
          else if (_error != null)
            SurfaceCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ErrorBanner(message: _error.toString()),
                  const SizedBox(height: 12),
                  SoftButton(
                    label: 'Thử lại',
                    icon: Icons.refresh_rounded,
                    onTap: _load,
                  ),
                ],
              ),
            )
          else ...[
            Row(
              children: [
                Expanded(
                  child: _ReviewMetricCard(
                    label: 'Đã gửi',
                    value: '${_reviews.length}',
                    icon: Icons.rate_review_rounded,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _ReviewMetricCard(
                    label: 'Điểm TB',
                    value: averageRating == null ? '-' : '$averageRating',
                    icon: Icons.star_rounded,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _ReviewMetricCard(
                    label: 'Đủ điều kiện',
                    value: '${eligible.length}',
                    icon: Icons.assignment_turned_in_rounded,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            SurfaceCard(
              padding: const EdgeInsets.all(14),
              child: TextField(
                controller: _search,
                onChanged: (_) => setState(() {}),
                decoration: sheetInputDecoration(
                  label: 'Tìm theo pet, phòng khám hoặc loại lịch',
                  icon: Icons.search_rounded,
                ),
              ),
            ),
            const SizedBox(height: 14),
            SectionCard(
              title: '${filteredEligible.length} lượt khám có thể đánh giá',
              subtitle:
                  'Chỉ hiển thị lịch Completed chưa review clinic. Tổng Completed: ${completed.length}.',
              child: filteredEligible.isEmpty
                  ? const EmptyOwnerState(
                      icon: Icons.rate_review_outlined,
                      title: 'Chưa có lượt khám phù hợp',
                      message:
                          'Hoàn thành một lịch khám mới, chọn clinic chưa từng đánh giá hoặc đổi từ khóa tìm kiếm.',
                      compact: true,
                    )
                  : Column(
                      children: [
                        for (
                          var index = 0;
                          index < filteredEligible.length;
                          index++
                        )
                          _ReviewEligibleAppointmentTile(
                            appointment: filteredEligible[index],
                            petName: _petName(
                              data,
                              filteredEligible[index].petId,
                            ),
                            clinicName: _clinicName(
                              filteredEligible[index].clinicId,
                            ),
                            onTap: () =>
                                _openReviewSheet(filteredEligible[index]),
                            showDivider: index != filteredEligible.length - 1,
                          ),
                      ],
                    ),
            ),
            const SizedBox(height: 14),
            SectionCard(
              title: 'Đã gửi',
              subtitle: 'Review của owner đang đăng nhập.',
              child: _reviews.isEmpty
                  ? const EmptyOwnerState(
                      icon: Icons.star_border_rounded,
                      title: 'Chưa có đánh giá',
                      message:
                          'Khi API review đã deploy và bạn gửi phản hồi, lịch sử sẽ xuất hiện tại đây.',
                      compact: true,
                    )
                  : Column(
                      children: [
                        for (var index = 0; index < _reviews.length; index++)
                          _OwnerClinicReviewTile(
                            review: _reviews[index],
                            clinicName: _clinicName(_reviews[index].clinicId),
                            showDivider: index != _reviews.length - 1,
                          ),
                      ],
                    ),
            ),
          ],
        ],
      ),
    );
  }
}

class _ReviewMetricCard extends StatelessWidget {
  const _ReviewMetricCard({
    required this.label,
    required this.value,
    required this.icon,
  });

  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return SurfaceCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: AppColors.primaryHover),
          const SizedBox(height: 10),
          Text(
            value,
            style: Theme.of(
              context,
            ).textTheme.headlineMedium?.copyWith(fontSize: 22, height: 1),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: AppColors.textSubtle,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

class _ReviewApiBlockedCard extends StatelessWidget {
  const _ReviewApiBlockedCard({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return SurfaceCard(
      padding: const EdgeInsets.all(22),
      child: Column(
        children: [
          const IconBubble(
            icon: Icons.lock_clock_rounded,
            background: AppColors.warningSoft,
            foreground: AppColors.warning,
          ),
          const SizedBox(height: 14),
          Text(
            'API review chưa deploy',
            style: Theme.of(context).textTheme.headlineMedium,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 10),
          const StatusChip(
            label: 'Đang phát triển',
            color: AppColors.warning,
            background: AppColors.warningSoft,
          ),
          const SizedBox(height: 14),
          Text(
            'Source backend đã có ClinicReviewController, nhưng domain deploy hiện trả 404 cho /api/clinic-reviews. Mobile đã chuẩn bị UI và repository, submit sẽ tự mở khi route được deploy.',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 18),
          SoftButton(
            label: 'Kiểm tra lại API',
            icon: Icons.refresh_rounded,
            onTap: onRetry,
          ),
        ],
      ),
    );
  }
}

class _ReviewEligibleAppointmentTile extends StatelessWidget {
  const _ReviewEligibleAppointmentTile({
    required this.appointment,
    required this.petName,
    required this.clinicName,
    required this.onTap,
    required this.showDivider,
  });

  final OwnerAppointment appointment;
  final String petName;
  final String clinicName;
  final VoidCallback onTap;
  final bool showDivider;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        ListTile(
          contentPadding: EdgeInsets.zero,
          leading: const IconBubble(icon: Icons.rate_review_rounded),
          title: Text(clinicName),
          subtitle: Text(
            '$petName • ${formatDateOnly(appointment.date ?? DateTime.now())}',
          ),
          trailing: FilledButton.tonal(
            onPressed: onTap,
            child: const Text('Đánh giá'),
          ),
        ),
        if (showDivider) const Divider(height: 1),
      ],
    );
  }
}

class _OwnerClinicReviewTile extends StatelessWidget {
  const _OwnerClinicReviewTile({
    required this.review,
    required this.clinicName,
    required this.showDivider,
  });

  final OwnerClinicReview review;
  final String clinicName;
  final bool showDivider;

  @override
  Widget build(BuildContext context) {
    final (color, background) = appointmentStatusStyle(review.status);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ListTile(
          contentPadding: EdgeInsets.zero,
          leading: const IconBubble(icon: Icons.star_rounded),
          title: Text(clinicName),
          subtitle: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 4),
              Text(_stars(review.rating)),
              const SizedBox(height: 4),
              Text(review.reviewContent),
              const SizedBox(height: 4),
              Text(formatDateTime(review.createdDate)),
            ],
          ),
          trailing: StatusChip(
            label: review.status,
            color: color,
            background: background,
          ),
        ),
        if (showDivider) const Divider(height: 1),
      ],
    );
  }

  String _stars(int rating) {
    final safeRating = rating.clamp(1, 5);
    return '${List.filled(safeRating, '★').join()}'
        '${List.filled(5 - safeRating, '☆').join()}';
  }
}

class _CreateClinicReviewSheet extends StatefulWidget {
  const _CreateClinicReviewSheet({
    required this.appointment,
    required this.clinicName,
  });

  final OwnerAppointment appointment;
  final String clinicName;

  @override
  State<_CreateClinicReviewSheet> createState() =>
      _CreateClinicReviewSheetState();
}

class _CreateClinicReviewSheetState extends State<_CreateClinicReviewSheet> {
  final _content = TextEditingController();
  int _rating = 0;
  bool _saving = false;
  String? _error;

  @override
  void dispose() {
    _content.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final text = _content.text.trim();
    if (_rating < 1) {
      setState(() => _error = 'Vui lòng chọn số sao đánh giá.');
      return;
    }
    if (text.isEmpty) {
      setState(() => _error = 'Vui lòng nhập nội dung đánh giá.');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await OwnerScope.of(context).repository.createClinicReview(
        clinicId: widget.appointment.clinicId,
        appointmentId: widget.appointment.appointmentId,
        rating: _rating,
        reviewContent: text,
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
    final activeLabel = const [
      '',
      'Tệ',
      'Chưa tốt',
      'Bình thường',
      'Tốt',
      'Tuyệt vời',
    ][_rating];
    return OwnerSheetFrame(
      title: 'Gửi đánh giá',
      subtitle: widget.clinicName,
      icon: Icons.star_rounded,
      error: _error,
      children: [
        Text('Mức hài lòng', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          children: [
            for (var rating = 1; rating <= 5; rating++)
              ChoiceChip(
                selected: _rating == rating,
                label: Text('$rating ★'),
                onSelected: _saving
                    ? null
                    : (_) => setState(() => _rating = rating),
              ),
          ],
        ),
        const SizedBox(height: 8),
        Text(
          _rating == 0 ? 'Chạm để chọn sao' : activeLabel,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: AppColors.textSubtle,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: _content,
          enabled: !_saving,
          maxLines: 4,
          maxLength: 1000,
          decoration: sheetInputDecoration(
            label: 'Nhận xét',
            icon: Icons.notes_rounded,
          ),
        ),
        const SizedBox(height: 16),
        PrimaryButton(
          label: _saving ? 'Đang gửi...' : 'Gửi đánh giá',
          icon: Icons.send_rounded,
          onTap: _saving ? null : _submit,
        ),
      ],
    );
  }
}
