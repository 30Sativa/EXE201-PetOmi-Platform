-- Migration 048: Allow fully discounted AI Premium redemptions without a bank transfer.
IF OBJECT_ID('dbo.ChatSubscriptionPayments', 'U') IS NOT NULL
BEGIN
    IF EXISTS
    (
        SELECT 1
        FROM sys.check_constraints
        WHERE name = 'CHK_ChatSubscriptionPayments_Provider'
          AND parent_object_id = OBJECT_ID('dbo.ChatSubscriptionPayments')
    )
    BEGIN
        ALTER TABLE dbo.ChatSubscriptionPayments
            DROP CONSTRAINT CHK_ChatSubscriptionPayments_Provider;
    END;

    ALTER TABLE dbo.ChatSubscriptionPayments WITH CHECK
        ADD CONSTRAINT CHK_ChatSubscriptionPayments_Provider
            CHECK (Provider IN ('SePay', 'Manual'));

    IF EXISTS
    (
        SELECT 1
        FROM sys.check_constraints
        WHERE name = 'CHK_ChatSubscriptionPayments_Amount'
          AND parent_object_id = OBJECT_ID('dbo.ChatSubscriptionPayments')
    )
    BEGIN
        ALTER TABLE dbo.ChatSubscriptionPayments
            DROP CONSTRAINT CHK_ChatSubscriptionPayments_Amount;
    END;

    ALTER TABLE dbo.ChatSubscriptionPayments WITH CHECK
        ADD CONSTRAINT CHK_ChatSubscriptionPayments_Amount
            CHECK
            (
                Amount > 0
                OR
                (
                    Amount = 0
                    AND Status = 'Paid'
                    AND Provider = 'Manual'
                    AND VoucherID IS NOT NULL
                    AND DiscountAmount = OriginalAmount
                    AND OriginalAmount > 0
                )
            );
END;
GO
