-- PET ADVISOR AI - MIGRATION 021
-- Create Conversations in SQL Server core backend.

USE PetOmni_DB;
GO

IF OBJECT_ID('dbo.Conversations', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Conversations (
        ConversationID UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT DF_Conversations_ConversationID DEFAULT NEWSEQUENTIALID(),
        UserID         UNIQUEIDENTIFIER NOT NULL,
        PetID          UNIQUEIDENTIFIER NULL,
        Title          NVARCHAR(200)    NULL,
        IsActive       BIT              NOT NULL
            CONSTRAINT DF_Conversations_IsActive DEFAULT 1,
        CreatedAt      DATETIME2        NOT NULL
            CONSTRAINT DF_Conversations_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt      DATETIME2        NOT NULL
            CONSTRAINT DF_Conversations_UpdatedAt DEFAULT SYSUTCDATETIME(),
        DeletedAt      DATETIME         NULL,

        CONSTRAINT FK_Conversations_User
            FOREIGN KEY (UserID) REFERENCES dbo.Users(UserID),

        CONSTRAINT FK_Conversations_Pet
            FOREIGN KEY (PetID) REFERENCES dbo.Pets(PetID),

        CONSTRAINT PK_Conversations
            PRIMARY KEY (ConversationID)
    );
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_Conversations_User_UpdatedAt'
      AND object_id = OBJECT_ID('dbo.Conversations')
)
BEGIN
    CREATE INDEX IX_Conversations_User_UpdatedAt
    ON dbo.Conversations (UserID, UpdatedAt DESC, CreatedAt DESC)
    WHERE IsActive = 1;
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_Conversations_Pet_UpdatedAt'
      AND object_id = OBJECT_ID('dbo.Conversations')
)
BEGIN
    CREATE INDEX IX_Conversations_Pet_UpdatedAt
    ON dbo.Conversations (PetID, UpdatedAt DESC, CreatedAt DESC)
    WHERE PetID IS NOT NULL AND IsActive = 1;
END
GO
