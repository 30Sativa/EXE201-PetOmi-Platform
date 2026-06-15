import 'dart:async';

import 'package:flutter/material.dart';

import 'main.dart';
import 'models/owner_models.dart';

/// Màn chat AI tư vấn chăm sóc thú cưng (giống OwnerChatPage bên web).
class ChatPage extends StatefulWidget {
  const ChatPage({super.key});

  @override
  State<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends State<ChatPage> {
  final _inputController = TextEditingController();
  final _scrollController = ScrollController();

  String? _conversationId;
  String? _pendingMessageId;
  String? _petId;
  List<ChatMessage> _messages = const [];
  List<ChatConversation> _conversations = const [];
  ChatSubscriptionStatus? _subscription;

  bool _sending = false;
  bool _waitingAi = false;
  Timer? _pollTimer;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final pets = OwnerScope.of(context).data.pets;
      if (pets.length == 1) _petId = pets.first.petId;
      _loadSubscription();
      _loadConversations();
    });
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _inputController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _loadSubscription() async {
    try {
      final status = await OwnerScope.of(
        context,
      ).repository.getChatSubscriptionStatus(petId: _petId);
      if (mounted) setState(() => _subscription = status);
    } catch (_) {
      // Không chặn chat nếu không lấy được trạng thái gói.
    }
  }

  Future<void> _loadConversations() async {
    try {
      final repository = OwnerScope.of(context).repository;
      final results = await Future.wait<dynamic>([
        repository.getChatConversations(),
        repository.getSavedChatConversationId(),
      ]);
      final conversations = results[0] as List<ChatConversation>;
      final savedId = results[1] as String?;
      if (!mounted) return;
      setState(() => _conversations = conversations);
      if (_conversationId == null && savedId != null) {
        final matches = conversations.where(
          (item) => item.conversationId == savedId,
        );
        if (matches.isNotEmpty) await _selectConversation(matches.first);
      }
    } catch (_) {
      // Chat mới vẫn hoạt động nếu lịch sử tạm thời không tải được.
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _send() async {
    final text = _inputController.text.trim();
    if (text.isEmpty || _sending || _waitingAi) return;
    final repo = OwnerScope.of(context).repository;

    setState(() {
      _sending = true;
      _error = null;
      // Hiện ngay tin nhắn của người dùng (optimistic).
      _messages = [
        ..._messages,
        ChatMessage(
          messageId: 'local-${DateTime.now().millisecondsSinceEpoch}',
          conversationId: _conversationId ?? '',
          senderRole: 'User',
          status: 'Pending',
          content: text,
          createdAt: DateTime.now().toIso8601String(),
        ),
      ];
    });
    _inputController.clear();
    _scrollToBottom();

    try {
      final result = await repo.sendChatMessage(
        content: text,
        conversationId: _conversationId,
        petId: _petId,
      );
      _conversationId = result.conversationId;
      _pendingMessageId = result.messageId;
      await repo.saveChatConversationId(result.conversationId);
      if (mounted) {
        setState(() {
          _sending = false;
          _waitingAi = true;
        });
      }
      _startPolling();
    } catch (error) {
      if (mounted) {
        setState(() {
          _sending = false;
          _error = error.toString().replaceFirst('Exception: ', '');
        });
      }
    }
  }

  void _startPolling() {
    _pollTimer?.cancel();
    var attempts = 0;
    _pollTimer = Timer.periodic(const Duration(seconds: 2), (timer) async {
      attempts++;
      final convId = _conversationId;
      if (convId == null) {
        timer.cancel();
        return;
      }
      try {
        final messages = await OwnerScope.of(
          context,
        ).repository.getConversationMessages(convId);
        if (!mounted) return;
        final hasReadyAi = messages.any(
          (m) => m.isAi && !m.isPending && m.content.trim().isNotEmpty,
        );
        setState(() => _messages = messages);
        _scrollToBottom();
        if (hasReadyAi || attempts >= 30) {
          timer.cancel();
          setState(() {
            _waitingAi = false;
            _pendingMessageId = null;
          });
          _loadSubscription();
          _loadConversations();
        }
      } catch (_) {
        if (attempts >= 30) {
          timer.cancel();
          if (mounted) {
            setState(() {
              _waitingAi = false;
              _pendingMessageId = null;
            });
          }
        }
      }
    });
  }

  void _openPlans() {
    openAiPlanPage(context);
  }

  Future<void> _cancelPending() async {
    final messageId = _pendingMessageId;
    if (messageId == null) return;
    try {
      await OwnerScope.of(context).repository.cancelChatMessage(messageId);
      _pollTimer?.cancel();
      if (mounted) {
        setState(() {
          _waitingAi = false;
          _pendingMessageId = null;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Đã hủy yêu cầu AI đang xử lý.')),
        );
      }
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    }
  }

  Future<void> _selectConversation(ChatConversation conversation) async {
    final repository = OwnerScope.of(context).repository;
    setState(() {
      _conversationId = conversation.conversationId;
      _petId = conversation.petId;
      _messages = const [];
      _error = null;
    });
    await repository.saveChatConversationId(conversation.conversationId);
    try {
      final messages = await repository.getConversationMessages(
        conversation.conversationId,
      );
      if (mounted) {
        setState(() => _messages = messages);
        _scrollToBottom();
        _loadSubscription();
      }
    } catch (error) {
      if (mounted) setState(() => _error = error.toString());
    }
  }

  void _newConversation() {
    _pollTimer?.cancel();
    setState(() {
      _conversationId = null;
      _pendingMessageId = null;
      _messages = const [];
      _waitingAi = false;
      _error = null;
    });
    OwnerScope.of(context).repository.saveChatConversationId(null);
  }

  Future<void> _openHistory() async {
    await _loadConversations();
    if (!mounted) return;
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.45,
        maxChildSize: 0.9,
        expand: false,
        builder: (_, controller) => Container(
          decoration: const BoxDecoration(
            color: AppColors.background,
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          ),
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(18),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Lịch sử trò chuyện',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                    ),
                    IconButton(
                      tooltip: 'Cuộc trò chuyện mới',
                      onPressed: () {
                        Navigator.of(sheetContext).pop();
                        _newConversation();
                      },
                      icon: const Icon(Icons.add_comment_rounded),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: _conversations.isEmpty
                    ? const EmptyOwnerState(
                        icon: Icons.forum_outlined,
                        title: 'Chưa có cuộc trò chuyện',
                        message: 'Bắt đầu hỏi AI để tạo lịch sử đầu tiên.',
                      )
                    : ListView.separated(
                        controller: controller,
                        padding: const EdgeInsets.fromLTRB(18, 0, 18, 24),
                        itemCount: _conversations.length,
                        separatorBuilder: (_, _) =>
                            const Divider(color: AppColors.border),
                        itemBuilder: (_, index) {
                          final item = _conversations[index];
                          final petName = item.petId == null
                              ? 'Hỏi chung'
                              : petNameFor(
                                  OwnerScope.of(context).data,
                                  item.petId!,
                                );
                          return ListTile(
                            contentPadding: EdgeInsets.zero,
                            leading: const IconBubble(
                              icon: Icons.chat_bubble_rounded,
                            ),
                            title: Text(
                              item.title?.trim().isNotEmpty == true
                                  ? item.title!
                                  : 'Cuộc trò chuyện',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            subtitle: Text(
                              '$petName • ${formatDateTime(DateTime.tryParse(item.updatedAt ?? item.createdAt ?? ''))}',
                            ),
                            trailing: item.conversationId == _conversationId
                                ? const Icon(
                                    Icons.check_circle_rounded,
                                    color: AppColors.success,
                                  )
                                : const Icon(Icons.chevron_right_rounded),
                            onTap: () {
                              Navigator.of(sheetContext).pop();
                              _selectConversation(item);
                            },
                          );
                        },
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final pets = OwnerScope.of(context).data.pets;
    final sub = _subscription;
    return DecoratedGradient(
      child: Column(
        children: [
          _buildHeader(pets, sub),
          Expanded(
            child: _messages.isEmpty && !_waitingAi
                ? _buildEmpty()
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                    itemCount: _messages.length + (_waitingAi ? 1 : 0),
                    itemBuilder: (context, index) {
                      if (index == _messages.length) {
                        return const _TypingBubble();
                      }
                      return _ChatBubble(message: _messages[index]);
                    },
                  ),
          ),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: ErrorBanner(message: _error!),
            ),
          _buildComposer(),
        ],
      ),
    );
  }

  Widget _buildHeader(List<OwnerPet> pets, ChatSubscriptionStatus? sub) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 6),
      child: SurfaceCard(
        radius: 24,
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            const IconBubble(icon: Icons.smart_toy_rounded),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Trợ lý AI PetOmi',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    sub == null
                        ? 'Hỏi đáp về chăm sóc thú cưng'
                        : 'Gói ${sub.currentPlanName} • còn ${sub.remainingMessages} tin nhắn',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(
                      context,
                    ).textTheme.bodyMedium?.copyWith(fontSize: 12),
                  ),
                ],
              ),
            ),
            IconButton(
              tooltip: 'Lịch sử trò chuyện',
              onPressed: _openHistory,
              icon: const Icon(Icons.history_rounded),
            ),
            FilledButton.tonalIcon(
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.primarySoft,
                foregroundColor: AppColors.primaryHover,
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                ),
              ),
              onPressed: _openPlans,
              icon: const Icon(Icons.workspace_premium_rounded, size: 18),
              label: const Text('Gói'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmpty() {
    final pets = OwnerScope.of(context).data.pets;
    final suggestions = [
      'Chó của tôi bỏ ăn 2 ngày nay, tôi nên làm gì?',
      'Lịch tiêm phòng cho mèo con như thế nào?',
      'Thức ăn nào tốt cho chó con 3 tháng tuổi?',
    ];
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 20),
      children: [
        const SizedBox(height: 20),
        Center(
          child: Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              color: AppColors.primarySoft,
              borderRadius: BorderRadius.circular(24),
            ),
            child: const Icon(
              Icons.smart_toy_rounded,
              color: AppColors.primaryHover,
              size: 36,
            ),
          ),
        ),
        const SizedBox(height: 16),
        Text(
          'Xin chào! Tôi có thể giúp gì cho bé cưng của bạn?',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 8),
        Text(
          'Hỏi tôi về sức khỏe, dinh dưỡng, huấn luyện hoặc bất cứ điều gì về thú cưng.',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        const SizedBox(height: 20),
        if (pets.isEmpty)
          const EmptyOwnerState(
            icon: Icons.pets_rounded,
            title: 'Chưa có thú cưng',
            message:
                'Thêm thú cưng để được tư vấn chính xác hơn theo từng bé, hoặc cứ hỏi chung cũng được.',
            compact: true,
          ),
        ...suggestions.map(
          (s) => Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: GestureDetector(
              onTap: () {
                _inputController.text = s;
                _send();
              },
              child: SurfaceCard(
                radius: 18,
                padding: const EdgeInsets.all(14),
                child: Row(
                  children: [
                    const Icon(
                      Icons.chat_bubble_outline_rounded,
                      size: 18,
                      color: AppColors.primaryHover,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        s,
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildComposer() {
    final pets = OwnerScope.of(context).data.pets;
    return SafeArea(
      top: false,
      child: Container(
        margin: const EdgeInsets.fromLTRB(16, 4, 16, 10),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(26),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          children: [
            if (pets.isNotEmpty)
              Align(
                alignment: Alignment.centerLeft,
                child: DropdownButton<String?>(
                  value: _petId,
                  isDense: true,
                  underline: const SizedBox.shrink(),
                  borderRadius: BorderRadius.circular(16),
                  hint: const Text('Hỏi chung (chưa chọn bé)'),
                  items: [
                    const DropdownMenuItem<String?>(
                      value: null,
                      child: Text('Hỏi chung'),
                    ),
                    ...pets.map(
                      (p) => DropdownMenuItem<String?>(
                        value: p.petId,
                        child: Text('Về ${p.name}'),
                      ),
                    ),
                  ],
                  onChanged: (value) {
                    setState(() => _petId = value);
                    _loadSubscription();
                  },
                ),
              ),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _inputController,
                    minLines: 1,
                    maxLines: 4,
                    textInputAction: TextInputAction.send,
                    onSubmitted: (_) => _send(),
                    decoration: const InputDecoration(
                      hintText: 'Nhập câu hỏi của bạn...',
                      border: InputBorder.none,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                _sending || _waitingAi
                    ? IconButton(
                        tooltip: _waitingAi ? 'Hủy xử lý' : 'Đang gửi',
                        onPressed: _waitingAi && _pendingMessageId != null
                            ? _cancelPending
                            : null,
                        icon: _waitingAi
                            ? const Icon(
                                Icons.stop_circle_rounded,
                                color: AppColors.danger,
                              )
                            : const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: AppColors.primary,
                                ),
                              ),
                      )
                    : IconButton.filled(
                        style: IconButton.styleFrom(
                          backgroundColor: AppColors.primary,
                        ),
                        onPressed: _send,
                        icon: const Icon(Icons.send_rounded, size: 20),
                      ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ChatBubble extends StatelessWidget {
  const _ChatBubble({required this.message});

  final ChatMessage message;

  @override
  Widget build(BuildContext context) {
    final isAi = message.isAi;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        mainAxisAlignment: isAi
            ? MainAxisAlignment.start
            : MainAxisAlignment.end,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (isAi) ...[const _Avatar(isAi: true), const SizedBox(width: 8)],
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: isAi ? AppColors.surface : AppColors.primary,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(18),
                  topRight: const Radius.circular(18),
                  bottomLeft: Radius.circular(isAi ? 4 : 18),
                  bottomRight: Radius.circular(isAi ? 18 : 4),
                ),
                border: isAi ? Border.all(color: AppColors.border) : null,
              ),
              child: Text(
                message.content,
                style: TextStyle(
                  color: isAi ? AppColors.text : Colors.white,
                  fontSize: 14,
                  height: 1.45,
                ),
              ),
            ),
          ),
          if (!isAi) const SizedBox(width: 8),
          if (!isAi) const _Avatar(isAi: false),
        ],
      ),
    );
  }
}

class _Avatar extends StatelessWidget {
  const _Avatar({required this.isAi});
  final bool isAi;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 30,
      height: 30,
      decoration: BoxDecoration(
        color: isAi ? AppColors.primarySoft : AppColors.surfaceMuted,
        shape: BoxShape.circle,
      ),
      child: Icon(
        isAi ? Icons.smart_toy_rounded : Icons.person_rounded,
        size: 17,
        color: isAi ? AppColors.primaryHover : AppColors.textSubtle,
      ),
    );
  }
}

// ==================== AI PLANS SHEET ====================

Future<void> showChatPlansSheet({
  required BuildContext context,
  required ChatSubscriptionStatus status,
  required String? petId,
  required Future<void> Function() onChanged,
}) {
  final scope = OwnerScope.of(context);
  return showOwnerActionSheet<void>(
    context: context,
    child: _ChatPlansSheet(
      repository: scope.repository,
      pets: scope.data.pets,
      status: status,
      initialPetId: petId,
      onChanged: onChanged,
    ),
  );
}

class _ChatPlansSheet extends StatefulWidget {
  const _ChatPlansSheet({
    required this.repository,
    required this.pets,
    required this.status,
    required this.initialPetId,
    required this.onChanged,
  });

  final dynamic repository;
  final List<OwnerPet> pets;
  final ChatSubscriptionStatus status;
  final String? initialPetId;
  final Future<void> Function() onChanged;

  @override
  State<_ChatPlansSheet> createState() => _ChatPlansSheetState();
}

class _ChatPlansSheetState extends State<_ChatPlansSheet> {
  String? _petId;
  ChatPayment? _payment;
  Timer? _paymentTimer;
  bool _loading = false;
  bool _checkingPayment = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _petId =
        widget.initialPetId ??
        (widget.pets.isEmpty ? null : widget.pets.first.petId);
  }

  @override
  void dispose() {
    _paymentTimer?.cancel();
    super.dispose();
  }

  String _formatMoney(double value) {
    final s = value.toStringAsFixed(0);
    final buf = StringBuffer();
    for (var i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) buf.write('.');
      buf.write(s[i]);
    }
    return '${buf.toString()}đ';
  }

  Future<void> _upgrade(ChatPlan plan) async {
    final petId = _petId;
    if (petId == null || petId.isEmpty) {
      setState(() => _error = 'Chọn thú cưng áp dụng gói trước.');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final payment = await widget.repository.createChatSubscriptionPayment(
        planCode: plan.code,
        petId: petId,
      );
      if (mounted) {
        final typedPayment = payment as ChatPayment;
        setState(() => _payment = typedPayment);
        _startPaymentPolling(typedPayment);
      }
      await widget.onChanged();
    } catch (error) {
      if (mounted) {
        setState(
          () => _error = error.toString().replaceFirst('Exception: ', ''),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _startPaymentPolling(ChatPayment payment) {
    _paymentTimer?.cancel();
    if (!payment.isPending) return;
    _paymentTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      _refreshPayment(showError: false);
    });
  }

  Future<void> _refreshPayment({bool showError = true}) async {
    final payment = _payment;
    if (payment == null || _checkingPayment) return;
    setState(() {
      _checkingPayment = true;
      if (showError) _error = null;
    });
    try {
      final updated = await widget.repository.getChatPaymentStatus(
        payment.paymentId,
      );
      if (!mounted) return;
      setState(() => _payment = updated as ChatPayment);
      if (!updated.isPending) {
        _paymentTimer?.cancel();
        await widget.onChanged();
      }
    } catch (error) {
      if (mounted && showError) {
        setState(
          () => _error = error.toString().replaceFirst('Exception: ', ''),
        );
      }
    } finally {
      if (mounted) setState(() => _checkingPayment = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final status = widget.status;
    final payment = _payment;
    if (payment != null) {
      return _buildPayment(payment);
    }
    return OwnerSheetFrame(
      title: 'Gói trợ lý AI',
      subtitle: 'Nâng cấp để hỏi nhiều hơn và nhận tư vấn chuyên sâu.',
      icon: Icons.workspace_premium_rounded,
      error: _error,
      children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.primarySoft.withValues(alpha: 0.5),
            borderRadius: BorderRadius.circular(18),
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Gói hiện tại: ${status.currentPlanName}',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Đã dùng ${status.usedMessages}/${status.monthlyMessageQuota} tin nhắn tháng này',
                      style: Theme.of(
                        context,
                      ).textTheme.bodyMedium?.copyWith(fontSize: 12),
                    ),
                  ],
                ),
              ),
              StatusChip(
                label: status.isPremium ? 'Premium' : 'Miễn phí',
                color: status.isPremium
                    ? AppColors.primaryHover
                    : AppColors.textSubtle,
                background: status.isPremium
                    ? AppColors.primarySoft
                    : AppColors.surfaceMuted,
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        if (widget.pets.isNotEmpty) ...[
          SheetChoiceField(
            label: 'Áp dụng cho thú cưng',
            icon: Icons.pets_rounded,
            value: _petId ?? '',
            options: widget.pets.map((p) => (p.petId, p.name)).toList(),
            onChanged: _loading ? null : (v) => setState(() => _petId = v),
          ),
          const SizedBox(height: 16),
        ],
        ...status.plans.map((plan) => _buildPlanCard(plan, status)),
      ],
    );
  }

  Widget _buildPlanCard(ChatPlan plan, ChatSubscriptionStatus status) {
    final isCurrent =
        plan.code.toLowerCase() == status.currentPlanCode.toLowerCase();
    final isFree = plan.priceMonthly <= 0;
    final highlight = !isFree;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: highlight ? AppColors.primary : AppColors.border,
          width: highlight ? 1.6 : 1,
        ),
      ),
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
              if (isCurrent)
                const StatusChip(
                  label: 'Đang dùng',
                  color: AppColors.success,
                  background: AppColors.successSoft,
                ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            isFree
                ? 'Miễn phí'
                : '${_formatMoney(plan.priceMonthly)} / ${plan.billingCycleDays} ngày',
            style: Theme.of(
              context,
            ).textTheme.headlineMedium?.copyWith(fontSize: 22),
          ),
          const SizedBox(height: 10),
          _PlanFeature(text: '${plan.monthlyMessageQuota} tin nhắn / tháng'),
          _PlanFeature(
            text:
                'Tư vấn chuyên sâu (RAG): ${plan.deepRagEnabled ? "Có" : "Không"}',
          ),
          _PlanFeature(
            text: 'Gửi ảnh: ${plan.imageUploadEnabled ? "Có" : "Không"}',
          ),
          if (!isFree && !isCurrent) ...[
            const SizedBox(height: 14),
            SizedBox(
              width: double.infinity,
              child: PrimaryButton(
                label: _loading ? 'Đang xử lý...' : 'Nâng cấp gói này',
                icon: Icons.bolt_rounded,
                onTap: _loading ? null : () => _upgrade(plan),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildPayment(ChatPayment payment) {
    final statusColor = payment.isPaid
        ? AppColors.success
        : payment.isPending
        ? AppColors.warning
        : AppColors.danger;
    final statusBackground = payment.isPaid
        ? AppColors.successSoft
        : payment.isPending
        ? AppColors.warningSoft
        : AppColors.dangerSoft;
    return OwnerSheetFrame(
      title: 'Thanh toán ${payment.planName}',
      subtitle: payment.isPending
          ? 'Quét mã QR để hoàn tất nâng cấp gói. Trạng thái được tự động cập nhật.'
          : payment.isPaid
          ? 'Thanh toán đã hoàn tất và gói đang được cập nhật.'
          : 'Yêu cầu thanh toán không còn hiệu lực.',
      icon: Icons.qr_code_rounded,
      error: _error,
      children: [
        Center(
          child: Text(
            _formatMoney(payment.amount),
            style: Theme.of(context).textTheme.headlineLarge,
          ),
        ),
        const SizedBox(height: 16),
        if (payment.qrCodeUrl != null && payment.qrCodeUrl!.isNotEmpty)
          Center(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(18),
              child: Image.network(
                payment.qrCodeUrl!,
                width: 220,
                height: 220,
                fit: BoxFit.contain,
                errorBuilder: (_, _, _) => const SizedBox(
                  width: 220,
                  height: 220,
                  child: Center(child: Text('Không tải được mã QR')),
                ),
              ),
            ),
          ),
        const SizedBox(height: 16),
        SectionCard(
          title: 'Thông tin chuyển khoản',
          subtitle: 'Hoặc chuyển khoản thủ công theo thông tin dưới đây.',
          child: Column(
            children: [
              if (payment.bankCode != null)
                InfoRow(label: 'Ngân hàng', value: payment.bankCode!),
              if (payment.bankAccountNo != null)
                InfoRow(label: 'Số tài khoản', value: payment.bankAccountNo!),
              if (payment.paymentReference != null)
                InfoRow(label: 'Nội dung', value: payment.paymentReference!),
              InfoRow(label: 'Trạng thái', value: payment.status),
              if (payment.expiresAt != null)
                InfoRow(
                  label: 'Hết hạn',
                  value: formatDateTime(DateTime.tryParse(payment.expiresAt!)),
                ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Center(
          child: StatusChip(
            label: payment.isPaid
                ? 'Đã thanh toán'
                : payment.isPending
                ? 'Đang chờ thanh toán'
                : payment.isExpired
                ? 'Đã hết hạn'
                : 'Đã hủy',
            color: statusColor,
            background: statusBackground,
          ),
        ),
        const SizedBox(height: 16),
        SoftButton(
          label: _checkingPayment
              ? 'Đang kiểm tra...'
              : payment.isPending
              ? 'Kiểm tra thanh toán'
              : 'Đóng',
          icon: payment.isPending
              ? Icons.refresh_rounded
              : Icons.check_circle_rounded,
          onTap: _checkingPayment
              ? null
              : payment.isPending
              ? _refreshPayment
              : () => Navigator.of(context).pop(),
        ),
      ],
    );
  }
}

class _PlanFeature extends StatelessWidget {
  const _PlanFeature({required this.text});
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          const Icon(
            Icons.check_circle_rounded,
            size: 16,
            color: AppColors.success,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(text, style: Theme.of(context).textTheme.bodyMedium),
          ),
        ],
      ),
    );
  }
}

class _TypingBubble extends StatelessWidget {
  const _TypingBubble();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        children: [
          const _Avatar(isAi: true),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: AppColors.primary,
                  ),
                ),
                const SizedBox(width: 10),
                Text(
                  'Đang soạn câu trả lời...',
                  style: Theme.of(
                    context,
                  ).textTheme.bodyMedium?.copyWith(fontSize: 12),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
