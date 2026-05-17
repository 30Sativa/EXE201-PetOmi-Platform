-- ===================================================================
-- PET ADVISOR AI - MIGRATION 010
-- Tạo bảng PetMedicalRecords: hồ sơ y tế, vaccine, khám bệnh, thuốc, phẫu thuật...
-- Không dùng CHECK constraint cho RecordType vì validation xử lý ở Application layer
-- ===================================================================

USE PetOmni_DB;
GO

CREATE TABLE PetMedicalRecords (
    MedicalRecordID UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWSEQUENTIALID(), -- Khóa chính GUID
    PetID           UNIQUEIDENTIFIER NOT NULL,                                       -- Liên kết thú cưng
    RecordType      NVARCHAR(50)     NOT NULL,                                       -- Vaccine / Visit / Medication / Surgery / Allergy / Illness
    Title           NVARCHAR(200)    NOT NULL,                                       -- Tiêu đề record
    Description     NVARCHAR(MAX)    NULL,                                           -- Nội dung chi tiết
    RecordDate      DATE             NOT NULL,                                       -- Ngày xảy ra / ngày ghi nhận y tế
    VetName         NVARCHAR(200)    NULL,                                           -- Tên bác sĩ nếu có
    ClinicName      NVARCHAR(200)    NULL,                                           -- Tên phòng khám nếu có
    MedicationName  NVARCHAR(200)    NULL,                                           -- Tên thuốc nếu RecordType là Medication
    Dosage          NVARCHAR(100)    NULL,                                           -- Liều dùng nếu là thuốc
    StartDate       DATE             NULL,                                           -- Ngày bắt đầu thuốc/điều trị nếu có
    EndDate         DATE             NULL,                                           -- Ngày kết thúc thuốc/điều trị nếu có
    AttachmentURL   NVARCHAR(500)    NULL,                                           -- File/ảnh đính kèm nếu có
    CreatedAt       DATETIME         NOT NULL DEFAULT GETUTCDATE(),                  -- Ngày tạo record
    UpdatedAt       DATETIME         NULL,                                           -- Lần cập nhật gần nhất
    DeletedAt       DATETIME         NULL,                                           -- Xóa mềm record
    IsActive        BIT              NOT NULL DEFAULT 1,                             -- Record còn hoạt động? 0=xóa mềm

    CONSTRAINT FK_PetMedicalRecords_Pet
        FOREIGN KEY (PetID) REFERENCES Pets(PetID)
);
GO
