-- ===================================================================
-- MIGRATION 014: DoctorSchedules + Inventory tables
-- ===================================================================
USE PetOmni_DB;
GO

-- 1. Lịch làm việc của bác sĩ tại phòng khám (theo tuần)
CREATE TABLE DoctorSchedules (
    ScheduleID   UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID()
                 CONSTRAINT PK_DoctorSchedules PRIMARY KEY,
    VetClinicID  UNIQUEIDENTIFIER NOT NULL,    -- FK → VetClinic
    DayOfWeek    INT              NOT NULL,    -- 0=Sunday, 1=Monday, ..., 6=Saturday
    StartTime    TIME             NOT NULL,
    EndTime      TIME             NOT NULL,
    IsActive     BIT              NOT NULL DEFAULT 1,
    CreatedAt    DATETIME         NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt    DATETIME         NULL,

    CONSTRAINT FK_DoctorSchedules_VetClinic
        FOREIGN KEY (VetClinicID) REFERENCES VetClinic(VetClinicID),
    CONSTRAINT CK_DoctorSchedules_DayOfWeek
        CHECK (DayOfWeek BETWEEN 0 AND 6),
    CONSTRAINT CK_DoctorSchedules_Time
        CHECK (StartTime < EndTime)
);
GO

CREATE INDEX IX_DoctorSchedules_VetClinicID ON DoctorSchedules(VetClinicID);
GO

-- 2. Kho thuốc / vật tư cơ bản
CREATE TABLE Inventory (
    ItemID              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID()
                        CONSTRAINT PK_Inventory PRIMARY KEY,
    ClinicID            UNIQUEIDENTIFIER NOT NULL,
    ItemName            NVARCHAR(200)    NOT NULL,
    Unit                NVARCHAR(50)     NULL,       -- "viên", "ml", "lọ"...
    Quantity            INT              NOT NULL DEFAULT 0,
    LowStockThreshold   INT              NOT NULL DEFAULT 10,
    UnitPrice           DECIMAL(18,2)    NULL,
    ExpiryDate          DATE             NULL,
    IsActive            BIT              NOT NULL DEFAULT 1,
    CreatedAt           DATETIME         NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt           DATETIME         NULL,

    CONSTRAINT FK_Inventory_Clinic
        FOREIGN KEY (ClinicID) REFERENCES Clinics(ClinicID),
    CONSTRAINT CK_Inventory_Quantity
        CHECK (Quantity >= 0)
);
GO

CREATE INDEX IX_Inventory_ClinicID ON Inventory(ClinicID);
GO
