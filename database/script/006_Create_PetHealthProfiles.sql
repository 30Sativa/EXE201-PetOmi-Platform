-- ===================================================================
-- PET ADVISOR AI - MIGRATION 006
-- Tạo bảng PetHealthProfiles: snapshot sức khỏe hiện tại của thú cưng
-- Không lưu current_medications để tránh duplicate với PetMedicalRecords
-- Không dùng CHECK constraint cho IsNeutered vì validation xử lý ở Application layer
-- ===================================================================

USE PetOmni_DB;
GO

CREATE TABLE PetHealthProfiles (
    PetHealthProfileID UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWSEQUENTIALID(), -- Khóa chính GUID
    PetID              UNIQUEIDENTIFIER NOT NULL UNIQUE,                                -- Mỗi pet có tối đa 1 health profile hiện tại
    CurrentWeightKg    DECIMAL(5,2)     NULL,                                           -- Cân nặng hiện tại, dùng cho hiển thị nhanh
    Color              NVARCHAR(200)    NULL,                                           -- Màu lông / đặc điểm nhận dạng
    IsNeutered         NVARCHAR(20)     NULL,                                           -- Đã triệt sản chưa (Yes / No / Unknown), validation trong code
    Allergies          NVARCHAR(MAX)    NULL,                                           -- Dị ứng hiện tại, dạng text
    ChronicConditions  NVARCHAR(MAX)    NULL,                                           -- Bệnh mãn tính / tình trạng dài hạn
    MicrochipNumber    NVARCHAR(100)    NULL,                                           -- Mã microchip nếu có
    CreatedAt          DATETIME         NOT NULL DEFAULT GETUTCDATE(),                  -- Ngày tạo profile sức khỏe
    UpdatedAt          DATETIME         NULL,                                           -- Lần cập nhật gần nhất

    CONSTRAINT FK_PetHealthProfiles_Pet
        FOREIGN KEY (PetID) REFERENCES Pets(PetID)
);
GO
