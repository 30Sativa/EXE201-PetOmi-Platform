-- ===================================================================
-- MIGRATION 031: Add image columns to Inventory
-- Supports product image URL + Cloudinary public ID for clinic store.
-- ===================================================================
USE PetOmni_DB;
GO

IF OBJECT_ID('dbo.Inventory', 'U') IS NULL
    THROW 50031, 'Table dbo.Inventory does not exist. Run previous migrations first.', 1;

IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.Inventory')
      AND name = 'ImageUrl'
)
BEGIN
    ALTER TABLE dbo.Inventory
    ADD ImageUrl NVARCHAR(500) NULL;
    PRINT 'Added ImageUrl to Inventory.';
END
ELSE
    PRINT 'ImageUrl already exists in Inventory.';

IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.Inventory')
      AND name = 'ImageCloudinaryPublicId'
)
BEGIN
    ALTER TABLE dbo.Inventory
    ADD ImageCloudinaryPublicId NVARCHAR(500) NULL;
    PRINT 'Added ImageCloudinaryPublicId to Inventory.';
END
ELSE
    PRINT 'ImageCloudinaryPublicId already exists in Inventory.';

PRINT 'Script 031 completed successfully.';
GO
