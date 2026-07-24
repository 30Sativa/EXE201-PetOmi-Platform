-- =============================================
-- Migration 044: Account-level PetOmi AI subscriptions and SePay payments
-- Scope: user/owner thanh toan goi AI, khong con rang buoc theo tung PetID.
-- Idempotent: an toan chay lai nhieu lan.
-- =============================================
USE PetOmni_DB;
GO

-- Cho phep subscription OwnerPet cua user khong can PetID, dung cho toan tai khoan.
IF EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = 'CHK_ChatSubscriptions_OwnerPetScope'
      AND parent_object_id = OBJECT_ID('dbo.ChatSubscriptions')
)
BEGIN
    ALTER TABLE dbo.ChatSubscriptions
        DROP CONSTRAINT CHK_ChatSubscriptions_OwnerPetScope;
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = 'CHK_ChatSubscriptions_OwnerScope'
      AND parent_object_id = OBJECT_ID('dbo.ChatSubscriptions')
)
BEGIN
    ALTER TABLE dbo.ChatSubscriptions
        ADD CONSTRAINT CHK_ChatSubscriptions_OwnerScope CHECK (
            (ScopeType = 'OwnerPet' AND OwnerUserID IS NOT NULL AND ClinicID IS NULL)
            OR
            (ScopeType = 'Clinic' AND ClinicID IS NOT NULL)
        );
END
GO

-- Dam bao rang buoc 1 active subscription / user thay vi / pet.
IF EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'UX_ChatSubscriptions_ActiveOwnerPet'
      AND object_id = OBJECT_ID('dbo.ChatSubscriptions')
)
BEGIN
    DROP INDEX UX_ChatSubscriptions_ActiveOwnerPet ON dbo.ChatSubscriptions;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'UX_ChatSubscriptions_ActiveOwnerUser'
      AND object_id = OBJECT_ID('dbo.ChatSubscriptions')
)
BEGIN
    CREATE UNIQUE INDEX UX_ChatSubscriptions_ActiveOwnerUser
        ON dbo.ChatSubscriptions (ScopeType, OwnerUserID, IsActive)
        WHERE ScopeType = 'OwnerPet'
          AND OwnerUserID IS NOT NULL
          AND IsActive = 1;
END
GO

-- Payment cua goi AI la theo user/account, PetID chi con la audit optional neu client gui.
IF EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = 'FK_ChatSubscriptionPayments_Pet'
      AND parent_object_id = OBJECT_ID('dbo.ChatSubscriptionPayments')
)
BEGIN
    ALTER TABLE dbo.ChatSubscriptionPayments
        DROP CONSTRAINT FK_ChatSubscriptionPayments_Pet;
END
GO

IF EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.ChatSubscriptionPayments')
      AND name = 'PetID'
      AND is_nullable = 0
)
BEGIN
    ALTER TABLE dbo.ChatSubscriptionPayments
        ALTER COLUMN PetID UNIQUEIDENTIFIER NULL;
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = 'FK_ChatSubscriptionPayments_Pet'
      AND parent_object_id = OBJECT_ID('dbo.ChatSubscriptionPayments')
)
BEGIN
    ALTER TABLE dbo.ChatSubscriptionPayments
        ADD CONSTRAINT FK_ChatSubscriptionPayments_Pet
        FOREIGN KEY (PetID) REFERENCES dbo.Pets(PetID);
END
GO

UPDATE dbo.ChatSubscriptionPlans
SET Description = N'Mot goi dung cho tat ca thu cung cua ban: nhieu luot nhan hon, phan hoi nhanh hon, tu van sau theo ho so va gui duoc anh cho AI xem.',
    UpdatedAt = GETUTCDATE()
WHERE Code = 'premium';
GO
