# 🎯 PET ADVISOR AI - FEATURE LIST v7 (FINAL)

> **Complete Platform | Owner + Vet + Admin | Tích hợp phản biện & hoàn thiện**

## 🤖 AI CORE ENGINE (Shared)

| ID    | Tính năng                     | Mô tả                                                                                                            | Status  |
| :---- | :---------------------------- | :--------------------------------------------------------------------------------------------------------------- | :------ |
| AI-01 | **Urgency Pre-check 2-level** | 🔴 Critical: Bỏ qua GPT, push/SMS khẩn, gợi ý gọi hotline + PK gần nhất / 🟠 High: GPT+cảnh báo / 🟢 Normal: GPT | ✅ Core |
| AI-02 | **Intent Classifier**         | Rule-based: symptom/nutrition/vaccine/general/emergency                                                          | ✅ Core |
| AI-03 | **Context Validator**         | Kiểm tra loài, tuổi, cân nặng                                                                                    | ✅ Core |
| AI-04 | **RAG Retriever**             | pgvector + embedding-3-small, top 3 chunks                                                                       | ✅ Core |
| AI-05 | **Response Generator**        | GPT-4o-mini + RAG context                                                                                        | ✅ Core |
| AI-06 | **Memory Manager**            | Lưu 5 tin nhắn gần nhất                                                                                          | ✅ Core |
| AI-07 | **Cost Guardrail**            | Giới hạn 300 req/ngày                                                                                            | ✅ Core |
| AI-08 | **Simple Logger**             | Ghi nhận intent, urgency, tokens, cost, latency                                                                  | ✅ Core |
| AI-09 | **Fallback Handler**          | Hỏi thêm nếu thiếu context                                                                                       | ✅ Core |
| AI-10 | **Multi-language Support**    | Tiếng Việt, English (sẵn sàng mở rộng)                                                                           | ✅ Core |
| AI-11 | **Anti-abuse Guardrail**      | Phát hiện và chặn spam/troll request                                                                             | ✅ Core |

## 👤 PHẦN 1: CHỦ NUÔI (Pet Owner)

### 1.1 TÀI KHOẢN & BẢO MẬT

| ID     | Tính năng                  | Mô tả                            | Status          |
| :----- | :------------------------- | :------------------------------- | :-------------- |
| OW-0.1 | Đăng ký/Đăng nhập          | Email + OTP qua Mail             | ✅ Core         |
| OW-0.2 | Đăng nhập sinh trắc học    | Face ID / Touch ID / Fingerprint | ⭐ Nice to have |
| OW-0.3 | Role toggle Owner↔Vet      | Chuyển đổi mode nếu có clinic    | ✅ Core         |
| OW-0.4 | Quản lý thiết bị đăng nhập | Xem/khóa thiết bị lạ             | ✅ Core         |
| OW-0.5 | **Bảo mật 2 lớp (2FA)**    | TOTP cho thao tác nhạy cảm       | ⭐ Nice to have |
| OW-0.6 | **Mã PIN cho hồ sơ**       | Bảo vệ xem hồ sơ y tế            | ⭐ Nice to have |
| OW-0.7 | **Xóa dữ liệu**            | Right to be forgotten (GDPR)     | ✅ Core         |
| OW-0.8 | **Xuất dữ liệu cá nhân**   | Tải về toàn bộ dữ liệu           | ✅ Core         |

### 1.2 HỒ SƠ SỨC KHỎE SỐ

| ID      | Tính năng                     | Mô tả                                                                 | Status          |
| :------ | :---------------------------- | :-------------------------------------------------------------------- | :-------------- |
| OW-1.1  | Hồ sơ thú cưng duy nhất       | 1 ID suốt vòng đời                                                    | ✅ Core         |
| OW-1.2  | Thông tin cơ bản              | Tên, giống, tuổi, giới tính, cân nặng, màu lông…                      | ✅ Core         |
| OW-1.3  | **Ảnh hồ sơ**                 | Gallery ảnh pet theo thời gian                                        | ✅ Core         |
| OW-1.4  | Lịch sử tiêm phòng            | Loại, ngày, nhắc lại, lô vaccine, bác sĩ                              | ✅ Core         |
| OW-1.5  | Lịch sử khám bệnh             | Triệu chứng, chẩn đoán, đơn thuốc, xét nghiệm                         | ✅ Core         |
| OW-1.6  | Lịch sử chi phí y tế          | Phân loại theo dịch vụ (từ hóa đơn PK)                                | ✅ Core         |
| OW-1.7  | Chủ sở hữu kiểm soát dữ liệu  | Quyết định chia sẻ, thu hồi quyền                                     | ✅ Core         |
| OW-1.8  | Chia sẻ hồ sơ có kiểm soát    | Link/token tạm thời, chọn phạm vi                                     | ✅ Core         |
| OW-1.9  | Multi-pet management          | Quản lý nhiều pet                                                     | ✅ Core         |
| OW-1.10 | Family sharing                | Mời người thân (view/edit) – _truy cập đa người dùng vào đa thú cưng_ | ✅ Core         |
| OW-1.11 | Pet Passport / Vaccination QR | PDF/QR cho đi lại (nếu có đối tác xuất/nhập khẩu)                     | ⭐ Nice to have |
| OW-1.12 | **Import hồ sơ từ PK cũ**     | Nhập từ file Excel/PDF                                                | ⭐ Nice to have |
| OW-1.13 | **Backup hồ sơ**              | Tự động backup định kỳ (phía server)                                  | ✅ Core         |
| OW-1.14 | **Offline data cache**        | Xem hồ sơ cơ bản khi không có mạng                                    | ⭐ Nice to have |

### 1.3 AI CONSULTATION

| ID     | Tính năng               | Mô tả                                                               | Status          |
| :----- | :---------------------- | :------------------------------------------------------------------ | :-------------- |
| OW-2.1 | Chat với AI (RAG-based) | Nhập triệu chứng, nhận tư vấn                                       | ✅ Core         |
| OW-2.2 | Urgency Alert 2-level   | 🔴 Khẩn cấp: kèm hướng dẫn gọi hotline/PK / 🟠 Cao / 🟢 Bình thường | ✅ Core         |
| OW-2.3 | Vet Recommendation      | Mức độ cần đến bác sĩ                                               | ✅ Core         |
| OW-2.4 | Pre-visit Summary       | AI tổng hợp cho bác sĩ                                              | ✅ Core         |
| OW-2.5 | Lịch sử chat AI         | Tìm kiếm, xuất hội thoại                                            | ✅ Core         |
| OW-2.6 | Breed-Specific Tips     | Mẹo chăm sóc theo giống                                             | ⭐ Nice to have |
| OW-2.7 | **First Aid Guide**     | Hướng dẫn sơ cứu offline                                            | ⭐ Nice to have |
| OW-2.8 | **Poison Control**      | Tra cứu chất độc, cách xử lý                                        | ⭐ Nice to have |

### 1.4 SMART CLINIC LOCATOR

| ID      | Tính năng              | Mô tả                                            | Status          |
| :------ | :--------------------- | :----------------------------------------------- | :-------------- |
| OW-3.1  | Tìm phòng khám gần đây | Geo-location, bán kính 1-10km                    | ✅ Core         |
| OW-3.2  | Lọc thông minh         | Chuyên khoa, đánh giá, giá, 24/7                 | ✅ Core         |
| OW-3.3  | Thông tin chi tiết PK  | Địa chỉ, SĐT, giờ làm việc, dịch vụ, bác sĩ      | ✅ Core         |
| OW-3.4  | Đánh giá & review      | Xem và gửi đánh giá sau khám                     | ✅ Core         |
| OW-3.5  | Đặt lịch khám online   | Chọn ngày, giờ, bác sĩ, dịch vụ                  | ✅ Core         |
| OW-3.6  | Smart Booking từ AI    | AI detect urgency → gợi ý slot gấp               | ⭐ Nice to have |
| OW-3.7  | QR Check-in            | Quét tại quầy, vào hàng đợi                      | ✅ Core         |
| OW-3.8  | Real-time queue        | Xem số thứ tự, thời gian chờ                     | ⭐ Nice to have |
| OW-3.9  | Emergency Routing      | Chỉ đường nhanh nhất đến PK 24/7 (bản đồ cơ bản) | ✅ Core         |
| OW-3.10 | Hotline khẩn cấp       | Nút gọi nhanh PK gần nhất                        | ✅ Core         |
| OW-3.11 | **So sánh nhiều PK**   | So sánh giá, đánh giá, khoảng cách               | ⭐ Nice to have |
| OW-3.12 | **Yêu thích PK**       | Lưu phòng khám thường đến                        | ⭐ Nice to have |

### 1.5 POST-VISIT CARE

| ID     | Tính năng                   | Mô tả                                           | Status          |
| :----- | :-------------------------- | :---------------------------------------------- | :-------------- |
| OW-4.1 | Nhận kết quả khám           | Đơn thuốc, xét nghiệm, chẩn đoán (sync tự động) | ✅ Core         |
| OW-4.2 | Nhắc lịch tiêm phòng        | Push 3-7 ngày trước                             | ✅ Core         |
| OW-4.3 | Nhắc uống thuốc             | Theo đơn: liều, thời gian, tương tác            | ✅ Core         |
| OW-4.4 | Nhắc tái khám               | Từ lịch hẹn bác sĩ                              | ✅ Core         |
| OW-4.5 | Nhật ký sức khỏe            | Ghi chép ăn, uống, vệ sinh, hành vi             | ✅ Core         |
| OW-4.6 | Theo dõi xu hướng           | Biểu đồ cân nặng, hoạt động                     | ⭐ Nice to have |
| OW-4.7 | ~~Chat với PK~~             | _Đã gộp vào INT-11_                             | -               |
| OW-4.8 | **Yêu cầu tái khám online** | Không cần đến PK nếu ổn định                    | ⭐ Nice to have |
| OW-4.9 | **Gửi cập nhật cho bác sĩ** | Báo cáo tình trạng sau điều trị                 | ⭐ Nice to have |

### 1.6 DAILY CARE

| ID     | Tính năng           | Mô tả                                       | Status          |
| :----- | :------------------ | :------------------------------------------ | :-------------- |
| OW-5.1 | Kế hoạch dinh dưỡng | Khẩu phần theo giống, tuổi, cân nặng        | ✅ Core         |
| OW-5.2 | Gợi ý bài tập       | Hoạt động phù hợp                           | ✅ Core         |
| OW-5.3 | Nhắc tẩy giun, ve   | Định kỳ, tùy vùng miền                      | ✅ Core         |
| OW-5.4 | Thư viện kiến thức  | Bài viết, video (dùng cho RAG)              | ✅ Core         |
| OW-5.6 | Cảnh báo dịch bệnh  | Bệnh truyền nhiễm khu vực                   | ⭐ Nice to have |
| OW-5.7 | **Weight Tracker**  | Cân nặng định kỳ, cảnh báo đột ngột         | ✅ Core         |
| OW-5.8 | **Diet log**        | Ghi nhận thức ăn hàng ngày (mở rộng từ 4.5) | ⭐ Nice to have |

### 1.7 E-COMMERCE

| ID     | Tính năng                 | Mô tả                            | Status          |
| :----- | :------------------------ | :------------------------------- | :-------------- |
| OW-7.1 | **Mua thuốc online**      | Từ đơn của bác sĩ, giao tận nơi  | ⭐ Nice to have |
| OW-7.2 | **Mua thức ăn, phụ kiện** | Gợi ý theo giống, tuổi           | ⭐ Nice to have |
| OW-7.3 | **So sánh giá**           | Giá thuốc, thức ăn giữa các shop | ⭐ Nice to have |
| OW-7.4 | **Đặt dịch vụ tại nhà**   | Tắm, cắt tỉa, tiêm tận nơi       | ⭐ Nice to have |

### 1.8 IOT INTEGRATION

| ID     | Tính năng                     | Mô tả                    | Status          |
| :----- | :---------------------------- | :----------------------- | :-------------- |
| OW-8.1 | Kết nối vòng cổ thông minh    | Đồng bộ dữ liệu          | ⭐ Nice to have |
| OW-8.2 | Theo dõi vận động             | Bước chân, quãng đường   | ⭐ Nice to have |
| OW-8.3 | Theo dõi nhịp tim             | Cảnh báo bất thường      | ⭐ Nice to have |
| OW-8.4 | Theo dõi nhiệt độ             | Phát hiện sốt            | ⭐ Nice to have |
| OW-8.5 | Theo dõi vị trí GPS           | Tìm pet đi lạc           | ⭐ Nice to have |
| OW-8.6 | Phân tích giấc ngủ            | Thời lượng, chất lượng   | ⭐ Nice to have |
| OW-8.7 | Theo dõi ăn uống              | Lượng calo, thời gian ăn | ⭐ Nice to have |
| OW-8.8 | Cảnh báo bất thường real-time | Thông báo ngay           | ⭐ Nice to have |

### 1.9 INSURANCE

| ID     | Tính năng              | Mô tả                       | Status          |
| :----- | :--------------------- | :-------------------------- | :-------------- |
| OW-9.1 | **Tìm gói bảo hiểm**   | So sánh bảo hiểm thú cưng   | ⭐ Nice to have |
| OW-9.2 | **Mua bảo hiểm**       | Tích hợp trong app          | ⭐ Nice to have |
| OW-9.3 | **Yêu cầu bồi thường** | Nộp hồ sơ, theo dõi tiến độ | ⭐ Nice to have |
| OW-9.4 | **Lịch sử bảo hiểm**   | Gói đang dùng, đã hết hạn   | ⭐ Nice to have |

## 🏥 PHẦN 2: VET PORTAL

### 2.1 ACCOUNT SETUP

| ID     | Tính năng               | Mô tả                                      | Status  |
| :----- | :---------------------- | :----------------------------------------- | :------ |
| VT-0.1 | Đăng ký phòng khám      | Thông tin, giấy phép, trạng thái chờ duyệt | ✅ Core |
| VT-0.2 | Quản lý subscription    | Nâng cấp/hạ cấp gói                        | ✅ Core |
| VT-0.3 | Thanh toán subscription | Thẻ, chuyển khoản                          | ✅ Core |
| VT-0.4 | Multi-user management   | Thêm/xóa nhân viên, phân quyền             | ✅ Core |
| VT-0.5 | Audit log               | Lịch sử thao tác nhân viên                 | ✅ Core |

### 2.2 CLINIC MANAGEMENT

| ID     | Tính năng             | Mô tả                                                               | Status          |
| :----- | :-------------------- | :------------------------------------------------------------------ | :-------------- |
| VT-1.1 | Trang web PK có sẵn   | Template giới thiệu, đặt lịch                                       | ⭐ Nice to have |
| VT-1.2 | Custom domain         | Tên miền riêng cho PK                                               | ⭐ Nice to have |
| VT-1.3 | Quản lý thông tin PK  | Logo, địa chỉ, giờ, chuyên khoa                                     | ✅ Core         |
| VT-1.4 | Quản lý bác sĩ thú y  | Hồ sơ, lịch làm việc                                                | ✅ Core         |
| VT-1.5 | Dịch vụ & bảng giá    | Tạo danh mục, giá, khuyến mãi                                       | ✅ Core         |
| VT-1.6 | **Quản lý kho thuốc** | Nhập/xuất, tồn kho, cảnh báo hết hạn (cơ bản, chưa lô/nhà cung cấp) | ✅ Core         |
| VT-1.7 | Quản lý nhân viên     | Lễ tân, kỹ thuật viên, phân quyền                                   | ✅ Core         |
| VT-1.8 | Quản lý phòng/chuồng  | Phòng khám, phòng mổ, chuồng nội trú                                | ⭐ Nice to have |
| VT-1.9 | Quản lý thiết bị y tế | Máy X-quang, siêu âm, bảo trì                                       | ⭐ Nice to have |

### 2.3 PATIENT MANAGEMENT

| ID      | Tính năng                | Mô tả                              | Status          |
| :------ | :----------------------- | :--------------------------------- | :-------------- |
| VT-2.1  | Tiếp nhận bệnh nhân      | Check-in QR hoặc tìm kiếm          | ✅ Core         |
| VT-2.2  | Xem hồ sơ pet shared     | Full history từ owner share        | ✅ Core         |
| VT-2.3  | Xem AI pre-check summary | Triệu chứng, urgency, intent       | ✅ Core         |
| VT-2.4  | Tạo phiếu khám           | Ghi chép triệu chứng, tiền sử      | ✅ Core         |
| VT-2.5  | Chẩn đoán & kê đơn       | ICD code, đơn thuốc từ kho         | ✅ Core         |
| VT-2.6  | Chỉ định xét nghiệm      | Máu, nước tiểu, X-quang, siêu âm   | ✅ Core         |
| VT-2.7  | Nhập kết quả xét nghiệm  | Upload file, nhập số liệu          | ✅ Core         |
| VT-2.8  | Cập nhật hồ sơ chung     | Sync về Owner app ngay             | ✅ Core         |
| VT-2.9  | Xuất giấy chứng nhận     | Sức khỏe, tiêm phòng, Pet passport | ✅ Core         |
| VT-2.10 | Lập kế hoạch điều trị    | Lịch tái khám, liệu trình          | ✅ Core         |
| VT-2.11 | Theo dõi nội trú         | Nhập viện, theo dõi post-op        | ⭐ Nice to have |
| VT-2.12 | Phẫu thuật log           | Ghi chép phẫu thuật, gây mê        | ⭐ Nice to have |

### 2.4 SCHEDULING

| ID     | Tính năng                 | Mô tả                             | Status          |
| :----- | :------------------------ | :-------------------------------- | :-------------- |
| VT-3.1 | Lịch làm việc bác sĩ      | Set khung giờ, ngày nghỉ          | ✅ Core         |
| VT-3.2 | Tiếp nhận booking online  | Từ Owner app                      | ✅ Core         |
| VT-3.3 | Quản lý lịch hẹn          | Xác nhận, hủy, đổi, push về owner | ✅ Core         |
| VT-3.4 | Phân loại lịch hẹn        | Khám, tiêm, phẫu thuật, cấp cứu   | ✅ Core         |
| VT-3.5 | Real-time queue           | Gọi số, ước tính chờ              | ⭐ Nice to have |
| VT-3.6 | Lịch phẫu thuật & nội trú | Phòng mổ, chuồng                  | ⭐ Nice to have |
| VT-3.7 | Block time                | Khóa slot cho cấp cứu, nghỉ       | ✅ Core         |
| VT-3.8 | Recurring appointments    | Lịch tái khám định kỳ tự động     | ✅ Core         |

### 2.5 BILLING

| ID     | Tính năng                    | Mô tả                              | Status          |
| :----- | :--------------------------- | :--------------------------------- | :-------------- |
| VT-4.1 | Tạo hóa đơn tự động          | Dịch vụ + thuốc + xét nghiệm       | ✅ Core         |
| VT-4.2 | Nhiều phương thức thanh toán | Tiền mặt, chuyển khoản, ví, thẻ    | ✅ Core         |
| VT-4.3 | Quản lý công nợ              | Theo dõi khách nợ, nhắc tự động    | ✅ Core         |
| VT-4.4 | Hóa đơn VAT                  | Tích hợp hóa đơn điện tử           | ⭐ Nice to have |
| VT-4.5 | Báo cáo doanh thu            | Theo ngày/tháng/bác sĩ/dịch vụ     | ✅ Core         |
| VT-4.6 | Dashboard tổng quan          | Lượt khám, doanh thu, khách mới/cũ | ✅ Core         |
| VT-4.7 | Báo cáo thuế                 | Tổng hợp cho kế toán               | ⭐ Nice to have |
| VT-4.8 | Chi phí vận hành             | Nhập chi phí thuốc, điện, nước     | ⭐ Nice to have |

### 2.6 CRM

| ID     | Tính năng                | Mô tả                           | Status          |
| :----- | :----------------------- | :------------------------------ | :-------------- |
| VT-5.1 | Hồ sơ khách hàng (CRM)   | Thông tin, lịch sử, tần suất    | ✅ Core         |
| VT-5.2 | Gửi nhắc lịch tự động    | SMS/Zalo/App: tiêm, tái khám    | ✅ Core         |
| VT-5.3 | Chương trình thân thiết  | Tích điểm, giảm giá, tier       | ✅ Core         |
| VT-5.4 | Gửi khuyến mãi targeting | Theo nhóm: chưa khám 6 tháng... | ⭐ Nice to have |
| VT-5.5 | Thu thập đánh giá        | Mời đánh giá sau khám           | ✅ Core         |
| VT-5.7 | Email marketing          | Gửi newsletter, tips chăm sóc   | ⭐ Nice to have |
| VT-5.8 | Referral program         | Giới thiệu bạn bè, nhận ưu đãi  | ⭐ Nice to have |

### 2.7 ANALYTICS

| ID     | Tính năng                | Mô tả                         | Status          |
| :----- | :----------------------- | :---------------------------- | :-------------- |
| VT-6.1 | Thống kê bệnh lý         | Bệnh theo mùa, giống, khu vực | ⭐ Nice to have |
| VT-6.2 | Báo cáo hiệu suất bác sĩ | Số ca, doanh thu, đánh giá    | ⭐ Nice to have |
| VT-6.3 | Dự báo xu hướng          | AI gợi ý thuốc cần nhập       | ⭐ Nice to have |
| VT-6.4 | Xuất báo cáo             | Excel, PDF cho kế toán        | ⭐ Nice to have |
| VT-6.6 | Patient outcome tracking | Tỷ lệ khỏi, tái phát          | ⭐ Nice to have |

### 2.8 AI COLLABORATION

| ID     | Tính năng                  | Mô tả                        | Status          |
| :----- | :------------------------- | :--------------------------- | :-------------- |
| VT-7.1 | Validate AI prediction     | Đánh giá đúng/sai/không chắc | ✅ Core         |
| VT-7.2 | Feedback to RAG model      | Chẩn đoán thực → Cập nhật KB | ✅ Core         |
| VT-7.3 | View AI confidence score   | Xem độ tin cậy của AI        | ✅ Core         |
| VT-7.4 | Contribute case study      | Case đặc biệt → Train AI     | ⭐ Nice to have |
| VT-7.5 | AI suggestion in diagnosis | Gợi ý chẩn đoán differential | ✅ Core         |

### 2.9 INTEGRATIONS

| ID     | Tính năng                         | Mô tả                               | Status          |
| :----- | :-------------------------------- | :---------------------------------- | :-------------- |
| VT-8.1 | Kết nối lab xét nghiệm            | Nhận kết quả tự động                | ⭐ Nice to have |
| VT-8.2 | Kết nối nhà cung cấp              | Đặt thuốc, cập nhật tồn kho         | ⭐ Nice to have |
| VT-8.3 | Telemedicine dashboard            | Quản lý video call                  | ⭐ Nice to have |
| VT-8.4 | API cho bên thứ 3                 | Kế toán, bảo hiểm                   | ✅ Core         |
| VT-8.5 | Kết nối bảo hiểm                  | Xác nhận bảo hiểm, bồi thường       | ⭐ Nice to have |
| VT-8.6 | **External pharmacy integration** | Gửi đơn thuốc điện tử đến nhà thuốc | ⭐ Nice to have |

## 🔧 PHẦN 3: ADMIN

| ID    | Tính năng                   | Mô tả                                          | Status          |
| :---- | :-------------------------- | :--------------------------------------------- | :-------------- |
| AD-1  | User management             | Quản lý owner, vet, ban/unban                  | ✅ Core         |
| AD-2  | **Clinic verification**     | Quy trình duyệt: pending → approved → rejected | ✅ Core         |
| AD-3  | Content moderation          | Review đánh giá, forum posts                   | ✅ Core         |
| AD-4  | Knowledge base management   | Thêm/sửa tài liệu y khoa cho RAG               | ✅ Core         |
| AD-5  | AI model monitoring         | Urgency accuracy, cost tracking                | ✅ Core         |
| AD-6  | Platform analytics          | DAU, MAU, retention, churn                     | ✅ Core         |
| AD-7  | Revenue dashboard           | MRR, ARPU, LTV theo segment                    | ✅ Core         |
| AD-8  | Support ticket system       | Tiếp nhận, phân loại, xử lý                    | ✅ Core         |
| AD-9  | Announcement system         | Gửi thông báo toàn hệ thống                    | ✅ Core         |
| AD-10 | Feature flags               | Bật/tắt tính năng theo region                  | ✅ Core         |
| AD-11 | A/B testing setup           | Test thay đổi UI, pricing                      | ⭐ Nice to have |
| AD-12 | Security monitoring         | Log đăng nhập, phát hiện bất thường            | ✅ Core         |
| AD-13 | Data backup & recovery      | Backup định kỳ, restore                        | ✅ Core         |
| AD-14 | GDPR compliance tools       | Xóa dữ liệu, xuất dữ liệu user                 | ✅ Core         |
| AD-15 | API rate limiting           | Quản lý quota theo tier                        | ✅ Core         |
| AD-16 | Vet payout management       | Thanh toán cho PK (nếu có marketplace)         | ⭐ Nice to have |
| AD-17 | Fraud detection             | Phát hiện booking giả, review fake             | ⭐ Nice to have |
| AD-18 | System health monitoring    | Uptime, latency, error rate                    | ✅ Core         |
| AD-20 | Documentation & help center | Viết/maintain docs cho user                    | ✅ Core         |
| AD-21 | **Auto retention & purge**  | Tự động xóa dữ liệu sau X năm theo GDPR        | ✅ Core         |

## 🔗 PHẦN 4: INTEGRATION LAYER

| ID     | Tính năng                    | Mô tả                                        | Status          |
| :----- | :--------------------------- | :------------------------------------------- | :-------------- |
| INT-1  | Unified Health Record        | Dữ liệu sức khỏe duy nhất                    | ✅ Core         |
| INT-2  | Smart Booking Bridge         | AI urgency → Slot gấp                        | ✅ Core         |
| INT-3  | Pre-visit AI Summary         | Tổng hợp cho bác sĩ                          | ✅ Core         |
| INT-4  | Real-time 2-way Sync         | Cập nhật đồng thời                           | ✅ Core         |
| INT-5  | Shared Payment Flow          | Owner trả → Vet xác nhận                     | ✅ Core         |
| INT-6  | Notification Hub             | Push/Email/SMS/In-app (tất cả kênh)          | ✅ Core         |
| INT-7  | AI Training Feedback Loop    | Vet → AI → All users                         | ✅ Core         |
| INT-8  | **Offline sync**             | Hàng đợi đồng bộ khi có mạng                 | ⭐ Nice to have |
| INT-9  | **Data export/import**       | Migration, backup                            | ✅ Core         |
| INT-10 | **Notification Preferences** | Cấu hình kênh, giờ yên lặng cho Owner + Vet  | ✅ Core         |
| INT-11 | **Two-way Chat**             | Chat giữa chủ nuôi và phòng khám (ảnh, text) | ✅ Core         |

## 📊 TỔNG KẾT

| Phân loại       | Số lượng |
| :-------------- | :------- |
| ✅ Core         | **103**  |
| ⭐ Nice to have | **52**   |
| 🔮 Phase 2+     | **3**    |
| **Tổng**        | **158**  |
