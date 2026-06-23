-- =============================================
-- Migration 040: Gop chung Chat AI subscription theo USER (thay vi theo tung pet)
-- Boi canh: Truoc day moi pet co 1 subscription Premium rieng, usage/quota tinh rieng tung pet.
--           Nay doi sang: 1 user chi can 1 goi Premium dang active la dung cho TAT CA pet,
--           quota/usage tinh chung tren toan tai khoan.
-- Pham vi: KHONG doi cau truc bang (khong them/xoa cot). Chi:
--   1) Dat lai unique index "1 active/user" thay cho "1 active/pet".
--   2) Don du lieu trung: moi user chi giu 1 subscription active (cai het han muon nhat),
--      cac subscription active du thua se chuyen sang 'Cancelled'.
-- An toan chay lai nhieu lan (idempotent).
-- =============================================
USE PetOmni_DB;
GO

-- ---------------------------------------------
-- Buoc 1: Don du lieu trung TRUOC khi tao unique index moi.
-- Voi moi OwnerUserID co nhieu subscription OwnerPet dang Active+IsActive,
-- giu lai 1 cai co ExpiresAt muon nhat (tie-break theo CreatedAt moi nhat),
-- cac cai con lai chuyen thanh Cancelled de khong tinh trung quota va de qua duoc unique index.
-- ---------------------------------------------
;WITH RankedActive AS (
    SELECT
        SubscriptionID,
        ROW_NUMBER() OVER (
            PARTITION BY OwnerUserID
            ORDER BY ExpiresAt DESC, CreatedAt DESC
        ) AS rn
    FROM dbo.ChatSubscriptions
    WHERE ScopeType = 'OwnerPet'
      AND OwnerUserID IS NOT NULL
      AND Status = 'Active'
      AND IsActive = 1
)
UPDATE s
SET s.Status      = 'Cancelled',
    s.IsActive    = 0,
    s.CancelledAt = GETUTCDATE(),
    s.UpdatedAt   = GETUTCDATE()
FROM dbo.ChatSubscriptions s
INNER JOIN RankedActive r ON r.SubscriptionID = s.SubscriptionID
WHERE r.rn > 1;
GO

-- ---------------------------------------------
-- Buoc 2: Bo unique index cu (rang buoc 1 active / 1 pet).
-- ---------------------------------------------
IF EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'UX_ChatSubscriptions_ActiveOwnerPet'
      AND object_id = OBJECT_ID('dbo.ChatSubscriptions')
)
BEGIN
    DROP INDEX UX_ChatSubscriptions_ActiveOwnerPet ON dbo.ChatSubscriptions;
END
GO

-- ---------------------------------------------
-- Buoc 3: Tao unique index moi (rang buoc 1 active / 1 USER, khong phan biet pet).
-- Dam bao moi user chi co toi da 1 subscription OwnerPet dang active.
-- ---------------------------------------------
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

-- ---------------------------------------------
-- Buoc 4: Them index tra cuu theo user (phuc vu GetActiveOwnerSubscriptionAsync /
-- GetLatestOwnerSubscriptionAsync - query theo OwnerUserID + ExpiresAt, khong loc PetID).
-- Index cu IX_ChatSubscriptions_OwnerPet_ExpiresAt van giu lai vi van dung tot cho cac query khac.
-- ---------------------------------------------
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_ChatSubscriptions_Owner_ExpiresAt'
      AND object_id = OBJECT_ID('dbo.ChatSubscriptions')
)
BEGIN
    CREATE INDEX IX_ChatSubscriptions_Owner_ExpiresAt
        ON dbo.ChatSubscriptions (ScopeType, OwnerUserID, ExpiresAt DESC);
END
GO

-- ---------------------------------------------
-- Buoc 5 (tuy chon): Cap nhat mo ta goi Premium cho dung ngu canh moi (dung cho ca tai khoan,
-- khong con "danh rieng cho tung be"). Chi update mo ta, khong doi gia/quota.
-- ---------------------------------------------
UPDATE dbo.ChatSubscriptionPlans
SET Description = N'Mot goi dung cho tat ca thu cung cua ban: nhieu luot nhan hon, phan hoi nhanh hon, tu van sau theo ho so va gui duoc anh cho AI xem.',
    UpdatedAt   = GETUTCDATE()
WHERE Code = 'premium';
GO
