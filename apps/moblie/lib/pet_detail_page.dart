import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

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

  Future<bool> _confirmAction(String title, String message) async {
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
                child: const Text('Xác nhận'),
              ),
            ],
          ),
        ) ??
        false;
  }

  Future<void> _editPet() async {
    final pet = _pet;
    if (pet == null) return;
    final changed = await showOwnerActionSheet<bool>(
      context: context,
      child: _EditPetSheet(repository: _repo, pet: pet),
    );
    if (changed == true) {
      await widget.onChanged();
      await _loadCore();
    }
  }

  Future<void> _editHealth() async {
    final changed = await showOwnerActionSheet<bool>(
      context: context,
      child: _HealthProfileSheet(
        repository: _repo,
        petId: widget.petId,
        profile: _health,
      ),
    );
    if (changed == true) {
      _health = await _repo.getPetHealthProfile(widget.petId);
      await widget.onChanged();
      if (mounted) setState(() {});
    }
  }

  Future<void> _deleteWeight(PetWeightLog log) async {
    if (!await _confirmAction(
      'Xóa bản ghi cân nặng?',
      'Bản ghi ${log.weightKg} kg sẽ bị xóa khỏi lịch sử.',
    )) {
      return;
    }
    await _repo.deleteWeightLog(
      petId: widget.petId,
      weightLogId: log.weightLogId,
    );
    _weightLogs = await _repo.getPetWeightLogs(widget.petId);
    await widget.onChanged();
    if (mounted) setState(() {});
  }

  Future<void> _openMedicalSheet([PetMedicalRecord? record]) async {
    final changed = await showOwnerActionSheet<bool>(
      context: context,
      child: _MedicalRecordSheet(
        repository: _repo,
        petId: widget.petId,
        record: record,
      ),
    );
    if (changed == true) {
      _medicalRecords = await _repo.getPetMedicalRecords(widget.petId);
      if (mounted) setState(() {});
    }
  }

  Future<void> _deleteMedical(PetMedicalRecord record) async {
    if (!await _confirmAction(
      'Xóa hồ sơ y tế?',
      'Bản ghi “${record.title}” sẽ bị xóa vĩnh viễn.',
    )) {
      return;
    }
    await _repo.deleteMedicalRecord(
      petId: widget.petId,
      medicalRecordId: record.medicalRecordId,
    );
    _medicalRecords = await _repo.getPetMedicalRecords(widget.petId);
    if (mounted) setState(() {});
  }

  Future<void> _addPhoto() async {
    final changed = await showOwnerActionSheet<bool>(
      context: context,
      child: _PetPhotoSheet(repository: _repo, petId: widget.petId),
    );
    if (changed == true) {
      _photos = await _repo.getPetPhotos(widget.petId);
      _pet = await _repo.getPetById(widget.petId);
      await widget.onChanged();
      if (mounted) setState(() {});
    }
  }

  Future<void> _editPhoto(PetPhoto photo) async {
    final changed = await showOwnerActionSheet<bool>(
      context: context,
      child: _PetPhotoSheet(
        repository: _repo,
        petId: widget.petId,
        photo: photo,
      ),
    );
    if (changed == true) {
      _photos = await _repo.getPetPhotos(widget.petId);
      if (mounted) setState(() {});
    }
  }

  Future<void> _deletePhoto(PetPhoto photo) async {
    if (!await _confirmAction(
      'Xóa ảnh?',
      'Ảnh này sẽ bị xóa khỏi thư viện của thú cưng.',
    )) {
      return;
    }
    await _repo.deletePetPhoto(petId: widget.petId, photoId: photo.photoId);
    _photos = await _repo.getPetPhotos(widget.petId);
    _pet = await _repo.getPetById(widget.petId);
    await widget.onChanged();
    if (mounted) setState(() {});
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
            tooltip: 'Sửa',
            style: IconButton.styleFrom(
              backgroundColor: AppColors.primarySoft,
              foregroundColor: AppColors.primaryHover,
            ),
            onPressed: _editPet,
            icon: const Icon(Icons.edit_rounded),
          ),
          const SizedBox(width: 8),
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
        child: Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
      );
    }
    switch (_tab) {
      case _PetTab.overview:
        return _OverviewTab(pet: pet, health: _health, weightLogs: _weightLogs);
      case _PetTab.health:
        return _HealthTab(
          health: _health,
          weightLogs: _weightLogs,
          onEdit: _editHealth,
        );
      case _PetTab.weight:
        return _WeightTab(
          logs: _weightLogs,
          onAdd: _addWeight,
          onDelete: _deleteWeight,
        );
      case _PetTab.medical:
        return _MedicalTab(
          records: _medicalRecords ?? const [],
          onAdd: () => _openMedicalSheet(),
          onEdit: _openMedicalSheet,
          onDelete: _deleteMedical,
        );
      case _PetTab.photos:
        return _PhotosTab(
          photos: _photos ?? const [],
          onAdd: _addPhoto,
          onEdit: _editPhoto,
          onDelete: _deletePhoto,
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
                ScaffoldMessenger.of(
                  context,
                ).showSnackBar(SnackBar(content: Text(error.toString())));
              }
            }
          },
        );
      case _PetTab.sharing:
        return _SharingTab(
          access: _access ?? const [],
          petName: pet.name,
          onManage: () =>
              openOwnerSharingPage(context, initialPetId: widget.petId),
          onRevoke: (a) => _confirmRevoke(a),
        );
      case _PetTab.reminders:
        return _RemindersTab(
          reminders: _reminders ?? const [],
          onAdd: () async {
            await showCreateReminderSheet(context, petId: widget.petId);
            _reminders = await _repo.getPetReminders(widget.petId);
            if (mounted) setState(() {});
          },
          onPreferences: () => openReminderPreferencesPage(context),
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
                        style: Theme.of(
                          context,
                        ).textTheme.headlineMedium?.copyWith(fontSize: 22),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      pet.speciesEmoji,
                      style: const TextStyle(fontSize: 20),
                    ),
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
              InfoRow(
                label: 'Ngày sinh',
                value: petFormatDate(pet.dateOfBirth),
              ),
              InfoRow(
                label: 'Màu lông',
                value: health?.color ?? pet.color ?? '—',
              ),
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
  const _HealthTab({
    required this.health,
    required this.weightLogs,
    required this.onEdit,
  });

  final PetHealthProfile? health;
  final List<PetWeightLog> weightLogs;
  final VoidCallback onEdit;

  @override
  Widget build(BuildContext context) {
    final profile = health;
    final latestWeight = weightLogs.isEmpty ? null : weightLogs.first.weightKg;
    return SectionCard(
      title: 'Hồ sơ sức khỏe',
      subtitle: 'Tổng hợp tình trạng sức khỏe của thú cưng.',
      action: IconButton(
        tooltip: profile == null ? 'Tạo hồ sơ' : 'Sửa hồ sơ',
        onPressed: onEdit,
        icon: Icon(profile == null ? Icons.add_rounded : Icons.edit_rounded),
      ),
      child: profile == null
          ? const EmptyOwnerState(
              icon: Icons.favorite_border_rounded,
              title: 'Chưa có hồ sơ sức khỏe',
              message:
                  'Tạo hồ sơ sức khỏe để theo dõi tình trạng của thú cưng.',
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
  const _WeightTab({
    required this.logs,
    required this.onAdd,
    required this.onDelete,
  });

  final List<PetWeightLog> logs;
  final VoidCallback onAdd;
  final ValueChanged<PetWeightLog> onDelete;

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
                                    style: Theme.of(context)
                                        .textTheme
                                        .bodyMedium
                                        ?.copyWith(fontSize: 12),
                                  ),
                                ],
                              ),
                            ),
                            IconButton(
                              tooltip: 'Xóa bản ghi',
                              onPressed: () => onDelete(log),
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
  const _MedicalTab({
    required this.records,
    required this.onAdd,
    required this.onEdit,
    required this.onDelete,
  });

  final List<PetMedicalRecord> records;
  final VoidCallback onAdd;
  final ValueChanged<PetMedicalRecord> onEdit;
  final ValueChanged<PetMedicalRecord> onDelete;

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
          action: IconButton(
            tooltip: 'Thêm hồ sơ y tế',
            onPressed: widget.onAdd,
            icon: const Icon(Icons.add_rounded),
          ),
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
                                IconButton(
                                  tooltip: 'Sửa',
                                  onPressed: () => widget.onEdit(r),
                                  icon: const Icon(Icons.edit_rounded),
                                ),
                                IconButton(
                                  tooltip: 'Xóa',
                                  onPressed: () => widget.onDelete(r),
                                  icon: const Icon(
                                    Icons.delete_outline_rounded,
                                    color: AppColors.danger,
                                  ),
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
      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
        fontSize: 11,
        color: AppColors.textSubtle,
      ),
    );
  }
}

// ==================== PHOTOS TAB ====================

class _PhotosTab extends StatelessWidget {
  const _PhotosTab({
    required this.photos,
    required this.onAdd,
    required this.onEdit,
    required this.onDelete,
    required this.onSetAvatar,
  });

  final List<PetPhoto> photos;
  final VoidCallback onAdd;
  final ValueChanged<PetPhoto> onEdit;
  final ValueChanged<PetPhoto> onDelete;
  final ValueChanged<String> onSetAvatar;

  @override
  Widget build(BuildContext context) {
    return SectionCard(
      title: 'Thư viện ảnh',
      subtitle: '${photos.length} ảnh.',
      action: IconButton(
        tooltip: 'Thêm ảnh',
        onPressed: onAdd,
        icon: const Icon(Icons.add_photo_alternate_rounded),
      ),
      child: photos.isEmpty
          ? const EmptyOwnerState(
              icon: Icons.photo_library_rounded,
              title: 'Chưa có ảnh nào',
              message:
                  'Chưa có ảnh nào. Thêm ảnh để lưu giữ khoảnh khắc của bé.',
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
                      Positioned(
                        right: 8,
                        bottom: 8,
                        child: Row(
                          children: [
                            _PhotoAction(
                              icon: Icons.edit_rounded,
                              onTap: () => onEdit(photo),
                            ),
                            const SizedBox(width: 6),
                            _PhotoAction(
                              icon: Icons.delete_outline_rounded,
                              color: AppColors.danger,
                              onTap: () => onDelete(photo),
                            ),
                          ],
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
    required this.onManage,
    required this.onRevoke,
  });

  final List<PetUserAccess> access;
  final String petName;
  final VoidCallback onManage;
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
          action: IconButton(
            tooltip: 'Mở quản lý chia sẻ',
            onPressed: onManage,
            icon: const Icon(Icons.manage_accounts_rounded),
          ),
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
                                    style: Theme.of(context)
                                        .textTheme
                                        .titleMedium
                                        ?.copyWith(fontSize: 14),
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
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: SoftButton(
            label: 'Mời người dùng hoặc tạo mã sức khỏe',
            icon: Icons.share_rounded,
            onTap: onManage,
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
    required this.onAdd,
    required this.onPreferences,
    required this.onToggle,
    required this.onDismiss,
  });

  final List<OwnerReminder> reminders;
  final VoidCallback onAdd;
  final VoidCallback onPreferences;
  final Future<void> Function(String) onToggle;
  final Future<void> Function(String) onDismiss;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SectionCard(
          title: 'Nhắc nhở của thú cưng',
          subtitle: '${reminders.length} nhắc nhở liên quan.',
          action: IconButton(
            tooltip: 'Tạo nhắc nhở',
            onPressed: onAdd,
            icon: const Icon(Icons.add_alert_rounded),
          ),
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
                                    style: Theme.of(
                                      context,
                                    ).textTheme.titleMedium,
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    formatDateTime(r.dueAt),
                                    style: Theme.of(context)
                                        .textTheme
                                        .bodyMedium
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
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: SoftButton(
            label: 'Cài đặt nhắc nhở',
            icon: Icons.tune_rounded,
            onTap: onPreferences,
          ),
        ),
      ],
    );
  }
}

class _PhotoAction extends StatelessWidget {
  const _PhotoAction({
    required this.icon,
    required this.onTap,
    this.color = AppColors.text,
  });

  final IconData icon;
  final VoidCallback onTap;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(6),
        decoration: const BoxDecoration(
          color: Colors.white,
          shape: BoxShape.circle,
        ),
        child: Icon(icon, size: 18, color: color),
      ),
    );
  }
}

// ==================== WEIGHT LOG SHEET ====================

class _EditPetSheet extends StatefulWidget {
  const _EditPetSheet({required this.repository, required this.pet});

  final OwnerRepository repository;
  final OwnerPet pet;

  @override
  State<_EditPetSheet> createState() => _EditPetSheetState();
}

class _EditPetSheetState extends State<_EditPetSheet> {
  late final TextEditingController _name;
  late final TextEditingController _breed;
  late final TextEditingController _color;
  late String _species;
  late String _gender;
  late String _neutered;
  late bool _estimated;
  DateTime? _birthDate;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final pet = widget.pet;
    _name = TextEditingController(text: pet.name);
    _breed = TextEditingController(text: pet.breed ?? '');
    _color = TextEditingController(text: pet.color ?? '');
    _species = pet.species;
    _gender = pet.gender ?? 'Unknown';
    _neutered = pet.isNeutered ?? 'Unknown';
    _estimated = pet.isBirthDateEstimated;
    _birthDate = DateTime.tryParse(pet.dateOfBirth ?? '');
  }

  @override
  void dispose() {
    _name.dispose();
    _breed.dispose();
    _color.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_name.text.trim().isEmpty) {
      setState(() => _error = 'Tên thú cưng không được để trống.');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await widget.repository.updatePet(
        petId: widget.pet.petId,
        name: _name.text.trim(),
        species: _species,
        breed: optionalInput(_breed),
        gender: _gender,
        isNeutered: _neutered,
        dateOfBirth: _birthDate,
        isBirthDateEstimated: _estimated,
        color: optionalInput(_color),
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
      title: 'Sửa hồ sơ thú cưng',
      subtitle: 'Cập nhật thông tin cơ bản của ${widget.pet.name}.',
      icon: Icons.edit_rounded,
      error: _error,
      children: [
        SheetTextField(
          controller: _name,
          label: 'Tên',
          icon: Icons.badge_rounded,
        ),
        const SizedBox(height: 12),
        SheetChoiceField(
          label: 'Loài',
          icon: Icons.category_rounded,
          value: _species,
          options: const [('Dog', 'Chó'), ('Cat', 'Mèo')],
          onChanged: _saving ? null : (v) => setState(() => _species = v),
        ),
        const SizedBox(height: 12),
        SheetChoiceField(
          label: 'Giới tính',
          icon: Icons.transgender_rounded,
          value: _gender,
          options: const [
            ('Unknown', 'Không rõ'),
            ('Male', 'Đực'),
            ('Female', 'Cái'),
          ],
          onChanged: _saving ? null : (v) => setState(() => _gender = v),
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
          onChanged: _saving ? null : (v) => setState(() => _neutered = v),
        ),
        const SizedBox(height: 12),
        SheetTextField(
          controller: _breed,
          label: 'Giống',
          icon: Icons.pets_rounded,
        ),
        const SizedBox(height: 12),
        SheetTextField(
          controller: _color,
          label: 'Màu lông',
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
        PrimaryButton(
          label: _saving ? 'Đang lưu...' : 'Lưu thay đổi',
          icon: Icons.save_rounded,
          onTap: _saving ? null : _submit,
        ),
      ],
    );
  }
}

class _HealthProfileSheet extends StatefulWidget {
  const _HealthProfileSheet({
    required this.repository,
    required this.petId,
    required this.profile,
  });

  final OwnerRepository repository;
  final String petId;
  final PetHealthProfile? profile;

  @override
  State<_HealthProfileSheet> createState() => _HealthProfileSheetState();
}

class _HealthProfileSheetState extends State<_HealthProfileSheet> {
  late final TextEditingController _weight;
  late final TextEditingController _color;
  late final TextEditingController _allergies;
  late final TextEditingController _chronic;
  late final TextEditingController _microchip;
  late String _neutered;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final p = widget.profile;
    _weight = TextEditingController(text: p?.currentWeightKg?.toString() ?? '');
    _color = TextEditingController(text: p?.color ?? '');
    _allergies = TextEditingController(text: p?.allergies ?? '');
    _chronic = TextEditingController(text: p?.chronicConditions ?? '');
    _microchip = TextEditingController(text: p?.microchipNumber ?? '');
    _neutered = p?.isNeutered ?? 'Unknown';
  }

  @override
  void dispose() {
    _weight.dispose();
    _color.dispose();
    _allergies.dispose();
    _chronic.dispose();
    _microchip.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final rawWeight = _weight.text.trim().replaceAll(',', '.');
    final weight = rawWeight.isEmpty ? null : double.tryParse(rawWeight);
    if (rawWeight.isNotEmpty && (weight == null || weight <= 0)) {
      setState(() => _error = 'Cân nặng không hợp lệ.');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await widget.repository.savePetHealthProfile(
        petId: widget.petId,
        create: widget.profile == null,
        currentWeightKg: weight,
        color: optionalInput(_color),
        isNeutered: _neutered,
        allergies: optionalInput(_allergies),
        chronicConditions: optionalInput(_chronic),
        microchipNumber: optionalInput(_microchip),
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
      title: widget.profile == null
          ? 'Tạo hồ sơ sức khỏe'
          : 'Sửa hồ sơ sức khỏe',
      subtitle: 'Dị ứng, bệnh nền, microchip và tình trạng hiện tại.',
      icon: Icons.favorite_rounded,
      error: _error,
      children: [
        SheetTextField(
          controller: _weight,
          label: 'Cân nặng hiện tại (kg)',
          icon: Icons.scale_rounded,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
        ),
        const SizedBox(height: 12),
        SheetTextField(
          controller: _color,
          label: 'Màu lông',
          icon: Icons.palette_rounded,
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
          onChanged: _saving ? null : (v) => setState(() => _neutered = v),
        ),
        const SizedBox(height: 12),
        SheetTextField(
          controller: _microchip,
          label: 'Mã microchip',
          icon: Icons.nfc_rounded,
        ),
        const SizedBox(height: 12),
        SheetTextField(
          controller: _allergies,
          label: 'Dị ứng',
          icon: Icons.warning_amber_rounded,
          maxLines: 2,
        ),
        const SizedBox(height: 12),
        SheetTextField(
          controller: _chronic,
          label: 'Bệnh mãn tính',
          icon: Icons.medical_information_rounded,
          maxLines: 2,
        ),
        const SizedBox(height: 18),
        PrimaryButton(
          label: _saving ? 'Đang lưu...' : 'Lưu hồ sơ',
          icon: Icons.save_rounded,
          onTap: _saving ? null : _submit,
        ),
      ],
    );
  }
}

class _MedicalRecordSheet extends StatefulWidget {
  const _MedicalRecordSheet({
    required this.repository,
    required this.petId,
    this.record,
  });

  final OwnerRepository repository;
  final String petId;
  final PetMedicalRecord? record;

  @override
  State<_MedicalRecordSheet> createState() => _MedicalRecordSheetState();
}

class _MedicalRecordSheetState extends State<_MedicalRecordSheet> {
  late final TextEditingController _title;
  late final TextEditingController _description;
  late final TextEditingController _vet;
  late final TextEditingController _clinic;
  late final TextEditingController _medication;
  late final TextEditingController _dosage;
  late String _type;
  late DateTime _date;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final r = widget.record;
    _title = TextEditingController(text: r?.title ?? '');
    _description = TextEditingController(text: r?.description ?? '');
    _vet = TextEditingController(text: r?.vetName ?? '');
    _clinic = TextEditingController(text: r?.clinicName ?? '');
    _medication = TextEditingController(text: r?.medicationName ?? '');
    _dosage = TextEditingController(text: r?.dosage ?? '');
    _type = r?.recordType ?? 'Checkup';
    _date = r?.date ?? DateTime.now();
  }

  @override
  void dispose() {
    _title.dispose();
    _description.dispose();
    _vet.dispose();
    _clinic.dispose();
    _medication.dispose();
    _dosage.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_title.text.trim().isEmpty) {
      setState(() => _error = 'Nhập tiêu đề hồ sơ.');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await widget.repository.saveMedicalRecord(
        petId: widget.petId,
        medicalRecordId: widget.record?.medicalRecordId,
        recordType: _type,
        title: _title.text.trim(),
        recordDate: _date,
        description: optionalInput(_description),
        vetName: optionalInput(_vet),
        clinicName: optionalInput(_clinic),
        medicationName: optionalInput(_medication),
        dosage: optionalInput(_dosage),
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
      title: widget.record == null ? 'Thêm hồ sơ y tế' : 'Sửa hồ sơ y tế',
      subtitle: 'Lưu thông tin khám, tiêm phòng hoặc điều trị.',
      icon: Icons.medical_information_rounded,
      error: _error,
      children: [
        SheetChoiceField(
          label: 'Loại hồ sơ',
          icon: Icons.category_rounded,
          value: _type,
          options: const [
            ('Vaccination', 'Tiêm phòng'),
            ('Checkup', 'Khám định kỳ'),
            ('Surgery', 'Phẫu thuật'),
            ('Illness', 'Bệnh lý'),
            ('Medication', 'Thuốc'),
            ('LabTest', 'Xét nghiệm'),
            ('Dental', 'Răng miệng'),
            ('Grooming', 'Vệ sinh'),
          ],
          onChanged: _saving ? null : (v) => setState(() => _type = v),
        ),
        const SizedBox(height: 12),
        SheetTextField(
          controller: _title,
          label: 'Tiêu đề',
          icon: Icons.title_rounded,
        ),
        const SizedBox(height: 12),
        SoftButton(
          label: 'Ngày ${formatDateOnly(_date)}',
          icon: Icons.calendar_today_rounded,
          onTap: _saving
              ? null
              : () async {
                  final date = await showDatePicker(
                    context: context,
                    initialDate: _date,
                    firstDate: DateTime(2000),
                    lastDate: DateTime.now(),
                  );
                  if (date != null) setState(() => _date = date);
                },
        ),
        const SizedBox(height: 12),
        SheetTextField(
          controller: _description,
          label: 'Mô tả',
          icon: Icons.notes_rounded,
          maxLines: 3,
        ),
        const SizedBox(height: 12),
        SheetTextField(
          controller: _clinic,
          label: 'Phòng khám',
          icon: Icons.local_hospital_rounded,
        ),
        const SizedBox(height: 12),
        SheetTextField(
          controller: _vet,
          label: 'Bác sĩ',
          icon: Icons.person_rounded,
        ),
        const SizedBox(height: 12),
        SheetTextField(
          controller: _medication,
          label: 'Tên thuốc',
          icon: Icons.medication_rounded,
        ),
        const SizedBox(height: 12),
        SheetTextField(
          controller: _dosage,
          label: 'Liều dùng',
          icon: Icons.science_rounded,
        ),
        const SizedBox(height: 18),
        PrimaryButton(
          label: _saving ? 'Đang lưu...' : 'Lưu hồ sơ',
          icon: Icons.save_rounded,
          onTap: _saving ? null : _submit,
        ),
      ],
    );
  }
}

class _PetPhotoSheet extends StatefulWidget {
  const _PetPhotoSheet({
    required this.repository,
    required this.petId,
    this.photo,
  });

  final OwnerRepository repository;
  final String petId;
  final PetPhoto? photo;

  @override
  State<_PetPhotoSheet> createState() => _PetPhotoSheetState();
}

class _PetPhotoSheetState extends State<_PetPhotoSheet> {
  late final TextEditingController _caption;
  XFile? _file;
  DateTime _takenAt = DateTime.now();
  bool _avatar = false;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _caption = TextEditingController(text: widget.photo?.caption ?? '');
    _avatar = widget.photo?.isAvatar ?? false;
    _takenAt = DateTime.tryParse(widget.photo?.takenAt ?? '') ?? DateTime.now();
  }

  @override
  void dispose() {
    _caption.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (widget.photo == null && _file == null) {
      setState(() => _error = 'Chọn ảnh trước khi tải lên.');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      if (widget.photo == null) {
        await widget.repository.uploadPetPhoto(
          petId: widget.petId,
          filePath: _file!.path,
          caption: optionalInput(_caption),
          takenAt: _takenAt,
          isAvatar: _avatar,
        );
      } else {
        await widget.repository.updatePetPhoto(
          petId: widget.petId,
          photoId: widget.photo!.photoId,
          caption: optionalInput(_caption),
          setAsAvatar: _avatar && !widget.photo!.isAvatar ? true : null,
        );
      }
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
      title: widget.photo == null ? 'Thêm ảnh' : 'Sửa thông tin ảnh',
      subtitle: 'Ảnh được upload trực tiếp vào kho lưu trữ PetOmi.',
      icon: Icons.add_photo_alternate_rounded,
      error: _error,
      children: [
        if (widget.photo == null)
          SoftButton(
            label: _file == null ? 'Chọn ảnh từ thiết bị' : _file!.name,
            icon: Icons.photo_library_rounded,
            onTap: _saving
                ? null
                : () async {
                    final file = await ImagePicker().pickImage(
                      source: ImageSource.gallery,
                      imageQuality: 88,
                      maxWidth: 1800,
                    );
                    if (file != null) setState(() => _file = file);
                  },
          ),
        if (widget.photo == null) const SizedBox(height: 12),
        SheetTextField(
          controller: _caption,
          label: 'Chú thích',
          icon: Icons.notes_rounded,
          maxLines: 2,
        ),
        if (widget.photo == null) ...[
          const SizedBox(height: 12),
          SoftButton(
            label: 'Ngày chụp ${formatDateOnly(_takenAt)}',
            icon: Icons.calendar_today_rounded,
            onTap: _saving
                ? null
                : () async {
                    final date = await showDatePicker(
                      context: context,
                      initialDate: _takenAt,
                      firstDate: DateTime(2000),
                      lastDate: DateTime.now(),
                    );
                    if (date != null) setState(() => _takenAt = date);
                  },
          ),
        ],
        SwitchListTile.adaptive(
          contentPadding: EdgeInsets.zero,
          title: const Text('Đặt làm ảnh đại diện'),
          value: _avatar,
          onChanged: _saving ? null : (v) => setState(() => _avatar = v),
        ),
        PrimaryButton(
          label: _saving ? 'Đang lưu...' : 'Lưu ảnh',
          icon: Icons.cloud_upload_rounded,
          onTap: _saving ? null : _submit,
        ),
      ],
    );
  }
}

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
