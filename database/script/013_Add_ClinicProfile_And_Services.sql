-- ===================================================================
-- MIGRATION 013: Add Clinic Profile Fields + ClinicServices Table
-- ===================================================================
USE PetOmni_DB;
GO

-- 1. Thêm profile fields vào Clinics
ALTER TABLE Clinics
ADD
    LogoUrl       NVARCHAR(500) NULL,
    Description   NVARCHAR(1000) NULL,
    OpeningHours  NVARCHAR(500) NULL;   -- JSON string: {"Mon-Fri":"08:00-17:00","Sat":"08:00-12:00"}
GO

-- 2. Tạo bảng ClinicServices
CREATE TABLE ClinicServices (
    ServiceID    UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID()
                 CONSTRAINT PK_ClinicServices PRIMARY KEY,
    ClinicID     UNIQUEIDENTIFIER NOT NULL,
    ServiceName  NVARCHAR(200)    NOT NULL,
    Description  NVARCHAR(500)    NULL,
    Price        DECIMAL(18,2)    NOT NULL,
    DurationMins INT              NOT NULL DEFAULT 30,
    IsActive     BIT              NOT NULL DEFAULT 1,
    CreatedAt    DATETIME         NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt    DATETIME         NULL,

    CONSTRAINT FK_ClinicServices_Clinic
        FOREIGN KEY (ClinicID) REFERENCES Clinics(ClinicID)
);
GO

CREATE INDEX IX_ClinicServices_ClinicID ON ClinicServices(ClinicID);
GO
