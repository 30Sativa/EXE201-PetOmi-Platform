-- ============================================================
-- 022_Add_ClinicLocation_And_NoShowStatus.sql
-- Phase 3: Vet/Clinic - Tìm clinic theo vị trí + NoShow
-- ============================================================
-- Chạy sau script 021
-- Tác giả: PetOmi Backend Team
-- Mô tả:
--   1. Thêm Latitude, Longitude vào bảng Clinics (hỗ trợ GPS search)
--   2. Thêm AppointmentBufferMins vào bảng Clinics (buffer time giữa appointments)
--   3. Mở rộng CHECK constraint cho Appointment.Status thêm NoShow
-- ============================================================

-- ============================================================
-- PHẦN 1: Thêm cột Location vào Clinics
-- ============================================================

-- Thêm cột Latitude, Longitude, AppointmentBufferMins nếu chưa có
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE Object_ID = Object_ID('Clinics') AND Name = 'Latitude'
)
BEGIN
    ALTER TABLE Clinics
    ADD Latitude FLOAT NULL;
    PRINT 'Added Latitude column to Clinics.';
END
ELSE
BEGIN
    PRINT 'Latitude column already exists in Clinics.';
END

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE Object_ID = Object_ID('Clinics') AND Name = 'Longitude'
)
BEGIN
    ALTER TABLE Clinics
    ADD Longitude FLOAT NULL;
    PRINT 'Added Longitude column to Clinics.';
END
ELSE
BEGIN
    PRINT 'Longitude column already exists in Clinics.';
END

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE Object_ID = Object_ID('Clinics') AND Name = 'AppointmentBufferMins'
)
BEGIN
    ALTER TABLE Clinics
    ADD AppointmentBufferMins INT NOT NULL DEFAULT 0;
    PRINT 'Added AppointmentBufferMins column to Clinics.';
END
ELSE
BEGIN
    PRINT 'AppointmentBufferMins column already exists in Clinics.';
END

-- ============================================================
-- PHẦN 2: Cập nhật CHECK constraint cho Appointments.Status
-- Thêm NoShow vào danh sách trạng thái hợp lệ
-- ============================================================

-- Xóa constraint cũ (nếu tồn tại) và tạo constraint mới với NoShow
IF EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'CHK_Appointments_Status'
)
BEGIN
    ALTER TABLE Appointments DROP CONSTRAINT CHK_Appointments_Status;
    PRINT 'Dropped old CHK_Appointments_Status constraint.';
END
ELSE IF EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'CHK_Appointments_Status'
    AND parent_object_id = OBJECT_ID('Appointments')
)
BEGIN
    -- MSSQL specific: drop by name
    DECLARE @constraintName NVARCHAR(200);
    SELECT @constraintName = name
    FROM sys.check_constraints
    WHERE parent_object_id = OBJECT_ID('Appointments')
      AND name LIKE '%Status%';

    IF @constraintName IS NOT NULL
    BEGIN
        EXEC('ALTER TABLE Appointments DROP CONSTRAINT ' + @constraintName);
        PRINT 'Dropped existing status constraint: ' + @constraintName;
    END
END

-- Tạo constraint mới với NoShow
-- Giá trị hợp lệ: Pending, Confirmed, CheckedIn, Completed, Cancelled, Rejected, Expired, NoShow
ALTER TABLE Appointments
ADD CONSTRAINT CHK_Appointments_Status
CHECK (Status IN ('Pending','Confirmed','CheckedIn','Completed','Cancelled','Rejected','Expired','NoShow'));

PRINT 'Created/updated CHK_Appointments_Status constraint with NoShow.';

-- ============================================================
-- PHẦN 3: Index cho tìm kiếm theo vị trí (tùy chọn - tăng hiệu suất)
-- ============================================================

-- Index trên Latitude/Longitude để tìm kiếm nhanh hơn (thường dùng cho bounding box queries)
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID('Clinics') AND name = 'IX_Clinics_Location'
)
BEGIN
    CREATE INDEX IX_Clinics_Location ON Clinics(Latitude, Longitude)
    WHERE Latitude IS NOT NULL AND Longitude IS NOT NULL;
    PRINT 'Created IX_Clinics_Location index on Clinics.';
END
ELSE
BEGIN
    PRINT 'IX_Clinics_Location index already exists.';
END

PRINT 'Script 022 completed successfully.';
GO
