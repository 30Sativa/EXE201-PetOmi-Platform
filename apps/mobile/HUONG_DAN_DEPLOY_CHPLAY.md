# Hướng dẫn deploy PetOmi Owner Mobile lên CH Play (Google Play)

App: `petomi_owner_mobile` · Package: `com.petomi.petomi_owner_mobile` · Framework: Flutter

> Các file config đã được chuẩn bị sẵn. Bạn chỉ cần làm theo các bước dưới đây.
> Phần lệnh terminal chạy trong thư mục `apps/moblie`.

---

## TÓM TẮT NHANH (đã làm sẵn cho bạn)

| Việc | Trạng thái |
|---|---|
| Thêm release signing config vào `build.gradle.kts` | ✅ Đã làm |
| Bật minify + shrink resources (giảm size app) | ✅ Đã làm |
| File `proguard-rules.pro` | ✅ Đã tạo |
| Bỏ `usesCleartextTraffic`, thêm network security config | ✅ Đã làm |
| Template `key.properties.example` | ✅ Đã tạo |
| **Tạo keystore (.jks)** | ⬜ Bạn phải tự làm — Bước 1 |
| **Tạo file `key.properties`** | ⬜ Bạn phải tự làm — Bước 2 |
| **Build file AAB** | ⬜ Bước 3 |
| **Upload lên Play Console** | ⬜ Bước 4 |

---

## BƯỚC 1 — Tạo keystore (chữ ký số của app)

Keystore là "chữ ký" của app. **Mất keystore = vĩnh viễn không update được app trên Play Store nữa**, nên hãy backup cẩn thận (Google Drive riêng, password manager...).

Mở terminal, chạy lệnh sau (cần đã cài Java/JDK — thường có sẵn khi cài Android Studio):

```bash
keytool -genkey -v -keystore petomi-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias petomi
```

- Nó sẽ hỏi password (nhớ kỹ password này) và vài thông tin (tên, tổ chức, thành phố...). Điền gì cũng được.
- Sau khi xong sẽ ra file `petomi-release.jks`.

**Đặt file `petomi-release.jks` vào thư mục:** `apps/moblie/android/app/`

> File `.jks` đã được `.gitignore` ignore sẵn → sẽ KHÔNG bị push lên git. Đúng như mong muốn.

---

## BƯỚC 2 — Tạo file `key.properties`

Vào thư mục `apps/moblie/android/`, copy file `key.properties.example` thành `key.properties`, rồi điền thông tin THẬT:

```properties
storePassword=<password keystore vừa tạo>
keyPassword=<password key vừa tạo>
keyAlias=petomi
storeFile=app/petomi-release.jks
```

> File `key.properties` cũng đã được `.gitignore` ignore → an toàn, không lên git.

Nếu để file `.jks` ở chỗ khác, sửa `storeFile` thành đường dẫn tuyệt đối, ví dụ:
`storeFile=C:/Users/thitr/keys/petomi-release.jks`

---

## BƯỚC 3 — Build file AAB để upload

Play Store yêu cầu file **AAB** (`.aab`), không nhận APK.

```bash
flutter clean
flutter pub get
flutter build appbundle --release
```

File AAB sẽ nằm ở:

```
apps/moblie/build/app/outputs/bundle/release/app-release.aab
```

> Cách kiểm tra app đã ký bằng release key (không phải debug):
> nếu `key.properties` tồn tại thì gradle tự ký release. Để chắc chắn, có thể chạy:
> `flutter build appbundle --release --verbose` và xem có dùng đúng keystore không.

**Test thử trên máy trước khi up (khuyến khích):**

```bash
flutter build apk --release
flutter install --release
```

---

## BƯỚC 4 — Upload lên Google Play Console

1. Truy cập https://play.google.com/console — cần tài khoản Google Play Developer (phí đăng ký **một lần $25**).
2. **Create app** → điền tên app, ngôn ngữ, loại app (App), miễn phí/trả phí.
3. Vào **Production → Create new release** → upload file `app-release.aab`.
4. Khuyến nghị bật **Play App Signing** (Google giữ key ký cuối cùng — an toàn hơn nếu lỡ mất keystore của bạn).
5. Hoàn thành các mục bắt buộc trong checklist của Play Console (xem phần dưới).

---

## CÒN CẦN CHUẨN BỊ (yêu cầu của Play Console, không nằm trong code)

Google bắt buộc các mục này trước khi app được duyệt:

- **Privacy Policy URL** — link chính sách bảo mật (bắt buộc nếu app thu thập dữ liệu / có đăng nhập). Có thể host miễn phí trên GitHub Pages.
- **App icon 512×512 px** (PNG) cho trang Store.
- **Feature graphic 1024×500 px**.
- **Screenshots** — tối thiểu 2 ảnh chụp màn hình điện thoại.
- **Mô tả ngắn + mô tả đầy đủ** của app.
- **Content rating** — trả lời bảng câu hỏi phân loại độ tuổi.
- **Data safety form** — khai báo app thu thập dữ liệu gì.
- **Target audience** — nhóm tuổi mục tiêu.

---

## LƯU Ý QUAN TRỌNG VỀ VERSION

Mỗi lần upload bản mới lên Play Store, **`versionCode` phải tăng** (1 → 2 → 3...).
Sửa trong `apps/moblie/pubspec.yaml`, ví dụ:

```yaml
version: 1.0.1+2   # 1.0.1 là versionName hiển thị, +2 là versionCode
```

(Bản đầu tiên hiện đang là `1.0.0+1` — ok cho lần submit đầu.)

---

## CHECKLIST KỸ THUẬT TRƯỚC KHI BUILD

- [ ] Đã tạo `petomi-release.jks` và đặt vào `android/app/`
- [ ] Đã tạo `android/key.properties` với đúng password
- [ ] Đã backup keystore + password ở nơi an toàn
- [ ] API production chạy HTTPS (vì cleartext HTTP đã bị chặn ở production)
- [ ] `flutter build appbundle --release` chạy thành công
- [ ] App mở được bình thường khi cài bản release (test minify không làm crash)
