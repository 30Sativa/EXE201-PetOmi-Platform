-- ===================================================================
-- DEMO SEED 034: Clean clinic demo data for production/staging demo
-- Run after scripts 001..033. Safe to re-run: fixed GUIDs + upserts.
-- Demo login password for all seeded users: 194551524@Thanh
-- ===================================================================
USE PetOmni_DB;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @Now DATETIME = GETUTCDATE();
    DECLARE @Today DATE = CONVERT(DATE, GETUTCDATE());
    DECLARE @Tomorrow DATE = DATEADD(DAY, 1, @Today);
    DECLARE @Yesterday DATE = DATEADD(DAY, -1, @Today);
    DECLARE @LastWeek DATE = DATEADD(DAY, -7, @Today);
    DECLARE @ThirtyFiveDaysAgo DATE = DATEADD(DAY, -35, @Today);
    DECLARE @ThirtyThreeDaysAgo DATE = DATEADD(DAY, -33, @Today);
    DECLARE @TwentyTwoDaysAgo DATE = DATEADD(DAY, -22, @Today);
    DECLARE @FifteenDaysAgo DATE = DATEADD(DAY, -15, @Today);
    DECLARE @NineDaysAgo DATE = DATEADD(DAY, -9, @Today);
    DECLARE @FiveDaysAgo DATE = DATEADD(DAY, -5, @Today);
    DECLARE @FourDaysAgo DATE = DATEADD(DAY, -4, @Today);
    DECLARE @TwoDaysAgo DATE = DATEADD(DAY, -2, @Today);
    DECLARE @InThreeDays DATE = DATEADD(DAY, 3, @Today);
    DECLARE @InSevenDays DATE = DATEADD(DAY, 7, @Today);
    DECLARE @NextMonth DATE = DATEADD(MONTH, 1, @Today);
    DECLARE @PasswordHash NVARCHAR(255) = N'$2a$11$3FhJ22U7m0GdVXspO7s23e/TCW.TwB0LYg8KqaCvgeVJGTNpo2Ugq';

    -- -------------------------------------------------------------------
    -- 1) Required roles. Do not depend on script 004 because its Roles
    -- insert currently has a stray semicolon before the Vet row.
    -- -------------------------------------------------------------------
    DECLARE @OwnerRoleID UNIQUEIDENTIFIER = COALESCE(
        (SELECT RoleID FROM dbo.Roles WHERE RoleName = N'Owner'),
        '11111111-0000-0000-0000-000000000001');
    DECLARE @AdminRoleID UNIQUEIDENTIFIER = COALESCE(
        (SELECT RoleID FROM dbo.Roles WHERE RoleName = N'Admin'),
        '11111111-0000-0000-0000-000000000002');
    DECLARE @VetRoleID UNIQUEIDENTIFIER = COALESCE(
        (SELECT RoleID FROM dbo.Roles WHERE RoleName = N'Vet'),
        '11111111-0000-0000-0000-000000000003');

    IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleName = N'Owner')
        INSERT INTO dbo.Roles (RoleID, RoleName) VALUES (@OwnerRoleID, N'Owner');
    IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleName = N'Admin')
        INSERT INTO dbo.Roles (RoleID, RoleName) VALUES (@AdminRoleID, N'Admin');
    IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleName = N'Vet')
        INSERT INTO dbo.Roles (RoleID, RoleName) VALUES (@VetRoleID, N'Vet');

    DECLARE @ClinicOwnerRoleID UNIQUEIDENTIFIER = COALESCE(
        (SELECT RoleID FROM dbo.VetClinicRoles WHERE RoleName = N'ClinicOwner'),
        '33333333-0000-0000-0000-000000000001');
    DECLARE @PrimaryVetRoleID UNIQUEIDENTIFIER = COALESCE(
        (SELECT RoleID FROM dbo.VetClinicRoles WHERE RoleName = N'PrimaryVet'),
        '33333333-0000-0000-0000-000000000002');
    DECLARE @AssistantRoleID UNIQUEIDENTIFIER = COALESCE(
        (SELECT RoleID FROM dbo.VetClinicRoles WHERE RoleName = N'Assistant'),
        '33333333-0000-0000-0000-000000000003');

    IF NOT EXISTS (SELECT 1 FROM dbo.VetClinicRoles WHERE RoleName = N'ClinicOwner')
        INSERT INTO dbo.VetClinicRoles (RoleID, RoleName) VALUES (@ClinicOwnerRoleID, N'ClinicOwner');
    IF NOT EXISTS (SELECT 1 FROM dbo.VetClinicRoles WHERE RoleName = N'PrimaryVet')
        INSERT INTO dbo.VetClinicRoles (RoleID, RoleName) VALUES (@PrimaryVetRoleID, N'PrimaryVet');
    IF NOT EXISTS (SELECT 1 FROM dbo.VetClinicRoles WHERE RoleName = N'Assistant')
        INSERT INTO dbo.VetClinicRoles (RoleID, RoleName) VALUES (@AssistantRoleID, N'Assistant');

    -- -------------------------------------------------------------------
    -- 2) Demo users and profiles
    -- -------------------------------------------------------------------
    DECLARE @ClinicOwnerUserID UNIQUEIDENTIFIER = '44444444-2026-1000-0000-000000000001';
    DECLARE @DrMinhUserID UNIQUEIDENTIFIER = '44444444-2026-1000-0000-000000000002';
    DECLARE @DrLanUserID UNIQUEIDENTIFIER = '44444444-2026-1000-0000-000000000003';
    DECLARE @AssistantUserID UNIQUEIDENTIFIER = '44444444-2026-1000-0000-000000000004';
    DECLARE @OwnerMaiUserID UNIQUEIDENTIFIER = '44444444-2026-1000-0000-000000000011';
    DECLARE @OwnerAnhUserID UNIQUEIDENTIFIER = '44444444-2026-1000-0000-000000000012';
    DECLARE @OwnerQuyenUserID UNIQUEIDENTIFIER = '44444444-2026-1000-0000-000000000013';

    IF EXISTS (
        SELECT 1
        FROM dbo.Users
        WHERE NormalizedEmail IN (
            N'demo.clinic.owner@petomi.test',
            N'demo.dr.minh@petomi.test',
            N'demo.dr.lan@petomi.test',
            N'demo.assistant@petomi.test',
            N'demo.owner.mai@petomi.test',
            N'demo.owner.anh@petomi.test',
            N'demo.owner.quyen@petomi.test')
          AND UserID NOT IN (
            @ClinicOwnerUserID, @DrMinhUserID, @DrLanUserID, @AssistantUserID,
            @OwnerMaiUserID, @OwnerAnhUserID, @OwnerQuyenUserID)
    )
        THROW 50340, 'A demo email is already used by another user. Stop to avoid production conflict.', 1;

    MERGE dbo.Users AS target
    USING (VALUES
        (@ClinicOwnerUserID, N'demo.clinic.owner@petomi.test', N'demo.clinic.owner@petomi.test'),
        (@DrMinhUserID, N'demo.dr.minh@petomi.test', N'demo.dr.minh@petomi.test'),
        (@DrLanUserID, N'demo.dr.lan@petomi.test', N'demo.dr.lan@petomi.test'),
        (@AssistantUserID, N'demo.assistant@petomi.test', N'demo.assistant@petomi.test'),
        (@OwnerMaiUserID, N'demo.owner.mai@petomi.test', N'demo.owner.mai@petomi.test'),
        (@OwnerAnhUserID, N'demo.owner.anh@petomi.test', N'demo.owner.anh@petomi.test'),
        (@OwnerQuyenUserID, N'demo.owner.quyen@petomi.test', N'demo.owner.quyen@petomi.test')
    ) AS src(UserID, Email, NormalizedEmail)
    ON target.UserID = src.UserID
    WHEN MATCHED THEN
        UPDATE SET
            Email = src.Email,
            NormalizedEmail = src.NormalizedEmail,
            PasswordHash = @PasswordHash,
            EmailVerified = 1,
            FailedLoginAttempts = 0,
            LockoutUntil = NULL,
            DeletedAt = NULL,
            IsActive = 1,
            IsProfileCompleted = 1,
            UpdatedAt = @Now
    WHEN NOT MATCHED THEN
        INSERT (UserID, Email, NormalizedEmail, PasswordHash, EmailVerified, FailedLoginAttempts,
                LockoutUntil, CreatedAt, UpdatedAt, DeletedAt, IsActive, IsProfileCompleted)
        VALUES (src.UserID, src.Email, src.NormalizedEmail, @PasswordHash, 1, 0,
                NULL, DATEADD(DAY, -30, @Now), @Now, NULL, 1, 1);

    MERGE dbo.UserProfiles AS target
    USING (VALUES
        ('44444444-2026-1100-0000-000000000001', @ClinicOwnerUserID, N'Nguyen Hoang - Clinic Owner', N'0901000001', N'Male', N'PetOmi Demo Clinic, District 1, HCMC'),
        ('44444444-2026-1100-0000-000000000002', @DrMinhUserID, N'Dr Minh Tran', N'0901000002', N'Male', N'PetOmi Demo Clinic, District 1, HCMC'),
        ('44444444-2026-1100-0000-000000000003', @DrLanUserID, N'Dr Lan Pham', N'0901000003', N'Female', N'PetOmi Demo Clinic, District 1, HCMC'),
        ('44444444-2026-1100-0000-000000000004', @AssistantUserID, N'Le An - Vet Assistant', N'0901000004', N'Other', N'PetOmi Demo Clinic, District 1, HCMC'),
        ('44444444-2026-1100-0000-000000000011', @OwnerMaiUserID, N'Mai Nguyen', N'0902000011', N'Female', N'24 Nguyen Hue, District 1, HCMC'),
        ('44444444-2026-1100-0000-000000000012', @OwnerAnhUserID, N'Anh Vo', N'0902000012', N'Male', N'9 Le Loi, District 3, HCMC'),
        ('44444444-2026-1100-0000-000000000013', @OwnerQuyenUserID, N'Quyen Tran', N'0902000013', N'Female', N'52 Dien Bien Phu, Binh Thanh, HCMC')
    ) AS src(ProfileID, UserID, FullName, Phone, Gender, Address)
    ON target.UserID = src.UserID
    WHEN MATCHED THEN
        UPDATE SET
            FullName = src.FullName,
            Phone = src.Phone,
            Gender = src.Gender,
            Address = src.Address,
            AvatarURL = N'https://placehold.co/256x256/png?text=PetOmi',
            UpdatedAt = @Now
    WHEN NOT MATCHED THEN
        INSERT (ProfileID, UserID, FullName, Phone, AvatarURL, Gender, Address, CreatedAt, UpdatedAt)
        VALUES (src.ProfileID, src.UserID, src.FullName, src.Phone,
                N'https://placehold.co/256x256/png?text=PetOmi', src.Gender, src.Address,
                DATEADD(DAY, -30, @Now), @Now);

    INSERT INTO dbo.UserRoles (UserID, RoleID)
    SELECT src.UserID, src.RoleID
    FROM (VALUES
        (@ClinicOwnerUserID, @VetRoleID),
        (@DrMinhUserID, @VetRoleID),
        (@DrLanUserID, @VetRoleID),
        (@AssistantUserID, @VetRoleID),
        (@OwnerMaiUserID, @OwnerRoleID),
        (@OwnerAnhUserID, @OwnerRoleID),
        (@OwnerQuyenUserID, @OwnerRoleID)
    ) AS src(UserID, RoleID)
    WHERE NOT EXISTS (
        SELECT 1 FROM dbo.UserRoles ur
        WHERE ur.UserID = src.UserID AND ur.RoleID = src.RoleID
    );

    -- -------------------------------------------------------------------
    -- 3) Clinic, clinic staff, schedules, services, inventory, SePay
    -- -------------------------------------------------------------------
    DECLARE @ClinicID UNIQUEIDENTIFIER = '44444444-2026-0000-0000-000000000001';

    IF EXISTS (
        SELECT 1 FROM dbo.Clinics
        WHERE LicenseNumber = N'DEMO-CLINIC-2026-001'
          AND ClinicID <> @ClinicID
    )
        THROW 50341, 'Demo clinic license is already used by another clinic.', 1;

    MERGE dbo.Clinics AS target
    USING (VALUES (
        @ClinicID,
        N'PetOmi Demo Clinic',
        N'18 Nguyen Hue, Ben Nghe Ward, District 1, HCMC',
        N'02873000001',
        N'demo.clinic@petomi.test',
        N'DEMO-CLINIC-2026-001'
    )) AS src(ClinicID, ClinicName, Address, Phone, Email, LicenseNumber)
    ON target.ClinicID = src.ClinicID
    WHEN MATCHED THEN
        UPDATE SET
            ClinicName = src.ClinicName,
            Address = src.Address,
            Phone = src.Phone,
            Email = src.Email,
            LicenseNumber = src.LicenseNumber,
            Status = N'Approved',
            RejectedReason = NULL,
            Description = N'Demo clinic with appointments, examinations, prescriptions, inventory, retail orders, invoices, and SePay reconciliation.',
            OpeningHours = N'{"Mon-Fri":"08:00-18:00","Sat":"08:00-12:00","Sun":"Emergency only"}',
            LogoUrl = N'https://placehold.co/512x512/png?text=PetOmi+Clinic',
            LicenseImageUrl = N'https://placehold.co/900x600/png?text=Demo+License',
            Latitude = 10.7733,
            Longitude = 106.7039,
            AppointmentBufferMins = 10,
            UpdatedAt = @Now
    WHEN NOT MATCHED THEN
        INSERT (ClinicID, ClinicName, Address, Phone, Email, LicenseNumber, Status,
                Description, OpeningHours, LogoUrl, LicenseImageUrl, Latitude, Longitude,
                AppointmentBufferMins, CreatedAt, UpdatedAt)
        VALUES (src.ClinicID, src.ClinicName, src.Address, src.Phone, src.Email, src.LicenseNumber,
                N'Approved',
                N'Demo clinic with appointments, examinations, prescriptions, inventory, retail orders, invoices, and SePay reconciliation.',
                N'{"Mon-Fri":"08:00-18:00","Sat":"08:00-12:00","Sun":"Emergency only"}',
                N'https://placehold.co/512x512/png?text=PetOmi+Clinic',
                N'https://placehold.co/900x600/png?text=Demo+License',
                10.7733, 106.7039, 10, DATEADD(DAY, -30, @Now), @Now);

    MERGE dbo.VetProfiles AS target
    USING (VALUES
        ('44444444-2026-2000-0000-000000000001', @ClinicOwnerUserID, N'DEMO-VET-OWNER-001', N'Clinic Management, General Practice'),
        ('44444444-2026-2000-0000-000000000002', @DrMinhUserID, N'DEMO-VET-MINH-002', N'Internal Medicine, Vaccination'),
        ('44444444-2026-2000-0000-000000000003', @DrLanUserID, N'DEMO-VET-LAN-003', N'Surgery, Emergency Care'),
        ('44444444-2026-2000-0000-000000000004', @AssistantUserID, N'DEMO-VET-ASSIST-004', N'Patient Intake, Nursing Support')
    ) AS src(VetProfileID, UserID, LicenseNumber, Specialization)
    ON target.VetProfileID = src.VetProfileID
    WHEN MATCHED THEN
        UPDATE SET
            UserID = src.UserID,
            LicenseNumber = src.LicenseNumber,
            Specialization = src.Specialization,
            IsActive = 1,
            UpdatedAt = @Now
    WHEN NOT MATCHED THEN
        INSERT (VetProfileID, UserID, LicenseNumber, Specialization, IsActive, CreatedAt, UpdatedAt)
        VALUES (src.VetProfileID, src.UserID, src.LicenseNumber, src.Specialization, 1, DATEADD(DAY, -30, @Now), @Now);

    DECLARE @VetProfileOwner UNIQUEIDENTIFIER = '44444444-2026-2000-0000-000000000001';
    DECLARE @VetProfileMinh UNIQUEIDENTIFIER = '44444444-2026-2000-0000-000000000002';
    DECLARE @VetProfileLan UNIQUEIDENTIFIER = '44444444-2026-2000-0000-000000000003';
    DECLARE @VetProfileAssistant UNIQUEIDENTIFIER = '44444444-2026-2000-0000-000000000004';
    DECLARE @VetClinicOwner UNIQUEIDENTIFIER = '44444444-2026-3000-0000-000000000001';
    DECLARE @VetClinicMinh UNIQUEIDENTIFIER = '44444444-2026-3000-0000-000000000002';
    DECLARE @VetClinicLan UNIQUEIDENTIFIER = '44444444-2026-3000-0000-000000000003';
    DECLARE @VetClinicAssistant UNIQUEIDENTIFIER = '44444444-2026-3000-0000-000000000004';

    MERGE dbo.VetClinic AS target
    USING (VALUES
        (@VetClinicOwner, @VetProfileOwner, @ClinicID, @ClinicOwnerRoleID),
        (@VetClinicMinh, @VetProfileMinh, @ClinicID, @PrimaryVetRoleID),
        (@VetClinicLan, @VetProfileLan, @ClinicID, @PrimaryVetRoleID),
        (@VetClinicAssistant, @VetProfileAssistant, @ClinicID, @AssistantRoleID)
    ) AS src(VetClinicID, VetProfileID, ClinicID, RoleID)
    ON target.VetClinicID = src.VetClinicID
    WHEN MATCHED THEN
        UPDATE SET
            VetProfileID = src.VetProfileID,
            ClinicID = src.ClinicID,
            RoleID = src.RoleID,
            EndDate = NULL,
            IsActive = 1,
            UpdatedAt = @Now
    WHEN NOT MATCHED THEN
        INSERT (VetClinicID, VetProfileID, ClinicID, RoleID, StartDate, EndDate, IsActive, CreatedAt, UpdatedAt)
        VALUES (src.VetClinicID, src.VetProfileID, src.ClinicID, src.RoleID, DATEADD(DAY, -30, @Today), NULL, 1, DATEADD(DAY, -30, @Now), @Now);

    MERGE dbo.DoctorSchedules AS target
    USING (VALUES
        ('44444444-2026-3100-0000-000000000001', @VetClinicMinh, 1, CAST('08:00:00' AS TIME), CAST('12:00:00' AS TIME)),
        ('44444444-2026-3100-0000-000000000002', @VetClinicMinh, 2, CAST('08:00:00' AS TIME), CAST('12:00:00' AS TIME)),
        ('44444444-2026-3100-0000-000000000003', @VetClinicMinh, 3, CAST('13:00:00' AS TIME), CAST('17:00:00' AS TIME)),
        ('44444444-2026-3100-0000-000000000004', @VetClinicLan, 4, CAST('08:00:00' AS TIME), CAST('12:00:00' AS TIME)),
        ('44444444-2026-3100-0000-000000000005', @VetClinicLan, 5, CAST('13:00:00' AS TIME), CAST('18:00:00' AS TIME)),
        ('44444444-2026-3100-0000-000000000006', @VetClinicAssistant, 6, CAST('08:00:00' AS TIME), CAST('12:00:00' AS TIME))
    ) AS src(ScheduleID, VetClinicID, DayOfWeek, StartTime, EndTime)
    ON target.ScheduleID = src.ScheduleID
    WHEN MATCHED THEN
        UPDATE SET
            VetClinicID = src.VetClinicID,
            DayOfWeek = src.DayOfWeek,
            StartTime = src.StartTime,
            EndTime = src.EndTime,
            IsActive = 1,
            UpdatedAt = @Now
    WHEN NOT MATCHED THEN
        INSERT (ScheduleID, VetClinicID, DayOfWeek, StartTime, EndTime, IsActive, CreatedAt, UpdatedAt)
        VALUES (src.ScheduleID, src.VetClinicID, src.DayOfWeek, src.StartTime, src.EndTime, 1, DATEADD(DAY, -30, @Now), @Now);

    MERGE dbo.ClinicServices AS target
    USING (VALUES
        ('44444444-2026-4000-0000-000000000001', @ClinicID, N'General Checkup', N'Full physical exam and basic consultation.', 180000.00, 30),
        ('44444444-2026-4000-0000-000000000002', @ClinicID, N'Core Vaccination', N'Core vaccine package with post-shot monitoring.', 320000.00, 30),
        ('44444444-2026-4000-0000-000000000003', @ClinicID, N'Emergency Intake', N'Triage, stabilization, and emergency consultation.', 450000.00, 45),
        ('44444444-2026-4000-0000-000000000004', @ClinicID, N'Minor Surgery', N'Minor wound repair or abscess drainage.', 1200000.00, 90),
        ('44444444-2026-4000-0000-000000000005', @ClinicID, N'Grooming Basic', N'Bath, nail trim, and ear cleaning.', 250000.00, 45),
        ('44444444-2026-4000-0000-000000000006', @ClinicID, N'Follow-up Visit', N'Recheck after treatment or surgery.', 120000.00, 20)
    ) AS src(ServiceID, ClinicID, ServiceName, Description, Price, DurationMins)
    ON target.ServiceID = src.ServiceID
    WHEN MATCHED THEN
        UPDATE SET
            ClinicID = src.ClinicID,
            ServiceName = src.ServiceName,
            Description = src.Description,
            Price = src.Price,
            DurationMins = src.DurationMins,
            IsActive = 1,
            UpdatedAt = @Now
    WHEN NOT MATCHED THEN
        INSERT (ServiceID, ClinicID, ServiceName, Description, Price, DurationMins, IsActive, CreatedAt, UpdatedAt)
        VALUES (src.ServiceID, src.ClinicID, src.ServiceName, src.Description, src.Price, src.DurationMins, 1, DATEADD(DAY, -30, @Now), @Now);

    MERGE dbo.Inventory AS target
    USING (VALUES
        ('44444444-2026-5000-0000-000000000001', @ClinicID, N'Nobivac DHPPi Vaccine', N'dose', 42, 10, 220000.00, DATEADD(MONTH, 8, @Today), N'https://placehold.co/300x200/png?text=Vaccine'),
        ('44444444-2026-5000-0000-000000000002', @ClinicID, N'Rabies Vaccine', N'dose', 25, 8, 180000.00, DATEADD(MONTH, 10, @Today), N'https://placehold.co/300x200/png?text=Rabies'),
        ('44444444-2026-5000-0000-000000000003', @ClinicID, N'Cefalexin 250mg', N'capsule', 180, 30, 12000.00, DATEADD(MONTH, 6, @Today), N'https://placehold.co/300x200/png?text=Cefalexin'),
        ('44444444-2026-5000-0000-000000000004', @ClinicID, N'Meloxicam Oral 1.5mg/ml', N'bottle', 9, 10, 95000.00, @NextMonth, N'https://placehold.co/300x200/png?text=Meloxicam'),
        ('44444444-2026-5000-0000-000000000005', @ClinicID, N'Oresol Pet Electrolyte', N'sachet', 75, 20, 8000.00, DATEADD(MONTH, 12, @Today), N'https://placehold.co/300x200/png?text=Oresol'),
        ('44444444-2026-5000-0000-000000000006', @ClinicID, N'Probiotic Digestive Gel', N'tube', 16, 12, 85000.00, DATEADD(MONTH, 5, @Today), N'https://placehold.co/300x200/png?text=Probiotic'),
        ('44444444-2026-5000-0000-000000000007', @ClinicID, N'Elizabeth Collar Size M', N'piece', 6, 6, 75000.00, NULL, N'https://placehold.co/300x200/png?text=Collar'),
        ('44444444-2026-5000-0000-000000000008', @ClinicID, N'Sterile Gauze 10x10', N'pack', 12, 15, 25000.00, DATEADD(MONTH, 18, @Today), N'https://placehold.co/300x200/png?text=Gauze'),
        ('44444444-2026-5000-0000-000000000009', @ClinicID, N'Saline 500ml', N'bottle', 20, 12, 18000.00, DATEADD(MONTH, 9, @Today), N'https://placehold.co/300x200/png?text=Saline'),
        ('44444444-2026-5000-0000-000000000010', @ClinicID, N'Flea and Tick Spot-On', N'pipette', 34, 10, 140000.00, DATEADD(MONTH, 7, @Today), N'https://placehold.co/300x200/png?text=Flea+Tick'),
        ('44444444-2026-5000-0000-000000000011', @ClinicID, N'Recovery Wet Food', N'can', 48, 12, 42000.00, DATEADD(MONTH, 11, @Today), N'https://placehold.co/300x200/png?text=Recovery+Food'),
        ('44444444-2026-5000-0000-000000000012', @ClinicID, N'Dental Chew Small', N'pack', 7, 8, 65000.00, DATEADD(MONTH, 14, @Today), N'https://placehold.co/300x200/png?text=Dental+Chew')
    ) AS src(ItemID, ClinicID, ItemName, Unit, Quantity, LowStockThreshold, UnitPrice, ExpiryDate, ImageUrl)
    ON target.ItemID = src.ItemID
    WHEN MATCHED THEN
        UPDATE SET
            ClinicID = src.ClinicID,
            ItemName = src.ItemName,
            Unit = src.Unit,
            Quantity = src.Quantity,
            LowStockThreshold = src.LowStockThreshold,
            UnitPrice = src.UnitPrice,
            ExpiryDate = src.ExpiryDate,
            ImageUrl = src.ImageUrl,
            ImageCloudinaryPublicId = NULL,
            IsActive = 1,
            UpdatedAt = @Now
    WHEN NOT MATCHED THEN
        INSERT (ItemID, ClinicID, ItemName, Unit, Quantity, LowStockThreshold,
                UnitPrice, ExpiryDate, ImageUrl, ImageCloudinaryPublicId, IsActive, CreatedAt, UpdatedAt)
        VALUES (src.ItemID, src.ClinicID, src.ItemName, src.Unit, src.Quantity, src.LowStockThreshold,
                src.UnitPrice, src.ExpiryDate, src.ImageUrl, NULL, 1, DATEADD(DAY, -30, @Now), @Now);

    MERGE dbo.ClinicPaymentAccounts AS target
    USING (VALUES (
        '44444444-2026-5200-0000-000000000001',
        @ClinicID,
        N'SePay',
        N'MB',
        N'MB Bank',
        N'9704221234567890',
        N'PETOMI DEMO CLINIC'
    )) AS src(ClinicPaymentAccountID, ClinicID, Provider, BankCode, BankName, AccountNumber, AccountName)
    ON target.ClinicPaymentAccountID = src.ClinicPaymentAccountID
    WHEN MATCHED THEN
        UPDATE SET
            ClinicID = src.ClinicID,
            Provider = src.Provider,
            BankCode = src.BankCode,
            BankName = src.BankName,
            AccountNumber = src.AccountNumber,
            AccountName = src.AccountName,
            IsActive = 1,
            UpdatedAt = @Now
    WHEN NOT MATCHED THEN
        INSERT (ClinicPaymentAccountID, ClinicID, Provider, BankCode, BankName, AccountNumber, AccountName, IsActive, CreatedAt, UpdatedAt)
        VALUES (src.ClinicPaymentAccountID, src.ClinicID, src.Provider, src.BankCode, src.BankName, src.AccountNumber, src.AccountName, 1, DATEADD(DAY, -30, @Now), @Now);

    -- -------------------------------------------------------------------
    -- 4) Demo pets, health profile, and owner-side medical records
    -- -------------------------------------------------------------------
    DECLARE @PetBong UNIQUEIDENTIFIER = '44444444-2026-6000-0000-000000000001';
    DECLARE @PetMimi UNIQUEIDENTIFIER = '44444444-2026-6000-0000-000000000002';
    DECLARE @PetLucky UNIQUEIDENTIFIER = '44444444-2026-6000-0000-000000000003';
    DECLARE @PetCoco UNIQUEIDENTIFIER = '44444444-2026-6000-0000-000000000004';
    DECLARE @PetMoon UNIQUEIDENTIFIER = '44444444-2026-6000-0000-000000000005';
    DECLARE @PetBin UNIQUEIDENTIFIER = '44444444-2026-6000-0000-000000000006';

    MERGE dbo.Pets AS target
    USING (VALUES
        (@PetBong, @OwnerMaiUserID, N'Bong', N'Dog', N'Corgi', N'Male', CAST('2022-03-10' AS DATE), 0, N'https://placehold.co/300x300/png?text=Bong'),
        (@PetMimi, @OwnerMaiUserID, N'Mimi', N'Cat', N'British Shorthair', N'Female', CAST('2021-08-22' AS DATE), 0, N'https://placehold.co/300x300/png?text=Mimi'),
        (@PetLucky, @OwnerAnhUserID, N'Lucky', N'Dog', N'Poodle', N'Male', CAST('2023-01-15' AS DATE), 0, N'https://placehold.co/300x300/png?text=Lucky'),
        (@PetCoco, @OwnerAnhUserID, N'Coco', N'Dog', N'Pomeranian', N'Female', CAST('2020-11-05' AS DATE), 0, N'https://placehold.co/300x300/png?text=Coco'),
        (@PetMoon, @OwnerQuyenUserID, N'Moon', N'Cat', N'Maine Coon', N'Female', CAST('2019-06-01' AS DATE), 1, N'https://placehold.co/300x300/png?text=Moon'),
        (@PetBin, @OwnerQuyenUserID, N'Bin', N'Dog', N'Beagle', N'Male', CAST('2024-02-18' AS DATE), 0, N'https://placehold.co/300x300/png?text=Bin')
    ) AS src(PetID, OwnerUserID, Name, Species, Breed, Gender, DateOfBirth, IsBirthDateEstimated, AvatarURL)
    ON target.PetID = src.PetID
    WHEN MATCHED THEN
        UPDATE SET
            OwnerUserID = src.OwnerUserID,
            Name = src.Name,
            Species = src.Species,
            Breed = src.Breed,
            Gender = src.Gender,
            DateOfBirth = src.DateOfBirth,
            IsBirthDateEstimated = src.IsBirthDateEstimated,
            AvatarURL = src.AvatarURL,
            IsActive = 1,
            DeletedAt = NULL,
            UpdatedAt = @Now
    WHEN NOT MATCHED THEN
        INSERT (PetID, OwnerUserID, Name, Species, Breed, Gender, DateOfBirth,
                IsBirthDateEstimated, AvatarURL, IsActive, CreatedAt, UpdatedAt)
        VALUES (src.PetID, src.OwnerUserID, src.Name, src.Species, src.Breed, src.Gender, src.DateOfBirth,
                src.IsBirthDateEstimated, src.AvatarURL, 1, DATEADD(DAY, -25, @Now), @Now);

    MERGE dbo.PetHealthProfiles AS target
    USING (VALUES
        ('44444444-2026-6100-0000-000000000001', @PetBong, 11.80, N'Tan and white', N'Yes', N'No known allergies', N'Mild seasonal dermatitis', N'DEMO-MICRO-BONG'),
        ('44444444-2026-6100-0000-000000000002', @PetMimi, 4.60, N'Blue gray', N'Yes', N'Chicken protein sensitivity', N'None', N'DEMO-MICRO-MIMI'),
        ('44444444-2026-6100-0000-000000000003', @PetLucky, 5.20, N'Apricot', N'No', N'None', N'None', N'DEMO-MICRO-LUCKY'),
        ('44444444-2026-6100-0000-000000000004', @PetCoco, 3.30, N'Cream', N'Yes', N'None', N'Patellar luxation grade I', N'DEMO-MICRO-COCO'),
        ('44444444-2026-6100-0000-000000000005', @PetMoon, 6.80, N'Silver tabby', N'Yes', N'None', N'Weight control plan', N'DEMO-MICRO-MOON'),
        ('44444444-2026-6100-0000-000000000006', @PetBin, 8.90, N'Tri-color', N'No', N'None', N'None', N'DEMO-MICRO-BIN')
    ) AS src(PetHealthProfileID, PetID, CurrentWeightKg, Color, IsNeutered, Allergies, ChronicConditions, MicrochipNumber)
    ON target.PetID = src.PetID
    WHEN MATCHED THEN
        UPDATE SET
            CurrentWeightKg = src.CurrentWeightKg,
            Color = src.Color,
            IsNeutered = src.IsNeutered,
            Allergies = src.Allergies,
            ChronicConditions = src.ChronicConditions,
            MicrochipNumber = src.MicrochipNumber,
            UpdatedAt = @Now
    WHEN NOT MATCHED THEN
        INSERT (PetHealthProfileID, PetID, CurrentWeightKg, Color, IsNeutered, Allergies, ChronicConditions, MicrochipNumber, CreatedAt, UpdatedAt)
        VALUES (src.PetHealthProfileID, src.PetID, src.CurrentWeightKg, src.Color, src.IsNeutered, src.Allergies, src.ChronicConditions, src.MicrochipNumber, DATEADD(DAY, -25, @Now), @Now);

    MERGE dbo.PetMedicalRecords AS target
    USING (VALUES
        ('44444444-2026-6200-0000-000000000001', @PetBong, N'Vaccine', N'DHPPi booster', N'Annual booster completed before demo.', @LastWeek, N'Dr Minh Tran', N'PetOmi Demo Clinic', NULL, NULL, NULL, NULL),
        ('44444444-2026-6200-0000-000000000002', @PetMimi, N'Allergy', N'Food sensitivity noted', N'Owner reports itching after chicken-based food.', DATEADD(DAY, -20, @Today), N'Dr Lan Pham', N'PetOmi Demo Clinic', NULL, NULL, NULL, NULL),
        ('44444444-2026-6200-0000-000000000003', @PetMoon, N'Visit', N'Weight control follow-up', N'Plan includes diet adjustment and weekly weight log.', DATEADD(DAY, -14, @Today), N'Dr Minh Tran', N'PetOmi Demo Clinic', NULL, NULL, NULL, NULL)
    ) AS src(MedicalRecordID, PetID, RecordType, Title, Description, RecordDate, VetName, ClinicName, MedicationName, Dosage, StartDate, EndDate)
    ON target.MedicalRecordID = src.MedicalRecordID
    WHEN MATCHED THEN
        UPDATE SET
            PetID = src.PetID,
            RecordType = src.RecordType,
            Title = src.Title,
            Description = src.Description,
            RecordDate = src.RecordDate,
            VetName = src.VetName,
            ClinicName = src.ClinicName,
            MedicationName = src.MedicationName,
            Dosage = src.Dosage,
            StartDate = src.StartDate,
            EndDate = src.EndDate,
            DeletedAt = NULL,
            IsActive = 1,
            UpdatedAt = @Now
    WHEN NOT MATCHED THEN
        INSERT (MedicalRecordID, PetID, RecordType, Title, Description, RecordDate, VetName, ClinicName,
                MedicationName, Dosage, StartDate, EndDate, IsActive, CreatedAt, UpdatedAt)
        VALUES (src.MedicalRecordID, src.PetID, src.RecordType, src.Title, src.Description, src.RecordDate, src.VetName, src.ClinicName,
                src.MedicationName, src.Dosage, src.StartDate, src.EndDate, 1, DATEADD(DAY, -20, @Now), @Now);

    -- -------------------------------------------------------------------
    -- 5) Appointments, examinations, prescriptions
    -- -------------------------------------------------------------------
    DECLARE @SvcCheckup UNIQUEIDENTIFIER = '44444444-2026-4000-0000-000000000001';
    DECLARE @SvcVaccine UNIQUEIDENTIFIER = '44444444-2026-4000-0000-000000000002';
    DECLARE @SvcEmergency UNIQUEIDENTIFIER = '44444444-2026-4000-0000-000000000003';
    DECLARE @SvcSurgery UNIQUEIDENTIFIER = '44444444-2026-4000-0000-000000000004';
    DECLARE @SvcGrooming UNIQUEIDENTIFIER = '44444444-2026-4000-0000-000000000005';
    DECLARE @SvcFollowup UNIQUEIDENTIFIER = '44444444-2026-4000-0000-000000000006';

    DECLARE @ApptCompletedToday UNIQUEIDENTIFIER = '44444444-2026-7000-0000-000000000001';
    DECLARE @ApptCheckedIn UNIQUEIDENTIFIER = '44444444-2026-7000-0000-000000000002';
    DECLARE @ApptConfirmedToday UNIQUEIDENTIFIER = '44444444-2026-7000-0000-000000000003';
    DECLARE @ApptPendingTomorrow UNIQUEIDENTIFIER = '44444444-2026-7000-0000-000000000004';
    DECLARE @ApptSurgeryTomorrow UNIQUEIDENTIFIER = '44444444-2026-7000-0000-000000000005';
    DECLARE @ApptCompletedYesterday UNIQUEIDENTIFIER = '44444444-2026-7000-0000-000000000006';
    DECLARE @ApptNoShow UNIQUEIDENTIFIER = '44444444-2026-7000-0000-000000000007';
    DECLARE @ApptCancelled UNIQUEIDENTIFIER = '44444444-2026-7000-0000-000000000008';

    MERGE dbo.Appointments AS target
    USING (VALUES
        (@ApptCompletedToday, @ClinicID, @VetClinicMinh, @SvcCheckup, @PetBong, @OwnerMaiUserID, @Today, CAST('09:00:00' AS TIME), CAST('09:30:00' AS TIME), 'Checkup', 'Completed', N'Annual wellness exam.', 0, 0, DATEADD(HOUR, -4, @Now), DATEADD(HOUR, -3, @Now), @AssistantUserID, NULL, NULL),
        (@ApptCheckedIn, @ClinicID, @VetClinicLan, @SvcEmergency, @PetMimi, @AssistantUserID, @Today, CAST('10:00:00' AS TIME), CAST('10:45:00' AS TIME), 'Emergency', 'CheckedIn', N'Vomiting since morning, walk-in intake.', 1, 0, DATEADD(HOUR, -3, @Now), DATEADD(HOUR, -2, @Now), @AssistantUserID, NULL, NULL),
        (@ApptConfirmedToday, @ClinicID, @VetClinicMinh, @SvcVaccine, @PetLucky, @OwnerAnhUserID, @Today, CAST('14:00:00' AS TIME), CAST('14:30:00' AS TIME), 'Vaccination', 'Confirmed', N'Core vaccine appointment.', 0, 0, DATEADD(HOUR, -1, @Now), NULL, NULL, NULL, NULL),
        (@ApptPendingTomorrow, @ClinicID, NULL, @SvcGrooming, @PetMoon, @OwnerQuyenUserID, @Tomorrow, CAST('08:30:00' AS TIME), CAST('09:15:00' AS TIME), 'Grooming', 'Pending', N'Owner asked for gentle handling.', 0, 0, NULL, NULL, NULL, NULL, NULL),
        (@ApptSurgeryTomorrow, @ClinicID, @VetClinicLan, @SvcSurgery, @PetCoco, @OwnerAnhUserID, @Tomorrow, CAST('09:30:00' AS TIME), CAST('11:00:00' AS TIME), 'Surgery', 'Confirmed', N'Planned minor wound repair.', 0, 0, DATEADD(HOUR, -1, @Now), NULL, NULL, NULL, NULL),
        (@ApptCompletedYesterday, @ClinicID, @VetClinicMinh, @SvcVaccine, @PetMoon, @OwnerQuyenUserID, @Yesterday, CAST('15:00:00' AS TIME), CAST('15:30:00' AS TIME), 'Vaccination', 'Completed', N'Rabies vaccination completed.', 0, 0, DATEADD(DAY, -1, @Now), DATEADD(DAY, -1, DATEADD(MINUTE, 5, @Now)), @AssistantUserID, NULL, NULL),
        (@ApptNoShow, @ClinicID, @VetClinicMinh, @SvcCheckup, @PetBin, @OwnerQuyenUserID, @Today, CAST('11:00:00' AS TIME), CAST('11:30:00' AS TIME), 'Checkup', 'NoShow', N'Owner did not arrive.', 0, 0, DATEADD(HOUR, -2, @Now), NULL, NULL, NULL, NULL),
        (@ApptCancelled, @ClinicID, @VetClinicLan, @SvcCheckup, @PetCoco, @OwnerAnhUserID, @Today, CAST('16:00:00' AS TIME), CAST('16:30:00' AS TIME), 'Followup', 'Cancelled', N'Owner requested reschedule.', 0, 1, DATEADD(HOUR, -8, @Now), NULL, NULL, DATEADD(HOUR, -2, @Now), @OwnerAnhUserID)
    ) AS src(AppointmentID, ClinicID, VetClinicID, ServiceID, PetID, BookedByUserID, AppointmentDate, StartTime, EndTime,
             AppointmentType, Status, Notes, IsWalkIn, IsLateCancellation, ConfirmedAt, CheckedInAt, CheckedInByUserID, CancelledAt, CancelledByUserID)
    ON target.AppointmentID = src.AppointmentID
    WHEN MATCHED THEN
        UPDATE SET
            ClinicID = src.ClinicID,
            VetClinicID = src.VetClinicID,
            ServiceID = src.ServiceID,
            PetID = src.PetID,
            BookedByUserID = src.BookedByUserID,
            AppointmentDate = src.AppointmentDate,
            StartTime = src.StartTime,
            EndTime = src.EndTime,
            AppointmentType = src.AppointmentType,
            Status = src.Status,
            Notes = src.Notes,
            IsWalkIn = src.IsWalkIn,
            IsLateCancellation = src.IsLateCancellation,
            ConfirmedAt = src.ConfirmedAt,
            CheckedInAt = src.CheckedInAt,
            CheckedInByUserID = src.CheckedInByUserID,
            CancelledAt = src.CancelledAt,
            CancelledByUserID = src.CancelledByUserID,
            CancellationReason = CASE WHEN src.Status = 'Cancelled' THEN N'Demo late cancellation' ELSE NULL END,
            UpdatedAt = @Now
    WHEN NOT MATCHED THEN
        INSERT (AppointmentID, ClinicID, VetClinicID, ServiceID, PetID, BookedByUserID, AppointmentDate,
                StartTime, EndTime, AppointmentType, Status, Notes, CancellationReason, IsWalkIn,
                IsLateCancellation, ConfirmedAt, CheckedInAt, CheckedInByUserID, CancelledAt,
                CancelledByUserID, CreatedAt, UpdatedAt)
        VALUES (src.AppointmentID, src.ClinicID, src.VetClinicID, src.ServiceID, src.PetID, src.BookedByUserID, src.AppointmentDate,
                src.StartTime, src.EndTime, src.AppointmentType, src.Status, src.Notes,
                CASE WHEN src.Status = 'Cancelled' THEN N'Demo late cancellation' ELSE NULL END,
                src.IsWalkIn, src.IsLateCancellation, src.ConfirmedAt, src.CheckedInAt,
                src.CheckedInByUserID, src.CancelledAt, src.CancelledByUserID, DATEADD(DAY, -3, @Now), @Now);

    DECLARE @ExamBong UNIQUEIDENTIFIER = '44444444-2026-8000-0000-000000000001';
    DECLARE @ExamMimi UNIQUEIDENTIFIER = '44444444-2026-8000-0000-000000000002';
    DECLARE @ExamMoon UNIQUEIDENTIFIER = '44444444-2026-8000-0000-000000000003';

    MERGE dbo.MedicalExaminations AS target
    USING (VALUES
        (@ExamBong, @ApptCompletedToday, @PetBong, @VetClinicMinh, N'Annual wellness exam and mild itching.', 11.80, 38.4, 96, 24, N'Alert, hydrated, mild skin redness around belly.', N'Mild allergic dermatitis.', N'Probiotic support, skin care, recheck if itching persists.', 'Completed', DATEADD(HOUR, -3, @Now)),
        (@ExamMimi, @ApptCheckedIn, @PetMimi, @VetClinicLan, N'Acute vomiting and reduced appetite.', 4.55, 38.9, 128, 32, N'Mild dehydration, abdomen soft, no fever spike.', N'Gastroenteritis suspected.', N'Fluid support, antiemetic if vomiting continues, monitor for 24h.', 'InProgress', NULL),
        (@ExamMoon, @ApptCompletedYesterday, @PetMoon, @VetClinicMinh, N'Rabies vaccination visit.', 6.80, 38.2, 104, 26, N'Normal exam before vaccination.', N'Healthy for vaccination.', N'Rabies vaccine given, next annual booster reminder.', 'Completed', DATEADD(DAY, -1, @Now))
    ) AS src(ExaminationID, AppointmentID, PetID, VetClinicID, ChiefComplaint, WeightKg, TemperatureC, HeartRate,
             RespiratoryRate, ExaminationNotes, Diagnosis, TreatmentPlan, Status, CompletedAt)
    ON target.ExaminationID = src.ExaminationID
    WHEN MATCHED THEN
        UPDATE SET
            AppointmentID = src.AppointmentID,
            PetID = src.PetID,
            VetClinicID = src.VetClinicID,
            ChiefComplaint = src.ChiefComplaint,
            WeightKg = src.WeightKg,
            TemperatureC = src.TemperatureC,
            HeartRate = src.HeartRate,
            RespiratoryRate = src.RespiratoryRate,
            ExaminationNotes = src.ExaminationNotes,
            Diagnosis = src.Diagnosis,
            TreatmentPlan = src.TreatmentPlan,
            Status = src.Status,
            CompletedAt = src.CompletedAt,
            UpdatedAt = @Now
    WHEN NOT MATCHED THEN
        INSERT (ExaminationID, AppointmentID, PetID, VetClinicID, ChiefComplaint, WeightKg, TemperatureC, HeartRate,
                RespiratoryRate, ExaminationNotes, Diagnosis, TreatmentPlan, Status, CreatedAt, UpdatedAt, CompletedAt)
        VALUES (src.ExaminationID, src.AppointmentID, src.PetID, src.VetClinicID, src.ChiefComplaint, src.WeightKg, src.TemperatureC, src.HeartRate,
                src.RespiratoryRate, src.ExaminationNotes, src.Diagnosis, src.TreatmentPlan, src.Status, DATEADD(HOUR, -4, @Now), @Now, src.CompletedAt);

    MERGE dbo.Prescriptions AS target
    USING (VALUES
        ('44444444-2026-8100-0000-000000000001', @ExamBong, N'Cefalexin 250mg', N'1 capsule', N'2 times/day', 5, N'Give after meal.', '44444444-2026-5000-0000-000000000003'),
        ('44444444-2026-8100-0000-000000000002', @ExamBong, N'Probiotic Digestive Gel', N'2 cm', N'1 time/day', 7, N'Mix with food.', '44444444-2026-5000-0000-000000000006'),
        ('44444444-2026-8100-0000-000000000003', @ExamMimi, N'Oresol Pet Electrolyte', N'1 sachet', N'2 times/day', 3, N'Dilute in clean water.', '44444444-2026-5000-0000-000000000005')
    ) AS src(PrescriptionID, ExaminationID, MedicationName, Dosage, Frequency, DurationDays, Instructions, InventoryItemID)
    ON target.PrescriptionID = src.PrescriptionID
    WHEN MATCHED THEN
        UPDATE SET
            ExaminationID = src.ExaminationID,
            MedicationName = src.MedicationName,
            Dosage = src.Dosage,
            Frequency = src.Frequency,
            DurationDays = src.DurationDays,
            Instructions = src.Instructions,
            InventoryItemID = src.InventoryItemID
    WHEN NOT MATCHED THEN
        INSERT (PrescriptionID, ExaminationID, MedicationName, Dosage, Frequency, DurationDays, Instructions, InventoryItemID, CreatedAt)
        VALUES (src.PrescriptionID, src.ExaminationID, src.MedicationName, src.Dosage, src.Frequency, src.DurationDays, src.Instructions, src.InventoryItemID, @Now);

    -- -------------------------------------------------------------------
    -- 6) Orders, invoices, invoice items, and SePay transactions
    -- -------------------------------------------------------------------
    DECLARE @OrderRetailPaid UNIQUEIDENTIFIER = '44444444-2026-9000-0000-000000000001';
    DECLARE @OrderRetailUnpaid UNIQUEIDENTIFIER = '44444444-2026-9000-0000-000000000002';

    MERGE dbo.Orders AS target
    USING (VALUES
        (@OrderRetailPaid, @ClinicID, @OwnerMaiUserID, @PetBong, NULL, N'Retail', N'Paid', 205000.00, N'Counter retail sale after exam.', @AssistantUserID, DATEADD(HOUR, -3, @Now), DATEADD(HOUR, -3, @Now), DATEADD(HOUR, -3, @Now), DATEADD(HOUR, -2, @Now), NULL),
        (@OrderRetailUnpaid, @ClinicID, @OwnerAnhUserID, @PetLucky, NULL, N'Retail', N'Invoiced', 140000.00, N'Flea and tick retail item waiting for payment.', @AssistantUserID, DATEADD(HOUR, -1, @Now), DATEADD(HOUR, -1, @Now), DATEADD(HOUR, -1, @Now), NULL, NULL)
    ) AS src(OrderID, ClinicID, CustomerUserID, PetID, AppointmentID, OrderType, Status, TotalAmount, Notes,
             CreatedByUserID, CreatedAt, UpdatedAt, ConfirmedAt, PaidAt, CancelledAt)
    ON target.OrderID = src.OrderID
    WHEN MATCHED THEN
        UPDATE SET
            ClinicID = src.ClinicID,
            CustomerUserID = src.CustomerUserID,
            PetID = src.PetID,
            AppointmentID = src.AppointmentID,
            OrderType = src.OrderType,
            Status = src.Status,
            TotalAmount = src.TotalAmount,
            Notes = src.Notes,
            CreatedByUserID = src.CreatedByUserID,
            UpdatedAt = @Now,
            ConfirmedAt = src.ConfirmedAt,
            PaidAt = src.PaidAt,
            CancelledAt = src.CancelledAt
    WHEN NOT MATCHED THEN
        INSERT (OrderID, ClinicID, CustomerUserID, PetID, AppointmentID, OrderType, Status, TotalAmount,
                Notes, CreatedByUserID, CreatedAt, UpdatedAt, ConfirmedAt, PaidAt, CancelledAt)
        VALUES (src.OrderID, src.ClinicID, src.CustomerUserID, src.PetID, src.AppointmentID, src.OrderType, src.Status, src.TotalAmount,
                src.Notes, src.CreatedByUserID, src.CreatedAt, src.UpdatedAt, src.ConfirmedAt, src.PaidAt, src.CancelledAt);

    MERGE dbo.OrderItems AS target
    USING (VALUES
        ('44444444-2026-9100-0000-000000000001', @OrderRetailPaid, '44444444-2026-5000-0000-000000000007', N'Elizabeth Collar Size M', 1, 75000.00, 75000.00, N'Retail', NULL),
        ('44444444-2026-9100-0000-000000000002', @OrderRetailPaid, '44444444-2026-5000-0000-000000000011', N'Recovery Wet Food', 3, 42000.00, 126000.00, N'Retail', NULL),
        ('44444444-2026-9100-0000-000000000003', @OrderRetailUnpaid, '44444444-2026-5000-0000-000000000010', N'Flea and Tick Spot-On', 1, 140000.00, 140000.00, N'Retail', NULL)
    ) AS src(OrderItemID, OrderID, InventoryItemID, Description, Quantity, UnitPrice, TotalPrice, SourceType, PrescriptionID)
    ON target.OrderItemID = src.OrderItemID
    WHEN MATCHED THEN
        UPDATE SET
            OrderID = src.OrderID,
            InventoryItemID = src.InventoryItemID,
            Description = src.Description,
            Quantity = src.Quantity,
            UnitPrice = src.UnitPrice,
            TotalPrice = src.TotalPrice,
            SourceType = src.SourceType,
            PrescriptionID = src.PrescriptionID
    WHEN NOT MATCHED THEN
        INSERT (OrderItemID, OrderID, InventoryItemID, Description, Quantity, UnitPrice, TotalPrice, SourceType, PrescriptionID, CreatedAt)
        VALUES (src.OrderItemID, src.OrderID, src.InventoryItemID, src.Description, src.Quantity, src.UnitPrice, src.TotalPrice, src.SourceType, src.PrescriptionID, @Now);

    DECLARE @InvoiceApptPaidSePay UNIQUEIDENTIFIER = '44444444-2026-A000-0000-000000000001';
    DECLARE @InvoiceCheckedInUnpaid UNIQUEIDENTIFIER = '44444444-2026-A000-0000-000000000002';
    DECLARE @InvoiceYesterdayCash UNIQUEIDENTIFIER = '44444444-2026-A000-0000-000000000003';
    DECLARE @InvoiceConfirmedUnpaid UNIQUEIDENTIFIER = '44444444-2026-A000-0000-000000000004';
    DECLARE @InvoiceCancelledRefund UNIQUEIDENTIFIER = '44444444-2026-A000-0000-000000000005';
    DECLARE @InvoiceOrderPaid UNIQUEIDENTIFIER = '44444444-2026-A000-0000-000000000006';
    DECLARE @InvoiceOrderUnpaid UNIQUEIDENTIFIER = '44444444-2026-A000-0000-000000000007';

    MERGE dbo.Invoices AS target
    USING (VALUES
        (@InvoiceApptPaidSePay, @ApptCompletedToday, NULL, @ExamBong, @ClinicID, N'Appointment', N'INV260606DEMOA101', 515000.00, 15000.00, 500000.00, N'Paid', N'SePay', N'POM26060101', N'https://qr.sepay.vn/img?acc=9704221234567890&bank=MB&amount=500000&des=POM26060101', N'9704221234567890', N'MB', 500000.00, DATEADD(HOUR, -2, @Now), N'SePayBankTransfer', NULL, NULL, NULL, 0, NULL, NULL, NULL, DATEADD(HOUR, -2, @Now), N'Demo paid SePay appointment invoice.'),
        (@InvoiceCheckedInUnpaid, @ApptCheckedIn, NULL, @ExamMimi, @ClinicID, N'Appointment', N'INV260606DEMOA102', 628000.00, 0.00, 628000.00, N'Unpaid', N'SePay', N'POM26060102', N'https://qr.sepay.vn/img?acc=9704221234567890&bank=MB&amount=628000&des=POM26060102', N'9704221234567890', N'MB', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, N'Unpaid emergency invoice with partial SePay transaction for reconciliation demo.'),
        (@InvoiceYesterdayCash, @ApptCompletedYesterday, NULL, @ExamMoon, @ClinicID, N'Appointment', N'INV260605DEMOA103', 500000.00, 50000.00, 450000.00, N'Paid', N'Manual', NULL, NULL, NULL, NULL, 450000.00, NULL, N'Cash', NULL, NULL, NULL, 0, NULL, NULL, NULL, DATEADD(DAY, -1, @Now), N'Cash payment yesterday.'),
        (@InvoiceConfirmedUnpaid, @ApptConfirmedToday, NULL, NULL, @ClinicID, N'Appointment', N'INV260606DEMOA104', 350000.00, 0.00, 350000.00, N'Unpaid', N'Manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, N'Confirmed appointment awaiting payment.'),
        (@InvoiceCancelledRefund, @ApptCancelled, NULL, NULL, @ClinicID, N'Appointment', N'INV260606DEMOA105', 180000.00, 0.00, 180000.00, N'Cancelled', N'Manual', NULL, NULL, NULL, NULL, 180000.00, NULL, N'BankTransfer', N'Owner cancelled after paid; manual refund pending.', @AssistantUserID, DATEADD(HOUR, -2, @Now), 1, NULL, NULL, NULL, DATEADD(HOUR, -5, @Now), N'Cancelled paid invoice for pending refund widget.'),
        (@InvoiceOrderPaid, NULL, @OrderRetailPaid, NULL, @ClinicID, N'Order', N'INV260606DEMOO106', 205000.00, 5000.00, 200000.00, N'Paid', N'Manual', NULL, NULL, NULL, NULL, 200000.00, NULL, N'Cash', NULL, NULL, NULL, 0, NULL, NULL, NULL, DATEADD(HOUR, -2, @Now), N'Paid retail order invoice.'),
        (@InvoiceOrderUnpaid, NULL, @OrderRetailUnpaid, NULL, @ClinicID, N'Order', N'INV260606DEMOO107', 140000.00, 0.00, 140000.00, N'Unpaid', N'SePay', N'POM26060107', N'https://qr.sepay.vn/img?acc=9704221234567890&bank=MB&amount=140000&des=POM26060107', N'9704221234567890', N'MB', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, N'Unpaid retail SePay order invoice.')
    ) AS src(InvoiceID, AppointmentID, OrderID, ExaminationID, ClinicID, InvoiceSource, InvoiceCode, TotalAmount,
             DiscountAmount, FinalAmount, Status, PaymentProvider, PaymentReference, QrCodeUrl, BankAccountNo, BankCode,
             PaidAmount, PaymentWebhookAt, PaymentMethod, CancellationReason, CancelledByUserID, CancelledAt,
             RequiresManualRefund, RefundNote, RefundConfirmedByUserID, RefundConfirmedAt, PaidAt, Notes)
    ON target.InvoiceID = src.InvoiceID
    WHEN MATCHED THEN
        UPDATE SET
            AppointmentID = src.AppointmentID,
            OrderID = src.OrderID,
            ExaminationID = src.ExaminationID,
            ClinicID = src.ClinicID,
            InvoiceSource = src.InvoiceSource,
            InvoiceCode = src.InvoiceCode,
            TotalAmount = src.TotalAmount,
            DiscountAmount = src.DiscountAmount,
            FinalAmount = src.FinalAmount,
            Status = src.Status,
            PaymentProvider = src.PaymentProvider,
            PaymentReference = src.PaymentReference,
            QrCodeUrl = src.QrCodeUrl,
            BankAccountNo = src.BankAccountNo,
            BankCode = src.BankCode,
            PaidAmount = src.PaidAmount,
            PaymentWebhookAt = src.PaymentWebhookAt,
            PaymentMethod = src.PaymentMethod,
            CancellationReason = src.CancellationReason,
            CancelledByUserID = src.CancelledByUserID,
            CancelledAt = src.CancelledAt,
            RequiresManualRefund = src.RequiresManualRefund,
            RefundNote = src.RefundNote,
            RefundConfirmedByUserID = src.RefundConfirmedByUserID,
            RefundConfirmedAt = src.RefundConfirmedAt,
            PaidAt = src.PaidAt,
            Notes = src.Notes,
            UpdatedAt = @Now
    WHEN NOT MATCHED THEN
        INSERT (InvoiceID, AppointmentID, OrderID, ExaminationID, ClinicID, InvoiceSource, InvoiceCode,
                TotalAmount, DiscountAmount, FinalAmount, Status, PaymentProvider, PaymentReference,
                QrCodeUrl, BankAccountNo, BankCode, PaidAmount, PaymentWebhookAt, PaymentMethod,
                CancellationReason, CancelledByUserID, CancelledAt, RequiresManualRefund, RefundNote,
                RefundConfirmedByUserID, RefundConfirmedAt, PaidAt, Notes, CreatedAt, UpdatedAt)
        VALUES (src.InvoiceID, src.AppointmentID, src.OrderID, src.ExaminationID, src.ClinicID, src.InvoiceSource, src.InvoiceCode,
                src.TotalAmount, src.DiscountAmount, src.FinalAmount, src.Status, src.PaymentProvider, src.PaymentReference,
                src.QrCodeUrl, src.BankAccountNo, src.BankCode, src.PaidAmount, src.PaymentWebhookAt, src.PaymentMethod,
                src.CancellationReason, src.CancelledByUserID, src.CancelledAt, src.RequiresManualRefund, src.RefundNote,
                src.RefundConfirmedByUserID, src.RefundConfirmedAt, src.PaidAt, src.Notes, DATEADD(DAY, -3, @Now), @Now);

    MERGE dbo.InvoiceItems AS target
    USING (VALUES
        ('44444444-2026-A100-0000-000000000001', @InvoiceApptPaidSePay, N'Service', N'General Checkup', 1, 180000.00, 180000.00, @SvcCheckup, NULL, NULL, NULL),
        ('44444444-2026-A100-0000-000000000002', @InvoiceApptPaidSePay, N'Medication', N'Cefalexin 250mg', 10, 12000.00, 120000.00, NULL, '44444444-2026-5000-0000-000000000003', NULL, '44444444-2026-8100-0000-000000000001'),
        ('44444444-2026-A100-0000-000000000003', @InvoiceApptPaidSePay, N'Medication', N'Probiotic Digestive Gel', 1, 85000.00, 85000.00, NULL, '44444444-2026-5000-0000-000000000006', NULL, '44444444-2026-8100-0000-000000000002'),
        ('44444444-2026-A100-0000-000000000004', @InvoiceApptPaidSePay, N'Other', N'Skin care counseling and supplies', 1, 130000.00, 130000.00, NULL, NULL, NULL, NULL),
        ('44444444-2026-A100-0000-000000000005', @InvoiceCheckedInUnpaid, N'Service', N'Emergency Intake', 1, 450000.00, 450000.00, @SvcEmergency, NULL, NULL, NULL),
        ('44444444-2026-A100-0000-000000000006', @InvoiceCheckedInUnpaid, N'Medication', N'Oresol Pet Electrolyte', 6, 8000.00, 48000.00, NULL, '44444444-2026-5000-0000-000000000005', NULL, '44444444-2026-8100-0000-000000000003'),
        ('44444444-2026-A100-0000-000000000007', @InvoiceCheckedInUnpaid, N'Other', N'Observation and nursing care', 1, 130000.00, 130000.00, NULL, NULL, NULL, NULL),
        ('44444444-2026-A100-0000-000000000008', @InvoiceYesterdayCash, N'Service', N'Core Vaccination', 1, 320000.00, 320000.00, @SvcVaccine, NULL, NULL, NULL),
        ('44444444-2026-A100-0000-000000000009', @InvoiceYesterdayCash, N'Medication', N'Rabies Vaccine', 1, 180000.00, 180000.00, NULL, '44444444-2026-5000-0000-000000000002', NULL, NULL),
        ('44444444-2026-A100-0000-000000000010', @InvoiceConfirmedUnpaid, N'Service', N'Core Vaccination', 1, 320000.00, 320000.00, @SvcVaccine, NULL, NULL, NULL),
        ('44444444-2026-A100-0000-000000000011', @InvoiceConfirmedUnpaid, N'Other', N'Vaccine certificate handling', 1, 30000.00, 30000.00, NULL, NULL, NULL, NULL),
        ('44444444-2026-A100-0000-000000000012', @InvoiceCancelledRefund, N'Service', N'General Checkup', 1, 180000.00, 180000.00, @SvcCheckup, NULL, NULL, NULL),
        ('44444444-2026-A100-0000-000000000013', @InvoiceOrderPaid, N'Product', N'Elizabeth Collar Size M', 1, 75000.00, 75000.00, NULL, '44444444-2026-5000-0000-000000000007', '44444444-2026-9100-0000-000000000001', NULL),
        ('44444444-2026-A100-0000-000000000014', @InvoiceOrderPaid, N'Product', N'Recovery Wet Food', 3, 42000.00, 126000.00, NULL, '44444444-2026-5000-0000-000000000011', '44444444-2026-9100-0000-000000000002', NULL),
        ('44444444-2026-A100-0000-000000000015', @InvoiceOrderUnpaid, N'Product', N'Flea and Tick Spot-On', 1, 140000.00, 140000.00, NULL, '44444444-2026-5000-0000-000000000010', '44444444-2026-9100-0000-000000000003', NULL)
    ) AS src(InvoiceItemID, InvoiceID, ItemType, Description, Quantity, UnitPrice, TotalPrice, ServiceID, InventoryItemID, OrderItemID, PrescriptionID)
    ON target.InvoiceItemID = src.InvoiceItemID
    WHEN MATCHED THEN
        UPDATE SET
            InvoiceID = src.InvoiceID,
            ItemType = src.ItemType,
            Description = src.Description,
            Quantity = src.Quantity,
            UnitPrice = src.UnitPrice,
            TotalPrice = src.TotalPrice,
            ServiceID = src.ServiceID,
            InventoryItemID = src.InventoryItemID,
            OrderItemID = src.OrderItemID,
            PrescriptionID = src.PrescriptionID
    WHEN NOT MATCHED THEN
        INSERT (InvoiceItemID, InvoiceID, ItemType, Description, Quantity, UnitPrice, TotalPrice,
                ServiceID, InventoryItemID, OrderItemID, PrescriptionID)
        VALUES (src.InvoiceItemID, src.InvoiceID, src.ItemType, src.Description, src.Quantity, src.UnitPrice, src.TotalPrice,
                src.ServiceID, src.InventoryItemID, src.OrderItemID, src.PrescriptionID);

    MERGE dbo.PaymentTransactions AS target
    USING (VALUES
        ('44444444-2026-B000-0000-000000000001', @InvoiceApptPaidSePay, @ClinicID, N'SePay', N'DEMO-SEPAY-260606-0001', N'POM26060101', N'POM26060101 INV260606DEMOA101', N'in', 500000.00, N'SePay', N'9704221234567890', DATEADD(HOUR, -2, @Now), 1, NULL, NULL, NULL, N'{"demo":true,"case":"matched"}'),
        ('44444444-2026-B000-0000-000000000002', @InvoiceCheckedInUnpaid, @ClinicID, N'SePay', N'DEMO-SEPAY-260606-0002', N'POM26060102', N'POM26060102 partial transfer', N'in', 300000.00, N'SePay', N'9704221234567890', DATEADD(MINUTE, -30, @Now), 0, NULL, NULL, NULL, N'{"demo":true,"case":"amount_mismatch"}'),
        ('44444444-2026-B000-0000-000000000003', NULL, @ClinicID, N'SePay', N'DEMO-SEPAY-260606-0003', N'UNKNOWN-DEMO', N'Customer transfer without invoice reference', N'in', 125000.00, N'SePay', N'9704221234567890', DATEADD(MINUTE, -15, @Now), 0, NULL, NULL, NULL, N'{"demo":true,"case":"unmatched"}')
    ) AS src(PaymentTransactionID, InvoiceID, ClinicID, Provider, ProviderTransactionID, ReferenceCode, TransferContent,
             TransferType, TransferAmount, Gateway, AccountNumber, TransactionDate, IsMatched, ReviewNote,
             ReviewedByUserID, ReviewedAt, RawPayload)
    ON target.PaymentTransactionID = src.PaymentTransactionID
    WHEN MATCHED THEN
        UPDATE SET
            InvoiceID = src.InvoiceID,
            ClinicID = src.ClinicID,
            Provider = src.Provider,
            ProviderTransactionID = src.ProviderTransactionID,
            ReferenceCode = src.ReferenceCode,
            TransferContent = src.TransferContent,
            TransferType = src.TransferType,
            TransferAmount = src.TransferAmount,
            Gateway = src.Gateway,
            AccountNumber = src.AccountNumber,
            TransactionDate = src.TransactionDate,
            IsMatched = src.IsMatched,
            ReviewNote = src.ReviewNote,
            ReviewedByUserID = src.ReviewedByUserID,
            ReviewedAt = src.ReviewedAt,
            RawPayload = src.RawPayload
    WHEN NOT MATCHED THEN
        INSERT (PaymentTransactionID, InvoiceID, ClinicID, Provider, ProviderTransactionID, ReferenceCode, TransferContent,
                TransferType, TransferAmount, Gateway, AccountNumber, TransactionDate, IsMatched, ReviewNote,
                ReviewedByUserID, ReviewedAt, RawPayload, CreatedAt)
        VALUES (src.PaymentTransactionID, src.InvoiceID, src.ClinicID, src.Provider, src.ProviderTransactionID, src.ReferenceCode, src.TransferContent,
                src.TransferType, src.TransferAmount, src.Gateway, src.AccountNumber, src.TransactionDate, src.IsMatched, src.ReviewNote,
                src.ReviewedByUserID, src.ReviewedAt, src.RawPayload, @Now);

    -- -------------------------------------------------------------------
    -- 7) Time-distributed history pack for richer clinic dashboards.
    -- Covers revenue trend, aging buckets, late cancellations, and future
    -- scheduling without conflicting with active invoice uniqueness.
    -- -------------------------------------------------------------------
    DECLARE @ApptHist35 UNIQUEIDENTIFIER = '44444444-2026-7010-0000-000000000001';
    DECLARE @ApptUnpaid33 UNIQUEIDENTIFIER = '44444444-2026-7010-0000-000000000002';
    DECLARE @ApptHist22 UNIQUEIDENTIFIER = '44444444-2026-7010-0000-000000000003';
    DECLARE @ApptHist15 UNIQUEIDENTIFIER = '44444444-2026-7010-0000-000000000004';
    DECLARE @ApptUnpaid9 UNIQUEIDENTIFIER = '44444444-2026-7010-0000-000000000005';
    DECLARE @ApptHist5 UNIQUEIDENTIFIER = '44444444-2026-7010-0000-000000000006';
    DECLARE @ApptUnpaid4 UNIQUEIDENTIFIER = '44444444-2026-7010-0000-000000000007';
    DECLARE @ApptCancelled2 UNIQUEIDENTIFIER = '44444444-2026-7010-0000-000000000008';
    DECLARE @ApptFuture3 UNIQUEIDENTIFIER = '44444444-2026-7010-0000-000000000009';
    DECLARE @ApptFuture7 UNIQUEIDENTIFIER = '44444444-2026-7010-0000-000000000010';

    MERGE dbo.Appointments AS target
    USING (VALUES
        (@ApptHist35, @ClinicID, @VetClinicMinh, @SvcCheckup, @PetLucky, @OwnerAnhUserID, @ThirtyFiveDaysAgo, CAST('09:00:00' AS TIME), CAST('09:30:00' AS TIME), 'Checkup', 'Completed', N'Historical wellness check for 30+ day revenue trend.', 0, 0, DATEADD(DAY, -35, @Now), DATEADD(DAY, -35, DATEADD(MINUTE, 10, @Now)), @AssistantUserID, NULL, NULL, DATEADD(DAY, -35, @Now)),
        (@ApptUnpaid33, @ClinicID, @VetClinicLan, @SvcEmergency, @PetBin, @OwnerQuyenUserID, @ThirtyThreeDaysAgo, CAST('17:00:00' AS TIME), CAST('17:45:00' AS TIME), 'Emergency', 'Completed', N'Old unpaid emergency balance for 31+ aging bucket.', 0, 0, DATEADD(DAY, -33, @Now), DATEADD(DAY, -33, DATEADD(MINUTE, 5, @Now)), @AssistantUserID, NULL, NULL, DATEADD(DAY, -33, @Now)),
        (@ApptHist22, @ClinicID, @VetClinicLan, @SvcGrooming, @PetCoco, @OwnerAnhUserID, @TwentyTwoDaysAgo, CAST('10:00:00' AS TIME), CAST('10:45:00' AS TIME), 'Grooming', 'Completed', N'Completed grooming visit for mid-month activity.', 0, 0, DATEADD(DAY, -22, @Now), DATEADD(DAY, -22, DATEADD(MINUTE, 8, @Now)), @AssistantUserID, NULL, NULL, DATEADD(DAY, -22, @Now)),
        (@ApptHist15, @ClinicID, @VetClinicLan, @SvcEmergency, @PetMimi, @OwnerMaiUserID, @FifteenDaysAgo, CAST('18:00:00' AS TIME), CAST('18:45:00' AS TIME), 'Emergency', 'Completed', N'After-hours emergency paid by SePay.', 0, 0, DATEADD(DAY, -15, @Now), DATEADD(DAY, -15, DATEADD(MINUTE, 6, @Now)), @AssistantUserID, NULL, NULL, DATEADD(DAY, -15, @Now)),
        (@ApptUnpaid9, @ClinicID, @VetClinicMinh, @SvcFollowup, @PetBong, @OwnerMaiUserID, @NineDaysAgo, CAST('16:00:00' AS TIME), CAST('16:20:00' AS TIME), 'Followup', 'Completed', N'Follow-up visit still unpaid for 8-30 aging bucket.', 0, 0, DATEADD(DAY, -9, @Now), DATEADD(DAY, -9, DATEADD(MINUTE, 5, @Now)), @AssistantUserID, NULL, NULL, DATEADD(DAY, -9, @Now)),
        (@ApptHist5, @ClinicID, @VetClinicMinh, @SvcVaccine, @PetMimi, @OwnerMaiUserID, @FiveDaysAgo, CAST('13:00:00' AS TIME), CAST('13:30:00' AS TIME), 'Vaccination', 'Completed', N'Vaccination paid in cash for recent trend.', 0, 0, DATEADD(DAY, -5, @Now), DATEADD(DAY, -5, DATEADD(MINUTE, 7, @Now)), @AssistantUserID, NULL, NULL, DATEADD(DAY, -5, @Now)),
        (@ApptUnpaid4, @ClinicID, @VetClinicMinh, @SvcCheckup, @PetMoon, @OwnerQuyenUserID, @FourDaysAgo, CAST('08:30:00' AS TIME), CAST('09:00:00' AS TIME), 'Checkup', 'Completed', N'Recent unpaid checkup for 0-7 aging bucket.', 0, 0, DATEADD(DAY, -4, @Now), DATEADD(DAY, -4, DATEADD(MINUTE, 9, @Now)), @AssistantUserID, NULL, NULL, DATEADD(DAY, -4, @Now)),
        (@ApptCancelled2, @ClinicID, @VetClinicLan, @SvcSurgery, @PetCoco, @OwnerAnhUserID, @TwoDaysAgo, CAST('11:00:00' AS TIME), CAST('12:30:00' AS TIME), 'Surgery', 'Cancelled', N'Surgery slot cancelled two days ago.', 0, 1, DATEADD(DAY, -2, @Now), NULL, NULL, DATEADD(DAY, -2, DATEADD(HOUR, 1, @Now)), @OwnerAnhUserID, DATEADD(DAY, -2, @Now)),
        (@ApptFuture3, @ClinicID, NULL, @SvcSurgery, @PetBin, @OwnerQuyenUserID, @InThreeDays, CAST('15:00:00' AS TIME), CAST('16:30:00' AS TIME), 'Surgery', 'Pending', N'Future surgery request waiting clinic confirmation.', 0, 0, NULL, NULL, NULL, NULL, NULL, @Now),
        (@ApptFuture7, @ClinicID, @VetClinicMinh, @SvcCheckup, @PetMimi, @OwnerMaiUserID, @InSevenDays, CAST('09:30:00' AS TIME), CAST('10:00:00' AS TIME), 'Checkup', 'Confirmed', N'Future confirmed routine check.', 0, 0, @Now, NULL, NULL, NULL, NULL, @Now)
    ) AS src(AppointmentID, ClinicID, VetClinicID, ServiceID, PetID, BookedByUserID, AppointmentDate, StartTime, EndTime,
             AppointmentType, Status, Notes, IsWalkIn, IsLateCancellation, ConfirmedAt, CheckedInAt, CheckedInByUserID,
             CancelledAt, CancelledByUserID, CreatedAt)
    ON target.AppointmentID = src.AppointmentID
    WHEN MATCHED THEN
        UPDATE SET
            ClinicID = src.ClinicID,
            VetClinicID = src.VetClinicID,
            ServiceID = src.ServiceID,
            PetID = src.PetID,
            BookedByUserID = src.BookedByUserID,
            AppointmentDate = src.AppointmentDate,
            StartTime = src.StartTime,
            EndTime = src.EndTime,
            AppointmentType = src.AppointmentType,
            Status = src.Status,
            Notes = src.Notes,
            CancellationReason = CASE WHEN src.Status = 'Cancelled' THEN N'Demo cancellation for historical calendar.' ELSE NULL END,
            IsWalkIn = src.IsWalkIn,
            IsLateCancellation = src.IsLateCancellation,
            ConfirmedAt = src.ConfirmedAt,
            CheckedInAt = src.CheckedInAt,
            CheckedInByUserID = src.CheckedInByUserID,
            CancelledAt = src.CancelledAt,
            CancelledByUserID = src.CancelledByUserID,
            CreatedAt = src.CreatedAt,
            UpdatedAt = @Now
    WHEN NOT MATCHED THEN
        INSERT (AppointmentID, ClinicID, VetClinicID, ServiceID, PetID, BookedByUserID, AppointmentDate,
                StartTime, EndTime, AppointmentType, Status, Notes, CancellationReason, IsWalkIn,
                IsLateCancellation, ConfirmedAt, CheckedInAt, CheckedInByUserID, CancelledAt,
                CancelledByUserID, CreatedAt, UpdatedAt)
        VALUES (src.AppointmentID, src.ClinicID, src.VetClinicID, src.ServiceID, src.PetID, src.BookedByUserID, src.AppointmentDate,
                src.StartTime, src.EndTime, src.AppointmentType, src.Status, src.Notes,
                CASE WHEN src.Status = 'Cancelled' THEN N'Demo cancellation for historical calendar.' ELSE NULL END,
                src.IsWalkIn, src.IsLateCancellation, src.ConfirmedAt, src.CheckedInAt,
                src.CheckedInByUserID, src.CancelledAt, src.CancelledByUserID, src.CreatedAt, @Now);

    DECLARE @InvoiceHist35 UNIQUEIDENTIFIER = '44444444-2026-A010-0000-000000000001';
    DECLARE @InvoiceUnpaid33 UNIQUEIDENTIFIER = '44444444-2026-A010-0000-000000000002';
    DECLARE @InvoiceHist22 UNIQUEIDENTIFIER = '44444444-2026-A010-0000-000000000003';
    DECLARE @InvoiceHist15 UNIQUEIDENTIFIER = '44444444-2026-A010-0000-000000000004';
    DECLARE @InvoiceUnpaid9 UNIQUEIDENTIFIER = '44444444-2026-A010-0000-000000000005';
    DECLARE @InvoiceHist5 UNIQUEIDENTIFIER = '44444444-2026-A010-0000-000000000006';
    DECLARE @InvoiceUnpaid4 UNIQUEIDENTIFIER = '44444444-2026-A010-0000-000000000007';

    MERGE dbo.Invoices AS target
    USING (VALUES
        (@InvoiceHist35, @ApptHist35, NULL, NULL, @ClinicID, N'Appointment', N'INV260501DEMOD201', 180000.00, 0.00, 180000.00, N'Paid', N'Manual', NULL, NULL, NULL, NULL, 180000.00, NULL, N'BankTransfer', NULL, NULL, NULL, 0, NULL, NULL, NULL, DATEADD(DAY, -35, @Now), N'Bank transfer revenue point 35 days ago.', DATEADD(DAY, -35, @Now)),
        (@InvoiceUnpaid33, @ApptUnpaid33, NULL, NULL, @ClinicID, N'Appointment', N'INV260503DEMOD202', 450000.00, 0.00, 450000.00, N'Unpaid', N'SePay', N'POM26060202', N'https://qr.sepay.vn/img?acc=9704221234567890&bank=MB&amount=450000&des=POM26060202', N'9704221234567890', N'MB', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, N'Old unpaid SePay invoice for 31+ aging bucket.', DATEADD(DAY, -33, @Now)),
        (@InvoiceHist22, @ApptHist22, NULL, NULL, @ClinicID, N'Appointment', N'INV260516DEMOD203', 250000.00, 0.00, 250000.00, N'Paid', N'Manual', NULL, NULL, NULL, NULL, 250000.00, NULL, N'Cash', NULL, NULL, NULL, 0, NULL, NULL, NULL, DATEADD(DAY, -22, @Now), N'Cash grooming revenue 22 days ago.', DATEADD(DAY, -22, @Now)),
        (@InvoiceHist15, @ApptHist15, NULL, NULL, @ClinicID, N'Appointment', N'INV260523DEMOD204', 450000.00, 0.00, 450000.00, N'Paid', N'SePay', N'POM26060204', N'https://qr.sepay.vn/img?acc=9704221234567890&bank=MB&amount=450000&des=POM26060204', N'9704221234567890', N'MB', 450000.00, DATEADD(DAY, -15, @Now), N'SePayBankTransfer', NULL, NULL, NULL, 0, NULL, NULL, NULL, DATEADD(DAY, -15, @Now), N'SePay emergency revenue 15 days ago.', DATEADD(DAY, -15, @Now)),
        (@InvoiceUnpaid9, @ApptUnpaid9, NULL, NULL, @ClinicID, N'Appointment', N'INV260529DEMOD205', 120000.00, 0.00, 120000.00, N'Unpaid', N'Manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, N'Unpaid follow-up for 8-30 aging bucket.', DATEADD(DAY, -9, @Now)),
        (@InvoiceHist5, @ApptHist5, NULL, NULL, @ClinicID, N'Appointment', N'INV260602DEMOD206', 350000.00, 0.00, 350000.00, N'Paid', N'Manual', NULL, NULL, NULL, NULL, 350000.00, NULL, N'Cash', NULL, NULL, NULL, 0, NULL, NULL, NULL, DATEADD(DAY, -5, @Now), N'Recent cash vaccine revenue.', DATEADD(DAY, -5, @Now)),
        (@InvoiceUnpaid4, @ApptUnpaid4, NULL, NULL, @ClinicID, N'Appointment', N'INV260603DEMOD207', 180000.00, 0.00, 180000.00, N'Unpaid', N'Manual', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, N'Recent unpaid checkup for 0-7 aging bucket.', DATEADD(DAY, -4, @Now))
    ) AS src(InvoiceID, AppointmentID, OrderID, ExaminationID, ClinicID, InvoiceSource, InvoiceCode, TotalAmount,
             DiscountAmount, FinalAmount, Status, PaymentProvider, PaymentReference, QrCodeUrl, BankAccountNo, BankCode,
             PaidAmount, PaymentWebhookAt, PaymentMethod, CancellationReason, CancelledByUserID, CancelledAt,
             RequiresManualRefund, RefundNote, RefundConfirmedByUserID, RefundConfirmedAt, PaidAt, Notes, CreatedAt)
    ON target.InvoiceID = src.InvoiceID
    WHEN MATCHED THEN
        UPDATE SET
            AppointmentID = src.AppointmentID,
            OrderID = src.OrderID,
            ExaminationID = src.ExaminationID,
            ClinicID = src.ClinicID,
            InvoiceSource = src.InvoiceSource,
            InvoiceCode = src.InvoiceCode,
            TotalAmount = src.TotalAmount,
            DiscountAmount = src.DiscountAmount,
            FinalAmount = src.FinalAmount,
            Status = src.Status,
            PaymentProvider = src.PaymentProvider,
            PaymentReference = src.PaymentReference,
            QrCodeUrl = src.QrCodeUrl,
            BankAccountNo = src.BankAccountNo,
            BankCode = src.BankCode,
            PaidAmount = src.PaidAmount,
            PaymentWebhookAt = src.PaymentWebhookAt,
            PaymentMethod = src.PaymentMethod,
            CancellationReason = src.CancellationReason,
            CancelledByUserID = src.CancelledByUserID,
            CancelledAt = src.CancelledAt,
            RequiresManualRefund = src.RequiresManualRefund,
            RefundNote = src.RefundNote,
            RefundConfirmedByUserID = src.RefundConfirmedByUserID,
            RefundConfirmedAt = src.RefundConfirmedAt,
            PaidAt = src.PaidAt,
            Notes = src.Notes,
            CreatedAt = src.CreatedAt,
            UpdatedAt = @Now
    WHEN NOT MATCHED THEN
        INSERT (InvoiceID, AppointmentID, OrderID, ExaminationID, ClinicID, InvoiceSource, InvoiceCode,
                TotalAmount, DiscountAmount, FinalAmount, Status, PaymentProvider, PaymentReference,
                QrCodeUrl, BankAccountNo, BankCode, PaidAmount, PaymentWebhookAt, PaymentMethod,
                CancellationReason, CancelledByUserID, CancelledAt, RequiresManualRefund, RefundNote,
                RefundConfirmedByUserID, RefundConfirmedAt, PaidAt, Notes, CreatedAt, UpdatedAt)
        VALUES (src.InvoiceID, src.AppointmentID, src.OrderID, src.ExaminationID, src.ClinicID, src.InvoiceSource, src.InvoiceCode,
                src.TotalAmount, src.DiscountAmount, src.FinalAmount, src.Status, src.PaymentProvider, src.PaymentReference,
                src.QrCodeUrl, src.BankAccountNo, src.BankCode, src.PaidAmount, src.PaymentWebhookAt, src.PaymentMethod,
                src.CancellationReason, src.CancelledByUserID, src.CancelledAt, src.RequiresManualRefund, src.RefundNote,
                src.RefundConfirmedByUserID, src.RefundConfirmedAt, src.PaidAt, src.Notes, src.CreatedAt, @Now);

    MERGE dbo.InvoiceItems AS target
    USING (VALUES
        ('44444444-2026-A110-0000-000000000001', @InvoiceHist35, N'Service', N'General Checkup', 1, 180000.00, 180000.00, @SvcCheckup, NULL, NULL, NULL),
        ('44444444-2026-A110-0000-000000000002', @InvoiceUnpaid33, N'Service', N'Emergency Intake', 1, 450000.00, 450000.00, @SvcEmergency, NULL, NULL, NULL),
        ('44444444-2026-A110-0000-000000000003', @InvoiceHist22, N'Service', N'Grooming Basic', 1, 250000.00, 250000.00, @SvcGrooming, NULL, NULL, NULL),
        ('44444444-2026-A110-0000-000000000004', @InvoiceHist15, N'Service', N'Emergency Intake', 1, 450000.00, 450000.00, @SvcEmergency, NULL, NULL, NULL),
        ('44444444-2026-A110-0000-000000000005', @InvoiceUnpaid9, N'Service', N'Follow-up Visit', 1, 120000.00, 120000.00, @SvcFollowup, NULL, NULL, NULL),
        ('44444444-2026-A110-0000-000000000006', @InvoiceHist5, N'Service', N'Core Vaccination', 1, 320000.00, 320000.00, @SvcVaccine, NULL, NULL, NULL),
        ('44444444-2026-A110-0000-000000000007', @InvoiceHist5, N'Other', N'Vaccine certificate handling', 1, 30000.00, 30000.00, NULL, NULL, NULL, NULL),
        ('44444444-2026-A110-0000-000000000008', @InvoiceUnpaid4, N'Service', N'General Checkup', 1, 180000.00, 180000.00, @SvcCheckup, NULL, NULL, NULL)
    ) AS src(InvoiceItemID, InvoiceID, ItemType, Description, Quantity, UnitPrice, TotalPrice, ServiceID, InventoryItemID, OrderItemID, PrescriptionID)
    ON target.InvoiceItemID = src.InvoiceItemID
    WHEN MATCHED THEN
        UPDATE SET
            InvoiceID = src.InvoiceID,
            ItemType = src.ItemType,
            Description = src.Description,
            Quantity = src.Quantity,
            UnitPrice = src.UnitPrice,
            TotalPrice = src.TotalPrice,
            ServiceID = src.ServiceID,
            InventoryItemID = src.InventoryItemID,
            OrderItemID = src.OrderItemID,
            PrescriptionID = src.PrescriptionID
    WHEN NOT MATCHED THEN
        INSERT (InvoiceItemID, InvoiceID, ItemType, Description, Quantity, UnitPrice, TotalPrice,
                ServiceID, InventoryItemID, OrderItemID, PrescriptionID)
        VALUES (src.InvoiceItemID, src.InvoiceID, src.ItemType, src.Description, src.Quantity, src.UnitPrice, src.TotalPrice,
                src.ServiceID, src.InventoryItemID, src.OrderItemID, src.PrescriptionID);

    MERGE dbo.PaymentTransactions AS target
    USING (VALUES
        ('44444444-2026-B010-0000-000000000001', @InvoiceHist15, @ClinicID, N'SePay', N'DEMO-SEPAY-HIST-0015', N'POM26060204', N'POM26060204 INV260523DEMOD204', N'in', 450000.00, N'SePay', N'9704221234567890', DATEADD(DAY, -15, @Now), 1, NULL, NULL, NULL, N'{"demo":true,"case":"historical_matched"}'),
        ('44444444-2026-B010-0000-000000000002', NULL, @ClinicID, N'SePay', N'DEMO-SEPAY-HIST-0006', N'OLD-UNKNOWN', N'Old unmatched transfer for reconciliation history', N'in', 99000.00, N'SePay', N'9704221234567890', DATEADD(DAY, -6, @Now), 0, NULL, NULL, NULL, N'{"demo":true,"case":"historical_unmatched"}')
    ) AS src(PaymentTransactionID, InvoiceID, ClinicID, Provider, ProviderTransactionID, ReferenceCode, TransferContent,
             TransferType, TransferAmount, Gateway, AccountNumber, TransactionDate, IsMatched, ReviewNote,
             ReviewedByUserID, ReviewedAt, RawPayload)
    ON target.PaymentTransactionID = src.PaymentTransactionID
    WHEN MATCHED THEN
        UPDATE SET
            InvoiceID = src.InvoiceID,
            ClinicID = src.ClinicID,
            Provider = src.Provider,
            ProviderTransactionID = src.ProviderTransactionID,
            ReferenceCode = src.ReferenceCode,
            TransferContent = src.TransferContent,
            TransferType = src.TransferType,
            TransferAmount = src.TransferAmount,
            Gateway = src.Gateway,
            AccountNumber = src.AccountNumber,
            TransactionDate = src.TransactionDate,
            IsMatched = src.IsMatched,
            ReviewNote = src.ReviewNote,
            ReviewedByUserID = src.ReviewedByUserID,
            ReviewedAt = src.ReviewedAt,
            RawPayload = src.RawPayload
    WHEN NOT MATCHED THEN
        INSERT (PaymentTransactionID, InvoiceID, ClinicID, Provider, ProviderTransactionID, ReferenceCode, TransferContent,
                TransferType, TransferAmount, Gateway, AccountNumber, TransactionDate, IsMatched, ReviewNote,
                ReviewedByUserID, ReviewedAt, RawPayload, CreatedAt)
        VALUES (src.PaymentTransactionID, src.InvoiceID, src.ClinicID, src.Provider, src.ProviderTransactionID, src.ReferenceCode, src.TransferContent,
                src.TransferType, src.TransferAmount, src.Gateway, src.AccountNumber, src.TransactionDate, src.IsMatched, src.ReviewNote,
                src.ReviewedByUserID, src.ReviewedAt, src.RawPayload, @Now);

    COMMIT TRANSACTION;

    PRINT 'Demo clinic seed completed successfully.';

    -- -------------------------------------------------------------------
    -- Smoke checks for demo readiness
    -- -------------------------------------------------------------------
    SELECT
        c.ClinicID,
        c.ClinicName,
        c.Status,
        ActiveStaff = (
            SELECT COUNT(*)
            FROM dbo.VetClinic vc
            WHERE vc.ClinicID = c.ClinicID AND vc.IsActive = 1
        ),
        Services = (
            SELECT COUNT(*)
            FROM dbo.ClinicServices cs
            WHERE cs.ClinicID = c.ClinicID AND cs.IsActive = 1
        ),
        InventoryItems = (
            SELECT COUNT(*)
            FROM dbo.Inventory i
            WHERE i.ClinicID = c.ClinicID AND i.IsActive = 1
        )
    FROM dbo.Clinics c
    WHERE c.ClinicID = '44444444-2026-0000-0000-000000000001';

    SELECT Status, COUNT(*) AS AppointmentCount
    FROM dbo.Appointments
    WHERE ClinicID = '44444444-2026-0000-0000-000000000001'
      AND AppointmentDate IN (CONVERT(DATE, GETUTCDATE()), DATEADD(DAY, 1, CONVERT(DATE, GETUTCDATE())))
    GROUP BY Status
    ORDER BY Status;

    SELECT Status, PaymentMethod, PaymentProvider, COUNT(*) AS InvoiceCount, SUM(FinalAmount) AS FinalAmount
    FROM dbo.Invoices
    WHERE ClinicID = '44444444-2026-0000-0000-000000000001'
    GROUP BY Status, PaymentMethod, PaymentProvider
    ORDER BY Status, PaymentMethod, PaymentProvider;

    SELECT ItemName, Quantity, LowStockThreshold, IsLowStock =
        CASE WHEN Quantity <= LowStockThreshold THEN 1 ELSE 0 END
    FROM dbo.Inventory
    WHERE ClinicID = '44444444-2026-0000-0000-000000000001'
    ORDER BY IsLowStock DESC, ItemName;

    SELECT ProviderTransactionID, InvoiceID, ReferenceCode, TransferAmount, IsMatched
    FROM dbo.PaymentTransactions
    WHERE ClinicID = '44444444-2026-0000-0000-000000000001'
    ORDER BY CreatedAt DESC;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH;
GO
