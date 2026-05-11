-- ===================================================================
-- PET ADVISOR AI - MIGRATION 002
-- 1. Thêm bảng ExternalLogins (OAuth providers: Google, Facebook, ...)
-- 2. Sửa PasswordHash thành NULL (user login bằng OAuth không có password)
-- ===================================================================

USE PetOmni_DB;
GO

-- 1. Sửa PasswordHash cho phép NULL
ALTER TABLE Users
ALTER COLUMN PasswordHash NVARCHAR(255) NULL;
GO

-- 2. Thêm bảng ExternalLogins
CREATE TABLE ExternalLogins (
    ExternalLoginID UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWSEQUENTIALID(), -- Khóa chính GUID
    UserID          UNIQUEIDENTIFIER NOT NULL,                                       -- Liên kết Users
    Provider        NVARCHAR(50)     NOT NULL,                                       -- 'google', 'facebook', 'github',...
    ProviderKey     NVARCHAR(255)    NOT NULL,                                       -- Subject ID từ provider (Google sub)
    Email           NVARCHAR(255)    NULL,                                           -- Email trả về từ provider
    CreatedAt       DATETIME         NOT NULL DEFAULT GETUTCDATE(),                  -- Thời điểm liên kết
    UpdatedAt       DATETIME         NULL,                                           -- Lần cập nhật gần nhất
    CONSTRAINT UQ_ExternalLogins UNIQUE (Provider, ProviderKey),                    -- Mỗi provider+key chỉ 1 lần
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);
GO