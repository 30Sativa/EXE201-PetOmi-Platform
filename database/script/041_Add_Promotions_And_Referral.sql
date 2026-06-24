-- =============================================
-- Migration 041: Promotions (Free Trial, Early-bird discount) + Referral (tang quota)
-- Boi canh: Them 3 uu dai cho goi Premium Chat AI:
--   1) Free trial 7 ngay (ChatSubscriptions.IsTrial).
--   2) Early-bird giam 30% trong 3 chu ky dau (chi tinh khi tao payment, khong doi schema gia).
--   3) Referral: moi user co 1 ReferralCode; nguoi moi dang ky nhap ma -> nguoi gioi thieu
--      duoc +N luot nhan AI (cong vao quota), khong trung lap (1 newUser chi tinh 1 lan), khong tran.
-- Tat ca cac con so do Admin chinh qua SystemSetting (category 'Promotion').
-- An toan chay lai nhieu lan (idempotent).
-- =============================================
USE PetOmni_DB;
GO

-- ---------------------------------------------
-- 0) Bao dam bang SystemSetting ton tai (truoc day tao qua EF, phong khi DB chua co).
-- ---------------------------------------------
IF OBJECT_ID('dbo.SystemSetting', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.SystemSetting (
        SettingID    UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID()
            CONSTRAINT PK_SystemSetting PRIMARY KEY,
        SettingKey   NVARCHAR(100) NOT NULL,
        SettingValue NVARCHAR(MAX) NOT NULL,
        Category     NVARCHAR(50)  NOT NULL CONSTRAINT DF_SystemSetting_Category DEFAULT 'General',
        Description  NVARCHAR(500) NULL,
        CreatedAt    DATETIME      NOT NULL CONSTRAINT DF_SystemSetting_CreatedAt DEFAULT GETUTCDATE(),
        UpdatedAt    DATETIME      NOT NULL CONSTRAINT DF_SystemSetting_UpdatedAt DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_SystemSetting_Key UNIQUE (SettingKey)
    );
END
GO

-- ---------------------------------------------
-- 1) Them cot ReferralCode vao Users (ma gioi thieu rieng cua moi user).
-- ---------------------------------------------
IF COL_LENGTH('dbo.Users', 'ReferralCode') IS NULL
BEGIN
    ALTER TABLE dbo.Users ADD ReferralCode NVARCHAR(20) NULL;
END
GO

-- Unique filtered index (cho phep NULL nhieu, nhung ma da set thi duy nhat).
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'UX_Users_ReferralCode' AND object_id = OBJECT_ID('dbo.Users')
)
BEGIN
    CREATE UNIQUE INDEX UX_Users_ReferralCode
        ON dbo.Users (ReferralCode)
        WHERE ReferralCode IS NOT NULL;
END
GO

-- ---------------------------------------------
-- 2) Bang ReferralRedemptions: ghi nhan moi luot gioi thieu thanh cong.
--    NewUserID UNIQUE -> 1 nguoi moi chi duoc tinh 1 lan (chong trung).
-- ---------------------------------------------
IF OBJECT_ID('dbo.ReferralRedemptions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ReferralRedemptions (
        RedemptionID    UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID()
            CONSTRAINT PK_ReferralRedemptions PRIMARY KEY,
        ReferrerUserID  UNIQUEIDENTIFIER NOT NULL,   -- nguoi gioi thieu (chu ma)
        NewUserID       UNIQUEIDENTIFIER NOT NULL,   -- nguoi moi dang ky bang ma
        ReferralCode    NVARCHAR(20)     NOT NULL,   -- ma da dung (snapshot)
        BonusMessages   INT              NOT NULL,   -- so luot cong cho nguoi gioi thieu (snapshot setting luc do)
        CreatedAt       DATETIME         NOT NULL CONSTRAINT DF_ReferralRedemptions_CreatedAt DEFAULT GETUTCDATE(),
        CONSTRAINT UQ_ReferralRedemptions_NewUser UNIQUE (NewUserID),
        CONSTRAINT FK_ReferralRedemptions_Referrer FOREIGN KEY (ReferrerUserID) REFERENCES dbo.Users(UserID),
        CONSTRAINT FK_ReferralRedemptions_NewUser  FOREIGN KEY (NewUserID)      REFERENCES dbo.Users(UserID),
        CONSTRAINT CHK_ReferralRedemptions_NotSelf CHECK (ReferrerUserID <> NewUserID)
    );

    CREATE INDEX IX_ReferralRedemptions_Referrer ON dbo.ReferralRedemptions (ReferrerUserID);
END
GO

-- ---------------------------------------------
-- 3) Cot IsTrial cho ChatSubscriptions (danh dau subscription la ban dung thu mien phi).
-- ---------------------------------------------
IF COL_LENGTH('dbo.ChatSubscriptions', 'IsTrial') IS NULL
BEGIN
    ALTER TABLE dbo.ChatSubscriptions
        ADD IsTrial BIT NOT NULL CONSTRAINT DF_ChatSubscriptions_IsTrial DEFAULT 0;
END
GO

-- ---------------------------------------------
-- 4) Seed cac SystemSetting cho 3 uu dai (Admin chinh duoc). Idempotent qua MERGE.
-- ---------------------------------------------
;WITH PromoSettings AS (
    SELECT * FROM (VALUES
        ('Promotion:Trial:Enabled',           'true', 'Promotion', N'Bat/tat uu dai dung thu Premium mien phi.'),
        ('Promotion:Trial:Days',              '7',    'Promotion', N'So ngay dung thu Premium mien phi.'),
        ('Promotion:EarlyBird:Enabled',       'true', 'Promotion', N'Bat/tat uu dai giam gia cho Early Users.'),
        ('Promotion:EarlyBird:DiscountPercent','30',  'Promotion', N'Phan tram giam gia Early Users (%).'),
        ('Promotion:EarlyBird:Cycles',        '3',    'Promotion', N'So chu ky thanh toan dau duoc giam gia.'),
        ('Promotion:Referral:Enabled',        'true', 'Promotion', N'Bat/tat uu dai gioi thieu ban be.'),
        ('Promotion:Referral:BonusMessages',  '20',   'Promotion', N'So luot nhan AI cong them moi luot gioi thieu thanh cong.')
    ) AS v(SettingKey, SettingValue, Category, Description)
)
MERGE dbo.SystemSetting AS target
USING PromoSettings AS source
    ON target.SettingKey = source.SettingKey
WHEN NOT MATCHED BY TARGET THEN
    INSERT (SettingKey, SettingValue, Category, Description)
    VALUES (source.SettingKey, source.SettingValue, source.Category, source.Description);
GO

-- ---------------------------------------------
-- 5) Sinh ReferralCode cho cac user hien huu chua co (8 ky tu HEX viet hoa tu UserID).
-- ---------------------------------------------
UPDATE dbo.Users
SET ReferralCode = UPPER(LEFT(REPLACE(CONVERT(NVARCHAR(36), UserID), '-', ''), 8))
WHERE ReferralCode IS NULL;
GO
