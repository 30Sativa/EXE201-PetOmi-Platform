-- ===================================================================
-- PET ADVISOR AI - MIGRATION 007
-- Tạo bảng PetWeightLogs: lịch sử cân nặng để tracking/chart
-- ===================================================================

USE PetOmni_DB;
GO

CREATE TABLE PetWeightLogs (
    WeightLogID UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWSEQUENTIALID(), -- Khóa chính GUID
    PetID       UNIQUEIDENTIFIER NOT NULL,                                       -- Liên kết thú cưng
    WeightKg    DECIMAL(5,2)     NOT NULL,                                       -- Cân nặng tại thời điểm đo
    MeasuredAt  DATETIME         NOT NULL DEFAULT GETUTCDATE(),                  -- Thời điểm đo cân nặng
    Source      NVARCHAR(50)     NULL,                                           -- Nguồn nhập: Owner / Vet / System / Import
    Note        NVARCHAR(500)    NULL,                                           -- Ghi chú thêm nếu có
    CreatedAt   DATETIME         NOT NULL DEFAULT GETUTCDATE(),                  -- Ngày tạo record

    CONSTRAINT FK_PetWeightLogs_Pet
        FOREIGN KEY (PetID) REFERENCES Pets(PetID)
);
GO
