# Reminder System — User Flow

## Tổng quan

Hệ thống Reminder giúp người dùng **không bỏ lỡ** các sự kiện quan trọng liên quan đến thú cưng: lịch tái khám, tiêm vaccine, giờ uống thuốc.

---

## Luồng người dùng (User Story)

### 1. Reminder được tạo tự động

**Trigger:** Người dùng thực hiện một trong các hành động sau:

| Hành động | Reminder được tạo |
|-----------|------------------|
| Đặt lịch hẹn tái khám | Nhắc trước X ngày (mặc định 2 ngày) |
| Thêm bệnh án vaccine | Nhắc trước X ngày (mặc định 7 ngày) |
| Thêm bệnh án thuốc | Nhắc 2 lần/ngày (8h sáng, 20h tối) trong suốt疗程 |

**Ví dụ thực tế:**

> Ngày 01/06/2026, Minh đặt lịch tái khám cho mèo "Mimi" vào ngày 10/06/2026.
> Hệ thống tự tạo reminder: **"Nhắc tái khám cho Mimi"** — thời gian nhắc: **08/06/2026, 9:00** (trước 2 ngày).

**Lưu ý:**
- Nếu người dùng **tắt** loại reminder đó trong cài đặt → hệ thống **không tạo** reminder.
- Nếu thời điểm nhắc đã qua thời điểm hiện tại → reminder **không được tạo**.

---

### 2. Nhận thông báo

Khi đến thời điểm nhắc nhở:

```
┌──────────────────────────────────────────────┐
│  📱 Thông báo trên App (SignalR - Real-time) │
│  "Nhắc tiêm vaccine: vaccine dại dại cho Mèo" │
│  Thời gian: 01/06/2026 09:00               │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│  📧 Email thông báo                          │
│  Tiêu đề: "PetOmi - Nhắc nhở lịch tiêm..."  │
│  Nội dung: Thông tin chi tiết về reminder     │
└──────────────────────────────────────────────┘
```

- **SignalR**: Thông báo hiện ngay trên app khi đang mở (không cần reload).
- **Email**: Gửi kèm để đề phòng app không mở.

---

### 3. Xem danh sách Reminder

Người dùng có thể xem tất cả reminder của mình:

```
Trang Reminder:
┌────────────────────────────────────────────┐
│ 🔔 Reminders của tôi                        │
├────────────────────────────────────────────┤
│ ✅ Đã gửi                                   │
│   ├─ [Vaccine] Vaccine dại dại - Mimi       │
│   │     Đã gửi lúc 01/06/2026 09:00        │
│   └─ [Vaccine] Vaccine dại dại - Mimi       │
│         Đã gửi lúc 01/06/2026 09:05        │
├────────────────────────────────────────────┤
│ ⏳ Sắp tới                                   │
│   ├─ [Recheck] Nhắc tái khám - Mimi         │
│   │     08/06/2026 09:00                   │
│   └─ [Medication] Nhắc uống thuốc - Mèo     │
│         05/06/2026 08:00 (lặp lại)          │
├────────────────────────────────────────────┤
│ ❌ Đã bỏ qua                                 │
│   └─ [Vaccine] Vaccine dại dại - Mèo        │
│         Bỏ qua lúc 01/06/2026 10:00        │
└────────────────────────────────────────────┘
```

---

### 4. Bỏ qua (Dismiss) Reminder

Khi người dùng nhận thấy đã xử lý reminder rồi, có thể bỏ qua:

> Minh nhận thấy Mimi đã uống thuốc rồi → bấm "Bỏ qua" → reminder không hiện lại.

- Reminder bị đánh dấu `DismissedAt` → không gửi lại.
- Với reminder **lặp lại** (repeat): chỉ bỏ qua lần này, lần nhắc tiếp theo vẫn được gửi.

---

### 5. Tắt / Bật Reminder (Toggle)

Người dùng có thể tạm dừng một reminder cụ thể:

> Minh đi công tác 1 tuần → bấm tắt reminder thuốc → không nhận thông báo trong thời gian đó.

- `IsEnabled = false` → reminder không được gửi nhưng **vẫn tồn tại** trong DB.
- Bật lại → reminder tiếp tục hoạt động bình thường.

---

### 6. Cài đặt Reminder Preference

Người dùng cấu hình cách reminder hoạt động cho từng loại:

```
Trang Cài đặt Reminder:
┌──────────────────────────────────────────────────────────┐
│ 🔔 Cài đặt thông báo nhắc nhở                           │
├──────────────────────────────────────────────────────────┤
│ 💉 Vaccine                                    [Bật]      │
│    Nhắc trước: [7] ngày                                 │
├──────────────────────────────────────────────────────────┤
│ 🗓️ Tái khám                                 [Bật]       │
│    Nhắc trước: [2] ngày                                 │
├──────────────────────────────────────────────────────────┤
│ 💊 Thuốc                                       [Bật]     │
│    Nhắc trước: [1] giờ                                 │
├──────────────────────────────────────────────────────────┤
│ 🔔 Thông báo chung                           [Tắt]       │
│    Nhắc trước: [1] ngày                                 │
└──────────────────────────────────────────────────────────┘
```

**Ý nghĩa:**
- **Bật/Tắt**: Bật = nhận reminder loại này, Tắt = hệ thống không tạo reminder mới cho loại này.
- **Nhắc trước X ngày**: Thời điểm nhắc = ngày sự kiện - X ngày.

---

### 7. Reminder lặp lại (Repeat)

Với bệnh án thuốc, reminder tự động lặp lại theo ngày:

> Ngày 01/06 – 10/06, Mèo cần uống thuốc 2 lần/ngày.
> → Hệ thống tạo 20 reminder (2 lần × 10 ngày).
> → Sau mỗi lần nhắc, hệ thống tự tạo reminder tiếp theo cho đến ngày cuối (`RepeatUntil`).

```
01/06 08:00 → 01/06 20:00 → 02/06 08:00 → ... → 10/06 20:00
  ✅          ✅           ✅                    ✅
```

---

## Tóm tắt hành động người dùng

| Hành động | Mô tả |
|-----------|--------|
| **Tạo bệnh án / lịch hẹn** | Hệ thống tự tạo reminder |
| **Nhận thông báo** | SignalR real-time + Email |
| **Xem danh sách** | Xem tất cả reminder (đã gửi, sắp tới, đã bỏ qua) |
| **Bỏ qua (Dismiss)** | Đánh dấu đã xử lý, không hiện lại lần này |
| **Tắt/Bật (Toggle)** | Tạm dừng reminder cụ thể |
| **Cài đặt Preference** | Bật/tắt theo loại, chỉnh số ngày nhắc trước |

## Khi xảy ra lỗi (Error Handling)

### Chi tiết từng trường hợp

#### 1. SignalR gửi thất bại

```
ReminderProcessorService polling loop
    │
    ├─ ProcessPendingRemindersAsync()
    │       └─ dispatcher.DispatchReminderAsync()
    │               ├─ user tồn tại ✅
    │               └─ SendToUserAsync() ──❌─ throws (Hub disconnect / network lag)
    │
    ├─ ❌ Exception propagate lên
    │       → reminder KHÔNG được mark là đã gửi
    │       → KHÔNG gọi reminderRepo.UpdateAsync()
    │
    └─ 1 phút sau, poll lại → thử gửi lại (đúng) ✅
```

SignalR **không** có try-catch riêng → nếu fail, exception đẩy lên `ProcessPendingRemindersAsync` → reminder **không được mark là đã gửi** → sẽ được thử lại ở poll tiếp theo.

---

#### 2. Email gửi thất bại

```
dispatcher.DispatchReminderAsync()
    ├─ user tồn tại ✅
    ├─ SendToUserAsync() ──✅─ SignalR gửi thành công
    │
    └─ emailService.SendReminderEmailAsync()
            │
            └─ ❌ SMTP lỗi / email không tồn tại
                    │
                    └─ catch (swallow) → log → tiếp tục bình thường ✅
```

Email có try-catch riêng → nếu fail, chỉ log lỗi và **tiếp tục** bình thường. Reminder vẫn được mark là đã gửi. SignalR gửi thành công là quan trọng nhất.

---

#### 3. User không tồn tại

```
dispatcher.DispatchReminderAsync()
    ├─ userRepository.GetByIdAsync() ──❌─ null
    │       │
    │       └─ ❌ throw InvalidOperationException
    │
    └─ ⚠️ Exception propagate lên ReminderProcessorService
            → reminder KHÔNG được mark là đã gửi
            → 1 phút sau, poll lại → retry ✅
```

**Đã sửa:** Thay vì return khi user null, giờ throw exception → `MarkAsSent()` không bị gọi nhầm → reminder sẽ được retry ở poll tiếp theo.

---

#### 4. GenerateNextOccurrence thất bại

```
GenerateNextOccurrenceAsync()
    ├─ ParseRepeatRule() ──❌─ JSON corrupt
    │       └─ catch → log → tiếp tục ✅
    │
    ├─ CalculateNextRemindAt() ──❌
    │       └─ catch → log → tiếp tục ✅
    │
    └─ ReminderRepository.AddAsync() ──❌─ DB lỗi
            └─ catch → log → tiếp tục ✅
```

Reminder **vẫn được mark là đã gửi** bình thường. Chỉ không tạo được reminder tiếp theo.

---

#### 5. ReminderProcessorService bị crash

```
ExecuteAsync loop
    ├─ try
    │       └─ ProcessPendingRemindersAsync() ──❌─ Unhandled exception
    │
    └─ catch
            ├─ Log: "Error processing pending reminders"
            └─ Vòng lặp TIẾP TỤC, service KHÔNG crash ✅
```

Outer try-catch trong `ExecuteAsync` → service không bao giờ crash vì exception. Tiếp tục polling bình thường.

---

### Tóm tắt error handling

| Trường hợp | Xử lý | Reminder mark đã gửi? |
|-------------|--------|----------------------|
| SignalR fail | ✅ Catch ở processor → retry 1 phút sau | ❌ Không (đúng) |
| Email fail | ✅ Catch riêng, swallow | ✅ Có |
| User not found | ✅ Throw exception → retry ở poll tiếp theo | ❌ Không (đã sửa) |
| GenerateNextOccurrence fail | ✅ Catch riêng, swallow | ✅ Có |
| Processor crash loop | ✅ Outer catch, tiếp tục polling | — |

> **Đã sửa:** Trước đây user not found chỉ log và return → `MarkAsSent()` vẫn được gọi nhầm. Giờ throw exception để reminder được retry ở poll tiếp theo.

---

### Retry logic tự động

```
09:00  — Reminder đến giờ (chưa poll)
09:01  — Poll #1: SignalR fail → retry (IsSent vẫn false)
09:02  — Poll #2: SignalR fail → retry (IsSent vẫn false)
09:03  — Poll #3: SignalR success → MarkAsSent ✅

→ Reminder vẫn được gửi thành công, chỉ chậm 3 phút
```

Vì `IsSent = false` cho đến khi thành công, mỗi poll sẽ tự động retry cho đến khi gửi được.

---

## Trạng thái Reminder

```
[IsEnabled = true] ──toggle──► [IsEnabled = false] (tạm dừng)
        │
        ▼
[IsSent = false] ──khi đến giờ──► [IsSent = true] (đã gửi)
        │
        ▼ (nếu có RepeatRule)
   [Reminder tiếp theo được tạo tự động]
        │
        ▼
[IsSent = false] ──dispatch──► [IsSent = true]
        │
        ▼
[DismissedAt = null] ──dismiss──► [DismissedAt = timestamp] (bỏ qua)
```

---

## Quy tắc

1. **Reminder chỉ được gửi 1 lần** — sau khi gửi, `IsSent = true`.
2. **User có thể bỏ qua (dismiss)** — `DismissedAt` được ghi, không gửi nữa.
3. **RepeatRule tự động tạo reminder tiếp theo** — nếu chưa vượt quá `RepeatUntil`.
4. **Người dùng kiểm soát** — qua `ReminderPreference`, có thể tắt từng loại reminder.
5. **SignalR + Email song song** — một kênh fail không ảnh hưởng kênh kia.
6. **Retry tự động** — nếu gửi fail, poll tiếp theo sẽ thử lại.
7. **Service không crash** — `ReminderProcessorService` có outer try-catch, không bao giờ dừng vì exception.
