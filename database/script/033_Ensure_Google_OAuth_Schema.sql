-- ===================================================================
-- PETOMI - ENSURE GOOGLE OAUTH SCHEMA
-- Safe to rerun. Keeps password accounts intact while allowing OAuth
-- users to exist without a local password hash.
-- ===================================================================

USE PetOmni_DB;
GO

IF COL_LENGTH('dbo.Users', 'PasswordHash') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Users
    ALTER COLUMN PasswordHash NVARCHAR(255) NULL;
END
GO

IF OBJECT_ID('dbo.ExternalLogins', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ExternalLogins (
        ExternalLoginID UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_ExternalLogins PRIMARY KEY
            DEFAULT NEWSEQUENTIALID(),
        UserID          UNIQUEIDENTIFIER NOT NULL,
        Provider        NVARCHAR(50)     NOT NULL,
        ProviderKey     NVARCHAR(255)    NOT NULL,
        Email           NVARCHAR(255)    NULL,
        CreatedAt       DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt       DATETIME         NULL,
        CONSTRAINT UQ_ExternalLogins UNIQUE (Provider, ProviderKey),
        CONSTRAINT FK_ExternalLogins_Users FOREIGN KEY (UserID) REFERENCES dbo.Users(UserID)
    );
END
GO
