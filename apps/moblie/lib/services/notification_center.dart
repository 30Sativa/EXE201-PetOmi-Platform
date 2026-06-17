import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:signalr_netcore/signalr_client.dart';

import 'api_client.dart';

enum NotificationConnectionStatus {
  disabled,
  connecting,
  connected,
  reconnecting,
  disconnected,
}

class OwnerNotification {
  const OwnerNotification({
    required this.id,
    required this.title,
    required this.message,
    required this.reminderType,
    required this.entityType,
    required this.remindAt,
    required this.receivedAt,
    this.isRead = false,
  });

  factory OwnerNotification.fromPayload(Map<String, dynamic> payload) {
    final remindAt = DateTime.tryParse('${payload['remindAt'] ?? ''}');
    final title = '${payload['title'] ?? 'Nhắc nhở PetOmi'}'.trim();
    final message = '${payload['message'] ?? ''}'.trim();
    final reminderType = '${payload['reminderType'] ?? 'Custom'}'.trim();
    final entityType = '${payload['entityType'] ?? ''}'.trim();
    final rawId = '${payload['reminderId'] ?? ''}'.trim();
    final fallbackId =
        '$title|${remindAt?.toIso8601String() ?? ''}|$entityType';
    return OwnerNotification(
      id: rawId.isEmpty ? fallbackId : rawId,
      title: title.isEmpty ? 'Nhắc nhở PetOmi' : title,
      message: message,
      reminderType: reminderType,
      entityType: entityType,
      remindAt: remindAt,
      receivedAt: DateTime.now(),
    );
  }

  final String id;
  final String title;
  final String message;
  final String reminderType;
  final String entityType;
  final DateTime? remindAt;
  final DateTime receivedAt;
  final bool isRead;

  OwnerNotification copyWith({bool? isRead}) {
    return OwnerNotification(
      id: id,
      title: title,
      message: message,
      reminderType: reminderType,
      entityType: entityType,
      remindAt: remindAt,
      receivedAt: receivedAt,
      isRead: isRead ?? this.isRead,
    );
  }
}

class OwnerNotificationCenter extends ChangeNotifier {
  OwnerNotificationCenter({
    required TokenStore tokenStore,
    required String apiBaseUrl,
  }) : _tokenStore = tokenStore,
       _hubUrl = _buildHubUrl(apiBaseUrl),
       _enabled = true;

  OwnerNotificationCenter.disabled()
    : _tokenStore = TokenStore(),
      _hubUrl = '',
      _enabled = false,
      _status = NotificationConnectionStatus.disabled;

  final TokenStore _tokenStore;
  final String _hubUrl;
  final bool _enabled;
  final List<OwnerNotification> _items = [];
  HubConnection? _connection;
  String? _userId;
  NotificationConnectionStatus _status =
      NotificationConnectionStatus.disconnected;
  String? _errorMessage;
  bool _disposed = false;

  List<OwnerNotification> get items => List.unmodifiable(_items);
  NotificationConnectionStatus get status => _status;
  String? get errorMessage => _errorMessage;
  int get unreadCount => _items.where((item) => !item.isRead).length;
  bool get isPersistent => false;

  Future<void> connect(String userId) async {
    if (!_enabled || userId.isEmpty || _disposed) return;
    if (_userId == userId &&
        (_status == NotificationConnectionStatus.connecting ||
            _status == NotificationConnectionStatus.connected ||
            _status == NotificationConnectionStatus.reconnecting)) {
      return;
    }

    await disconnect(clearItems: _userId != null && _userId != userId);
    _userId = userId;
    _setStatus(NotificationConnectionStatus.connecting);

    final options = HttpConnectionOptions(
      accessTokenFactory: () async => await _tokenStore.getAccessToken() ?? '',
    );
    final connection = HubConnectionBuilder()
        .withUrl(_hubUrl, options: options)
        .withAutomaticReconnect(retryDelays: [2000, 5000, 10000, 30000])
        .build();
    _connection = connection;
    connection.on('ReceiveReminder', _handleReminderEvent);
    connection.onreconnecting(({Exception? error}) {
      _setStatus(
        NotificationConnectionStatus.reconnecting,
        errorMessage: error?.toString(),
      );
    });
    connection.onreconnected(({String? connectionId}) {
      unawaited(_restoreGroupAfterReconnect());
    });
    connection.onclose(({Exception? error}) {
      _setStatus(
        NotificationConnectionStatus.disconnected,
        errorMessage: error?.toString(),
      );
    });

    try {
      await connection.start();
      await _joinCurrentUserGroup();
      _setStatus(NotificationConnectionStatus.connected);
    } catch (error) {
      try {
        await connection.stop();
      } catch (_) {
        // Keep the original connection/join error for the UI.
      }
      _setStatus(
        NotificationConnectionStatus.disconnected,
        errorMessage: error.toString(),
      );
    }
  }

  Future<void> retry() async {
    final userId = _userId;
    if (userId == null || userId.isEmpty) return;
    await disconnect();
    await connect(userId);
  }

  Future<void> disconnect({bool clearItems = false}) async {
    final connection = _connection;
    _connection = null;
    if (connection != null) {
      connection.off('ReceiveReminder', method: _handleReminderEvent);
      try {
        await connection.stop();
      } catch (_) {
        // The session can still close locally when the network is unavailable.
      }
    }
    if (clearItems) _items.clear();
    if (!_disposed && _enabled) {
      _setStatus(NotificationConnectionStatus.disconnected);
    }
  }

  void ingestReminder(Map<String, dynamic> payload) {
    if (_disposed) return;
    final item = OwnerNotification.fromPayload(payload);
    if (_items.any((existing) => existing.id == item.id)) return;
    _items.insert(0, item);
    notifyListeners();
  }

  void markRead(String id) {
    final index = _items.indexWhere((item) => item.id == id);
    if (index < 0 || _items[index].isRead) return;
    _items[index] = _items[index].copyWith(isRead: true);
    notifyListeners();
  }

  void markAllRead() {
    if (unreadCount == 0) return;
    for (var index = 0; index < _items.length; index++) {
      _items[index] = _items[index].copyWith(isRead: true);
    }
    notifyListeners();
  }

  void _handleReminderEvent(List<Object?>? arguments) {
    if (arguments == null || arguments.isEmpty) return;
    final value = arguments.first;
    if (value is! Map) return;
    ingestReminder(Map<String, dynamic>.from(value));
  }

  Future<void> _joinCurrentUserGroup() async {
    final connection = _connection;
    final userId = _userId;
    if (connection == null || userId == null || userId.isEmpty) return;
    await connection.invoke('JoinUserGroup', args: <Object>[userId]);
  }

  Future<void> _restoreGroupAfterReconnect() async {
    try {
      await _joinCurrentUserGroup();
      _setStatus(NotificationConnectionStatus.connected);
    } catch (error) {
      _setStatus(
        NotificationConnectionStatus.disconnected,
        errorMessage: error.toString(),
      );
    }
  }

  void _setStatus(NotificationConnectionStatus value, {String? errorMessage}) {
    if (_disposed) return;
    _status = value;
    _errorMessage = errorMessage;
    notifyListeners();
  }

  @override
  void dispose() {
    _disposed = true;
    final connection = _connection;
    _connection = null;
    if (connection != null) {
      connection.off('ReceiveReminder', method: _handleReminderEvent);
      unawaited(connection.stop());
    }
    super.dispose();
  }

  static String _buildHubUrl(String apiBaseUrl) {
    final uri = Uri.parse(apiBaseUrl);
    final segments = uri.pathSegments.where((part) => part.isNotEmpty).toList();
    if (segments.isNotEmpty && segments.last.toLowerCase() == 'api') {
      segments.removeLast();
    }
    return uri
        .replace(pathSegments: [...segments, 'hubs', 'notifications'])
        .toString();
  }
}
