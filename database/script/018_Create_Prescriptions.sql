-- =============================================
-- Migration 018: Create Prescriptions table
-- Sprint 5 — Patient Flow (Đơn thuốc)
-- Mỗi record = 1 thuốc trong đơn của bác sĩ
-- =============================================
USE PetOmni_DB;
GO

CREATE TABLE Prescriptions (
    PrescriptionID      UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWSEQUENTIALID()
                        CONSTRAINT PK_Prescriptions PRIMARY KEY,

    ExaminationID       UNIQUEIDENTIFIER    NOT NULL,   -- FK → MedicalExaminations

    -- Thông tin thuốc (bác sĩ tự gõ, không bắt buộc link kho)
    MedicationName      NVARCHAR(200)       NOT NULL,   -- tên thuốc
    Dosage              NVARCHAR(100)       NOT NULL,   -- liều: "5mg", "1 viên", "5ml"
    Frequency           NVARCHAR(100)       NOT NULL,   -- tần suất: "2 lần/ngày", "sáng tối"
    DurationDays        INT                 NOT NULL,   -- số ngày dùng
    Instructions        NVARCHAR(500)       NULL,       -- hướng dẫn thêm: "uống sau ăn"

    -- Link về kho thuốc (optional, để sau link inventory)
    InventoryItemID     UNIQUEIDENTIFIER    NULL,       -- FK → Inventory (nullable)

    CreatedAt           DATETIME            NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_Prescriptions_Examination
        FOREIGN KEY (ExaminationID) REFERENCES MedicalExaminations(ExaminationID)
            ON DELETE CASCADE,  -- xóa phiếu khám → xóa đơn thuốc theo

    CONSTRAINT FK_Prescriptions_Inventory
        FOREIGN KEY (InventoryItemID) REFERENCES Inventory(ItemID),

    CONSTRAINT CHK_Prescriptions_Duration
        CHECK (DurationDays > 0)
);
GO

-- Index: lấy tất cả thuốc của 1 phiếu khám
CREATE INDEX IX_Prescriptions_ExaminationID
    ON Prescriptions (ExaminationID);
GO
