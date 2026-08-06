-- =====================================================================
-- MIGRATION 050: Mark synthetic/demo accounts explicitly.
--
-- Existing accounts are real by default (IsSynthetic = 0). Demo seeds must
-- set IsSynthetic = 1 so admin reports can keep demo data separate from
-- genuine customer activity.
-- =====================================================================

USE PetOmni_DB;
GO

SET XACT_ABORT ON;

IF COL_LENGTH('dbo.Users', 'IsSynthetic') IS NULL
BEGIN
    ALTER TABLE dbo.Users
    ADD IsSynthetic BIT NOT NULL
        CONSTRAINT DF_Users_IsSynthetic DEFAULT (0) WITH VALUES;
END;
GO

IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_Users_IsSynthetic_CreatedAt'
      AND object_id = OBJECT_ID('dbo.Users')
)
BEGIN
    CREATE INDEX IX_Users_IsSynthetic_CreatedAt
        ON dbo.Users (IsSynthetic, CreatedAt)
        INCLUDE (Email, NormalizedEmail, IsActive)
        WHERE IsSynthetic = 1;
END;
GO

