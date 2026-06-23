# Hướng dẫn cấu hình Deep link + Đăng nhập Google (PetOmi Mobile)

Tài liệu này liệt kê những phần **không phải code Flutter** mà bạn cần tự cấu hình
(Google Cloud, backend) để hai tính năng sau hoạt động trên app:

1. Xác minh email sau khi đăng ký (mở thẳng app qua deep link `petomi://`).
2. Đăng nhập bằng Google.

Phần code Flutter (nút Google, bắt deep link, gọi API) đã làm sẵn trong app.

---

## 0. Cơ chế tổng quan

App dùng URL scheme **`petomi://`**. Sau khi xác thực trên web/Google, backend
redirect về một trong hai địa chỉ:

- `petomi://verify-email?token=...` → app tự gọi `/auth/verify-email` và báo thành công.
- `petomi://auth/callback?accessToken=...&refreshToken=...&email=...` → app lưu session và vào thẳng dashboard.

App đã khai báo scheme này ở:
- Android: `android/app/src/main/AndroidManifest.xml` (intent-filter `petomi`).
- iOS: `ios/Runner/Info.plist` (`CFBundleURLSchemes` = `petomi`).

---

## 1. Backend — cho phép redirect về app (BẮT BUỘC)

Hiện backend redirect cứng về web (`FrontendUrl`, mặc định `http://localhost:5173`):

- `RegisterCommandHandler.cs` (dòng ~82): link verify email.
- `AuthController.GoogleCallback` (dòng ~187): redirect sau khi login Google.

### Cách 1 — nhanh để test (đổi tạm sang deep link)

Trong `appsettings.Development.json`, tạm đổi:

```json
"FrontendUrl": "petomi://"
```

Khi đó:
- Link verify email thành `petomi://verify-email?token=...` ✅
- Callback Google thành `petomi://auth/callback?...` ✅

Nhược điểm: web sẽ không nhận được link nữa (vì dùng chung config). Chỉ dùng khi test riêng mobile.

### Cách 2 — ĐANG DÙNG (hỗ trợ cả web lẫn mobile)

**App đã gửi sẵn `?client=mobile`** ở 2 request:
- `POST /auth/register?client=mobile`
- `GET  /auth/google/login?client=mobile`

Việc còn lại là backend đọc tham số này và chọn URL redirect. Các bước:

**Bước 1 — thêm key config** trong `appsettings*.json`:

```json
"MobileDeepLink": "petomi://"
```

**Bước 2 — Register: chọn URL theo `client`.**
Trong `RegisterCommandHandler` (hoặc `AuthController.Register`), đọc `client` từ query rồi:

```csharp
var isMobile = string.Equals(client, "mobile", StringComparison.OrdinalIgnoreCase);
var baseUrl = isMobile
    ? (_configuration["MobileDeepLink"] ?? "petomi://").TrimEnd('/')
    : (_configuration["FrontendUrl"] ?? "http://localhost:5173").TrimEnd('/');

var verificationLink = $"{baseUrl}/verify-email?token={Uri.EscapeDataString(rawToken)}";
```

> Nếu `client` nằm ở controller mà handler không thấy, truyền nó vào command
> (thêm field `Client` vào `RegisterCommand`) hoặc đọc `HttpContext.Request.Query["client"]`.

**Bước 3 — Google: phải truyền `client` qua OAuth `state` (QUAN TRỌNG).**

Đây là điểm dễ sai: khi `/auth/google/login` redirect sang Google rồi Google quay lại
`/auth/google/callback`, **query `?client=mobile` ban đầu BỊ MẤT**. Google chỉ trả lại
đúng tham số `state` mà bạn gửi đi. Vì vậy phải nhét `client` vào `state`:

```csharp
[HttpGet("google/login")]
public IActionResult GoogleLogin([FromQuery] string? client)
{
    var redirectUrl = Url.Action(nameof(GoogleCallback), "Auth", null, Request.Scheme);
    var properties = new AuthenticationProperties { RedirectUri = redirectUrl };
    // Lưu client vào state để callback đọc lại được.
    properties.Items["client"] = client ?? "web";
    return Challenge(properties, "Google");
}

[HttpGet("google/callback")]
public async Task<IActionResult> GoogleCallback()
{
    var authenticateResult = await HttpContext.AuthenticateAsync(GoogleExternalCookieScheme);
    // ... (giữ nguyên phần lấy token + Mediator.Send)

    // Đọc lại client đã lưu ở bước login:
    var client = authenticateResult.Properties?.Items.TryGetValue("client", out var c) == true ? c : "web";
    var isMobile = string.Equals(client, "mobile", StringComparison.OrdinalIgnoreCase);
    var baseUrl = isMobile
        ? (_configuration["MobileDeepLink"] ?? "petomi://").TrimEnd('/')
        : (_configuration["FrontendUrl"] ?? "http://localhost:5173").TrimEnd('/');

    return Redirect($"{baseUrl}/auth/callback{query.ToQueryString()}");
}
```

Kết quả:
- Web vẫn redirect về `http://localhost:5173/...` như cũ (không đổi gì).
- Mobile redirect về `petomi://verify-email?...` và `petomi://auth/callback?...` → app bắt được.

> Lưu ý: scheme tuỳ chỉnh như `petomi://` chỉ hoạt động khi app đã cài trên máy.
> Nếu sau này lên production, nên cân nhắc dùng **Android App Links / iOS Universal Links**
> (link `https://...` mở app) thay cho custom scheme.

---

## 2. Google Cloud Console — tạo OAuth Client (BẮT BUỘC cho Google login)

Luồng Google của backend là **web redirect flow** (không phải native), nên app chỉ
mở trình duyệt tới backend. Vì vậy **bạn dùng lại OAuth Client kiểu Web** đang có:

`ClientId` hiện tại trong `appsettings.Development.json`:
```
213462236840-8ncfo2e4a6ah6m5l3j37qrkm2d5hldsc.apps.googleusercontent.com
```

### Các bước trên Google Cloud Console
1. Vào https://console.cloud.google.com → chọn project chứa client ở trên.
2. **APIs & Services → Credentials** → mở **OAuth 2.0 Client ID** kiểu *Web application* đang dùng.
3. Trong **Authorized redirect URIs**, đảm bảo có URL callback của **backend** (không phải app):
   - Local: `http://localhost:<cổng-backend>/api/auth/google/callback`
     (kiểm tra cổng & prefix `/api` theo cấu hình backend thật của bạn).
   - Khi deploy: thêm domain thật, ví dụ `https://api.petomi.vn/auth/google/callback`.
4. Lưu lại.

> Vì app chỉ mở trình duyệt tới backend rồi backend nói chuyện với Google,
> Google chỉ cần biết **redirect URI của backend**. Bạn **không cần** tạo OAuth client
> kiểu Android/iOS, và **không cần** SHA-1, trừ khi sau này chuyển sang dùng
> `google_sign_in` native.

---

## 3. Chạy app

```bash
cd apps/moblie
flutter pub get          # cài app_links + url_launcher
dart run flutter_launcher_icons   # (nếu chưa) tạo icon app
flutter run
```

### Cách test nhanh deep link (không cần email thật)

Android (máy ảo/thiết bị đã cài app):
```bash
adb shell am start -a android.intent.action.VIEW -d "petomi://verify-email?token=TEST123"
```
→ App phải bật lên và hiện thông báo xác minh (token TEST123 sẽ báo lỗi từ backend là đúng,
chỉ cần thấy app bắt được link là OK).

iOS Simulator:
```bash
xcrun simctl openurl booted "petomi://verify-email?token=TEST123"
```

---

## 4. Tóm tắt việc cần bạn tự làm

| Việc | Ai làm | Bắt buộc? |
|------|--------|-----------|
| Khai báo scheme `petomi://` (Android/iOS) | ✅ Đã làm trong app | — |
| Bắt deep link + nút Google trong app | ✅ Đã làm trong app | — |
| Gửi `?client=mobile` ở register + google login | ✅ Đã làm trong app | — |
| Backend đọc `client` → chọn `MobileDeepLink` (mục 1, cách 2, 3 bước) | **Bạn** | Bắt buộc |
| Truyền `client` qua OAuth `state` cho Google (mục 1, bước 3) | **Bạn** | Bắt buộc cho Google login |
| Thêm redirect URI backend vào Google Cloud (mục 2) | **Bạn** | Bắt buộc cho Google login |
| `flutter pub get` + chạy lại | **Bạn** | Bắt buộc |

App đã đi theo **cách 2** (gửi `client=mobile`), nên web hoàn toàn không bị ảnh hưởng.
