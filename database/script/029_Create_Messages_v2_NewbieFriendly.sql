-- PET ADVISOR AI - MIGRATION 022
-- Create Messages in SQL Server core backend.

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

IF OBJECT_ID('dbo.Messages', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Messages (
        MessageID         UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT DF_Messages_MessageID DEFAULT NEWSEQUENTIALID(),
        ConversationID    UNIQUEIDENTIFIER NOT NULL,
        SenderRole        NVARCHAR(20)     NOT NULL,
        Status            NVARCHAR(20)     NOT NULL
            CONSTRAINT DF_Messages_Status DEFAULT 'pending',
        Content           NVARCHAR(MAX)    NOT NULL,
        Intent            NVARCHAR(50)     NULL,
        UrgencyLevel      NVARCHAR(20)     NULL,
        VetRecommendation NVARCHAR(20)     NULL,
        RagUsed           BIT              NOT NULL
            CONSTRAINT DF_Messages_RagUsed DEFAULT 0,
        ChunksUsed        INT              NOT NULL
            CONSTRAINT DF_Messages_ChunksUsed DEFAULT 0,
        Model             NVARCHAR(100)    NULL,
        SourcesJson       NVARCHAR(MAX)    NULL,
        TokensInput       INT              NOT NULL
            CONSTRAINT DF_Messages_TokensInput DEFAULT 0,
        TokensOutput      INT              NOT NULL
            CONSTRAINT DF_Messages_TokensOutput DEFAULT 0,
        CreatedAt         DATETIME         NOT NULL
            CONSTRAINT DF_Messages_CreatedAt DEFAULT GETUTCDATE(),
        DeletedAt         DATETIME         NULL,
        IsActive          BIT              NOT NULL
            CONSTRAINT DF_Messages_IsActive DEFAULT 1,

        CONSTRAINT FK_Messages_Conversation
            FOREIGN KEY (ConversationID) REFERENCES dbo.Conversations(ConversationID),

        CONSTRAINT CK_Messages_SenderRole
            CHECK (SenderRole IN ('user', 'assistant', 'system')),

        CONSTRAINT CK_Messages_Status
            CHECK (Status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),

        CONSTRAINT CK_Messages_Intent
            CHECK (Intent IS NULL OR Intent IN (
                'nutrition', 'symptom', 'vaccine', 'general', 'emergency',
                'appointment', 'billing', 'grooming', 'training', 'behavior', 'product'
            )),

        CONSTRAINT CK_Messages_UrgencyLevel
            CHECK (UrgencyLevel IS NULL OR UrgencyLevel IN ('critical', 'high', 'normal')),

        CONSTRAINT CK_Messages_VetRecommendation
            CHECK (VetRecommendation IS NULL OR VetRecommendation IN ('urgent', 'watch', 'monitor', 'none')),

        CONSTRAINT PK_Messages
            PRIMARY KEY (MessageID)
    );
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_Messages_Conversation_CreatedAt'
      AND object_id = OBJECT_ID('dbo.Messages')
)
BEGIN
    CREATE INDEX IX_Messages_Conversation_CreatedAt
    ON dbo.Messages (ConversationID, CreatedAt DESC)
    WHERE IsActive = 1;
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_Messages_Conversation_Role_CreatedAt'
      AND object_id = OBJECT_ID('dbo.Messages')
)
BEGIN
    CREATE INDEX IX_Messages_Conversation_Role_CreatedAt
    ON dbo.Messages (ConversationID, SenderRole, CreatedAt DESC)
    WHERE IsActive = 1;
END
GO
