-- ===================================================================
-- PET ADVISOR AI - MIGRATION 005
-- Tạo bảng Pets: thông tin core/identity của thú cưng
-- Không dùng CHECK constraint cho Species/Gender vì validation xử lý ở Application layer
-- ===================================================================

USE PetOmni_DB;
GO

CREATE TABLE Pets (
    PetID                UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWSEQUENTIALID(), -- Khóa chính GUID, tự sinh tuần tự
    OwnerUserID          UNIQUEIDENTIFIER NOT NULL,                                       -- Chủ nuôi chính, liên kết bảng Users
    Name                 NVARCHAR(100)    NOT NULL,                                       -- Tên thú cưng
    Species              NVARCHAR(50)     NOT NULL,                                       -- Loài (Dog / Cat / ...) validation trong code
    Breed                NVARCHAR(100)    NULL,                                           -- Giống thú cưng
    Gender               NVARCHAR(20)     NULL,                                           -- Giới tính (Male / Female / Unknown) validation trong code
    DateOfBirth          DATE             NULL,                                           -- Ngày sinh, NULL nếu không nhớ
    IsBirthDateEstimated BIT              NOT NULL DEFAULT 0,                             -- 1=ngày sinh ước tính, 0=chính xác
    AvatarURL            NVARCHAR(500)    NULL,                                           -- Ảnh đại diện hiện tại của pet
    IsActive             BIT              NOT NULL DEFAULT 1,                             -- Hồ sơ còn hoạt động? 0=xóa mềm
    DeletedAt            DATETIME         NULL,                                           -- Thời điểm xóa mềm
    CreatedAt            DATETIME         NOT NULL DEFAULT GETUTCDATE(),                  -- Ngày tạo hồ sơ UTC
    UpdatedAt            DATETIME         NULL,                                           -- Lần cập nhật gần nhất

    CONSTRAINT FK_Pets_OwnerUser
        FOREIGN KEY (OwnerUserID) REFERENCES Users(UserID)
);
GO
