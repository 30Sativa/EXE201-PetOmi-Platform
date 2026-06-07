-- ===================================================================
-- PETOMI - MIGRATION 036
-- Create health profile share token and access log tables.
-- These records support temporary owner-controlled clinic access.
-- ===================================================================

USE PetOmni_DB;
GO

IF OBJECT_ID('PetHealthShareTokens', 'U') IS NULL
BEGIN
    CREATE TABLE PetHealthShareTokens (
        ShareTokenID       UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_PetHealthShareTokens PRIMARY KEY DEFAULT NEWID(),
        PetID              UNIQUEIDENTIFIER NOT NULL,
        OwnerUserID        UNIQUEIDENTIFIER NOT NULL,
        ClinicID           UNIQUEIDENTIFIER NULL,
        DisplayCode        NVARCHAR(20)     NOT NULL,
        TokenHash          NVARCHAR(256)    NOT NULL,
        Scope              NVARCHAR(40)     NOT NULL,
        AccessMode         NVARCHAR(30)     NOT NULL CONSTRAINT DF_PetHealthShareTokens_AccessMode DEFAULT 'Temporary',
        ExpiresAt          DATETIME2        NOT NULL,
        MaxUses            INT              NULL,
        UsedCount          INT              NOT NULL CONSTRAINT DF_PetHealthShareTokens_UsedCount DEFAULT 0,
        LastUsedAt         DATETIME2        NULL,
        RevokedAt          DATETIME2        NULL,
        CreatedAt          DATETIME2        NOT NULL CONSTRAINT DF_PetHealthShareTokens_CreatedAt DEFAULT SYSUTCDATETIME(),
        CreatedByUserID    UNIQUEIDENTIFIER NOT NULL,
        Note               NVARCHAR(500)    NULL,

        CONSTRAINT FK_PetHealthShareTokens_Pet
            FOREIGN KEY (PetID) REFERENCES Pets(PetID),
        CONSTRAINT FK_PetHealthShareTokens_Owner
            FOREIGN KEY (OwnerUserID) REFERENCES Users(UserID),
        CONSTRAINT FK_PetHealthShareTokens_Clinic
            FOREIGN KEY (ClinicID) REFERENCES Clinics(ClinicID),
        CONSTRAINT FK_PetHealthShareTokens_CreatedBy
            FOREIGN KEY (CreatedByUserID) REFERENCES Users(UserID),
        CONSTRAINT CK_PetHealthShareTokens_Scope
            CHECK (Scope IN ('EmergencySummary', 'ClinicVisit', 'FullHealthProfile')),
        CONSTRAINT CK_PetHealthShareTokens_AccessMode
            CHECK (AccessMode IN ('Temporary', 'OneTime')),
        CONSTRAINT CK_PetHealthShareTokens_MaxUses
            CHECK (MaxUses IS NULL OR MaxUses > 0),
        CONSTRAINT CK_PetHealthShareTokens_UsedCount
            CHECK (UsedCount >= 0)
    );
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'UX_PetHealthShareTokens_DisplayCode_Active'
      AND object_id = OBJECT_ID('PetHealthShareTokens')
)
BEGIN
    CREATE UNIQUE INDEX UX_PetHealthShareTokens_DisplayCode_Active
    ON PetHealthShareTokens(DisplayCode)
    WHERE RevokedAt IS NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_PetHealthShareTokens_PetID_CreatedAt'
      AND object_id = OBJECT_ID('PetHealthShareTokens')
)
BEGIN
    CREATE INDEX IX_PetHealthShareTokens_PetID_CreatedAt
    ON PetHealthShareTokens(PetID, CreatedAt DESC);
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_PetHealthShareTokens_TokenHash'
      AND object_id = OBJECT_ID('PetHealthShareTokens')
)
BEGIN
    CREATE INDEX IX_PetHealthShareTokens_TokenHash
    ON PetHealthShareTokens(TokenHash);
END
GO

IF OBJECT_ID('PetHealthShareAccessLogs', 'U') IS NULL
BEGIN
    CREATE TABLE PetHealthShareAccessLogs (
        AccessLogID      UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_PetHealthShareAccessLogs PRIMARY KEY DEFAULT NEWID(),
        ShareTokenID     UNIQUEIDENTIFIER NULL,
        PetID            UNIQUEIDENTIFIER NOT NULL,
        ClinicID         UNIQUEIDENTIFIER NULL,
        AccessedByUserID UNIQUEIDENTIFIER NULL,
        AccessType       NVARCHAR(40)     NOT NULL,
        Result           NVARCHAR(30)     NOT NULL,
        FailureReason    NVARCHAR(200)    NULL,
        IpAddress        NVARCHAR(64)     NULL,
        UserAgent        NVARCHAR(500)    NULL,
        CreatedAt        DATETIME2        NOT NULL CONSTRAINT DF_PetHealthShareAccessLogs_CreatedAt DEFAULT SYSUTCDATETIME(),

        CONSTRAINT FK_PetHealthShareAccessLogs_Token
            FOREIGN KEY (ShareTokenID) REFERENCES PetHealthShareTokens(ShareTokenID),
        CONSTRAINT FK_PetHealthShareAccessLogs_Pet
            FOREIGN KEY (PetID) REFERENCES Pets(PetID),
        CONSTRAINT FK_PetHealthShareAccessLogs_Clinic
            FOREIGN KEY (ClinicID) REFERENCES Clinics(ClinicID),
        CONSTRAINT FK_PetHealthShareAccessLogs_User
            FOREIGN KEY (AccessedByUserID) REFERENCES Users(UserID),
        CONSTRAINT CK_PetHealthShareAccessLogs_Result
            CHECK (Result IN ('Succeeded', 'Failed'))
    );
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_PetHealthShareAccessLogs_Pet_CreatedAt'
      AND object_id = OBJECT_ID('PetHealthShareAccessLogs')
)
BEGIN
    CREATE INDEX IX_PetHealthShareAccessLogs_Pet_CreatedAt
    ON PetHealthShareAccessLogs(PetID, CreatedAt DESC);
END
GO
