-- ============================================================
-- 022_Add_ClinicLocation_And_NoShowStatus.sql
-- Phase 3: Vet/Clinic - Tìm clinic theo vị trí + NoShow
-- Chạy sau script 021
-- ============================================================

-- ============================================================
-- PHẦN 1: Thêm cột Location vào Clinics
-- ============================================================

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.Clinics')
      AND name = 'Latitude'
)
BEGIN
    ALTER TABLE dbo.Clinics ADD Latitude FLOAT NULL;
    PRINT 'Added Latitude column to Clinics.';
END
ELSE
    PRINT 'Latitude column already exists in Clinics.';

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.Clinics')
      AND name = 'Longitude'
)
BEGIN
    ALTER TABLE dbo.Clinics ADD Longitude FLOAT NULL;
    PRINT 'Added Longitude column to Clinics.';
END
ELSE
    PRINT 'Longitude column already exists in Clinics.';

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.Clinics')
      AND name = 'AppointmentBufferMins'
)
BEGIN
    ALTER TABLE dbo.Clinics
    ADD AppointmentBufferMins INT NOT NULL
        CONSTRAINT DF_Clinics_AppointmentBufferMins DEFAULT 0;

    PRINT 'Added AppointmentBufferMins column to Clinics.';
END
ELSE
    PRINT 'AppointmentBufferMins column already exists in Clinics.';

-- ============================================================
-- PHẦN 2: Cập nhật CHECK constraint cho Appointments.Status
-- ============================================================

DECLARE @constraintName NVARCHAR(200);

SELECT @constraintName = name
FROM sys.check_constraints
WHERE parent_object_id = OBJECT_ID('dbo.Appointments')
  AND name = 'CHK_Appointments_Status';

IF @constraintName IS NOT NULL
BEGIN
    EXEC('ALTER TABLE dbo.Appointments DROP CONSTRAINT ' + @constraintName);
    PRINT 'Dropped old CHK_Appointments_Status constraint.';
END
ELSE
BEGIN
    PRINT 'CHK_Appointments_Status constraint does not exist.';
END

ALTER TABLE dbo.Appointments WITH CHECK
ADD CONSTRAINT CHK_Appointments_Status
CHECK (
    Status IN (
        'Pending',
        'Confirmed',
        'CheckedIn',
        'Completed',
        'Cancelled',
        'Rejected',
        'Expired',
        'NoShow'
    )
);

PRINT 'Created/updated CHK_Appointments_Status constraint with NoShow.';

-- ============================================================
-- PHẦN 3: Index cho tìm kiếm theo vị trí
-- Dùng dynamic SQL để tránh lỗi compile Invalid column name
-- ============================================================

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID('dbo.Clinics')
      AND name = 'IX_Clinics_Location'
)
BEGIN
    EXEC('
        CREATE INDEX IX_Clinics_Location
        ON dbo.Clinics(Latitude, Longitude)
        WHERE Latitude IS NOT NULL
          AND Longitude IS NOT NULL;
    ');

    PRINT 'Created IX_Clinics_Location index on Clinics.';
END
ELSE
BEGIN
    PRINT 'IX_Clinics_Location index already exists.';
END

PRINT 'Script 022 completed successfully.';
GO