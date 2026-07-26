-- =====================================================================
-- SEED 047: 10 realistic HCMC owners for PetOmi AI payment demos
-- Run after migrations 001..046.
--
-- Safe to re-run on unchanged seed data:
--   - fixed GUIDs
--   - guarded e-mail, pet-code, voucher and payment-reference namespaces
--   - MERGE/conditional INSERT for all seeded rows
--
-- Login password for all 10 accounts: 194551524@Thanh
-- All accounts are active, profile-complete and e-mail verified.
--
-- Recommended manual payment accounts:
--   demo.hcm.ngocan@petomi.test   : clean account, no payment/subscription
--   demo.hcm.minhbao@petomi.test  : clean account, no payment/subscription
--   demo.hcm.thuychi@petomi.test  : only an expired payment
--   demo.hcm.quocduy@petomi.test  : only a cancelled payment
--
-- Other demo states:
--   demo.hcm.hagiang@petomi.test  : active Premium trial
--   demo.hcm.minhha@petomi.test   : active paid Premium
--   demo.hcm.giakhanh@petomi.test : active paid Premium with voucher
--   demo.hcm.mylinh@petomi.test   : expired paid Premium
--   demo.hcm.hoangnam@petomi.test : expired trial, ready to purchase
--   demo.hcm.thanhthao@petomi.test: open pending QR with reserved voucher
-- =====================================================================
USE PetOmni_DB;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;

IF OBJECT_ID('dbo.Users', 'U') IS NULL
   OR OBJECT_ID('dbo.UserProfiles', 'U') IS NULL
   OR OBJECT_ID('dbo.Roles', 'U') IS NULL
   OR OBJECT_ID('dbo.UserRoles', 'U') IS NULL
   OR OBJECT_ID('dbo.Pets', 'U') IS NULL
   OR OBJECT_ID('dbo.PetHealthProfiles', 'U') IS NULL
   OR OBJECT_ID('dbo.PetWeightLogs', 'U') IS NULL
   OR OBJECT_ID('dbo.PetPhotos', 'U') IS NULL
   OR OBJECT_ID('dbo.PetMedicalRecords', 'U') IS NULL
   OR OBJECT_ID('dbo.ChatSubscriptionPlans', 'U') IS NULL
   OR OBJECT_ID('dbo.ChatSubscriptions', 'U') IS NULL
   OR OBJECT_ID('dbo.ChatSubscriptionPayments', 'U') IS NULL
   OR OBJECT_ID('dbo.ChatSubscriptionVouchers', 'U') IS NULL
   OR OBJECT_ID('dbo.ReferralRedemptions', 'U') IS NULL
BEGIN
    THROW 50470, 'Missing required tables. Run database scripts 001 through 046 before seed 047.', 1;
END;

IF COL_LENGTH('dbo.Users', 'IsProfileCompleted') IS NULL
   OR COL_LENGTH('dbo.Users', 'ReferralCode') IS NULL
   OR COL_LENGTH('dbo.Pets', 'PublicPetCode') IS NULL
   OR COL_LENGTH('dbo.ChatSubscriptions', 'IsTrial') IS NULL
   OR COL_LENGTH('dbo.ChatSubscriptionPayments', 'OriginalAmount') IS NULL
   OR COL_LENGTH('dbo.ChatSubscriptionPayments', 'DiscountAmount') IS NULL
   OR COL_LENGTH('dbo.ChatSubscriptionPayments', 'VoucherID') IS NULL
   OR COL_LENGTH('dbo.ChatSubscriptionPayments', 'IsOpen') IS NULL
   OR COL_LENGTH('dbo.ChatSubscriptionPayments', 'HasVoucherReservation') IS NULL
   OR COL_LENGTH('dbo.ChatSubscriptionVouchers', 'ReservedCount') IS NULL
BEGIN
    THROW 50471, 'Database schema is older than migration 046. Apply all migrations before seed 047.', 1;
END;
GO

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @Now DATETIME = GETUTCDATE();
    DECLARE @Today DATE = CONVERT(DATE, @Now);
    DECLARE @PasswordHash NVARCHAR(255) =
        N'$2a$11$3FhJ22U7m0GdVXspO7s23e/TCW.TwB0LYg8KqaCvgeVJGTNpo2Ugq';

    DECLARE @OwnerRoleID UNIQUEIDENTIFIER =
        (SELECT TOP (1) RoleID FROM dbo.Roles WHERE RoleName = N'Owner');

    IF @OwnerRoleID IS NULL
    BEGIN
        SET @OwnerRoleID = NEWID();
        INSERT INTO dbo.Roles (RoleID, RoleName)
        VALUES (@OwnerRoleID, N'Owner');
    END;

    DECLARE @DemoUsers TABLE
    (
        UserID         UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        ProfileID      UNIQUEIDENTIFIER NOT NULL,
        Email          NVARCHAR(255)    NOT NULL,
        FullName       NVARCHAR(100)    NOT NULL,
        Phone          NVARCHAR(20)     NOT NULL,
        DateOfBirth    DATE             NOT NULL,
        Gender         NVARCHAR(10)     NOT NULL,
        Address        NVARCHAR(500)    NOT NULL,
        AvatarURL      NVARCHAR(500)    NOT NULL,
        ReferralCode   NVARCHAR(20)     NOT NULL,
        AccountAgeDays INT              NOT NULL
    );

    INSERT INTO @DemoUsers
        (UserID, ProfileID, Email, FullName, Phone, DateOfBirth, Gender,
         Address, AvatarURL, ReferralCode, AccountAgeDays)
    VALUES
        ('77777777-2026-1000-0000-000000000001', '77777777-2026-1100-0000-000000000001',
         N'demo.hcm.ngocan@petomi.test', N'Nguyễn Ngọc An', N'0909004701', '1996-04-12', N'Female',
         N'15 Nguyễn Hữu Cảnh, Phường 19, Bình Thạnh, TP. Hồ Chí Minh',
         N'https://placehold.co/256x256/png?text=Ngoc+An', N'HCMAN4701', 210),
        ('77777777-2026-1000-0000-000000000002', '77777777-2026-1100-0000-000000000002',
         N'demo.hcm.minhbao@petomi.test', N'Trần Minh Bảo', N'0909004702', '1993-09-21', N'Male',
         N'88 Nguyễn Trãi, Phường 3, Quận 5, TP. Hồ Chí Minh',
         N'https://placehold.co/256x256/png?text=Minh+Bao', N'HCMBAO4702', 185),
        ('77777777-2026-1000-0000-000000000003', '77777777-2026-1100-0000-000000000003',
         N'demo.hcm.thuychi@petomi.test', N'Lê Thùy Chi', N'0918004703', '1998-01-08', N'Female',
         N'35 Trần Não, An Khánh, Thành phố Thủ Đức, TP. Hồ Chí Minh',
         N'https://placehold.co/256x256/png?text=Thuy+Chi', N'HCMCHI4703', 160),
        ('77777777-2026-1000-0000-000000000004', '77777777-2026-1100-0000-000000000004',
         N'demo.hcm.quocduy@petomi.test', N'Phạm Quốc Duy', N'0918004704', '1991-12-17', N'Male',
         N'106 Hoàng Diệu, Phường 12, Quận 4, TP. Hồ Chí Minh',
         N'https://placehold.co/256x256/png?text=Quoc+Duy', N'HCMDUY4704', 142),
        ('77777777-2026-1000-0000-000000000005', '77777777-2026-1100-0000-000000000005',
         N'demo.hcm.hagiang@petomi.test', N'Võ Hà Giang', N'0938004705', '1995-07-30', N'Female',
         N'27 Lê Văn Sỹ, Phường 13, Quận 3, TP. Hồ Chí Minh',
         N'https://placehold.co/256x256/png?text=Ha+Giang', N'HCMGIANG4705', 120),
        ('77777777-2026-1000-0000-000000000006', '77777777-2026-1100-0000-000000000006',
         N'demo.hcm.minhha@petomi.test', N'Đỗ Minh Hà', N'0938004706', '1989-03-05', N'Male',
         N'51 Tân Kỳ Tân Quý, Tân Sơn Nhì, Tân Phú, TP. Hồ Chí Minh',
         N'https://placehold.co/256x256/png?text=Minh+Ha', N'HCMHA4706', 105),
        ('77777777-2026-1000-0000-000000000007', '77777777-2026-1100-0000-000000000007',
         N'demo.hcm.giakhanh@petomi.test', N'Bùi Gia Khánh', N'0967004707', '1997-11-26', N'Male',
         N'90 Quang Trung, Phường 10, Gò Vấp, TP. Hồ Chí Minh',
         N'https://placehold.co/256x256/png?text=Gia+Khanh', N'HCMKHANH4707', 92),
        ('77777777-2026-1000-0000-000000000008', '77777777-2026-1100-0000-000000000008',
         N'demo.hcm.mylinh@petomi.test', N'Hoàng Mỹ Linh', N'0967004708', '1994-06-14', N'Female',
         N'18 Nguyễn Ảnh Thủ, Tân Chánh Hiệp, Quận 12, TP. Hồ Chí Minh',
         N'https://placehold.co/256x256/png?text=My+Linh', N'HCMLINH4708', 78),
        ('77777777-2026-1000-0000-000000000009', '77777777-2026-1100-0000-000000000009',
         N'demo.hcm.hoangnam@petomi.test', N'Đặng Hoàng Nam', N'0975004709', '1990-02-19', N'Male',
         N'42 Nguyễn Văn Linh, Bình Hưng, Bình Chánh, TP. Hồ Chí Minh',
         N'https://placehold.co/256x256/png?text=Hoang+Nam', N'HCMNAM4709', 64),
        ('77777777-2026-1000-0000-000000000010', '77777777-2026-1100-0000-000000000010',
         N'demo.hcm.thanhthao@petomi.test', N'Huỳnh Thanh Thảo', N'0975004710', '1999-10-03', N'Female',
         N'72 Phan Xích Long, Phường 2, Phú Nhuận, TP. Hồ Chí Minh',
         N'https://placehold.co/256x256/png?text=Thanh+Thao', N'HCMTHAO4710', 48);

    IF EXISTS
    (
        SELECT 1
        FROM dbo.Users existing
        INNER JOIN @DemoUsers demo
            ON existing.NormalizedEmail = LOWER(demo.Email)
        WHERE existing.UserID <> demo.UserID
    )
        THROW 50472, 'A seed e-mail is already assigned to another user.', 1;

    IF EXISTS
    (
        SELECT 1
        FROM dbo.Users existing
        INNER JOIN @DemoUsers demo
            ON existing.UserID = demo.UserID
        WHERE existing.NormalizedEmail <> LOWER(demo.Email)
    )
        THROW 50473, 'A seed UserID is already assigned to another e-mail.', 1;

    IF EXISTS
    (
        SELECT 1
        FROM dbo.Users existing
        INNER JOIN @DemoUsers demo
            ON existing.ReferralCode = demo.ReferralCode
        WHERE existing.UserID <> demo.UserID
    )
        THROW 50474, 'A seed referral code is already assigned to another user.', 1;

    MERGE dbo.Users WITH (HOLDLOCK) AS target
    USING @DemoUsers AS source
       ON target.UserID = source.UserID
    WHEN MATCHED THEN
        UPDATE SET
            Email = source.Email,
            NormalizedEmail = LOWER(source.Email),
            PasswordHash = @PasswordHash,
            EmailVerified = 1,
            FailedLoginAttempts = 0,
            LockoutUntil = NULL,
            DeletedAt = NULL,
            IsActive = 1,
            IsProfileCompleted = 1,
            ReferralCode = source.ReferralCode,
            UpdatedAt = @Now
    WHEN NOT MATCHED THEN
        INSERT
        (
            UserID, Email, NormalizedEmail, PasswordHash, EmailVerified,
            FailedLoginAttempts, LockoutUntil, CreatedAt, UpdatedAt,
            DeletedAt, IsActive, IsProfileCompleted, ReferralCode
        )
        VALUES
        (
            source.UserID, source.Email, LOWER(source.Email), @PasswordHash, 1,
            0, NULL, DATEADD(DAY, -source.AccountAgeDays, @Now), @Now,
            NULL, 1, 1, source.ReferralCode
        );

    MERGE dbo.UserProfiles WITH (HOLDLOCK) AS target
    USING @DemoUsers AS source
       ON target.UserID = source.UserID
    WHEN MATCHED THEN
        UPDATE SET
            FullName = source.FullName,
            Phone = source.Phone,
            AvatarURL = source.AvatarURL,
            DateOfBirth = source.DateOfBirth,
            Gender = source.Gender,
            Address = source.Address,
            UpdatedAt = @Now
    WHEN NOT MATCHED THEN
        INSERT
        (
            ProfileID, UserID, FullName, Phone, AvatarURL, DateOfBirth,
            Gender, Address, CreatedAt, UpdatedAt
        )
        VALUES
        (
            source.ProfileID, source.UserID, source.FullName, source.Phone,
            source.AvatarURL, source.DateOfBirth, source.Gender, source.Address,
            DATEADD(DAY, -source.AccountAgeDays, @Now), @Now
        );

    INSERT INTO dbo.UserRoles (UserID, RoleID)
    SELECT demo.UserID, @OwnerRoleID
    FROM @DemoUsers demo
    WHERE NOT EXISTS
    (
        SELECT 1
        FROM dbo.UserRoles existing
        WHERE existing.UserID = demo.UserID
          AND existing.RoleID = @OwnerRoleID
    );

    -- -----------------------------------------------------------------
    -- Fifteen pets: every owner has at least one; five owners have two.
    -- -----------------------------------------------------------------
    DECLARE @DemoPets TABLE
    (
        PetID                 UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        OwnerUserID           UNIQUEIDENTIFIER NOT NULL,
        Name                  NVARCHAR(100)    NOT NULL,
        Species               NVARCHAR(50)     NOT NULL,
        Breed                 NVARCHAR(100)    NOT NULL,
        Gender                NVARCHAR(20)     NOT NULL,
        DateOfBirth           DATE             NOT NULL,
        IsBirthDateEstimated  BIT              NOT NULL,
        AvatarURL             NVARCHAR(500)    NOT NULL,
        PublicPetCode         NVARCHAR(20)     NOT NULL,
        ProfileAgeDays        INT              NOT NULL
    );

    INSERT INTO @DemoPets
        (PetID, OwnerUserID, Name, Species, Breed, Gender, DateOfBirth,
         IsBirthDateEstimated, AvatarURL, PublicPetCode, ProfileAgeDays)
    VALUES
        ('77777777-2026-2000-0000-000000000001', '77777777-2026-1000-0000-000000000001',
         N'Mít', N'Dog', N'Toy Poodle', N'Male', '2021-09-18', 0,
         N'https://placehold.co/400x400/png?text=Mit', N'HCM-PET-4701', 205),
        ('77777777-2026-2000-0000-000000000002', '77777777-2026-1000-0000-000000000001',
         N'Miu', N'Cat', N'British Shorthair', N'Female', '2022-11-03', 0,
         N'https://placehold.co/400x400/png?text=Miu', N'HCM-PET-4702', 198),
        ('77777777-2026-2000-0000-000000000003', '77777777-2026-1000-0000-000000000002',
         N'Bơ', N'Dog', N'Pembroke Welsh Corgi', N'Female', '2020-05-22', 0,
         N'https://placehold.co/400x400/png?text=Bo', N'HCM-PET-4703', 178),
        ('77777777-2026-2000-0000-000000000004', '77777777-2026-1000-0000-000000000003',
         N'Đậu', N'Cat', N'Mèo ta lông ngắn', N'Male', '2023-02-14', 1,
         N'https://placehold.co/400x400/png?text=Dau', N'HCM-PET-4704', 154),
        ('77777777-2026-2000-0000-000000000005', '77777777-2026-1000-0000-000000000004',
         N'Cà Phê', N'Dog', N'Golden Retriever', N'Male', '2019-08-09', 0,
         N'https://placehold.co/400x400/png?text=Ca+Phe', N'HCM-PET-4705', 136),
        ('77777777-2026-2000-0000-000000000006', '77777777-2026-1000-0000-000000000004',
         N'Sữa', N'Cat', N'Scottish Fold', N'Female', '2022-06-25', 0,
         N'https://placehold.co/400x400/png?text=Sua', N'HCM-PET-4706', 130),
        ('77777777-2026-2000-0000-000000000007', '77777777-2026-1000-0000-000000000005',
         N'Nâu', N'Dog', N'Shiba Inu', N'Male', '2021-12-01', 0,
         N'https://placehold.co/400x400/png?text=Nau', N'HCM-PET-4707', 114),
        ('77777777-2026-2000-0000-000000000008', '77777777-2026-1000-0000-000000000006',
         N'Kem', N'Dog', N'Pomeranian', N'Female', '2023-04-18', 0,
         N'https://placehold.co/400x400/png?text=Kem', N'HCM-PET-4708', 99),
        ('77777777-2026-2000-0000-000000000009', '77777777-2026-1000-0000-000000000006',
         N'Mun', N'Cat', N'Mèo ta lông đen', N'Male', '2020-10-10', 1,
         N'https://placehold.co/400x400/png?text=Mun', N'HCM-PET-4709', 96),
        ('77777777-2026-2000-0000-000000000010', '77777777-2026-1000-0000-000000000007',
         N'Bắp', N'Dog', N'Beagle', N'Male', '2022-01-30', 0,
         N'https://placehold.co/400x400/png?text=Bap', N'HCM-PET-4710', 86),
        ('77777777-2026-2000-0000-000000000011', '77777777-2026-1000-0000-000000000008',
         N'Tôm', N'Dog', N'Toy Poodle', N'Female', '2021-07-07', 0,
         N'https://placehold.co/400x400/png?text=Tom', N'HCM-PET-4711', 73),
        ('77777777-2026-2000-0000-000000000012', '77777777-2026-1000-0000-000000000008',
         N'Mây', N'Cat', N'Ragdoll', N'Female', '2019-11-21', 0,
         N'https://placehold.co/400x400/png?text=May', N'HCM-PET-4712', 70),
        ('77777777-2026-2000-0000-000000000013', '77777777-2026-1000-0000-000000000009',
         N'Gấu', N'Dog', N'French Bulldog', N'Male', '2020-03-16', 0,
         N'https://placehold.co/400x400/png?text=Gau', N'HCM-PET-4713', 58),
        ('77777777-2026-2000-0000-000000000014', '77777777-2026-1000-0000-000000000010',
         N'Xoài', N'Cat', N'Mèo ta lông ngắn', N'Female', '2023-09-12', 1,
         N'https://placehold.co/400x400/png?text=Xoai', N'HCM-PET-4714', 44),
        ('77777777-2026-2000-0000-000000000015', '77777777-2026-1000-0000-000000000010',
         N'Mỡ', N'Dog', N'Samoyed', N'Male', '2018-12-05', 0,
         N'https://placehold.co/400x400/png?text=Mo', N'HCM-PET-4715', 40);

    IF EXISTS
    (
        SELECT 1
        FROM dbo.Pets existing
        INNER JOIN @DemoPets demo
            ON existing.PublicPetCode = demo.PublicPetCode
           AND existing.IsActive = 1
        WHERE existing.PetID <> demo.PetID
    )
        THROW 50475, 'A seed public pet code is already assigned to another active pet.', 1;

    MERGE dbo.Pets WITH (HOLDLOCK) AS target
    USING @DemoPets AS source
       ON target.PetID = source.PetID
    WHEN MATCHED THEN
        UPDATE SET
            OwnerUserID = source.OwnerUserID,
            Name = source.Name,
            Species = source.Species,
            Breed = source.Breed,
            Gender = source.Gender,
            DateOfBirth = source.DateOfBirth,
            IsBirthDateEstimated = source.IsBirthDateEstimated,
            AvatarURL = source.AvatarURL,
            PublicPetCode = source.PublicPetCode,
            IsActive = 1,
            DeletedAt = NULL,
            UpdatedAt = @Now
    WHEN NOT MATCHED THEN
        INSERT
        (
            PetID, OwnerUserID, Name, Species, Breed, Gender, DateOfBirth,
            IsBirthDateEstimated, AvatarURL, PublicPetCode, IsActive,
            DeletedAt, CreatedAt, UpdatedAt
        )
        VALUES
        (
            source.PetID, source.OwnerUserID, source.Name, source.Species,
            source.Breed, source.Gender, source.DateOfBirth,
            source.IsBirthDateEstimated, source.AvatarURL, source.PublicPetCode,
            1, NULL, DATEADD(DAY, -source.ProfileAgeDays, @Now), @Now
        );

    DECLARE @HealthProfiles TABLE
    (
        PetHealthProfileID UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        PetID               UNIQUEIDENTIFIER NOT NULL,
        CurrentWeightKg     DECIMAL(5,2)     NOT NULL,
        Color               NVARCHAR(200)    NOT NULL,
        IsNeutered          NVARCHAR(20)     NOT NULL,
        Allergies           NVARCHAR(MAX)    NULL,
        ChronicConditions   NVARCHAR(MAX)    NULL,
        MicrochipNumber     NVARCHAR(100)    NULL
    );

    INSERT INTO @HealthProfiles
        (PetHealthProfileID, PetID, CurrentWeightKg, Color, IsNeutered,
         Allergies, ChronicConditions, MicrochipNumber)
    VALUES
        ('77777777-2026-3000-0000-000000000001', '77777777-2026-2000-0000-000000000001', 4.80, N'Nâu mơ, ngực trắng', N'Yes', N'Không ghi nhận', N'Viêm da theo mùa mức độ nhẹ', N'900250000470001'),
        ('77777777-2026-3000-0000-000000000002', '77777777-2026-2000-0000-000000000002', 4.20, N'Xám xanh', N'Yes', N'Nhạy cảm với thức ăn vị cá biển', N'Không', N'900250000470002'),
        ('77777777-2026-3000-0000-000000000003', '77777777-2026-2000-0000-000000000003', 11.60, N'Vàng trắng', N'Yes', N'Nhạy cảm với protein gà', N'Không', N'900250000470003'),
        ('77777777-2026-3000-0000-000000000004', '77777777-2026-2000-0000-000000000004', 4.90, N'Mướp vàng', N'No', N'Không ghi nhận', N'Không', NULL),
        ('77777777-2026-3000-0000-000000000005', '77777777-2026-2000-0000-000000000005', 30.50, N'Vàng kem', N'Yes', N'Không ghi nhận', N'Loạn sản khớp háng mức độ nhẹ', N'900250000470005'),
        ('77777777-2026-3000-0000-000000000006', '77777777-2026-2000-0000-000000000006', 4.10, N'Xám bạc', N'Yes', N'Không ghi nhận', N'Cần theo dõi hô hấp khi thời tiết nóng', N'900250000470006'),
        ('77777777-2026-3000-0000-000000000007', '77777777-2026-2000-0000-000000000007', 10.20, N'Vàng đỏ', N'Yes', N'Không ghi nhận', N'Không', N'900250000470007'),
        ('77777777-2026-3000-0000-000000000008', '77777777-2026-2000-0000-000000000008', 3.10, N'Kem trắng', N'No', N'Không ghi nhận', N'Chảy nước mắt nhẹ', NULL),
        ('77777777-2026-3000-0000-000000000009', '77777777-2026-2000-0000-000000000009', 5.40, N'Đen tuyền', N'Yes', N'Không ghi nhận', N'Từng có tinh thể đường tiết niệu', N'900250000470009'),
        ('77777777-2026-3000-0000-000000000010', '77777777-2026-2000-0000-000000000010', 12.80, N'Tam thể nâu trắng đen', N'Yes', N'Nhạy cảm với thức ăn nhiều ngũ cốc', N'Không', N'900250000470010'),
        ('77777777-2026-3000-0000-000000000011', '77777777-2026-2000-0000-000000000011', 3.70, N'Nâu đỏ', N'Yes', N'Không ghi nhận', N'Không', NULL),
        ('77777777-2026-3000-0000-000000000012', '77777777-2026-2000-0000-000000000012', 5.80, N'Trắng kem, mặt xám', N'Yes', N'Không ghi nhận', N'Dễ búi lông, cần chải lông hằng ngày', N'900250000470012'),
        ('77777777-2026-3000-0000-000000000013', '77777777-2026-2000-0000-000000000013', 13.40, N'Vện nâu', N'Yes', N'Không ghi nhận', N'Viêm nếp gấp da tái phát', N'900250000470013'),
        ('77777777-2026-3000-0000-000000000014', '77777777-2026-2000-0000-000000000014', 3.80, N'Trắng vàng', N'No', N'Không ghi nhận', N'Không', NULL),
        ('77777777-2026-3000-0000-000000000015', '77777777-2026-2000-0000-000000000015', 24.60, N'Trắng', N'Yes', N'Không ghi nhận', N'Đang theo kế hoạch kiểm soát cân nặng', N'900250000470015');

    MERGE dbo.PetHealthProfiles WITH (HOLDLOCK) AS target
    USING @HealthProfiles AS source
       ON target.PetID = source.PetID
    WHEN MATCHED THEN
        UPDATE SET
            CurrentWeightKg = source.CurrentWeightKg,
            Color = source.Color,
            IsNeutered = source.IsNeutered,
            Allergies = source.Allergies,
            ChronicConditions = source.ChronicConditions,
            MicrochipNumber = source.MicrochipNumber,
            UpdatedAt = @Now
    WHEN NOT MATCHED THEN
        INSERT
        (
            PetHealthProfileID, PetID, CurrentWeightKg, Color, IsNeutered,
            Allergies, ChronicConditions, MicrochipNumber, CreatedAt, UpdatedAt
        )
        VALUES
        (
            source.PetHealthProfileID, source.PetID, source.CurrentWeightKg,
            source.Color, source.IsNeutered, source.Allergies,
            source.ChronicConditions, source.MicrochipNumber,
            DATEADD(DAY, -30, @Now), @Now
        );

    -- Two weight points per pet make the owner dashboard trend believable.
    DECLARE @WeightLogs TABLE
    (
        WeightLogID UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        PetID       UNIQUEIDENTIFIER NOT NULL,
        WeightKg    DECIMAL(5,2)     NOT NULL,
        DaysAgo     INT              NOT NULL,
        Source      NVARCHAR(50)     NOT NULL,
        Note        NVARCHAR(500)    NULL
    );

    INSERT INTO @WeightLogs (WeightLogID, PetID, WeightKg, DaysAgo, Source, Note)
    VALUES
        ('77777777-2026-3100-0000-000000000001', '77777777-2026-2000-0000-000000000001', 4.60, 90, N'Owner', N'Cân tại nhà trước khi đổi thức ăn.'),
        ('77777777-2026-3100-0000-000000000002', '77777777-2026-2000-0000-000000000001', 4.80, 7, N'Vet', N'Cân trong lần tái khám da.'),
        ('77777777-2026-3100-0000-000000000003', '77777777-2026-2000-0000-000000000002', 4.35, 75, N'Owner', N'Theo dõi khẩu phần.'),
        ('77777777-2026-3100-0000-000000000004', '77777777-2026-2000-0000-000000000002', 4.20, 8, N'Vet', N'Cân nặng ổn định.'),
        ('77777777-2026-3100-0000-000000000005', '77777777-2026-2000-0000-000000000003', 12.10, 80, N'Vet', N'Khuyến nghị tăng vận động.'),
        ('77777777-2026-3100-0000-000000000006', '77777777-2026-2000-0000-000000000003', 11.60, 6, N'Owner', N'Giảm cân đúng kế hoạch.'),
        ('77777777-2026-3100-0000-000000000007', '77777777-2026-2000-0000-000000000004', 4.55, 60, N'Owner', N'Cân sau khi nhận nuôi.'),
        ('77777777-2026-3100-0000-000000000008', '77777777-2026-2000-0000-000000000004', 4.90, 5, N'Vet', N'Tăng cân phù hợp.'),
        ('77777777-2026-3100-0000-000000000009', '77777777-2026-2000-0000-000000000005', 30.20, 95, N'Vet', N'Đánh giá khớp háng.'),
        ('77777777-2026-3100-0000-000000000010', '77777777-2026-2000-0000-000000000005', 30.50, 10, N'Owner', N'Cân sau buổi đi bộ sáng.'),
        ('77777777-2026-3100-0000-000000000011', '77777777-2026-2000-0000-000000000006', 3.95, 70, N'Owner', N'Khẩu phần mới.'),
        ('77777777-2026-3100-0000-000000000012', '77777777-2026-2000-0000-000000000006', 4.10, 9, N'Vet', N'Tình trạng ổn định.'),
        ('77777777-2026-3100-0000-000000000013', '77777777-2026-2000-0000-000000000007', 9.90, 85, N'Owner', N'Cân định kỳ.'),
        ('77777777-2026-3100-0000-000000000014', '77777777-2026-2000-0000-000000000007', 10.20, 4, N'Vet', N'Thể trạng tốt.'),
        ('77777777-2026-3100-0000-000000000015', '77777777-2026-2000-0000-000000000008', 2.90, 55, N'Owner', N'Cân tại nhà.'),
        ('77777777-2026-3100-0000-000000000016', '77777777-2026-2000-0000-000000000008', 3.10, 3, N'Vet', N'Tăng trưởng phù hợp.'),
        ('77777777-2026-3100-0000-000000000017', '77777777-2026-2000-0000-000000000009', 5.65, 88, N'Vet', N'Bắt đầu chế độ urinary.'),
        ('77777777-2026-3100-0000-000000000018', '77777777-2026-2000-0000-000000000009', 5.40, 11, N'Owner', N'Uống nước tốt hơn.'),
        ('77777777-2026-3100-0000-000000000019', '77777777-2026-2000-0000-000000000010', 13.20, 72, N'Owner', N'Cân trước khi điều chỉnh thức ăn.'),
        ('77777777-2026-3100-0000-000000000020', '77777777-2026-2000-0000-000000000010', 12.80, 5, N'Vet', N'Đáp ứng tốt.'),
        ('77777777-2026-3100-0000-000000000021', '77777777-2026-2000-0000-000000000011', 3.55, 68, N'Owner', N'Cân định kỳ.'),
        ('77777777-2026-3100-0000-000000000022', '77777777-2026-2000-0000-000000000011', 3.70, 8, N'Vet', N'Thể trạng cân đối.'),
        ('77777777-2026-3100-0000-000000000023', '77777777-2026-2000-0000-000000000012', 5.65, 77, N'Owner', N'Theo dõi búi lông.'),
        ('77777777-2026-3100-0000-000000000024', '77777777-2026-2000-0000-000000000012', 5.80, 12, N'Vet', N'Khuyến nghị tăng chải lông.'),
        ('77777777-2026-3100-0000-000000000025', '77777777-2026-2000-0000-000000000013', 13.10, 66, N'Owner', N'Cân tại nhà.'),
        ('77777777-2026-3100-0000-000000000026', '77777777-2026-2000-0000-000000000013', 13.40, 6, N'Vet', N'Kiểm tra nếp gấp da.'),
        ('77777777-2026-3100-0000-000000000027', '77777777-2026-2000-0000-000000000014', 3.45, 39, N'Owner', N'Cân sau khi nhận nuôi.'),
        ('77777777-2026-3100-0000-000000000028', '77777777-2026-2000-0000-000000000014', 3.80, 4, N'Vet', N'Tăng cân tốt.'),
        ('77777777-2026-3100-0000-000000000029', '77777777-2026-2000-0000-000000000015', 26.10, 82, N'Vet', N'Bắt đầu kế hoạch kiểm soát cân nặng.'),
        ('77777777-2026-3100-0000-000000000030', '77777777-2026-2000-0000-000000000015', 24.60, 7, N'Owner', N'Giảm cân an toàn.');

    MERGE dbo.PetWeightLogs WITH (HOLDLOCK) AS target
    USING @WeightLogs AS source
       ON target.WeightLogID = source.WeightLogID
    WHEN MATCHED THEN
        UPDATE SET
            PetID = source.PetID,
            WeightKg = source.WeightKg,
            MeasuredAt = DATEADD(DAY, -source.DaysAgo, @Now),
            Source = source.Source,
            Note = source.Note
    WHEN NOT MATCHED THEN
        INSERT (WeightLogID, PetID, WeightKg, MeasuredAt, Source, Note, CreatedAt)
        VALUES
        (
            source.WeightLogID, source.PetID, source.WeightKg,
            DATEADD(DAY, -source.DaysAgo, @Now), source.Source, source.Note,
            DATEADD(DAY, -source.DaysAgo, @Now)
        );

    MERGE dbo.PetPhotos WITH (HOLDLOCK) AS target
    USING
    (
        SELECT
            CONVERT(UNIQUEIDENTIFIER,
                CONCAT('77777777-2026-3200-0000-', RIGHT(CONCAT('000000000000', ROW_NUMBER() OVER (ORDER BY PetID)), 12))) AS PhotoID,
            PetID,
            AvatarURL AS ImageURL,
            CONCAT(N'Ảnh đại diện của ', Name) AS Caption,
            ProfileAgeDays
        FROM @DemoPets
    ) AS source
       ON target.PhotoID = source.PhotoID
    WHEN MATCHED THEN
        UPDATE SET
            PetID = source.PetID,
            ImageURL = source.ImageURL,
            Caption = source.Caption,
            IsAvatar = 1,
            TakenAt = DATEADD(DAY, -source.ProfileAgeDays, @Now),
            DeletedAt = NULL,
            IsActive = 1,
            UpdatedAt = @Now
    WHEN NOT MATCHED THEN
        INSERT
        (
            PhotoID, PetID, ImageURL, Caption, IsAvatar, TakenAt,
            CreatedAt, UpdatedAt, DeletedAt, IsActive
        )
        VALUES
        (
            source.PhotoID, source.PetID, source.ImageURL, source.Caption, 1,
            DATEADD(DAY, -source.ProfileAgeDays, @Now),
            DATEADD(DAY, -source.ProfileAgeDays, @Now), @Now, NULL, 1
        );

    DECLARE @MedicalRecords TABLE
    (
        MedicalRecordID UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        PetID           UNIQUEIDENTIFIER NOT NULL,
        RecordType      NVARCHAR(50)     NOT NULL,
        Title           NVARCHAR(200)    NOT NULL,
        Description     NVARCHAR(MAX)    NULL,
        DaysAgo         INT              NOT NULL,
        VetName         NVARCHAR(200)    NULL,
        ClinicName      NVARCHAR(200)    NULL,
        MedicationName  NVARCHAR(200)    NULL,
        Dosage          NVARCHAR(100)    NULL,
        DurationDays    INT              NULL
    );

    INSERT INTO @MedicalRecords
        (MedicalRecordID, PetID, RecordType, Title, Description, DaysAgo,
         VetName, ClinicName, MedicationName, Dosage, DurationDays)
    VALUES
        ('77777777-2026-3300-0000-000000000001', '77777777-2026-2000-0000-000000000001', N'Visit', N'Tái khám viêm da theo mùa', N'Da đáp ứng tốt, tiếp tục giữ lông khô và vệ sinh sau khi đi mưa.', 7, N'BS. Nguyễn Minh Quân', N'Phòng khám Thú y PetOmi Sài Gòn', NULL, NULL, NULL),
        ('77777777-2026-3300-0000-000000000002', '77777777-2026-2000-0000-000000000002', N'Allergy', N'Ghi nhận nhạy cảm thức ăn', N'Ngứa vùng cổ sau khi ăn pate cá; chuyển sang thức ăn đơn đạm.', 45, N'BS. Trần Hoài Phương', N'Phòng khám Thú y PetOmi Sài Gòn', NULL, NULL, NULL),
        ('77777777-2026-3300-0000-000000000003', '77777777-2026-2000-0000-000000000003', N'Vaccine', N'Tiêm nhắc DHPPi và Lepto', N'Khám sàng lọc bình thường, theo dõi tại nhà 24 giờ sau tiêm.', 32, N'BS. Nguyễn Minh Quân', N'Phòng khám Thú y PetOmi Sài Gòn', N'Nobivac DHPPi + Lepto', N'1 liều', NULL),
        ('77777777-2026-3300-0000-000000000004', '77777777-2026-2000-0000-000000000004', N'Visit', N'Khám sức khỏe sau nhận nuôi', N'Tổng trạng tốt, đã lên lịch tẩy giun và tiêm phòng theo tuổi.', 38, N'BS. Lê Thu Uyên', N'Phòng khám Thú y PetOmi Sài Gòn', NULL, NULL, NULL),
        ('77777777-2026-3300-0000-000000000005', '77777777-2026-2000-0000-000000000005', N'Visit', N'Đánh giá khớp háng định kỳ', N'Không đau cấp tính; duy trì vận động nhẹ và kiểm soát cân nặng.', 21, N'BS. Phạm Quốc Hưng', N'Phòng khám Thú y PetOmi Sài Gòn', NULL, NULL, NULL),
        ('77777777-2026-3300-0000-000000000006', '77777777-2026-2000-0000-000000000006', N'Visit', N'Kiểm tra hô hấp mùa nóng', N'Nhịp thở ổn định khi nghỉ, hạn chế vận động vào giữa trưa.', 16, N'BS. Trần Hoài Phương', N'Phòng khám Thú y PetOmi Sài Gòn', NULL, NULL, NULL),
        ('77777777-2026-3300-0000-000000000007', '77777777-2026-2000-0000-000000000007', N'Vaccine', N'Tiêm phòng dại hằng năm', N'Đã tiêm đúng lịch, không ghi nhận phản ứng bất lợi.', 54, N'BS. Nguyễn Minh Quân', N'Phòng khám Thú y PetOmi Sài Gòn', N'Rabisin', N'1 liều', NULL),
        ('77777777-2026-3300-0000-000000000008', '77777777-2026-2000-0000-000000000008', N'Medication', N'Chăm sóc chảy nước mắt', N'Vệ sinh khóe mắt hằng ngày và theo dõi màu dịch tiết.', 18, N'BS. Lê Thu Uyên', N'Phòng khám Thú y PetOmi Sài Gòn', N'Nước muối sinh lý 0,9%', N'2 lần/ngày', 10),
        ('77777777-2026-3300-0000-000000000009', '77777777-2026-2000-0000-000000000009', N'Illness', N'Tái khám đường tiết niệu', N'Không còn tiểu khó; tiếp tục thức ăn urinary và tăng lượng nước uống.', 11, N'BS. Trần Hoài Phương', N'Phòng khám Thú y PetOmi Sài Gòn', N'Urinary wet diet', N'Theo khẩu phần', 30),
        ('77777777-2026-3300-0000-000000000010', '77777777-2026-2000-0000-000000000010', N'Allergy', N'Theo dõi nhạy cảm thức ăn', N'Phân ổn định sau khi chuyển sang công thức không ngũ cốc.', 28, N'BS. Nguyễn Minh Quân', N'Phòng khám Thú y PetOmi Sài Gòn', NULL, NULL, NULL),
        ('77777777-2026-3300-0000-000000000011', '77777777-2026-2000-0000-000000000011', N'Vaccine', N'Tiêm vaccine tổng hợp', N'Khám trước tiêm bình thường, thân nhiệt 38,6°C.', 40, N'BS. Lê Thu Uyên', N'Phòng khám Thú y PetOmi Sài Gòn', N'Vaccine 5 bệnh', N'1 liều', NULL),
        ('77777777-2026-3300-0000-000000000012', '77777777-2026-2000-0000-000000000012', N'Visit', N'Tư vấn kiểm soát búi lông', N'Tăng chải lông, bổ sung nước và dùng gel hỗ trợ khi cần.', 12, N'BS. Trần Hoài Phương', N'Phòng khám Thú y PetOmi Sài Gòn', N'Hairball gel', N'2 cm/ngày', 7),
        ('77777777-2026-3300-0000-000000000013', '77777777-2026-2000-0000-000000000013', N'Medication', N'Điều trị viêm nếp gấp da', N'Vệ sinh và lau khô vùng mặt, tái khám nếu đỏ lan rộng.', 6, N'BS. Phạm Quốc Hưng', N'Phòng khám Thú y PetOmi Sài Gòn', N'Dung dịch Chlorhexidine thú y', N'1 lần/ngày', 14),
        ('77777777-2026-3300-0000-000000000014', '77777777-2026-2000-0000-000000000014', N'Visit', N'Khám tổng quát mèo trẻ', N'Phát triển phù hợp, hẹn triệt sản sau khi hoàn tất lịch vaccine.', 9, N'BS. Lê Thu Uyên', N'Phòng khám Thú y PetOmi Sài Gòn', NULL, NULL, NULL),
        ('77777777-2026-3300-0000-000000000015', '77777777-2026-2000-0000-000000000015', N'Visit', N'Tái khám kiểm soát cân nặng', N'Giảm 1,5 kg trong 10 tuần; tiếp tục khẩu phần hiện tại và đi bộ nhẹ.', 7, N'BS. Nguyễn Minh Quân', N'Phòng khám Thú y PetOmi Sài Gòn', NULL, NULL, NULL);

    MERGE dbo.PetMedicalRecords WITH (HOLDLOCK) AS target
    USING @MedicalRecords AS source
       ON target.MedicalRecordID = source.MedicalRecordID
    WHEN MATCHED THEN
        UPDATE SET
            PetID = source.PetID,
            RecordType = source.RecordType,
            Title = source.Title,
            Description = source.Description,
            RecordDate = DATEADD(DAY, -source.DaysAgo, @Today),
            VetName = source.VetName,
            ClinicName = source.ClinicName,
            MedicationName = source.MedicationName,
            Dosage = source.Dosage,
            StartDate = CASE WHEN source.DurationDays IS NULL THEN NULL ELSE DATEADD(DAY, -source.DaysAgo, @Today) END,
            EndDate = CASE WHEN source.DurationDays IS NULL THEN NULL ELSE DATEADD(DAY, source.DurationDays - source.DaysAgo, @Today) END,
            DeletedAt = NULL,
            IsActive = 1,
            UpdatedAt = @Now
    WHEN NOT MATCHED THEN
        INSERT
        (
            MedicalRecordID, PetID, RecordType, Title, Description, RecordDate,
            VetName, ClinicName, MedicationName, Dosage, StartDate, EndDate,
            AttachmentURL, CreatedAt, UpdatedAt, DeletedAt, IsActive
        )
        VALUES
        (
            source.MedicalRecordID, source.PetID, source.RecordType, source.Title,
            source.Description, DATEADD(DAY, -source.DaysAgo, @Today),
            source.VetName, source.ClinicName, source.MedicationName, source.Dosage,
            CASE WHEN source.DurationDays IS NULL THEN NULL ELSE DATEADD(DAY, -source.DaysAgo, @Today) END,
            CASE WHEN source.DurationDays IS NULL THEN NULL ELSE DATEADD(DAY, source.DurationDays - source.DaysAgo, @Today) END,
            NULL, DATEADD(DAY, -source.DaysAgo, @Now), @Now, NULL, 1
        );

    -- Two realistic referral events for the promotions dashboard.
    MERGE dbo.ReferralRedemptions WITH (HOLDLOCK) AS target
    USING (VALUES
        ('77777777-2026-3400-0000-000000000001',
         '77777777-2026-1000-0000-000000000001',
         '77777777-2026-1000-0000-000000000002',
         N'HCMAN4701', 25, DATEADD(DAY, -170, @Now)),
        ('77777777-2026-3400-0000-000000000002',
         '77777777-2026-1000-0000-000000000005',
         '77777777-2026-1000-0000-000000000006',
         N'HCMGIANG4705', 25, DATEADD(DAY, -98, @Now))
    ) AS source
        (RedemptionID, ReferrerUserID, NewUserID, ReferralCode, BonusMessages, CreatedAt)
       ON target.RedemptionID = source.RedemptionID
    WHEN MATCHED THEN
        UPDATE SET
            ReferrerUserID = source.ReferrerUserID,
            NewUserID = source.NewUserID,
            ReferralCode = source.ReferralCode,
            BonusMessages = source.BonusMessages,
            CreatedAt = source.CreatedAt
    WHEN NOT MATCHED THEN
        INSERT
            (RedemptionID, ReferrerUserID, NewUserID, ReferralCode, BonusMessages, CreatedAt)
        VALUES
            (source.RedemptionID, source.ReferrerUserID, source.NewUserID,
             source.ReferralCode, source.BonusMessages, source.CreatedAt);

    -- -----------------------------------------------------------------
    -- Vouchers and varied subscription/payment states for admin demos.
    -- -----------------------------------------------------------------
    DECLARE @PremiumPlanID UNIQUEIDENTIFIER =
        (SELECT TOP (1) PlanID FROM dbo.ChatSubscriptionPlans WHERE Code = N'premium' AND IsActive = 1);

    IF @PremiumPlanID IS NULL
        THROW 50476, 'Active premium chat subscription plan not found.', 1;

    DECLARE @VoucherPercentID UNIQUEIDENTIFIER = '77777777-2026-4000-0000-000000000001';
    DECLARE @VoucherFixedID UNIQUEIDENTIFIER = '77777777-2026-4000-0000-000000000002';
    DECLARE @VoucherWelcomeID UNIQUEIDENTIFIER = '77777777-2026-4000-0000-000000000003';

    IF EXISTS
    (
        SELECT 1
        FROM dbo.ChatSubscriptionVouchers existing
        WHERE existing.Code IN (N'PETOMI10', N'HCM20K', N'WELCOME15')
          AND existing.VoucherID NOT IN (@VoucherPercentID, @VoucherFixedID, @VoucherWelcomeID)
    )
        THROW 50477, 'A seed voucher code is already assigned to another voucher.', 1;

    MERGE dbo.ChatSubscriptionVouchers WITH (HOLDLOCK) AS target
    USING (VALUES
        (@VoucherPercentID, N'PETOMI10', N'Giảm 10% gói Premium', N'Voucher demo giảm 10%, tối đa 15.000đ.',
         N'Percent', CAST(10 AS DECIMAL(18,2)), CAST(15000 AS DECIMAL(18,2)), CAST(50000 AS DECIMAL(18,2)),
         100, 1, 0, DATEADD(DAY, -30, @Now), DATEADD(DAY, 180, @Now), CAST(1 AS BIT)),
        (@VoucherFixedID, N'HCM20K', N'Ưu đãi 20.000đ tại TP.HCM', N'Voucher demo giảm cố định 20.000đ.',
         N'FixedAmount', CAST(20000 AS DECIMAL(18,2)), NULL, CAST(50000 AS DECIMAL(18,2)),
         50, 0, 1, DATEADD(DAY, -30, @Now), DATEADD(DAY, 180, @Now), CAST(1 AS BIT)),
        (@VoucherWelcomeID, N'WELCOME15', N'Chào mừng thành viên mới', N'Giảm 15%, tối đa 20.000đ cho gói Premium.',
         N'Percent', CAST(15 AS DECIMAL(18,2)), CAST(20000 AS DECIMAL(18,2)), CAST(50000 AS DECIMAL(18,2)),
         200, 0, 0, DATEADD(DAY, -30, @Now), DATEADD(DAY, 180, @Now), CAST(1 AS BIT))
    ) AS source
        (VoucherID, Code, Name, Description, DiscountType, DiscountValue,
         MaxDiscountAmount, MinOrderAmount, UsageLimit, UsedCount, ReservedCount,
         StartsAt, ExpiresAt, IsActive)
       ON target.VoucherID = source.VoucherID
    WHEN MATCHED THEN
        UPDATE SET
            Code = source.Code,
            Name = source.Name,
            Description = source.Description,
            DiscountType = source.DiscountType,
            DiscountValue = source.DiscountValue,
            MaxDiscountAmount = source.MaxDiscountAmount,
            MinOrderAmount = source.MinOrderAmount,
            UsageLimit = source.UsageLimit,
            UsedCount = source.UsedCount,
            ReservedCount = source.ReservedCount,
            StartsAt = source.StartsAt,
            ExpiresAt = source.ExpiresAt,
            IsActive = source.IsActive,
            UpdatedAt = @Now
    WHEN NOT MATCHED THEN
        INSERT
        (
            VoucherID, Code, Name, Description, DiscountType, DiscountValue,
            MaxDiscountAmount, MinOrderAmount, UsageLimit, UsedCount,
            ReservedCount, StartsAt, ExpiresAt, IsActive, CreatedByAdminID,
            CreatedAt, UpdatedAt
        )
        VALUES
        (
            source.VoucherID, source.Code, source.Name, source.Description,
            source.DiscountType, source.DiscountValue, source.MaxDiscountAmount,
            source.MinOrderAmount, source.UsageLimit, source.UsedCount,
            source.ReservedCount, source.StartsAt, source.ExpiresAt,
            source.IsActive, NULL, DATEADD(DAY, -30, @Now), @Now
        );

    DECLARE @Subscriptions TABLE
    (
        SubscriptionID UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        OwnerUserID    UNIQUEIDENTIFIER NOT NULL,
        Status         NVARCHAR(20)     NOT NULL,
        StartsAt       DATETIME         NOT NULL,
        ExpiresAt      DATETIME         NOT NULL,
        IsActive       BIT              NOT NULL,
        IsTrial        BIT              NOT NULL,
        CancelledAt    DATETIME         NULL
    );

    INSERT INTO @Subscriptions
        (SubscriptionID, OwnerUserID, Status, StartsAt, ExpiresAt, IsActive, IsTrial, CancelledAt)
    VALUES
        ('77777777-2026-4100-0000-000000000001', '77777777-2026-1000-0000-000000000005',
         N'Active', DATEADD(DAY, -3, @Now), DATEADD(DAY, 4, @Now), 1, 1, NULL),
        ('77777777-2026-4100-0000-000000000002', '77777777-2026-1000-0000-000000000006',
         N'Active', DATEADD(DAY, -10, @Now), DATEADD(DAY, 20, @Now), 1, 0, NULL),
        ('77777777-2026-4100-0000-000000000003', '77777777-2026-1000-0000-000000000007',
         N'Active', DATEADD(DAY, -5, @Now), DATEADD(DAY, 25, @Now), 1, 0, NULL),
        ('77777777-2026-4100-0000-000000000004', '77777777-2026-1000-0000-000000000008',
         N'Expired', DATEADD(DAY, -45, @Now), DATEADD(DAY, -15, @Now), 0, 0, NULL),
        ('77777777-2026-4100-0000-000000000005', '77777777-2026-1000-0000-000000000009',
         N'Expired', DATEADD(DAY, -20, @Now), DATEADD(DAY, -13, @Now), 0, 1, NULL);

    IF EXISTS
    (
        SELECT 1
        FROM dbo.ChatSubscriptions existing
        INNER JOIN @Subscriptions demo
            ON existing.OwnerUserID = demo.OwnerUserID
           AND existing.ScopeType = N'OwnerPet'
           AND existing.IsActive = 1
        WHERE existing.SubscriptionID <> demo.SubscriptionID
          AND demo.IsActive = 1
    )
        THROW 50478, 'A demo owner already has another active chat subscription.', 1;

    MERGE dbo.ChatSubscriptions WITH (HOLDLOCK) AS target
    USING @Subscriptions AS source
       ON target.SubscriptionID = source.SubscriptionID
    WHEN MATCHED THEN
        UPDATE SET
            ScopeType = N'OwnerPet',
            OwnerUserID = source.OwnerUserID,
            PetID = NULL,
            ClinicID = NULL,
            PlanID = @PremiumPlanID,
            Status = source.Status,
            StartsAt = source.StartsAt,
            ExpiresAt = source.ExpiresAt,
            CancelledAt = source.CancelledAt,
            IsActive = source.IsActive,
            IsTrial = source.IsTrial,
            UpdatedAt = @Now
    WHEN NOT MATCHED THEN
        INSERT
        (
            SubscriptionID, ScopeType, OwnerUserID, PetID, ClinicID, PlanID,
            Status, StartsAt, ExpiresAt, CancelledAt, IsActive, IsTrial,
            CreatedAt, UpdatedAt
        )
        VALUES
        (
            source.SubscriptionID, N'OwnerPet', source.OwnerUserID, NULL, NULL,
            @PremiumPlanID, source.Status, source.StartsAt, source.ExpiresAt,
            source.CancelledAt, source.IsActive, source.IsTrial,
            source.StartsAt, @Now
        );

    DECLARE @Payments TABLE
    (
        PaymentID             UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        SubscriptionID        UNIQUEIDENTIFIER NULL,
        OwnerUserID           UNIQUEIDENTIFIER NOT NULL,
        Status                NVARCHAR(20)     NOT NULL,
        OriginalAmount        DECIMAL(18,2)    NOT NULL,
        DiscountAmount        DECIMAL(18,2)    NOT NULL,
        VoucherID             UNIQUEIDENTIFIER NULL,
        VoucherCode           NVARCHAR(40)     NULL,
        Amount                DECIMAL(18,2)    NOT NULL,
        PaymentReference      NVARCHAR(100)    NOT NULL,
        ProviderTransactionID NVARCHAR(100)    NULL,
        PaidAt                DATETIME         NULL,
        ExpiresAt             DATETIME         NOT NULL,
        IsOpen                BIT              NOT NULL,
        HasVoucherReservation BIT              NOT NULL,
        CreatedAt             DATETIME         NOT NULL,
        RawPayload            NVARCHAR(MAX)    NULL
    );

    INSERT INTO @Payments
        (PaymentID, SubscriptionID, OwnerUserID, Status, OriginalAmount,
         DiscountAmount, VoucherID, VoucherCode, Amount, PaymentReference,
         ProviderTransactionID, PaidAt, ExpiresAt, IsOpen,
         HasVoucherReservation, CreatedAt, RawPayload)
    VALUES
        ('77777777-2026-4200-0000-000000000001', NULL,
         '77777777-2026-1000-0000-000000000003', N'Expired', 99000, 29700,
         NULL, NULL, 69300, N'POM47000001', NULL, NULL,
         DATEADD(DAY, -4, @Now), 0, 0, DATEADD(MINUTE, -30, DATEADD(DAY, -4, @Now)),
         N'{"demo":true,"scenario":"expired_payment"}'),
        ('77777777-2026-4200-0000-000000000002', NULL,
         '77777777-2026-1000-0000-000000000004', N'Cancelled', 99000, 29700,
         NULL, NULL, 69300, N'POM47000002', NULL, NULL,
         DATEADD(DAY, -3, @Now), 0, 0, DATEADD(MINUTE, -30, DATEADD(DAY, -3, @Now)),
         N'{"demo":true,"scenario":"cancelled_payment"}'),
        ('77777777-2026-4200-0000-000000000003', '77777777-2026-4100-0000-000000000002',
         '77777777-2026-1000-0000-000000000006', N'Paid', 99000, 29700,
         NULL, NULL, 69300, N'POM47000003', N'DEMO-HCM-PAID-470003',
         DATEADD(DAY, -10, @Now), DATEADD(DAY, -10, DATEADD(MINUTE, 30, @Now)),
         0, 0, DATEADD(DAY, -10, @Now),
         N'{"demo":true,"scenario":"paid_early_bird"}'),
        ('77777777-2026-4200-0000-000000000004', '77777777-2026-4100-0000-000000000003',
         '77777777-2026-1000-0000-000000000007', N'Paid', 99000, 36630,
         @VoucherPercentID, N'PETOMI10', 62370, N'POM47000004', N'DEMO-HCM-PAID-470004',
         DATEADD(DAY, -5, @Now), DATEADD(DAY, -5, DATEADD(MINUTE, 30, @Now)),
         0, 0, DATEADD(DAY, -5, @Now),
         N'{"demo":true,"scenario":"paid_early_bird_and_voucher"}'),
        ('77777777-2026-4200-0000-000000000005', '77777777-2026-4100-0000-000000000004',
         '77777777-2026-1000-0000-000000000008', N'Paid', 99000, 29700,
         NULL, NULL, 69300, N'POM47000005', N'DEMO-HCM-PAID-470005',
         DATEADD(DAY, -45, @Now), DATEADD(DAY, -45, DATEADD(MINUTE, 30, @Now)),
         0, 0, DATEADD(DAY, -45, @Now),
         N'{"demo":true,"scenario":"expired_paid_subscription"}'),
        ('77777777-2026-4200-0000-000000000006', NULL,
         '77777777-2026-1000-0000-000000000010', N'Pending', 99000, 49700,
         @VoucherFixedID, N'HCM20K', 49300, N'POM47000006', NULL, NULL,
         DATEADD(MINUTE, 30, @Now), 1, 1, @Now,
         N'{"demo":true,"scenario":"pending_open_payment"}');

    IF EXISTS
    (
        SELECT 1
        FROM dbo.ChatSubscriptionPayments existing
        INNER JOIN @Payments demo
            ON existing.PaymentReference = demo.PaymentReference
        WHERE existing.PaymentID <> demo.PaymentID
    )
        THROW 50479, 'A seed payment reference is already assigned to another payment.', 1;

    IF EXISTS
    (
        SELECT 1
        FROM dbo.ChatSubscriptionPayments existing
        WHERE existing.OwnerUserID = '77777777-2026-1000-0000-000000000010'
          AND existing.IsOpen = 1
          AND existing.PaymentID <> '77777777-2026-4200-0000-000000000006'
    )
        THROW 50480, 'Pending-payment demo owner already has another open payment.', 1;

    MERGE dbo.ChatSubscriptionPayments WITH (HOLDLOCK) AS target
    USING @Payments AS source
       ON target.PaymentID = source.PaymentID
    WHEN MATCHED THEN
        UPDATE SET
            SubscriptionID = source.SubscriptionID,
            PlanID = @PremiumPlanID,
            OwnerUserID = source.OwnerUserID,
            PetID = NULL,
            Status = source.Status,
            OriginalAmount = source.OriginalAmount,
            DiscountAmount = source.DiscountAmount,
            VoucherID = source.VoucherID,
            VoucherCode = source.VoucherCode,
            Amount = source.Amount,
            Currency = N'VND',
            Provider = N'SePay',
            PaymentReference = source.PaymentReference,
            ProviderTransactionID = source.ProviderTransactionID,
            QrCodeUrl = N'https://placehold.co/600x600/png?text=DEMO+QR+DO+NOT+PAY',
            BankAccountNo = N'DEMO-NOT-PAYABLE',
            BankCode = N'DEMO',
            PaidAt = source.PaidAt,
            ExpiresAt = source.ExpiresAt,
            IsOpen = source.IsOpen,
            HasVoucherReservation = source.HasVoucherReservation,
            RawPayload = source.RawPayload,
            CreatedAt = source.CreatedAt,
            UpdatedAt = @Now
    WHEN NOT MATCHED THEN
        INSERT
        (
            PaymentID, SubscriptionID, PlanID, OwnerUserID, PetID, Status,
            OriginalAmount, DiscountAmount, VoucherID, VoucherCode, Amount,
            Currency, Provider, PaymentReference, ProviderTransactionID,
            QrCodeUrl, BankAccountNo, BankCode, PaidAt, ExpiresAt, IsOpen,
            HasVoucherReservation, RawPayload, CreatedAt, UpdatedAt
        )
        VALUES
        (
            source.PaymentID, source.SubscriptionID, @PremiumPlanID,
            source.OwnerUserID, NULL, source.Status, source.OriginalAmount,
            source.DiscountAmount, source.VoucherID, source.VoucherCode,
            source.Amount, N'VND', N'SePay', source.PaymentReference,
            source.ProviderTransactionID,
            N'https://placehold.co/600x600/png?text=DEMO+QR+DO+NOT+PAY',
            N'DEMO-NOT-PAYABLE', N'DEMO', source.PaidAt, source.ExpiresAt,
            source.IsOpen, source.HasVoucherReservation, source.RawPayload,
            source.CreatedAt, @Now
        );

    COMMIT TRANSACTION;

    -- Compact verification output for the person running the script.
    SELECT
        u.Email,
        u.EmailVerified,
        p.FullName,
        p.Phone,
        p.Address,
        COUNT(pet.PetID) AS PetCount
    FROM dbo.Users u
    INNER JOIN @DemoUsers demo ON demo.UserID = u.UserID
    INNER JOIN dbo.UserProfiles p ON p.UserID = u.UserID
    LEFT JOIN dbo.Pets pet ON pet.OwnerUserID = u.UserID AND pet.IsActive = 1
    GROUP BY u.Email, u.EmailVerified, p.FullName, p.Phone, p.Address
    ORDER BY u.Email;

    SELECT
        u.Email,
        subscription.Status AS SubscriptionStatus,
        subscription.IsTrial,
        subscription.ExpiresAt AS SubscriptionExpiresAt,
        payment.Status AS PaymentStatus,
        payment.Amount,
        payment.VoucherCode,
        payment.PaymentReference,
        payment.IsOpen,
        payment.ExpiresAt AS PaymentExpiresAt
    FROM @DemoUsers demo
    INNER JOIN dbo.Users u ON u.UserID = demo.UserID
    LEFT JOIN dbo.ChatSubscriptions subscription
        ON subscription.OwnerUserID = u.UserID
       AND subscription.SubscriptionID IN
           (SELECT SubscriptionID FROM @Subscriptions)
    LEFT JOIN dbo.ChatSubscriptionPayments payment
        ON payment.OwnerUserID = u.UserID
       AND payment.PaymentID IN
           (SELECT PaymentID FROM @Payments)
    ORDER BY u.Email;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO
