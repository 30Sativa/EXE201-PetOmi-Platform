-- ===================================================================
-- MIGRATION 012: Add LicenseImageUrl to Clinics
-- Owner uploads ảnh Giấy phép kinh doanh khi đăng ký phòng khám
-- ===================================================================
USE PetOmni_DB;
GO

ALTER TABLE Clinics
ADD LicenseImageUrl NVARCHAR(500) NULL;  -- URL ảnh GKPD (upload lên cloud storage)
GO
