-- ===================================================================
-- PET ADVISOR AI - AUTH DATABASE (FINAL - CHỐT ĐƠN)
-- UNIQUE được giữ trên UserDevices, bỏ trên VetClinic.
-- Mỗi field có comment, không trigger/index/proc ngoại trừ UNIQUE constraint.
-- ===================================================================
CREATE DATABASE PetOmni_DB;

GO
USE PetOmni_DB;
GO

-- 1. Users - thông tin xác thực đăng nhập
CREATE TABLE Users (
    UserID              UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWSEQUENTIALID(), -- Khóa chính GUID, tự sinh tuần tự
    Email               NVARCHAR(255)    NOT NULL,                                       -- Email gốc (có thể viết hoa/thường)
    NormalizedEmail     NVARCHAR(255)    NOT NULL UNIQUE,                                -- Email chuẩn hóa viết thường, login case-insensitive
    PasswordHash        NVARCHAR(255)    NOT NULL,                                       -- Mật khẩu đã hash (bcrypt/argon2)
    EmailVerified       BIT              NOT NULL DEFAULT 0,                             -- Đã xác thực email chưa (0=chưa,1=rồi)
    FailedLoginAttempts INT              NOT NULL DEFAULT 0,                             -- Số lần đăng nhập sai liên tiếp (chống brute force)
    LockoutUntil        DATETIME         NULL,                                           -- Khóa tài khoản đến thời điểm này (NULL = không khóa)
    CreatedAt           DATETIME         NOT NULL DEFAULT GETUTCDATE(),                  -- Thời điểm tạo tài khoản (UTC)
    UpdatedAt           DATETIME         NULL,                                           -- Lần cập nhật gần nhất
    LastLoginAt         DATETIME         NULL,                                           -- Lần đăng nhập thành công cuối cùng
    DeletedAt           DATETIME         NULL,                                           -- Xóa mềm (GDPR right to be forgotten)
    IsActive            BIT              NOT NULL DEFAULT 1                              -- Tài khoản còn hoạt động? (0=khóa,1=ok)
);

-- 2. UserProfiles - thông tin cá nhân (tách biệt xác thực)
CREATE TABLE UserProfiles (
    ProfileID   UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWSEQUENTIALID(), -- Khóa chính GUID
    UserID      UNIQUEIDENTIFIER NOT NULL UNIQUE,                                -- Liên kết Users, UNIQUE đảm bảo 1-1
    FullName    NVARCHAR(100)    NULL,                                           -- Họ và tên đầy đủ
    Phone       NVARCHAR(20)     NULL,                                           -- Số điện thoại liên hệ
    AvatarURL   NVARCHAR(500)    NULL,                                           -- Đường dẫn ảnh đại diện
    DateOfBirth DATE             NULL,                                           -- Ngày sinh (dùng cho gợi ý sức khỏe)
    Gender      NVARCHAR(10)     NULL CHECK (Gender IN ('Male', 'Female', 'Other', NULL)), -- Giới tính, ràng buộc giá trị
    Address     NVARCHAR(500)    NULL,                                           -- Địa chỉ liên hệ
    CreatedAt   DATETIME         NOT NULL DEFAULT GETUTCDATE(),                  -- Thời điểm tạo profile
    UpdatedAt   DATETIME         NULL,                                           -- Thời điểm cập nhật
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

-- 3. Roles - vai trò hệ thống (global)
CREATE TABLE Roles (
    RoleID   UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWSEQUENTIALID(), -- Khóa chính
    RoleName NVARCHAR(50)     NOT NULL UNIQUE                                 -- Tên vai trò: 'Owner', 'Vet', 'Admin'
);

-- 4. Permissions - danh sách quyền (global)
CREATE TABLE Permissions (
    PermissionID   UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWSEQUENTIALID(), -- Khóa chính
    PermissionName NVARCHAR(100)    NOT NULL UNIQUE,                                -- Tên quyền, ví dụ 'user:delete'
    Description    NVARCHAR(255)    NULL                                            -- Mô tả quyền
);

-- 5. RolePermissions - gán quyền cho vai trò global
CREATE TABLE RolePermissions (
    RolePermissionID UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWSEQUENTIALID(), -- Khóa chính
    RoleID           UNIQUEIDENTIFIER NOT NULL,                                       -- Vai trò global
    PermissionID     UNIQUEIDENTIFIER NOT NULL,                                       -- Quyền
    CONSTRAINT UQ_RolePermissions UNIQUE (RoleID, PermissionID),                      -- Mỗi cặp (role, permission) chỉ 1 lần
    FOREIGN KEY (RoleID) REFERENCES Roles(RoleID),
    FOREIGN KEY (PermissionID) REFERENCES Permissions(PermissionID)
);

-- 6. UserRoles - gán vai trò global cho người dùng
CREATE TABLE UserRoles (
    UserRoleID UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWSEQUENTIALID(), -- Khóa chính
    UserID     UNIQUEIDENTIFIER NOT NULL,                                       -- Người dùng
    RoleID     UNIQUEIDENTIFIER NOT NULL,                                       -- Vai trò global
    CONSTRAINT UQ_UserRoles UNIQUE (UserID, RoleID),                            -- Mỗi user chỉ 1 lần gán role
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (RoleID) REFERENCES Roles(RoleID)
);

-- 7. Clinics - phòng khám thú y (có quy trình duyệt)
CREATE TABLE Clinics (
    ClinicID          UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWSEQUENTIALID(), -- Khóa chính
    ClinicName        NVARCHAR(200)    NOT NULL,                                       -- Tên phòng khám
    Address           NVARCHAR(500)    NULL,                                           -- Địa chỉ
    Phone             NVARCHAR(20)     NULL,                                           -- Số điện thoại
    Email             NVARCHAR(255)    NULL,                                           -- Email liên hệ
    LicenseNumber     NVARCHAR(100)    NULL UNIQUE,                                    -- Số giấy phép, UNIQUE chống trùng
    Status            NVARCHAR(20)     NOT NULL DEFAULT 'Pending' CHECK (Status IN ('Pending', 'Approved', 'Rejected')), -- Trạng thái duyệt
    RejectedReason    NVARCHAR(500)    NULL,                                           -- Lý do từ chối (nếu Rejected)
    ReviewedByAdminID UNIQUEIDENTIFIER NULL,                                           -- ID admin đã duyệt/từ chối
    CreatedAt         DATETIME         NOT NULL DEFAULT GETUTCDATE(),                  -- Ngày tạo
    UpdatedAt         DATETIME         NULL,                                           -- Ngày cập nhật
    FOREIGN KEY (ReviewedByAdminID) REFERENCES Users(UserID)
);

-- 8. VetProfiles - thông tin cố định của bác sĩ (không gắn clinic cứng)
CREATE TABLE VetProfiles (
    VetProfileID   UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWSEQUENTIALID(), -- Khóa chính
    UserID         UNIQUEIDENTIFIER NOT NULL UNIQUE,                                -- Liên kết Users, 1-1
    LicenseNumber  NVARCHAR(100)    NULL,                                           -- Chứng chỉ hành nghề
    Specialization NVARCHAR(255)    NULL,                                           -- Chuyên khoa
    IsActive       BIT              NOT NULL DEFAULT 1,                             -- Còn hoạt động không
    CreatedAt      DATETIME         NOT NULL DEFAULT GETUTCDATE(),                  -- Ngày tạo
    UpdatedAt      DATETIME         NULL,                                           -- Ngày cập nhật
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

-- 9. VetClinicRoles - danh mục role trong clinic (clinic-level roles)
CREATE TABLE VetClinicRoles (
    RoleID   UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWSEQUENTIALID(), -- Khóa chính
    RoleName NVARCHAR(100)    NOT NULL UNIQUE                                 -- 'PrimaryVet', 'Assistant', 'Visiting'
);

-- 10. VetClinicRolePermissions - gán quyền cho từng role trong clinic
CREATE TABLE VetClinicRolePermissions (
    ID           UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWSEQUENTIALID(), -- Khóa chính
    RoleID       UNIQUEIDENTIFIER NOT NULL,                                       -- Liên kết VetClinicRoles
    PermissionID UNIQUEIDENTIFIER NOT NULL,                                       -- Liên kết Permissions
    CONSTRAINT UQ_VetClinicRolePermissions UNIQUE (RoleID, PermissionID),         -- Mỗi role chỉ 1 lần gán quyền
    FOREIGN KEY (RoleID) REFERENCES VetClinicRoles(RoleID),
    FOREIGN KEY (PermissionID) REFERENCES Permissions(PermissionID)
);

-- 11. VetClinic - bảng liên kết bác sĩ với phòng khám (KHÔNG UNIQUE, cho phép lịch sử)
CREATE TABLE VetClinic (
    VetClinicID   UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWSEQUENTIALID(), -- Khóa chính
    VetProfileID  UNIQUEIDENTIFIER NOT NULL,                                       -- Liên kết VetProfiles
    ClinicID      UNIQUEIDENTIFIER NOT NULL,                                       -- Liên kết Clinics
    RoleID        UNIQUEIDENTIFIER NOT NULL,                                       -- Vai trò tại clinic
    StartDate     DATE             NULL,                                           -- Ngày bắt đầu làm
    EndDate       DATE             NULL,                                           -- Ngày kết thúc (NULL = đang làm)
    IsActive      BIT              NOT NULL DEFAULT 1,                             -- Trạng thái hoạt động tại clinic
    CreatedAt     DATETIME         NOT NULL DEFAULT GETUTCDATE(),                  -- Ngày tạo liên kết
    UpdatedAt     DATETIME         NULL,                                           -- Ngày cập nhật
    FOREIGN KEY (VetProfileID) REFERENCES VetProfiles(VetProfileID),
    FOREIGN KEY (ClinicID) REFERENCES Clinics(ClinicID),
    FOREIGN KEY (RoleID) REFERENCES VetClinicRoles(RoleID)
    -- Không có UNIQUE (VetProfileID, ClinicID) để cho phép insert lịch sử
);

-- 12. EmailVerificationTokens - token xác thực email lần đầu
CREATE TABLE EmailVerificationTokens (
    VerificationTokenID UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWSEQUENTIALID(), -- Khóa chính
    UserID              UNIQUEIDENTIFIER NOT NULL,                                       -- Người dùng cần xác thực
    Token               NVARCHAR(255)    NOT NULL UNIQUE,                                -- Token ngẫu nhiên, duy nhất
    ExpiresAt           DATETIME         NOT NULL,                                       -- Hết hạn (24-48 giờ)
    IsUsed              BIT              NOT NULL DEFAULT 0,                             -- Đã dùng kích hoạt chưa
    CreatedAt           DATETIME         NOT NULL DEFAULT GETUTCDATE(),                  -- Thời điểm tạo
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

-- 13. PasswordResetTokens - token đặt lại mật khẩu
CREATE TABLE PasswordResetTokens (
    TokenID   UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWSEQUENTIALID(), -- Khóa chính
    UserID    UNIQUEIDENTIFIER NOT NULL,                                       -- Người dùng yêu cầu reset
    Token     NVARCHAR(255)    NOT NULL UNIQUE,                                -- Token ngẫu nhiên, duy nhất
    ExpiresAt DATETIME         NOT NULL,                                       -- Hết hạn (15-30 phút)
    IsUsed    BIT              NOT NULL DEFAULT 0,                             -- Đã dùng reset chưa
    UsedAt    DATETIME         NULL,                                           -- Thời điểm token được sử dụng
    IPAddress NVARCHAR(50)     NULL,                                           -- IP yêu cầu reset
    CreatedAt DATETIME         NOT NULL DEFAULT GETUTCDATE(),                  -- Thời điểm tạo
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

-- 14. LoginOTPTokens - OTP đăng nhập (feature OW-0.1)
CREATE TABLE LoginOTPTokens (
    LoginOTPID   UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWSEQUENTIALID(), -- Khóa chính
    UserID       UNIQUEIDENTIFIER NOT NULL,                                       -- Người dùng nhận OTP
    OTPCode      NVARCHAR(10)     NOT NULL,                                       -- Mã OTP (6-8 số)
    AttemptCount INT              NOT NULL DEFAULT 0,                             -- Số lần nhập sai mã OTP này
    ExpiresAt    DATETIME         NOT NULL,                                       -- Hết hạn (5-10 phút)
    IsUsed       BIT              NOT NULL DEFAULT 0,                             -- Đã dùng thành công chưa
    IPAddress    NVARCHAR(50)     NULL,                                           -- IP yêu cầu OTP (phát hiện abuse)
    CreatedAt    DATETIME         NOT NULL DEFAULT GETUTCDATE(),                  -- Thời điểm tạo OTP
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

-- 15. UserDevices - quản lý thiết bị, có UNIQUE trên (UserID, DeviceFingerprint)
CREATE TABLE UserDevices (
    DeviceID          UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWSEQUENTIALID(), -- Khóa chính
    UserID            UNIQUEIDENTIFIER NOT NULL,                                       -- Chủ sở hữu
    DeviceName        NVARCHAR(255)    NOT NULL DEFAULT 'Unknown Device',              -- Tên thiết bị
    DeviceType        NVARCHAR(50)     NULL,                                           -- 'ios', 'android', 'web'
    DeviceToken       NVARCHAR(500)    NULL,                                           -- Push token (FCM/APNS)
    LastLoginAt       DATETIME         NULL,                                           -- Lần cuối đăng nhập từ device
    IsBlocked         BIT              NOT NULL DEFAULT 0,                             -- Bị khóa (nếu phát hiện lạ)
    UserAgent         NVARCHAR(500)    NULL,                                           -- UserAgent để nhận diện
    DeviceFingerprint NVARCHAR(255)    NULL,                                           -- Dấu vết thiết bị (có thể NULL)
    CreatedAt         DATETIME         NOT NULL DEFAULT GETUTCDATE(),                  -- Lần đầu ghi nhận
    UpdatedAt         DATETIME         NULL,                                           -- Cập nhật lần cuối
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    CONSTRAINT UQ_UserDeviceFingerprint UNIQUE (UserID, DeviceFingerprint)            -- UNIQUE, nhưng NULL được phép trùng lặp
);

-- 16. RefreshTokens - refresh token cho JWT (hỗ trợ rotation)
CREATE TABLE RefreshTokens (
    RefreshTokenID  UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWSEQUENTIALID(), -- Khóa chính
    UserID          UNIQUEIDENTIFIER NOT NULL,                                       -- Chủ sở hữu
    DeviceID        UNIQUEIDENTIFIER NULL,                                           -- Thiết bị (nếu có)
    TokenHash       NVARCHAR(255)    NOT NULL,                                       -- Hash refresh token
    ExpiresAt       DATETIME         NOT NULL,                                       -- Hết hạn (7-30 ngày)
    IsRevoked       BIT              NOT NULL DEFAULT 0,                             -- Bị thu hồi chưa
    RevokedAt       DATETIME         NULL,                                           -- Thời điểm thu hồi
    ReplacedByToken UNIQUEIDENTIFIER NULL,                                           -- ID token thay thế (rotation)
    CreatedByIP     NVARCHAR(50)     NULL,                                           -- IP lúc tạo token
    UserAgent       NVARCHAR(500)    NULL,                                           -- UserAgent lúc tạo
    CreatedAt       DATETIME         NOT NULL DEFAULT GETUTCDATE(),                  -- Thời điểm cấp
    LastUsedAt      DATETIME         NULL,                                           -- Lần cuối dùng để lấy access mới
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (DeviceID) REFERENCES UserDevices(DeviceID)
);

-- 17. UserSessions - phiên đăng nhập hiện tại
CREATE TABLE UserSessions (
    SessionID      UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWSEQUENTIALID(), -- Khóa chính
    UserID         UNIQUEIDENTIFIER NOT NULL,                                       -- Người dùng
    RefreshTokenID UNIQUEIDENTIFIER NULL,                                           -- Refresh token đang dùng
    DeviceID       UNIQUEIDENTIFIER NULL,                                           -- Thiết bị
    AccessTokenJTI NVARCHAR(255)    NULL,                                           -- JWT ID (để blacklist nếu cần)
    IPAddress      NVARCHAR(50)     NULL,                                           -- IP tạo phiên
    UserAgent      NVARCHAR(500)    NULL,                                           -- UserAgent tạo phiên
    IsActive       BIT              NOT NULL DEFAULT 1,                             -- Phiên còn sống?
    LogoutAt       DATETIME         NULL,                                           -- Thời gian đăng xuất
    LastActivityAt DATETIME         NOT NULL DEFAULT GETUTCDATE(),                  -- Hoạt động cuối cùng
    CreatedAt      DATETIME         NOT NULL DEFAULT GETUTCDATE(),                  -- Thời điểm tạo phiên
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (RefreshTokenID) REFERENCES RefreshTokens(RefreshTokenID),
    FOREIGN KEY (DeviceID) REFERENCES UserDevices(DeviceID)
);

-- 18. AuditLog - ghi log hành động quan trọng
CREATE TABLE AuditLog (
    AuditLogID UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWSEQUENTIALID(), -- Khóa chính
    UserID     UNIQUEIDENTIFIER NULL,                                           -- Ai thực hiện (NULL nếu chưa đăng nhập)
    Action     NVARCHAR(100)    NOT NULL,                                       -- Hành động: 'Login', 'ChangePassword',...
    EntityType NVARCHAR(100)    NULL,                                           -- Loại đối tượng: 'User', 'Role',...
    EntityID   UNIQUEIDENTIFIER NULL,                                           -- ID đối tượng bị tác động
    OldValue   NVARCHAR(MAX)    NULL,                                           -- Giá trị cũ (JSON hoặc text)
    NewValue   NVARCHAR(MAX)    NULL,                                           -- Giá trị mới
    Severity   NVARCHAR(20)     NOT NULL DEFAULT 'Info',                        -- Mức độ: Info, Warning, Critical
    Category   NVARCHAR(50)     NOT NULL DEFAULT 'System',                      -- Loại: Auth, Permission, System, UserData
    IPAddress  NVARCHAR(50)     NULL,                                           -- IP thực hiện
    UserAgent  NVARCHAR(500)    NULL,                                           -- UserAgent thực hiện
    CreatedAt  DATETIME         NOT NULL DEFAULT GETUTCDATE(),                  -- Thời điểm ghi log
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);