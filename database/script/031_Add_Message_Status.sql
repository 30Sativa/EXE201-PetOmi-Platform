-- Add Status to existing Messages table.
-- Safe to run multiple times. If Messages does not exist yet, run 029 first.

USE PetOmni_DB;
GO

IF OBJECT_ID('dbo.Messages', 'U') IS NULL
BEGIN
    PRINT 'dbo.Messages does not exist. Run 029_Create_Messages_v2_NewbieFriendly.sql first.';
END
ELSE
BEGIN
    IF COL_LENGTH('dbo.Messages', 'Status') IS NULL
    BEGIN
        ALTER TABLE dbo.Messages
        ADD Status NVARCHAR(20) NOT NULL
            CONSTRAINT DF_Messages_Status DEFAULT 'pending';
    END

    IF EXISTS (
        SELECT 1
        FROM sys.check_constraints
        WHERE name = 'CK_Messages_Status'
          AND parent_object_id = OBJECT_ID('dbo.Messages')
    )
    BEGIN
        ALTER TABLE dbo.Messages DROP CONSTRAINT CK_Messages_Status;
    END

    ALTER TABLE dbo.Messages
    ADD CONSTRAINT CK_Messages_Status
        CHECK (Status IN ('pending', 'processing', 'completed', 'failed', 'cancelled'));

    IF COL_LENGTH('dbo.Messages', 'SourcesJson') IS NULL
    BEGIN
        ALTER TABLE dbo.Messages
        ADD SourcesJson NVARCHAR(MAX) NULL;
    END
END
GO
