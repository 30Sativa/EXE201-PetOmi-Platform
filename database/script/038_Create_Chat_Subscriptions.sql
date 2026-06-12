-- =============================================
-- Migration 038: Chat AI subscription plans, owner-pet subscriptions, and SePay payments
-- Scope: PetOmi AI chat subscription MVP for owners, ready for future clinic scope
-- =============================================
USE PetOmni_DB;
GO

IF OBJECT_ID('dbo.ChatSubscriptionPlans', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ChatSubscriptionPlans (
        PlanID                   UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID()
            CONSTRAINT PK_ChatSubscriptionPlans PRIMARY KEY,
        Code                     NVARCHAR(40)     NOT NULL,
        Name                     NVARCHAR(100)    NOT NULL,
        Description              NVARCHAR(500)    NULL,
        PriceMonthly             DECIMAL(18,2)    NOT NULL,
        BillingCycleDays         INT              NOT NULL CONSTRAINT DF_ChatSubscriptionPlans_BillingCycleDays DEFAULT 30,
        MonthlyMessageQuota      INT              NOT NULL,
        MonthlyTokenQuota        INT              NULL,
        PriorityLevel            INT              NOT NULL CONSTRAINT DF_ChatSubscriptionPlans_PriorityLevel DEFAULT 0,
        DeepRagEnabled           BIT              NOT NULL CONSTRAINT DF_ChatSubscriptionPlans_DeepRagEnabled DEFAULT 0,
        ImageUploadEnabled       BIT              NOT NULL CONSTRAINT DF_ChatSubscriptionPlans_ImageUploadEnabled DEFAULT 0,
        MaxImageUploadsPerMonth  INT              NOT NULL CONSTRAINT DF_ChatSubscriptionPlans_MaxImageUploads DEFAULT 0,
        IsActive                 BIT              NOT NULL CONSTRAINT DF_ChatSubscriptionPlans_IsActive DEFAULT 1,
        SortOrder                INT              NOT NULL CONSTRAINT DF_ChatSubscriptionPlans_SortOrder DEFAULT 0,
        CreatedAt                DATETIME         NOT NULL CONSTRAINT DF_ChatSubscriptionPlans_CreatedAt DEFAULT GETUTCDATE(),
        UpdatedAt                DATETIME         NULL,

        CONSTRAINT UQ_ChatSubscriptionPlans_Code UNIQUE (Code),
        CONSTRAINT CHK_ChatSubscriptionPlans_Code CHECK (Code IN ('free', 'premium')),
        CONSTRAINT CHK_ChatSubscriptionPlans_Price CHECK (PriceMonthly >= 0),
        CONSTRAINT CHK_ChatSubscriptionPlans_Cycle CHECK (BillingCycleDays > 0),
        CONSTRAINT CHK_ChatSubscriptionPlans_MessageQuota CHECK (MonthlyMessageQuota > 0),
        CONSTRAINT CHK_ChatSubscriptionPlans_ImageQuota CHECK (MaxImageUploadsPerMonth >= 0)
    );
END
GO

MERGE dbo.ChatSubscriptionPlans AS target
USING (VALUES
    ('free', 'Free', 'Goi mien phi cho PetOmi AI chat, gioi han theo account moi thang.', CAST(0 AS DECIMAL(18,2)), 30, 20, 100000, 0, CAST(0 AS BIT), CAST(0 AS BIT), 0, CAST(1 AS BIT), 1),
    ('premium', 'Premium', 'Goi tra phi theo tung pet: quota cao hon, uu tien xu ly, RAG sau hon va san sang cho upload anh.', CAST(99000 AS DECIMAL(18,2)), 30, 500, 1000000, 10, CAST(1 AS BIT), CAST(1 AS BIT), 30, CAST(1 AS BIT), 2)
) AS source (
    Code,
    Name,
    Description,
    PriceMonthly,
    BillingCycleDays,
    MonthlyMessageQuota,
    MonthlyTokenQuota,
    PriorityLevel,
    DeepRagEnabled,
    ImageUploadEnabled,
    MaxImageUploadsPerMonth,
    IsActive,
    SortOrder
)
ON target.Code = source.Code
WHEN MATCHED THEN
    UPDATE SET
        Name = source.Name,
        Description = source.Description,
        PriceMonthly = source.PriceMonthly,
        BillingCycleDays = source.BillingCycleDays,
        MonthlyMessageQuota = source.MonthlyMessageQuota,
        MonthlyTokenQuota = source.MonthlyTokenQuota,
        PriorityLevel = source.PriorityLevel,
        DeepRagEnabled = source.DeepRagEnabled,
        ImageUploadEnabled = source.ImageUploadEnabled,
        MaxImageUploadsPerMonth = source.MaxImageUploadsPerMonth,
        IsActive = source.IsActive,
        SortOrder = source.SortOrder,
        UpdatedAt = GETUTCDATE()
WHEN NOT MATCHED THEN
    INSERT (
        Code,
        Name,
        Description,
        PriceMonthly,
        BillingCycleDays,
        MonthlyMessageQuota,
        MonthlyTokenQuota,
        PriorityLevel,
        DeepRagEnabled,
        ImageUploadEnabled,
        MaxImageUploadsPerMonth,
        IsActive,
        SortOrder
    )
    VALUES (
        source.Code,
        source.Name,
        source.Description,
        source.PriceMonthly,
        source.BillingCycleDays,
        source.MonthlyMessageQuota,
        source.MonthlyTokenQuota,
        source.PriorityLevel,
        source.DeepRagEnabled,
        source.ImageUploadEnabled,
        source.MaxImageUploadsPerMonth,
        source.IsActive,
        source.SortOrder
    );
GO

IF OBJECT_ID('dbo.ChatSubscriptions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ChatSubscriptions (
        SubscriptionID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID()
            CONSTRAINT PK_ChatSubscriptions PRIMARY KEY,
        ScopeType      NVARCHAR(30)     NOT NULL,
        OwnerUserID    UNIQUEIDENTIFIER NULL,
        PetID          UNIQUEIDENTIFIER NULL,
        ClinicID       UNIQUEIDENTIFIER NULL,
        PlanID         UNIQUEIDENTIFIER NOT NULL,
        Status         NVARCHAR(20)     NOT NULL,
        StartsAt       DATETIME         NOT NULL,
        ExpiresAt      DATETIME         NOT NULL,
        CancelledAt    DATETIME         NULL,
        IsActive       BIT              NOT NULL CONSTRAINT DF_ChatSubscriptions_IsActive DEFAULT 1,
        CreatedAt      DATETIME         NOT NULL CONSTRAINT DF_ChatSubscriptions_CreatedAt DEFAULT GETUTCDATE(),
        UpdatedAt      DATETIME         NULL,

        CONSTRAINT FK_ChatSubscriptions_OwnerUser FOREIGN KEY (OwnerUserID) REFERENCES Users(UserID),
        CONSTRAINT FK_ChatSubscriptions_Pet FOREIGN KEY (PetID) REFERENCES Pets(PetID),
        CONSTRAINT FK_ChatSubscriptions_Clinic FOREIGN KEY (ClinicID) REFERENCES Clinics(ClinicID),
        CONSTRAINT FK_ChatSubscriptions_Plan FOREIGN KEY (PlanID) REFERENCES ChatSubscriptionPlans(PlanID),
        CONSTRAINT CHK_ChatSubscriptions_Scope CHECK (ScopeType IN ('OwnerPet', 'Clinic')),
        CONSTRAINT CHK_ChatSubscriptions_Status CHECK (Status IN ('Active', 'Expired', 'Cancelled')),
        CONSTRAINT CHK_ChatSubscriptions_OwnerPetScope CHECK (
            (ScopeType = 'OwnerPet' AND OwnerUserID IS NOT NULL AND PetID IS NOT NULL AND ClinicID IS NULL)
            OR
            (ScopeType = 'Clinic' AND ClinicID IS NOT NULL)
        ),
        CONSTRAINT CHK_ChatSubscriptions_Expires CHECK (ExpiresAt > StartsAt)
    );
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_ChatSubscriptions_OwnerPet_ExpiresAt'
      AND object_id = OBJECT_ID('dbo.ChatSubscriptions')
)
BEGIN
    CREATE INDEX IX_ChatSubscriptions_OwnerPet_ExpiresAt
        ON dbo.ChatSubscriptions (OwnerUserID, PetID, ExpiresAt DESC);
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'UX_ChatSubscriptions_ActiveOwnerPet'
      AND object_id = OBJECT_ID('dbo.ChatSubscriptions')
)
BEGIN
    CREATE UNIQUE INDEX UX_ChatSubscriptions_ActiveOwnerPet
        ON dbo.ChatSubscriptions (ScopeType, OwnerUserID, PetID, IsActive)
        WHERE ScopeType = 'OwnerPet'
          AND OwnerUserID IS NOT NULL
          AND PetID IS NOT NULL
          AND IsActive = 1;
END
GO

IF OBJECT_ID('dbo.ChatSubscriptionPayments', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ChatSubscriptionPayments (
        PaymentID             UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID()
            CONSTRAINT PK_ChatSubscriptionPayments PRIMARY KEY,
        SubscriptionID        UNIQUEIDENTIFIER NULL,
        PlanID                UNIQUEIDENTIFIER NOT NULL,
        OwnerUserID           UNIQUEIDENTIFIER NOT NULL,
        PetID                 UNIQUEIDENTIFIER NOT NULL,
        Status                NVARCHAR(20)     NOT NULL,
        Amount                DECIMAL(18,2)    NOT NULL,
        Currency              NVARCHAR(10)     NOT NULL CONSTRAINT DF_ChatSubscriptionPayments_Currency DEFAULT 'VND',
        Provider              NVARCHAR(20)     NOT NULL,
        PaymentReference      NVARCHAR(100)    NOT NULL,
        ProviderTransactionID NVARCHAR(100)    NULL,
        QrCodeUrl             NVARCHAR(1000)   NOT NULL,
        BankAccountNo         NVARCHAR(50)     NOT NULL,
        BankCode              NVARCHAR(30)     NOT NULL,
        PaidAt                DATETIME         NULL,
        ExpiresAt             DATETIME         NOT NULL,
        RawPayload            NVARCHAR(MAX)    NULL,
        CreatedAt             DATETIME         NOT NULL CONSTRAINT DF_ChatSubscriptionPayments_CreatedAt DEFAULT GETUTCDATE(),
        UpdatedAt             DATETIME         NULL,

        CONSTRAINT FK_ChatSubscriptionPayments_Subscription FOREIGN KEY (SubscriptionID) REFERENCES ChatSubscriptions(SubscriptionID),
        CONSTRAINT FK_ChatSubscriptionPayments_Plan FOREIGN KEY (PlanID) REFERENCES ChatSubscriptionPlans(PlanID),
        CONSTRAINT FK_ChatSubscriptionPayments_OwnerUser FOREIGN KEY (OwnerUserID) REFERENCES Users(UserID),
        CONSTRAINT FK_ChatSubscriptionPayments_Pet FOREIGN KEY (PetID) REFERENCES Pets(PetID),
        CONSTRAINT CHK_ChatSubscriptionPayments_Status CHECK (Status IN ('Pending', 'Paid', 'Expired', 'Cancelled')),
        CONSTRAINT CHK_ChatSubscriptionPayments_Provider CHECK (Provider IN ('SePay')),
        CONSTRAINT CHK_ChatSubscriptionPayments_Amount CHECK (Amount > 0)
    );
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'UX_ChatSubscriptionPayments_PaymentReference'
      AND object_id = OBJECT_ID('dbo.ChatSubscriptionPayments')
)
BEGIN
    CREATE UNIQUE INDEX UX_ChatSubscriptionPayments_PaymentReference
        ON dbo.ChatSubscriptionPayments (PaymentReference);
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'UX_ChatSubscriptionPayments_ProviderTransaction'
      AND object_id = OBJECT_ID('dbo.ChatSubscriptionPayments')
)
BEGIN
    CREATE UNIQUE INDEX UX_ChatSubscriptionPayments_ProviderTransaction
        ON dbo.ChatSubscriptionPayments (Provider, ProviderTransactionID)
        WHERE ProviderTransactionID IS NOT NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_ChatSubscriptionPayments_Owner_CreatedAt'
      AND object_id = OBJECT_ID('dbo.ChatSubscriptionPayments')
)
BEGIN
    CREATE INDEX IX_ChatSubscriptionPayments_Owner_CreatedAt
        ON dbo.ChatSubscriptionPayments (OwnerUserID, CreatedAt DESC);
END
GO
