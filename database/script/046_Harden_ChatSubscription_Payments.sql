-- Migration 046: Protect AI Premium QR payments and voucher capacity.
DECLARE @ShouldBackfillOpenPayments BIT = 0;

IF COL_LENGTH('dbo.ChatSubscriptionPayments', 'IsOpen') IS NULL
BEGIN
    ALTER TABLE dbo.ChatSubscriptionPayments
        ADD IsOpen BIT NOT NULL
            CONSTRAINT DF_ChatSubscriptionPayments_IsOpen DEFAULT 0;
    SET @ShouldBackfillOpenPayments = 1;
END;

IF COL_LENGTH('dbo.ChatSubscriptionPayments', 'HasVoucherReservation') IS NULL
BEGIN
    ALTER TABLE dbo.ChatSubscriptionPayments
        ADD HasVoucherReservation BIT NOT NULL
            CONSTRAINT DF_ChatSubscriptionPayments_HasVoucherReservation DEFAULT 0;
END;

IF COL_LENGTH('dbo.ChatSubscriptionVouchers', 'ReservedCount') IS NULL
BEGIN
    ALTER TABLE dbo.ChatSubscriptionVouchers
        ADD ReservedCount INT NOT NULL
            CONSTRAINT DF_ChatSubscriptionVouchers_ReservedCount DEFAULT 0;
END;

IF @ShouldBackfillOpenPayments = 1
BEGIN
    -- Existing rows were created before voucher reservation existed. Keep historical
    -- payments unchanged and make only the newest still-valid pending QR usable.
    UPDATE dbo.ChatSubscriptionPayments
    SET IsOpen = CASE
            WHEN Status = 'Pending' AND ExpiresAt > GETUTCDATE() THEN 1
            ELSE 0
        END,
        HasVoucherReservation = 0;

    ;WITH RankedOpenPayments AS
    (
        SELECT PaymentID,
               ROW_NUMBER() OVER
               (
                   PARTITION BY OwnerUserID
                   ORDER BY CreatedAt DESC, PaymentID DESC
               ) AS RowNumber
        FROM dbo.ChatSubscriptionPayments
        WHERE IsOpen = 1
    )
    UPDATE payment
    SET Status = 'Cancelled',
        IsOpen = 0,
        HasVoucherReservation = 0,
        UpdatedAt = GETUTCDATE()
    FROM dbo.ChatSubscriptionPayments payment
    INNER JOIN RankedOpenPayments ranked ON ranked.PaymentID = payment.PaymentID
    WHERE ranked.RowNumber > 1;
END;
GO

IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = 'UX_ChatSubscriptionPayments_OpenOwner'
      AND object_id = OBJECT_ID('dbo.ChatSubscriptionPayments')
)
BEGIN
    CREATE UNIQUE INDEX UX_ChatSubscriptionPayments_OpenOwner
        ON dbo.ChatSubscriptionPayments (OwnerUserID)
        WHERE IsOpen = 1;
END;
GO

IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_ChatSubscriptionPayments_Open_ExpiresAt'
      AND object_id = OBJECT_ID('dbo.ChatSubscriptionPayments')
)
BEGIN
    CREATE INDEX IX_ChatSubscriptionPayments_Open_ExpiresAt
        ON dbo.ChatSubscriptionPayments (IsOpen, ExpiresAt);
END;
GO
