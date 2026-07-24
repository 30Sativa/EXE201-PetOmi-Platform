-- Migration 045: Admin-managed vouchers for account-level PetOmi AI Premium payments.

IF OBJECT_ID('dbo.ChatSubscriptionVouchers', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ChatSubscriptionVouchers (
        VoucherID          UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_ChatSubscriptionVouchers PRIMARY KEY
            CONSTRAINT DF_ChatSubscriptionVouchers_ID DEFAULT NEWSEQUENTIALID(),
        Code               NVARCHAR(40)     NOT NULL,
        Name               NVARCHAR(120)    NOT NULL,
        Description        NVARCHAR(300)    NULL,
        DiscountType       NVARCHAR(20)     NOT NULL,
        DiscountValue      DECIMAL(18,2)    NOT NULL,
        MaxDiscountAmount  DECIMAL(18,2)    NULL,
        MinOrderAmount     DECIMAL(18,2)    NOT NULL CONSTRAINT DF_ChatSubscriptionVouchers_MinOrder DEFAULT 0,
        UsageLimit         INT              NULL,
        UsedCount          INT              NOT NULL CONSTRAINT DF_ChatSubscriptionVouchers_UsedCount DEFAULT 0,
        StartsAt           DATETIME         NULL,
        ExpiresAt          DATETIME         NULL,
        IsActive           BIT              NOT NULL CONSTRAINT DF_ChatSubscriptionVouchers_IsActive DEFAULT 1,
        CreatedByAdminID   UNIQUEIDENTIFIER NULL,
        CreatedAt          DATETIME         NOT NULL CONSTRAINT DF_ChatSubscriptionVouchers_CreatedAt DEFAULT GETUTCDATE(),
        UpdatedAt          DATETIME         NULL,

        CONSTRAINT FK_ChatSubscriptionVouchers_CreatedByAdmin
            FOREIGN KEY (CreatedByAdminID) REFERENCES dbo.Users(UserID),
        CONSTRAINT CHK_ChatSubscriptionVouchers_DiscountType
            CHECK (DiscountType IN ('Percent', 'FixedAmount')),
        CONSTRAINT CHK_ChatSubscriptionVouchers_DiscountValue
            CHECK (DiscountValue > 0),
        CONSTRAINT CHK_ChatSubscriptionVouchers_Percent
            CHECK (DiscountType <> 'Percent' OR DiscountValue <= 90),
        CONSTRAINT CHK_ChatSubscriptionVouchers_Amounts
            CHECK (
                MinOrderAmount >= 0
                AND (MaxDiscountAmount IS NULL OR MaxDiscountAmount >= 0)
                AND (UsageLimit IS NULL OR UsageLimit > 0)
                AND UsedCount >= 0
            ),
        CONSTRAINT CHK_ChatSubscriptionVouchers_Window
            CHECK (StartsAt IS NULL OR ExpiresAt IS NULL OR ExpiresAt > StartsAt)
    );
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'UX_ChatSubscriptionVouchers_Code'
      AND object_id = OBJECT_ID('dbo.ChatSubscriptionVouchers')
)
BEGIN
    CREATE UNIQUE INDEX UX_ChatSubscriptionVouchers_Code
        ON dbo.ChatSubscriptionVouchers (Code);
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_ChatSubscriptionVouchers_Active_Window'
      AND object_id = OBJECT_ID('dbo.ChatSubscriptionVouchers')
)
BEGIN
    CREATE INDEX IX_ChatSubscriptionVouchers_Active_Window
        ON dbo.ChatSubscriptionVouchers (IsActive, StartsAt, ExpiresAt);
END;

IF COL_LENGTH('dbo.ChatSubscriptionPayments', 'OriginalAmount') IS NULL
BEGIN
    ALTER TABLE dbo.ChatSubscriptionPayments
        ADD OriginalAmount DECIMAL(18,2) NOT NULL
            CONSTRAINT DF_ChatSubscriptionPayments_OriginalAmount DEFAULT 0;
END;

IF COL_LENGTH('dbo.ChatSubscriptionPayments', 'DiscountAmount') IS NULL
BEGIN
    ALTER TABLE dbo.ChatSubscriptionPayments
        ADD DiscountAmount DECIMAL(18,2) NOT NULL
            CONSTRAINT DF_ChatSubscriptionPayments_DiscountAmount DEFAULT 0;
END;

IF COL_LENGTH('dbo.ChatSubscriptionPayments', 'VoucherID') IS NULL
BEGIN
    ALTER TABLE dbo.ChatSubscriptionPayments
        ADD VoucherID UNIQUEIDENTIFIER NULL;
END;

IF COL_LENGTH('dbo.ChatSubscriptionPayments', 'VoucherCode') IS NULL
BEGIN
    ALTER TABLE dbo.ChatSubscriptionPayments
        ADD VoucherCode NVARCHAR(40) NULL;
END;

IF COL_LENGTH('dbo.ChatSubscriptionPayments', 'OriginalAmount') IS NOT NULL
   AND COL_LENGTH('dbo.ChatSubscriptionPayments', 'DiscountAmount') IS NOT NULL
BEGIN
    EXEC sp_executesql N'
        UPDATE dbo.ChatSubscriptionPayments
        SET OriginalAmount = Amount + DiscountAmount
        WHERE OriginalAmount = 0;
    ';
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys
    WHERE name = 'FK_ChatSubscriptionPayments_Voucher'
      AND parent_object_id = OBJECT_ID('dbo.ChatSubscriptionPayments')
)
BEGIN
    EXEC sp_executesql N'
        ALTER TABLE dbo.ChatSubscriptionPayments
            ADD CONSTRAINT FK_ChatSubscriptionPayments_Voucher
                FOREIGN KEY (VoucherID) REFERENCES dbo.ChatSubscriptionVouchers(VoucherID);
    ';
END;
