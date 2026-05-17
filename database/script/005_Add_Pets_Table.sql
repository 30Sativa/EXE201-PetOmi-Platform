-- ===================================================================
-- PET ADVISOR AI - MIGRATION 005
-- Thêm bảng Pets để quản lý hồ sơ thú cưng của chủ nuôi
-- Không dùng CHECK constraint cho Species/Gender/IsNeutered
-- vì validation được xử lý trong code (Application layer)
-- ===================================================================

USE PetOmni_DB;
GO

-- Bảng Pets - hồ sơ thú cưng, mỗi pet có 1 ID duy nhất suốt vòng đời
CREATE TABLE Pets (
    PetID               UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWSEQUENTIALID(), -- Khóa chính GUID, tự sinh tuần tự
    OwnerUserID         UNIQUEIDENTIFIER NOT NULL,                                       -- Chủ nuôi (liên kết bảng Users)
    Name                NVARCHAR(100)    NOT NULL,                                       -- Tên thú cưng
    Species             NVARCHAR(50)     NOT NULL,                                       -- Loài (Dog / Cat) — validation trong code
    Breed               NVARCHAR(100)    NULL,                                           -- Giống (string, FE cung cấp danh sách)
    Gender              NVARCHAR(20)     NULL,                                           -- Giới tính (Male / Female / Unknown) — validation trong code
    IsNeutered          NVARCHAR(20)     NULL,                                           -- Đã triệt sản chưa (Yes / No / Unknown) — validation trong code
    DateOfBirth         DATE             NULL,                                           -- Ngày sinh (để trống nếu không nhớ)
    IsBirthDateEstimated BIT             NOT NULL DEFAULT 0,                             -- Đánh dấu ngày sinh là ước tính (1=ước tính, 0=chính xác)
    AvatarURL           NVARCHAR(500)    NULL,                                           -- URL ảnh đại diện
    Color               NVARCHAR(200)    NULL,                                           -- Màu lông / đặc điểm nhận dạng
    IsActive            BIT              NOT NULL DEFAULT 1,                             -- Hồ sơ còn hoạt động? (0=đã xóa mềm)
    DeletedAt           DATETIME         NULL,                                           -- Thời điểm xóa mềm (không xóa cứng khỏi DB)
    CreatedAt           DATETIME         NOT NULL DEFAULT GETUTCDATE(),                  -- Ngày tạo hồ sơ (UTC)
    UpdatedAt           DATETIME         NULL,                                           -- Lần cập nhật gần nhất
    CONSTRAINT FK_Pets_OwnerUser FOREIGN KEY (OwnerUserID) REFERENCES Users(UserID)
);
GO
