-- =============================================
-- Migration 017: Create MedicalExaminations table
-- Sprint 5 — Patient Flow (Phiếu khám - vet-created)
-- Tách biệt với PetMedicalRecords (owner-managed)
-- =============================================
USE PetOmni_DB;
GO

CREATE TABLE MedicalExaminations (
    ExaminationID       UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWSEQUENTIALID()
                        CONSTRAINT PK_MedicalExaminations PRIMARY KEY,

    AppointmentID       UNIQUEIDENTIFIER    NOT NULL,   -- FK → Appointments
    PetID               UNIQUEIDENTIFIER    NOT NULL,   -- FK → Pets (denorm để query nhanh)
    VetClinicID         UNIQUEIDENTIFIER    NULL,       -- FK → VetClinic (bác sĩ thực hiện)

    -- Lý do đến khám (Chief Complaint - SOAP: S)
    ChiefComplaint      NVARCHAR(500)       NOT NULL,

    -- Chỉ số sinh tồn đo tại phòng khám (SOAP: O - Objective)
    WeightKg            DECIMAL(5,2)        NULL,       -- cân nặng tại phòng khám
    TemperatureC        DECIMAL(4,1)        NULL,       -- thân nhiệt (độ C)
    HeartRate           INT                 NULL,       -- nhịp tim (bpm)
    RespiratoryRate     INT                 NULL,       -- nhịp thở (lần/phút)

    -- Ghi nhận khám (SOAP: O - tiếp)
    ExaminationNotes    NVARCHAR(MAX)       NULL,       -- nhận xét lâm sàng

    -- Chẩn đoán & kế hoạch (SOAP: A + P)
    Diagnosis           NVARCHAR(MAX)       NULL,       -- chẩn đoán
    TreatmentPlan       NVARCHAR(MAX)       NULL,       -- kế hoạch điều trị / tái khám

    -- Trạng thái phiếu khám
    Status              NVARCHAR(20)        NOT NULL DEFAULT 'InProgress',
    -- InProgress | Completed

    CreatedAt           DATETIME            NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt           DATETIME            NULL,
    CompletedAt         DATETIME            NULL,

    CONSTRAINT FK_MedicalExaminations_Appointment
        FOREIGN KEY (AppointmentID) REFERENCES Appointments(AppointmentID),

    CONSTRAINT FK_MedicalExaminations_Pet
        FOREIGN KEY (PetID) REFERENCES Pets(PetID),

    CONSTRAINT FK_MedicalExaminations_VetClinic
        FOREIGN KEY (VetClinicID) REFERENCES VetClinic(VetClinicID),

    CONSTRAINT CHK_MedicalExaminations_Status
        CHECK (Status IN ('InProgress', 'Completed'))
);
GO

-- Index: tìm phiếu khám theo appointment (1-1 thực tế)
CREATE UNIQUE INDEX IX_MedicalExaminations_AppointmentID
    ON MedicalExaminations (AppointmentID);
GO

-- Index: xem lịch sử khám của pet
CREATE INDEX IX_MedicalExaminations_PetID
    ON MedicalExaminations (PetID, CreatedAt DESC);
GO
