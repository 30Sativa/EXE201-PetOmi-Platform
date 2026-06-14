import 'package:flutter/material.dart';

import 'main.dart';
import 'models/owner_models.dart';
import 'services/owner_repository.dart';

/// Màn hình chi tiết một thú cưng, dựng theo web FE OwnerPetDetailPage
/// với 7 tab: Tổng quan, Sức khỏe, Cân nặng, Hồ sơ y tế, Ảnh, Chia sẻ, Nhắc nhở.
class PetDetailPage extends StatefulWidget {
  const PetDetailPage({
    required this.petId,
    required this.repository,
    required this.onChanged,
    this.initialPet,
    super.key,
  });

  final String petId;
  final OwnerRepository repository;

  /// Gọi khi có thay đổi cần làm mới dashboard (xóa pet, thêm dữ liệu...).
  final Future<void> Function() onChanged;

  /// Pet đã có sẵn từ danh sách — dùng hiển thị ngay trong lúc tải chi tiết.
  final OwnerPet? initialPet;

  @override
  State<PetDetailPage> createState() => _PetDetailPageState();
}

enum _PetTab {
  overview('Tổng quan'),
  health('Sức khỏe'),
  weight('Cân nặng'),
  medical('Hồ sơ y tế'),
  photos('Ảnh'),
  sharing('Chia sẻ'),
  reminders('Nhắc nhở');

  const _PetTab(this.label);
  final String label;
}

class _PetDetailPageState extends State<PetDetailPage> {
  _PetTab _tab = _PetTab.overview;

  OwnerPet? _pet;
  PetHealthProfile? _health;
  List<PetWeightLog> _weightLogs = const [];

  // Dữ liệu tải lười theo tab.
  List<PetMedicalRecord>? _medicalRecords;
  List<PetPhoto>? _photos;
  List<PetUserAccess>? _access;
  List<OwnerReminder>? _reminders;

  bool _loadingCore = true;
  bool _loadingTab = false;
  Object? _error;

  OwnerRepository get _repo => widget.repository;

  @override
  void initState() {
    super.initState();
    _pet = widget.initialPet;
    _loadCore();
  }

  Future<void> _loadCore() async {
    setState(() {
      _loadingCore = true;
      _error = null;
    });
    try {
      final results = await Future.wait<dynamic>([
        _repo.getPetById(widget.petId),
        _repo.getPetHealthProfile(widget.petId),
        _repo.getPetWeightLogs(widget.petId),
      ]);
      if (!mounted) return;
      setState(() {
        _pet = results[0] as OwnerPet;
        _health = results[1] as PetHealthProfile?;
        _weightLogs = results[2] as List<PetWeightLog>;
        _loadingCore = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error;
        _loadingCore = false;
      });
    }
  }

  Future<void> _selectTab(_PetTab tab) async {
    setState(() => _tab = tab);
    // Tải dữ liệu của tab nếu chưa có.
    final needsLoad =
        (tab == _PetTab.medical && _medicalRecords == null) ||
        (tab == _PetTab.photos && _photos == null) ||
        (tab == _PetTab.sharing && _access == null) ||
        (tab == _PetTab.reminders && _reminders == null);
    if (!needsLoad) return;

    setState(() => _loadingTab = true);
    try {
      switch (tab) {
        case _PetTab.medical:
          final data = await _repo.getPetMedicalRecords(widget.petId);
          if (mounted) setState(() => _medicalRecords = data);
        case _PetTab.photos:
          final data = await _repo.getPetPhotos(widget.petId);
          if (mounted) setState(() => _photos = data);
        case _PetTab.sharing:
          final data = await _repo.getPetAccess(widget.petId);
          if (mounted) setState(() => _access = data);
        case _PetTab.reminders:
          final data = await _repo.getPetReminders(widget.petId);
          if (mounted) setState(() => _reminders = data);
        default:
          break;
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Không tải được dữ liệu tab: $error')),
        );
      }
    } finally {
      if (mounted) setState(() => _loadingTab = false);
    }
  }

  Future<void> _refreshTab() async {
    switch (_tab) {
      case _PetTab.medical:
        _medicalRecords = null;
      case _PetTab.photos:
        _photos = null;
      case _PetTab.sharing:
        _access = null;
      case _PetTab.reminders:
        _reminders = null;
      default:
        break;
    }
    await _loadCore();
    await _selectTab(_tab);
  }

  Future<void> _confirmDelete() async {
    final pet = _pet;
    if (pet == null) return;
    final navigator = Navigator.of(context);
    final messenger = ScaffoldMessenger.of(context);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text('Xóa ${pet.name}?'),
        content: const Text(
          'Hồ sơ thú cưng sẽ bị xóa mềm và có thể khôi phục sau.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Đóng'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: AppColors.danger),
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: const Text('Xóa'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await _repo.deletePet(pet.petId);
      await widget.onChanged();
      if (!mounted) return;
      navigator.pop();
      messenger.showSnackBar(
        SnackBar(content: Text('Đã xóa hồ sơ ${pet.name}.')),
      );
    } catch (error) {
      messenger.showSnackBar(SnackBar(content: Text(error.toString())));
    }
  }

  Future<void> _addWeight() async {
    final created = await showWeightLogSheet(
      context: context,
      repository: _repo,
      petId: widget.petId,
      lastWeight: _weightLogs.isEmpty ? null : _weightLogs.first.weightKg,
    );
    if (created == true) {
      await widget.onChanged();
      _weightLogs = await _repo.getPetWeightLogs(widget.petId);
      _health = await _repo.getPetHealthProfile(widget.petId);
      if (mounted) setState(() {});
    }
  }

  @override
  Widget build(BuildContext context) {
    final pet = _pet;
    return Scaffold(
      body: DecoratedGradient(
        child: SafeArea(
          child: _loadingCore && pet == null
              ? const Center(
                  child: CircularProgressIndicator(color: AppColors.primary),
                )
              : pet == null
              ? _buildError()
              : Column(
                  children: [
                    _buildTopBar(pet),
                    Expanded(
                      child: RefreshIndicator(
                        color: AppColors.primary,
                        onRefresh: _refreshTab,
                        child: ListView(
                          physics: const AlwaysScrollableScrollPhysics(
                            parent: BouncingScrollPhysics(),
                          ),
                          padding: const EdgeInsets.fromLTRB(18, 4, 18, 28),
                          children: [
                            _PetHero(pet: pet),
                            const SizedBox(height: 14),
                            _TabBar(
                              tabs: _PetTab.values,
                              selected: _tab,
                              onSelect: _selectTab,
                            ),
                            const SizedBox(height: 14),
                            _buildTabContent(pet),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
        ),
      ),
    );
  }

  Widget _buildError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(22),
        child: SurfaceCard(
          radius: 28,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.error_outline_rounded,
                color: AppColors.danger,
                size: 40,
              ),
              const SizedBox(height: 12),
              Text(
                'Không tải được hồ sơ thú cưng',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              Text(
                _error?.toString() ?? 'Lỗi không xác định.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: PrimaryButton(
                      label: 'Thử lại',
                      icon: Icons.refresh_rounded,
                      onTap: _loadCore,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: SoftButton(
                      label: 'Quay lại',
                      icon: Icons.arrow_back_rounded,
                      onTap: () => Navigator.of(context).pop(),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTopBar(OwnerPet pet) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(14, 8, 14, 4),
      child: Row(
        children: [
          IconButton.filledTonal(
            style: IconButton.styleFrom(
              backgroundColor: AppColors.surface,
              foregroundColor: AppColors.text,
            ),
            onPressed: () => Navigator.of(context).pop(),
            icon: const Icon(Icons.arrow_back_rounded),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              pet.name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.titleLarge,
            ),
          ),
          IconButton.filledTonal(
            tooltip: 'Xóa',
            style: IconButton.styleFrom(
              backgroundColor: AppColors.dangerSoft,
              foregroundColor: AppColors.danger,
            ),
            onPressed: _confirmDelete,
            icon: const Icon(Icons.delete_outline_rounded),
          ),
        ],
      ),
    );
  }

  Widget _buildTabContent(OwnerPet pet) {
    if (_loadingTab) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 40),
        child: Center(child: CircularProgressIndicator(color: AppColors.primary)),
      );
    }
    switch (_tab) {
      case _PetTab.overview:
        return _OverviewTab(
          pet: pet,
          health: _health,
          weightLogs: _weightLogs,
        );
      case _PetTab.health:
        return _HealthTab(health: _health, weightLogs: _weightLogs);
      case _PetTab.weight:
        return _WeightTab(logs: _weightLogs, onAdd: _addWeight);
      case _PetTab.medical:
        return _MedicalTab(records: _medicalRecords ?? const []);
      case _PetTab.photos:
        return _PhotosTab(
          photos: _photos ?? const [],
          onSetAvatar: (photoId) async {
            try {
              await _repo.setPetAvatar(petId: widget.petId, photoId: photoId);
              await widget.onChanged();
              _photos = await _repo.getPetPhotos(widget.petId);
              _pet = await _repo.getPetById(widget.petId);
              if (mounted) {
                setState(() {});
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Đã đặt ảnh đại diện.')),
                );
              }
            } catch (error) {
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text(error.toString())),
                );
              }
            }
          },
        );
      case _PetTab.sharing:
        return _SharingTab(
          access: _access ?? const [],
          petName: pet.name,
          onRevoke: (a) => _confirmRevoke(a),
        );
      case _PetTab.reminders:
        return _RemindersTab(
          reminders: _reminders ?? const [],
          onToggle: (id) async {
            await _repo.toggleReminder(id);
            await widget.onChanged();
            _reminders = await _repo.getPetReminders(widget.petId);
            if (mounted) setState(() {});
          },
          onDismiss: (id) async {
            await _repo.dismissReminder(id);
            await widget.onChanged();
            _reminders = await _repo.getPetReminders(widget.petId);
            if (mounted) setState(() {});
          },
        );
    }
  }

  Future<void> _confirmRevoke(PetUserAccess access) async {
    final messenger = ScaffoldMessenger.of(context);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Thu hồi quyền truy cập?'),
        content: const Text('Người dùng sẽ không còn truy cập hồ sơ này.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Đóng'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: AppColors.danger),
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: const Text('Thu hồi'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await _repo.revokePetAccess(
        petId: widget.petId,
        accessId: access.petUserAccessId,
      );
      _access = await _repo.getPetAccess(widget.petId);
      if (mounted) setState(() {});
    } catch (error) {
      messenger.showSnackBar(SnackBar(content: Text(error.toString())));
    }
  }
}

// ==================== HERO ====================

class _PetHero extends StatelessWidget {
  const _PetHero({required this.pet});

  final OwnerPet pet;

  @override
  Widget build(BuildContext context) {
    final age = petAgeLabel(pet.dateOfBirth);
    return SurfaceCard(
      radius: 28,
      padding: const EdgeInsets.all(16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          PetOmiAvatar(
            label: pet.initials,
            icon: pet.species.toLowerCase() == 'cat'
                ? Icons.cruelty_free_rounded
                : Icons.pets_rounded,
            size: 64,
            imageUrl: pet.avatarUrl,
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        pet.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.headlineMedium
                            ?.copyWith(fontSize: 22),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(pet.speciesEmoji, style: const TextStyle(fontSize: 20)),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  '${pet.speciesLabel}${pet.breed != null ? ' · ${pet.breed}' : ''}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    if (pet.gender != null) _HeroTag(text: pet.genderLabel),
                    if (age != null) _HeroTag(text: age),
                    if (pet.isBirthDateEstimated)
                      const _HeroTag(
                        text: 'Tuổi ước lượng',
                        color: AppColors.warning,
                        background: AppColors.warningSoft,
                      ),
                    if (pet.isNeutered != null && pet.isNeutered != 'Unknown')
                      _HeroTag(
                        text: pet.neuteredLabel,
                        color: AppColors.success,
                        background: AppColors.successSoft,
                      ),
                    if (pet.color != null) _HeroTag(text: pet.color!),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _HeroTag extends StatelessWidget {
  const _HeroTag({
    required this.text,
    this.color = AppColors.textMuted,
    this.background = AppColors.surfaceMuted,
  });

  final String text;
  final Color color;
  final Color background;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

// ==================== TAB BAR ====================

class _TabBar extends StatelessWidget {
  const _TabBar({
    required this.tabs,
    required this.selected,
    required this.onSelect,
  });

  final List<_PetTab> tabs;
  final _PetTab selected;
  final ValueChanged<_PetTab> onSelect;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 40,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: tabs.length,
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final tab = tabs[index];
          final active = tab == selected;
          return GestureDetector(
            onTap: () => onSelect(tab),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 160),
              padding: const EdgeInsets.symmetric(horizontal: 16),
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: active ? AppColors.primary : AppColors.surface,
                borderRadius: BorderRadius.circular(999),
                border: Border.all(
                  color: active ? AppColors.primary : AppColors.border,
                ),
              ),
              child: Text(
                tab.label,
                style: TextStyle(
                  color: active ? Colors.white : AppColors.textMuted,
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

// ==================== OVERVIEW TAB ====================

class _OverviewTab extends StatelessWidget {
  const _OverviewTab({
    required this.pet,
    required this.health,
    required this.weightLogs,
  });

  final OwnerPet pet;
  final PetHealthProfile? health;
  final List<PetWeightLog> weightLogs;

  @override
  Widget build(BuildContext context) {
    final latestWeight = weightLogs.isEmpty ? null : weightLogs.first.weightKg;
    final age = petAgeLabel(pet.dateOfBirth);
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _OverviewMetric(
                icon: Icons.cake_rounded,
                label: 'Tuổi',
                value: age ?? 'Chưa rõ',
                note: petFormatDate(pet.dateOfBirth),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _OverviewMetric(
                icon: Icons.monitor_weight_rounded,
                label: 'Cân nặng',
                value: latestWeight != null ? '$latestWeight kg' : 'Chưa ghi',
                note: '${weightLogs.length} lần',
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _OverviewMetric(
                icon: Icons.favorite_rounded,
                label: 'Sức khỏe',
                value: health != null ? 'Đã có' : 'Chưa có',
                note: health != null
                    ? petFormatDate(health!.updatedAt)
                    : 'hồ sơ',
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        SectionCard(
          title: 'Hồ sơ thú cưng',
          subtitle: 'Thông tin nhận diện và chăm sóc thường dùng.',
          child: Column(
            children: [
              InfoRow(label: 'Loài', value: pet.speciesLabel),
              InfoRow(label: 'Giống', value: pet.breed ?? '—'),
              InfoRow(label: 'Giới tính', value: pet.genderLabel),
              InfoRow(label: 'Ngày sinh', value: petFormatDate(pet.dateOfBirth)),
              InfoRow(label: 'Màu lông', value: health?.color ?? pet.color ?? '—'),
              InfoRow(label: 'Triệt sản', value: pet.neuteredLabel),
              InfoRow(label: 'Tạo hồ sơ', value: petFormatDate(pet.createdAt)),
            ],
          ),
        ),
        const SizedBox(height: 14),
        SectionCard(
          title: 'Theo dõi sức khỏe',
          subtitle: 'Dữ liệu cần nhìn nhanh trước khi chăm sóc.',
          child: health != null
              ? Column(
                  children: [
                    InfoRow(
                      label: 'Dị ứng',
                      value: health!.allergies ?? 'Chưa có thông tin',
                    ),
                    InfoRow(
                      label: 'Bệnh mãn tính',
                      value: health!.chronicConditions ?? 'Chưa có thông tin',
                    ),
                    InfoRow(
                      label: 'Microchip',
                      value: health!.microchipNumber ?? 'Chưa gắn',
                    ),
                  ],
                )
              : const EmptyOwnerState(
                  icon: Icons.favorite_border_rounded,
                  title: 'Chưa có hồ sơ sức khỏe',
                  message:
                      'Tạo hồ sơ sức khỏe để lưu cân nặng, dị ứng, bệnh mãn tính và microchip.',
                  compact: true,
                ),
        ),
      ],
    );
  }
}

class _OverviewMetric extends StatelessWidget {
  const _OverviewMetric({
    required this.icon,
    required this.label,
    required this.value,
    required this.note,
  });

  final IconData icon;
  final String label;
  final String value;
  final String note;

  @override
  Widget build(BuildContext context) {
    return SurfaceCard(
      radius: 20,
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          IconBubble(icon: icon),
          const SizedBox(height: 10),
          Text(
            label.toUpperCase(),
            style: const TextStyle(
              color: AppColors.textSubtle,
              fontSize: 10,
              fontWeight: FontWeight.w900,
              letterSpacing: 0.6,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(fontSize: 15),
          ),
          const SizedBox(height: 2),
          Text(
            note,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              fontSize: 10,
              color: AppColors.textSubtle,
            ),
          ),
        ],
      ),
    );
  }
}

// ==================== HEALTH TAB ====================

class _HealthTab extends StatelessWidget {
  const _HealthTab({required this.health, required this.weightLogs});

  final PetHealthProfile? health;
  final List<PetWeightLog> weightLogs;

  @override
  Widget build(BuildContext context) {
    final profile = health;
    final latestWeight = weightLogs.isEmpty ? null : weightLogs.first.weightKg;
    return SectionCard(
      title: 'Hồ sơ sức khỏe',
      subtitle: 'Tổng hợp tình trạng sức khỏe của thú cưng.',
      child: profile == null
          ? const EmptyOwnerState(
              icon: Icons.favorite_border_rounded,
              title: 'Chưa có hồ sơ sức khỏe',
              message: 'Tạo hồ sơ sức khỏe để theo dõi tình trạng của thú cưng.',
              compact: true,
            )
          : Column(
              children: [
                InfoRow(
                  label: 'Cân nặng hiện tại',
                  value: latestWeight != null
                      ? '$latestWeight kg'
                      : (profile.currentWeightKg != null
                            ? '${profile.currentWeightKg} kg'
                            : '—'),
                ),
                InfoRow(label: 'Màu lông', value: profile.color ?? '—'),
                InfoRow(label: 'Triệt sản', value: profile.neuteredLabel),
                InfoRow(
                  label: 'Microchip',
                  value: profile.microchipNumber ?? '—',
                ),
                InfoRow(
                  label: 'Dị ứng',
                  value: profile.allergies ?? 'Không có thông tin',
                ),
                InfoRow(
                  label: 'Bệnh mãn tính',
                  value: profile.chronicConditions ?? 'Không có thông tin',
                ),
              ],
            ),
    );
  }
}

// ==================== WEIGHT TAB ====================

class _WeightTab extends StatelessWidget {
  const _WeightTab({required this.logs, required this.onAdd});

  final List<PetWeightLog> logs;
  final VoidCallback onAdd;

  @override
  Widget build(BuildContext context) {
    final latest = logs.isEmpty ? null : logs.first.weightKg;
    final oldest = logs.length > 1 ? logs.last.weightKg : null;
    final change = (latest != null && oldest != null)
        ? (latest - oldest)
        : null;
    return Column(
      children: [
        if (latest != null)
          Row(
            children: [
              Expanded(
                child: _WeightStat(label: 'Hiện tại', value: '$latest kg'),
              ),
              if (change != null) ...[
                const SizedBox(width: 10),
                Expanded(
                  child: _WeightStat(
                    label: 'Thay đổi',
                    value:
                        '${change > 0 ? '+' : ''}${change.toStringAsFixed(1)} kg',
                    color: change > 0 ? AppColors.warning : AppColors.success,
                  ),
                ),
              ],
              const SizedBox(width: 10),
              Expanded(
                child: _WeightStat(label: 'Số lần', value: '${logs.length}'),
              ),
            ],
          ),
        if (latest != null) const SizedBox(height: 14),
        SectionCard(
          title: 'Lịch sử cân nặng',
          subtitle: '${logs.length} bản ghi.',
          action: FilledButton.tonalIcon(
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.primarySoft,
              foregroundColor: AppColors.primaryHover,
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
            ),
            onPressed: onAdd,
            icon: const Icon(Icons.add_rounded, size: 18),
            label: const Text('Ghi nhận'),
          ),
          child: logs.isEmpty
              ? const EmptyOwnerState(
                  icon: Icons.monitor_weight_rounded,
                  title: 'Chưa có bản ghi cân nặng',
                  message:
                      'Ghi nhận cân nặng để theo dõi sự phát triển của thú cưng.',
                  compact: true,
                )
              : Column(
                  children: logs.map((log) {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceMuted.withValues(alpha: 0.6),
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Row(
                          children: [
                            const IconBubble(icon: Icons.scale_rounded),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    '${log.weightKg} kg',
                                    style: Theme.of(
                                      context,
                                    ).textTheme.titleMedium,
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    '${petFormatDate(log.measuredAt)}${log.note != null ? ' • ${log.note}' : ''}',
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: Theme.of(context).textTheme.bodyMedium
                                        ?.copyWith(fontSize: 12),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ),
        ),
      ],
    );
  }
}

class _WeightStat extends StatelessWidget {
  const _WeightStat({
    required this.label,
    required this.value,
    this.color = AppColors.text,
  });

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return SurfaceCard(
      radius: 18,
      padding: const EdgeInsets.all(12),
      child: Column(
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              fontSize: 11,
              color: AppColors.textSubtle,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(
              context,
            ).textTheme.headlineMedium?.copyWith(fontSize: 18, color: color),
          ),
        ],
      ),
    );
  }
}

// ==================== MEDICAL TAB ====================

class _MedicalTab extends StatefulWidget {
  const _MedicalTab({required this.records});

  final List<PetMedicalRecord> records;

  @override
  State<_MedicalTab> createState() => _MedicalTabState();
}

class _MedicalTabState extends State<_MedicalTab> {
  String _filter = 'all';

  static const _types = <(String, String)>[
    ('all', 'Tất cả'),
    ('Vaccination', 'Tiêm phòng'),
    ('Checkup', 'Khám định kỳ'),
    ('Surgery', 'Phẫu thuật'),
    ('Illness', 'Bệnh lý'),
    ('Medication', 'Thuốc'),
    ('LabTest', 'Xét nghiệm'),
    ('Dental', 'Răng miệng'),
    ('Grooming', 'Vệ sinh'),
  ];

  @override
  Widget build(BuildContext context) {
    final filtered = widget.records
        .where((r) => _filter == 'all' || r.recordType == _filter)
        .toList();
    return Column(
      children: [
        SizedBox(
          height: 38,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: _types.length,
            separatorBuilder: (_, _) => const SizedBox(width: 8),
            itemBuilder: (context, index) {
              final type = _types[index];
              final active = type.$1 == _filter;
              return GestureDetector(
                onTap: () => setState(() => _filter = type.$1),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: active ? AppColors.primary : AppColors.surface,
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(
                      color: active ? AppColors.primary : AppColors.border,
                    ),
                  ),
                  child: Text(
                    type.$2,
                    style: TextStyle(
                      color: active ? Colors.white : AppColors.textMuted,
                      fontWeight: FontWeight.w800,
                      fontSize: 12,
                    ),
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 14),
        SectionCard(
          title: 'Hồ sơ y tế',
          subtitle: 'Lịch sử khám, tiêm phòng và điều trị.',
          child: filtered.isEmpty
              ? const EmptyOwnerState(
                  icon: Icons.medical_information_rounded,
                  title: 'Không có hồ sơ y tế',
                  message: 'Chưa có bản ghi nào cho bộ lọc này.',
                  compact: true,
                )
              : Column(
                  children: filtered.map((r) {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceMuted.withValues(alpha: 0.6),
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    r.title,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: Theme.of(
                                      context,
                                    ).textTheme.titleMedium,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                StatusChip(
                                  label: r.recordType,
                                  color: AppColors.primaryHover,
                                  background: AppColors.primarySoft,
                                ),
                              ],
                            ),
                            if (r.description != null) ...[
                              const SizedBox(height: 6),
                              Text(
                                r.description!,
                                style: Theme.of(context).textTheme.bodyMedium,
                              ),
                            ],
                            const SizedBox(height: 8),
                            Wrap(
                              spacing: 12,
                              runSpacing: 4,
                              children: [
                                _MetaText(petFormatDate(r.recordDate)),
                                if (r.clinicName != null)
                                  _MetaText(r.clinicName!),
                                if (r.vetName != null)
                                  _MetaText('BS. ${r.vetName}'),
                                if (r.medicationName != null)
                                  _MetaText('Thuốc: ${r.medicationName}'),
                                if (r.dosage != null)
                                  _MetaText('Liều: ${r.dosage}'),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ),
        ),
      ],
    );
  }
}

class _MetaText extends StatelessWidget {
  const _MetaText(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: Theme.of(
        context,
      ).textTheme.bodyMedium?.copyWith(fontSize: 11, color: AppColors.textSubtle),
    );
  }
}

// ==================== PHOTOS TAB ====================

class _PhotosTab extends StatelessWidget {
  const _PhotosTab({required this.photos, required this.onSetAvatar});

  final List<PetPhoto> photos;
  final ValueChanged<String> onSetAvatar;

  @override
  Widget build(BuildContext context) {
    return SectionCard(
      title: 'Thư viện ảnh',
      subtitle: '${photos.length} ảnh.',
      child: photos.isEmpty
          ? const EmptyOwnerState(
              icon: Icons.photo_library_rounded,
              title: 'Chưa có ảnh nào',
              message: 'Chưa có ảnh nào. Thêm ảnh để lưu giữ khoảnh khắc của bé.',
              compact: true,
            )
          : GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: photos.length,
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
              ),
              itemBuilder: (context, index) {
                final photo = photos[index];
                return ClipRRect(
                  borderRadius: BorderRadius.circular(18),
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      Image.network(
                        photo.imageUrl,
                        fit: BoxFit.cover,
                        errorBuilder: (_, _, _) => Container(
                          color: AppColors.surfaceMuted,
                          child: const Icon(
                            Icons.broken_image_rounded,
                            color: AppColors.textSubtle,
                          ),
                        ),
                      ),
                      if (photo.isAvatar)
                        Positioned(
                          left: 8,
                          top: 8,
                          child: StatusChip(
                            label: 'Avatar',
                            color: Colors.white,
                            background: AppColors.primary,
                          ),
                        )
                      else
                        Positioned(
                          right: 8,
                          top: 8,
                          child: GestureDetector(
                            onTap: () => onSetAvatar(photo.photoId),
                            child: Container(
                              padding: const EdgeInsets.all(6),
                              decoration: const BoxDecoration(
                                color: Colors.white,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                Icons.account_circle_rounded,
                                size: 18,
                                color: AppColors.primaryHover,
                              ),
                            ),
                          ),
                        ),
                      if (photo.caption != null)
                        Positioned(
                          left: 0,
                          right: 0,
                          bottom: 0,
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            color: Colors.black.withValues(alpha: 0.45),
                            child: Text(
                              photo.caption!,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
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

// ==================== SHARING TAB ====================

class _SharingTab extends StatelessWidget {
  const _SharingTab({
    required this.access,
    required this.petName,
    required this.onRevoke,
  });

  final List<PetUserAccess> access;
  final String petName;
  final ValueChanged<PetUserAccess> onRevoke;

  @override
  Widget build(BuildContext context) {
    final activeCount = access.where((a) => !a.isExpired).length;
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _WeightStat(
                label: 'Người được chia sẻ',
                value: '$activeCount',
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _WeightStat(label: 'Quyền', value: 'Viewer · Editor'),
            ),
          ],
        ),
        const SizedBox(height: 14),
        SectionCard(
          title: 'Quản lý chia sẻ $petName',
          subtitle: 'Người dùng đang có quyền truy cập hồ sơ.',
          child: access.isEmpty
              ? EmptyOwnerState(
                  icon: Icons.link_rounded,
                  title: 'Chưa chia sẻ với ai',
                  message:
                      'Chia sẻ quyền truy cập $petName với gia đình hoặc bác sĩ thú y.',
                  compact: true,
                )
              : Column(
                  children: access.map((a) {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceMuted.withValues(alpha: 0.6),
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    a.userId,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: Theme.of(
                                      context,
                                    ).textTheme.titleMedium?.copyWith(fontSize: 14),
                                  ),
                                  const SizedBox(height: 6),
                                  Row(
                                    children: [
                                      StatusChip(
                                        label: a.accessRole,
                                        color: a.accessRole == 'Editor'
                                            ? AppColors.warning
                                            : AppColors.primaryHover,
                                        background: a.accessRole == 'Editor'
                                            ? AppColors.warningSoft
                                            : AppColors.primarySoft,
                                      ),
                                      const SizedBox(width: 6),
                                      StatusChip(
                                        label: a.isExpired
                                            ? 'Hết hạn'
                                            : 'Hoạt động',
                                        color: a.isExpired
                                            ? AppColors.danger
                                            : AppColors.success,
                                        background: a.isExpired
                                            ? AppColors.dangerSoft
                                            : AppColors.successSoft,
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            if (!a.isExpired)
                              IconButton(
                                tooltip: 'Thu hồi',
                                onPressed: () => onRevoke(a),
                                icon: const Icon(
                                  Icons.delete_outline_rounded,
                                  color: AppColors.danger,
                                ),
                              ),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ),
        ),
      ],
    );
  }
}

// ==================== REMINDERS TAB ====================

class _RemindersTab extends StatelessWidget {
  const _RemindersTab({
    required this.reminders,
    required this.onToggle,
    required this.onDismiss,
  });

  final List<OwnerReminder> reminders;
  final Future<void> Function(String) onToggle;
  final Future<void> Function(String) onDismiss;

  @override
  Widget build(BuildContext context) {
    return SectionCard(
      title: 'Nhắc nhở của thú cưng',
      subtitle: '${reminders.length} nhắc nhở liên quan.',
      child: reminders.isEmpty
          ? const EmptyOwnerState(
              icon: Icons.notifications_none_rounded,
              title: 'Chưa có nhắc nhở',
              message:
                  'Tạo nhắc nhở để không bỏ lỡ lịch tiêm phòng, uống thuốc hay tái khám.',
              compact: true,
            )
          : Column(
              children: reminders.map((r) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceMuted.withValues(alpha: 0.6),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Row(
                      children: [
                        IconBubble(
                          icon: reminderIcon(r.reminderType),
                          background: r.isEnabled
                              ? AppColors.primarySoft
                              : AppColors.surfaceMuted,
                          foreground: r.isEnabled
                              ? AppColors.primaryHover
                              : AppColors.textSubtle,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                r.title,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: Theme.of(context).textTheme.titleMedium,
                              ),
                              const SizedBox(height: 2),
                              Text(
                                formatDateTime(r.dueAt),
                                style: Theme.of(context).textTheme.bodyMedium
                                    ?.copyWith(
                                      fontSize: 12,
                                      color: AppColors.textSubtle,
                                    ),
                              ),
                            ],
                          ),
                        ),
                        Switch.adaptive(
                          value: r.isEnabled,
                          activeThumbColor: AppColors.primary,
                          onChanged: (_) => onToggle(r.reminderId),
                        ),
                        IconButton(
                          tooltip: 'Bỏ qua',
                          onPressed: () => onDismiss(r.reminderId),
                          icon: const Icon(Icons.done_all_rounded),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
    );
  }
}

// ==================== WEIGHT LOG SHEET ====================

Future<bool?> showWeightLogSheet({
  required BuildContext context,
  required OwnerRepository repository,
  required String petId,
  double? lastWeight,
}) {
  return showOwnerActionSheet<bool>(
    context: context,
    child: _WeightLogSheet(
      repository: repository,
      petId: petId,
      lastWeight: lastWeight,
    ),
  );
}

class _WeightLogSheet extends StatefulWidget {
  const _WeightLogSheet({
    required this.repository,
    required this.petId,
    this.lastWeight,
  });

  final OwnerRepository repository;
  final String petId;
  final double? lastWeight;

  @override
  State<_WeightLogSheet> createState() => _WeightLogSheetState();
}

class _WeightLogSheetState extends State<_WeightLogSheet> {
  late final TextEditingController _weightController;
  final _noteController = TextEditingController();
  DateTime _measuredAt = DateTime.now();
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _weightController = TextEditingController(
      text: widget.lastWeight?.toString() ?? '',
    );
  }

  @override
  void dispose() {
    _weightController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _measuredAt,
      firstDate: DateTime.now().subtract(const Duration(days: 365 * 5)),
      lastDate: DateTime.now(),
    );
    if (date == null || !mounted) return;
    setState(() => _measuredAt = date);
  }

  Future<void> _submit() async {
    final raw = _weightController.text.trim().replaceAll(',', '.');
    final weight = double.tryParse(raw);
    if (weight == null || weight <= 0) {
      setState(() => _error = 'Nhập cân nặng hợp lệ (kg).');
      return;
    }
    final navigator = Navigator.of(context);
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await widget.repository.createWeightLog(
        petId: widget.petId,
        weightKg: weight,
        measuredAt: _measuredAt,
        note: optionalInput(_noteController),
      );
      if (mounted) navigator.pop(true);
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return OwnerSheetFrame(
      title: 'Ghi nhận cân nặng',
      subtitle: 'Lưu cân nặng mới để theo dõi sự phát triển.',
      icon: Icons.monitor_weight_rounded,
      error: _error,
      children: [
        SheetTextField(
          controller: _weightController,
          label: 'Cân nặng (kg)',
          icon: Icons.scale_rounded,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
        ),
        const SizedBox(height: 12),
        SoftButton(
          label: 'Ngày đo: ${formatDateOnly(_measuredAt)}',
          icon: Icons.calendar_today_rounded,
          onTap: _saving ? null : _pickDate,
        ),
        const SizedBox(height: 12),
        SheetTextField(
          controller: _noteController,
          label: 'Ghi chú (tuỳ chọn)',
          icon: Icons.notes_rounded,
          maxLines: 2,
        ),
        const SizedBox(height: 20),
        PrimaryButton(
          label: _saving ? 'Đang lưu...' : 'Lưu cân nặng',
          icon: Icons.save_rounded,
          onTap: _saving ? null : _submit,
        ),
      ],
    );
  }
}

// ==================== HELPERS ====================

String? petAgeLabel(String? dob) {
  if (dob == null || dob.isEmpty) return null;
  final birth = DateTime.tryParse(dob);
  if (birth == null) return null;
  final now = DateTime.now();
  var years = now.year - birth.year;
  var months = now.month - birth.month;
  if (now.day < birth.day) months--;
  final totalMonths = years * 12 + months;
  if (totalMonths < 1) return '< 1 tháng';
  if (totalMonths < 12) return '$totalMonths tháng';
  return '${totalMonths ~/ 12} tuổi';
}

String petFormatDate(String? value) {
  if (value == null || value.isEmpty) return '—';
  final date = DateTime.tryParse(value);
  if (date == null) return value;
  final day = date.day.toString().padLeft(2, '0');
  final month = date.month.toString().padLeft(2, '0');
  return '$day/$month/${date.year}';
}
