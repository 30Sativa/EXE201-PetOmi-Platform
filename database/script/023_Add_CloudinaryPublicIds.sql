-- ===================================================================
-- MIGRATION 023: Add Cloudinary Public IDs to all tables
-- Dùng để xóa ảnh/file cũ trên Cloudinary khi user upload ảnh/file mới
-- ===================================================================
USE PetOmni_DB;
GO

-- 0. Validate required tables
IF OBJECT_ID('dbo.UserProfiles', 'U') IS NULL
    THROW 50001, 'Table dbo.UserProfiles does not exist. Run previous migrations first.', 1;

IF OBJECT_ID('dbo.Pets', 'U') IS NULL
    THROW 50002, 'Table dbo.Pets does not exist. Run previous migrations first.', 1;

IF OBJECT_ID('dbo.PetPhotos', 'U') IS NULL
    THROW 50003, 'Table dbo.PetPhotos does not exist. Run previous migrations first.', 1;

IF OBJECT_ID('dbo.PetMedicalRecords', 'U') IS NULL
    THROW 50004, 'Table dbo.PetMedicalRecords does not exist. Run previous migrations first.', 1;

IF OBJECT_ID('dbo.Clinics', 'U') IS NULL
    THROW 50005, 'Table dbo.Clinics does not exist. Run previous migrations first.', 1;

-- 1. UserProfiles
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.UserProfiles')
      AND name = 'AvatarCloudinaryPublicId'
)
BEGIN
    ALTER TABLE dbo.UserProfiles
    ADD AvatarCloudinaryPublicId NVARCHAR(500) NULL;
    PRINT 'Added AvatarCloudinaryPublicId to UserProfiles.';
END
ELSE
    PRINT 'AvatarCloudinaryPublicId already exists in UserProfiles.';

-- 2. Pets
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.Pets')
      AND name = 'AvatarCloudinaryPublicId'
)
BEGIN
    ALTER TABLE dbo.Pets
    ADD AvatarCloudinaryPublicId NVARCHAR(500) NULL;
    PRINT 'Added AvatarCloudinaryPublicId to Pets.';
END
ELSE
    PRINT 'AvatarCloudinaryPublicId already exists in Pets.';

-- 3. PetPhotos
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.PetPhotos')
      AND name = 'CloudinaryPublicId'
)
BEGIN
    ALTER TABLE dbo.PetPhotos
    ADD CloudinaryPublicId NVARCHAR(500) NULL;
    PRINT 'Added CloudinaryPublicId to PetPhotos.';
END
ELSE
    PRINT 'CloudinaryPublicId already exists in PetPhotos.';

-- 4. PetMedicalRecords
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.PetMedicalRecords')
      AND name = 'AttachmentCloudinaryPublicId'
)
BEGIN
    ALTER TABLE dbo.PetMedicalRecords
    ADD AttachmentCloudinaryPublicId NVARCHAR(500) NULL;
    PRINT 'Added AttachmentCloudinaryPublicId to PetMedicalRecords.';
END
ELSE
    PRINT 'AttachmentCloudinaryPublicId already exists in PetMedicalRecords.';

-- 5. Clinics
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.Clinics')
      AND name = 'LicenseCloudinaryPublicId'
)
BEGIN
    ALTER TABLE dbo.Clinics
    ADD LicenseCloudinaryPublicId NVARCHAR(500) NULL;
    PRINT 'Added LicenseCloudinaryPublicId to Clinics.';
END
ELSE
    PRINT 'LicenseCloudinaryPublicId already exists in Clinics.';

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.Clinics')
      AND name = 'LogoCloudinaryPublicId'
)
BEGIN
    ALTER TABLE dbo.Clinics
    ADD LogoCloudinaryPublicId NVARCHAR(500) NULL;
    PRINT 'Added LogoCloudinaryPublicId to Clinics.';
END
ELSE
    PRINT 'LogoCloudinaryPublicId already exists in Clinics.';

PRINT 'Script 023 completed successfully.';
GO