import 'dart:convert';
import 'dart:math';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../app_config.dart';
import '../models/owner_models.dart';

class ApiException implements Exception {
  const ApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

class TokenStore {
  static const _accessTokenKey = 'petomi.accessToken';
  static const _refreshTokenKey = 'petomi.refreshToken';
  static const _emailKey = 'petomi.email';
  static const _deviceFingerprintKey = 'petomi.deviceFingerprint';

  Future<String?> getAccessToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_accessTokenKey);
  }

  Future<String?> getRefreshToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_refreshTokenKey);
  }

  Future<String?> getEmail() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_emailKey);
  }

  Future<void> saveSession(LoginSession session) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_accessTokenKey, session.accessToken);
    await prefs.setString(_refreshTokenKey, session.refreshToken);
    await prefs.setString(_emailKey, session.email);
  }

  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_accessTokenKey, accessToken);
    await prefs.setString(_refreshTokenKey, refreshToken);
  }

  Future<void> saveEmail(String email) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_emailKey, email);
  }

  Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_accessTokenKey);
    await prefs.remove(_refreshTokenKey);
    await prefs.remove(_emailKey);
  }

  Future<String> getOrCreateDeviceFingerprint() async {
    final prefs = await SharedPreferences.getInstance();
    final existing = prefs.getString(_deviceFingerprintKey);
    if (existing != null && existing.isNotEmpty) return existing;
    final random = Random.secure();
    final bytes = List<int>.generate(16, (_) => random.nextInt(256));
    final value = bytes
        .map((byte) => byte.toRadixString(16).padLeft(2, '0'))
        .join();
    await prefs.setString(_deviceFingerprintKey, value);
    return value;
  }
}

class ApiClient {
  ApiClient({http.Client? httpClient, TokenStore? tokenStore, String? baseUrl})
    : _httpClient = httpClient ?? http.Client(),
      _tokenStore = tokenStore ?? TokenStore(),
      _baseUrl = (baseUrl ?? AppConfig.apiBaseUrl).replaceFirst(
        RegExp(r'/+$'),
        '',
      );

  final http.Client _httpClient;
  final TokenStore _tokenStore;
  final String _baseUrl;

  TokenStore get tokenStore => _tokenStore;
  String get baseUrl => _baseUrl;

  Future<Map<String, dynamic>> getMap(String path) async {
    final response = await _sendWithRefresh('GET', path);
    return _decodeMap(response);
  }

  Future<List<dynamic>> getList(String path) async {
    final response = await _sendWithRefresh('GET', path);
    final data = _unwrap(_decodeJson(response));
    return data is List ? data : const [];
  }

  Future<Map<String, dynamic>> postMap(
    String path, {
    Map<String, dynamic>? body,
    bool authorized = true,
  }) async {
    final response = await _sendWithRefresh(
      'POST',
      path,
      body: body,
      authorized: authorized,
    );
    return _decodeMap(response);
  }

  Future<Map<String, dynamic>> putMap(
    String path, {
    Map<String, dynamic>? body,
    bool authorized = true,
  }) async {
    final response = await _sendWithRefresh(
      'PUT',
      path,
      body: body,
      authorized: authorized,
    );
    return _decodeMap(response);
  }

  Future<Map<String, dynamic>> patchMap(
    String path, {
    Map<String, dynamic>? body,
    bool authorized = true,
  }) async {
    final response = await _sendWithRefresh(
      'PATCH',
      path,
      body: body,
      authorized: authorized,
    );
    return _decodeMap(response);
  }

  Future<void> delete(String path, {bool authorized = true}) async {
    await _sendWithRefresh('DELETE', path, authorized: authorized);
  }

  Future<http.Response> _sendWithRefresh(
    String method,
    String path, {
    Map<String, dynamic>? body,
    bool authorized = true,
    bool retrying = false,
  }) async {
    final response = await _send(
      method,
      path,
      body: body,
      authorized: authorized,
    );
    if (response.statusCode == 401 && authorized && !retrying) {
      final refreshed = await _refreshToken();
      if (refreshed) {
        return _sendWithRefresh(
          method,
          path,
          body: body,
          authorized: authorized,
          retrying: true,
        );
      }
    }
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiException(
        _extractError(response),
        statusCode: response.statusCode,
      );
    }
    return response;
  }

  Future<http.Response> _send(
    String method,
    String path, {
    Map<String, dynamic>? body,
    bool authorized = true,
  }) async {
    final uri = Uri.parse('$_baseUrl$path');
    final headers = <String, String>{
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
    if (authorized) {
      final token = await _tokenStore.getAccessToken();
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }
    }
    final encodedBody = body == null ? null : jsonEncode(body);
    return switch (method) {
      'GET' => _httpClient.get(uri, headers: headers),
      'POST' => _httpClient.post(uri, headers: headers, body: encodedBody),
      'PUT' => _httpClient.put(uri, headers: headers, body: encodedBody),
      'PATCH' => _httpClient.patch(uri, headers: headers, body: encodedBody),
      'DELETE' => _httpClient.delete(uri, headers: headers, body: encodedBody),
      _ => throw UnsupportedError('Unsupported method $method'),
    };
  }

  Future<bool> _refreshToken() async {
    final refreshToken = await _tokenStore.getRefreshToken();
    if (refreshToken == null || refreshToken.isEmpty) return false;
    final response = await _send(
      'POST',
      '/auth/refresh-token',
      body: {'refreshToken': refreshToken},
      authorized: false,
    );
    if (response.statusCode < 200 || response.statusCode >= 300) {
      await _tokenStore.clear();
      return false;
    }
    final data = _unwrap(_decodeJson(response));
    if (data is! Map<String, dynamic>) return false;
    final accessToken = data.stringValue('accessToken');
    final newRefreshToken = data.stringValue(
      'refreshToken',
      fallback: refreshToken,
    );
    if (accessToken.isEmpty) return false;
    await _tokenStore.saveTokens(
      accessToken: accessToken,
      refreshToken: newRefreshToken,
    );
    return true;
  }

  Map<String, dynamic> _decodeMap(http.Response response) {
    final data = _unwrap(_decodeJson(response));
    if (data is Map<String, dynamic>) return data;
    return const {};
  }

  dynamic _decodeJson(http.Response response) {
    if (response.body.trim().isEmpty) return null;
    return jsonDecode(response.body);
  }

  dynamic _unwrap(dynamic payload) {
    if (payload is Map<String, dynamic> && payload.containsKey('data')) {
      return payload['data'];
    }
    return payload;
  }

  String _extractError(http.Response response) {
    try {
      final payload = _decodeJson(response);
      if (payload is Map<String, dynamic>) {
        final message =
            payload['message'] ?? payload['Message'] ?? payload['title'];
        if (message != null) return message.toString();
      }
    } catch (_) {
      // Use fallback below.
    }
    return 'Không gọi được API (${response.statusCode}).';
  }
}
