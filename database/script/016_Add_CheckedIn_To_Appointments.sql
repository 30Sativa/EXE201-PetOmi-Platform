-- =============================================
-- Migration 016: Add CheckedIn columns to Appointments
-- Sprint 5 — Patient Flow (Check-in step)
-- =============================================
USE PetOmni_DB;
GO

-- Thêm 2 cột hỗ trợ check-in
ALTER TABLE Appointments
    ADD CheckedInAt        DATETIME         NULL,
        CheckedInByUserID  UNIQUEIDENTIFIER NULL;
GO

-- FK cho CheckedInByUserID
ALTER TABLE Appointments
    ADD CONSTRAINT FK_Appointments_CheckedInBy
        FOREIGN KEY (CheckedInByUserID) REFERENCES Users(UserID);
GO

-- Cập nhật CHECK constraint Status để bao gồm 'CheckedIn'
-- SQL Server không cho phép ALTER constraint, phải drop rồi tạo lại
ALTER TABLE Appointments DROP CONSTRAINT CHK_Appointments_Status;
GO

ALTER TABLE Appointments
    ADD CONSTRAINT CHK_Appointments_Status
        CHECK (Status IN ('Pending','Confirmed','CheckedIn','Completed','Cancelled','Rejected','Expired'));
GO
