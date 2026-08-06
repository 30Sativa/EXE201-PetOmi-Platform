-- =====================================================================
-- SEED 051: OC3 synthetic/demo adoption activity for July 2026.
--
-- IMPORTANT
--   - This is SYNTHETIC DEMO DATA, not customer evidence.
--   - Run only on a local, demo, or staging database.
--   - Never attach these activities to existing customer accounts.
--   - All accounts use @petomi.test and IsSynthetic = 1.
--
-- Result
--   - reuses 13 supplied .test owner accounts and adds 7 .test owners
--   - creates one July demo pet for each of the 20 owners
--   - realistic daily activity across 2026-07-01 .. 2026-07-31
--   - owner/assistant chat pairs, sessions, vaccine notes, and reminders
--   - deterministic IDs and MERGE statements, so reruns are idempotent
--
-- Login password for the seven new demo.oc3.* accounts: 194551524@Thanh
-- Local/demo execution is enabled below. Change it back to 0 before sharing
-- this script for use outside the controlled demo environment.
-- Requires migrations 001..050 plus demo seeds 034 and 047.
-- =====================================================================

USE PetOmni_DB;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @AllowSyntheticDemoData BIT = 1;

IF @AllowSyntheticDemoData <> 1
BEGIN
    THROW 50510,
        'Safety stop: set @AllowSyntheticDemoData = 1 only on local/demo/staging.',
        1;
END;

IF OBJECT_ID('dbo.Users', 'U') IS NULL
   OR OBJECT_ID('dbo.UserProfiles', 'U') IS NULL
   OR OBJECT_ID('dbo.Roles', 'U') IS NULL
   OR OBJECT_ID('dbo.UserRoles', 'U') IS NULL
   OR OBJECT_ID('dbo.Pets', 'U') IS NULL
   OR OBJECT_ID('dbo.Conversations', 'U') IS NULL
   OR OBJECT_ID('dbo.Messages', 'U') IS NULL
   OR OBJECT_ID('dbo.PetMedicalRecords', 'U') IS NULL
   OR OBJECT_ID('dbo.Reminders', 'U') IS NULL
   OR OBJECT_ID('dbo.UserSessions', 'U') IS NULL
BEGIN
    THROW 50511, 'Missing required tables. Apply migrations 001 through 050 first.', 1;
END;

IF COL_LENGTH('dbo.Users', 'IsSynthetic') IS NULL
   OR COL_LENGTH('dbo.Users', 'IsProfileCompleted') IS NULL
   OR COL_LENGTH('dbo.Users', 'ReferralCode') IS NULL
   OR COL_LENGTH('dbo.Pets', 'PublicPetCode') IS NULL
   OR COL_LENGTH('dbo.UserSessions', 'ActiveRole') IS NULL
BEGIN
    THROW 50512, 'Database schema is older than migration 050.', 1;
END;

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @PasswordHash NVARCHAR(255) =
        N'$2a$11$uO6OrIPbvHZcd/uJ95rit.erWy0kevXR5ZZjG1fbQ9O5QOTRgXtxG';
    DECLARE @OwnerRoleID UNIQUEIDENTIFIER =
        (SELECT TOP (1) RoleID FROM dbo.Roles WHERE RoleName = N'Owner');

    IF @OwnerRoleID IS NULL
        THROW 50513, 'Owner role is missing. Apply the role seed before this script.', 1;

    DECLARE @DemoUsers TABLE
    (
        UserNo       INT              NOT NULL PRIMARY KEY,
        UserID       UNIQUEIDENTIFIER NOT NULL UNIQUE,
        ProfileID    UNIQUEIDENTIFIER NOT NULL UNIQUE,
        Email        NVARCHAR(255)    NOT NULL UNIQUE,
        FullName     NVARCHAR(100)    NOT NULL,
        Phone        NVARCHAR(20)     NOT NULL,
        Gender       NVARCHAR(10)     NOT NULL,
        Address      NVARCHAR(500)    NOT NULL,
        ReferralCode NVARCHAR(20)     NOT NULL UNIQUE,
        CreatedAt    DATETIME         NOT NULL,
        MustExist    BIT              NOT NULL
    );

    INSERT INTO @DemoUsers
        (UserNo, UserID, ProfileID, Email, FullName, Phone, Gender, Address, ReferralCode, CreatedAt, MustExist)
    VALUES
        -- 13 owner accounts already present in the supplied database export.
        ( 1, '77777777-2026-1000-0000-000000000001', '77777777-2026-1100-0000-000000000001', N'demo.hcm.ngocan@petomi.test',    N'Nguyễn Ngọc An',  N'0909004701', N'Female', N'Bình Thạnh, TP. Hồ Chí Minh', N'HCMAN4701',    '2025-12-30T07:04:09', 1),
        ( 2, '77777777-2026-1000-0000-000000000002', '77777777-2026-1100-0000-000000000002', N'demo.hcm.minhbao@petomi.test',   N'Trần Minh Bảo',   N'0909004702', N'Male',   N'Quận 5, TP. Hồ Chí Minh',     N'HCMBAO4702',   '2026-01-24T07:04:09', 1),
        ( 3, '77777777-2026-1000-0000-000000000003', '77777777-2026-1100-0000-000000000003', N'demo.hcm.thuychi@petomi.test',   N'Lê Thùy Chi',     N'0918004703', N'Female', N'Thủ Đức, TP. Hồ Chí Minh',    N'HCMCHI4703',   '2026-02-18T07:04:09', 1),
        ( 4, '77777777-2026-1000-0000-000000000004', '77777777-2026-1100-0000-000000000004', N'demo.hcm.quocduy@petomi.test',   N'Phạm Quốc Duy',   N'0918004704', N'Male',   N'Quận 4, TP. Hồ Chí Minh',     N'HCMDUY4704',   '2026-03-08T07:04:09', 1),
        ( 5, '77777777-2026-1000-0000-000000000005', '77777777-2026-1100-0000-000000000005', N'demo.hcm.hagiang@petomi.test',   N'Võ Hà Giang',     N'0938004705', N'Female', N'Quận 3, TP. Hồ Chí Minh',     N'HCMGIANG4705', '2026-03-30T07:04:09', 1),
        ( 6, '77777777-2026-1000-0000-000000000006', '77777777-2026-1100-0000-000000000006', N'demo.hcm.minhha@petomi.test',    N'Đỗ Minh Hà',      N'0938004706', N'Male',   N'Tân Phú, TP. Hồ Chí Minh',    N'HCMHA4706',    '2026-04-14T07:04:09', 1),
        ( 7, '77777777-2026-1000-0000-000000000007', '77777777-2026-1100-0000-000000000007', N'demo.hcm.giakhanh@petomi.test',  N'Bùi Gia Khánh',   N'0967004707', N'Male',   N'Gò Vấp, TP. Hồ Chí Minh',     N'HCMKHANH4707', '2026-04-27T07:04:09', 1),
        ( 8, '77777777-2026-1000-0000-000000000008', '77777777-2026-1100-0000-000000000008', N'demo.hcm.mylinh@petomi.test',    N'Hoàng Mỹ Linh',   N'0967004708', N'Female', N'Quận 12, TP. Hồ Chí Minh',    N'HCMLINH4708',  '2026-05-11T07:04:09', 1),
        ( 9, '77777777-2026-1000-0000-000000000009', '77777777-2026-1100-0000-000000000009', N'demo.hcm.hoangnam@petomi.test',  N'Đặng Hoàng Nam',  N'0975004709', N'Male',   N'Bình Chánh, TP. Hồ Chí Minh', N'HCMNAM4709',   '2026-05-25T07:04:09', 1),
        (10, '77777777-2026-1000-0000-000000000010', '77777777-2026-1100-0000-000000000010', N'demo.hcm.thanhthao@petomi.test', N'Huỳnh Thanh Thảo',N'0975004710', N'Female', N'Phú Nhuận, TP. Hồ Chí Minh',  N'HCMTHAO4710',  '2026-06-10T07:04:09', 1),
        (11, '44444444-2026-1000-0000-000000000011', '44444444-2026-1100-0000-000000000011', N'demo.owner.mai@petomi.test',     N'Mai Nguyễn',      N'0902000011', N'Female', N'Quận 1, TP. Hồ Chí Minh',     N'OC3OWN5111',   '2026-05-07T12:30:06', 1),
        (12, '44444444-2026-1000-0000-000000000012', '44444444-2026-1100-0000-000000000012', N'demo.owner.anh@petomi.test',     N'Anh Võ',          N'0902000012', N'Male',   N'Quận 3, TP. Hồ Chí Minh',     N'OC3OWN5112',   '2026-05-07T12:30:06', 1),
        (13, '44444444-2026-1000-0000-000000000013', '44444444-2026-1100-0000-000000000013', N'demo.owner.quyen@petomi.test',   N'Quyên Trần',      N'0902000013', N'Female', N'Bình Thạnh, TP. Hồ Chí Minh', N'OC3OWN5113',   '2026-05-07T12:30:06', 1),

        -- Seven additional .test owners bring the isolated demo cohort to 20.
        (14, '88880000-2026-1000-0000-000000000014', '88880000-2026-1100-0000-000000000014', N'demo.oc3.namkhanh@petomi.test',  N'Phạm Nam Khánh',  N'0907005114', N'Male',   N'Nhà Bè, TP. Hồ Chí Minh',     N'OC3JUL5114',   '2026-06-24T17:05:00', 0),
        (15, '88880000-2026-1000-0000-000000000015', '88880000-2026-1100-0000-000000000015', N'demo.oc3.haivan@petomi.test',    N'Võ Hải Vân',      N'0907005115', N'Female', N'Hóc Môn, TP. Hồ Chí Minh',    N'OC3JUL5115',   '2026-06-25T10:48:00', 0),
        (16, '88880000-2026-1000-0000-000000000016', '88880000-2026-1100-0000-000000000016', N'demo.oc3.trungnghia@petomi.test',N'Đỗ Trung Nghĩa',  N'0907005116', N'Male',   N'Củ Chi, TP. Hồ Chí Minh',     N'OC3JUL5116',   '2026-06-26T13:22:00', 0),
        (17, '88880000-2026-1000-0000-000000000017', '88880000-2026-1100-0000-000000000017', N'demo.oc3.tuongvy@petomi.test',   N'Bùi Tường Vy',    N'0907005117', N'Female', N'Quận 1, TP. Hồ Chí Minh',     N'OC3JUL5117',   '2026-06-27T08:06:00', 0),
        (18, '88880000-2026-1000-0000-000000000018', '88880000-2026-1100-0000-000000000018', N'demo.oc3.baolong@petomi.test',   N'Hoàng Bảo Long',  N'0907005118', N'Male',   N'Quận 11, TP. Hồ Chí Minh',    N'OC3JUL5118',   '2026-06-28T16:44:00', 0),
        (19, '88880000-2026-1000-0000-000000000019', '88880000-2026-1100-0000-000000000019', N'demo.oc3.phuongthao@petomi.test',N'Đặng Phương Thảo',N'0907005119', N'Female', N'Quận 5, TP. Hồ Chí Minh',     N'OC3JUL5119',   '2026-06-29T11:29:00', 0),
        (20, '88880000-2026-1000-0000-000000000020', '88880000-2026-1100-0000-000000000020', N'demo.oc3.kiencuong@petomi.test', N'Huỳnh Kiên Cường',N'0907005120', N'Male',   N'Quận 2, TP. Hồ Chí Minh',     N'OC3JUL5120',   '2026-06-30T19:02:00', 0);

    IF EXISTS
    (
        SELECT 1
        FROM dbo.Users existing
        INNER JOIN @DemoUsers demo
            ON existing.NormalizedEmail = LOWER(demo.Email)
        WHERE existing.UserID <> demo.UserID
    )
        THROW 50514, 'A demo e-mail conflicts with a non-demo or different account.', 1;

    IF EXISTS
    (
        SELECT 1
        FROM dbo.Users existing
        INNER JOIN @DemoUsers demo ON existing.UserID = demo.UserID
        WHERE existing.NormalizedEmail <> LOWER(demo.Email)
    )
        THROW 50515, 'A demo UserID conflicts with a non-demo or different account.', 1;

    IF EXISTS
    (
        SELECT 1
        FROM @DemoUsers demo
        WHERE demo.MustExist = 1
          AND NOT EXISTS
          (
              SELECT 1
              FROM dbo.Users existing
              WHERE existing.UserID = demo.UserID
                AND existing.NormalizedEmail = LOWER(demo.Email)
          )
    )
        THROW 50517, 'Expected demo owners are missing. Run seeds 034 and 047 first.', 1;

    MERGE dbo.Users WITH (HOLDLOCK) AS target
    USING @DemoUsers AS source
       ON target.UserID = source.UserID
    WHEN MATCHED THEN
        UPDATE SET
            IsSynthetic = 1
    WHEN NOT MATCHED AND source.MustExist = 0 THEN
        INSERT
        (
            UserID, Email, NormalizedEmail, PasswordHash, EmailVerified,
            FailedLoginAttempts, LockoutUntil, CreatedAt, UpdatedAt,
            LastLoginAt, DeletedAt, IsActive, IsProfileCompleted,
            ReferralCode, IsSynthetic
        )
        VALUES
        (
            source.UserID, source.Email, LOWER(source.Email), @PasswordHash, 1,
            0, NULL, source.CreatedAt, '2026-07-31T23:00:00',
            DATEADD(MINUTE, source.UserNo * 7, CAST('2026-07-31T17:00:00' AS DATETIME)),
            NULL, 1, 1, source.ReferralCode, 1
        );

    MERGE dbo.UserProfiles WITH (HOLDLOCK) AS target
    USING (SELECT * FROM @DemoUsers WHERE MustExist = 0) AS source
       ON target.UserID = source.UserID
    WHEN MATCHED THEN
        UPDATE SET
            FullName = source.FullName,
            Phone = source.Phone,
            Gender = source.Gender,
            Address = source.Address,
            UpdatedAt = '2026-07-31T23:00:00'
    WHEN NOT MATCHED THEN
        INSERT
        (
            ProfileID, UserID, FullName, Phone, AvatarURL, DateOfBirth,
            Gender, Address, CreatedAt, UpdatedAt
        )
        VALUES
        (
            source.ProfileID, source.UserID, source.FullName, source.Phone,
            N'https://placehold.co/256x256/png?text=OC3+DEMO',
            DATEADD(YEAR, -(22 + source.UserNo % 14), CAST('2026-01-01' AS DATE)),
            source.Gender, source.Address, source.CreatedAt, '2026-07-31T23:00:00'
        );

    MERGE dbo.UserRoles WITH (HOLDLOCK) AS target
    USING
    (
        SELECT
            CONVERT(UNIQUEIDENTIFIER,
                CONCAT('88880000-2026-1200-0000-', FORMAT(UserNo, '000000000000'))) AS UserRoleID,
            UserID,
            @OwnerRoleID AS RoleID
        FROM @DemoUsers
    ) AS source
       ON target.UserID = source.UserID AND target.RoleID = source.RoleID
    WHEN NOT MATCHED THEN
        INSERT (UserRoleID, UserID, RoleID)
        VALUES (source.UserRoleID, source.UserID, source.RoleID);

    DECLARE @DemoPets TABLE
    (
        UserNo       INT              NOT NULL PRIMARY KEY,
        PetID        UNIQUEIDENTIFIER NOT NULL UNIQUE,
        OwnerUserID  UNIQUEIDENTIFIER NOT NULL,
        PublicPetCode NVARCHAR(20)    NOT NULL UNIQUE,
        Name          NVARCHAR(100)   NOT NULL,
        Species       NVARCHAR(50)    NOT NULL,
        Breed         NVARCHAR(100)   NOT NULL,
        Gender        NVARCHAR(20)    NOT NULL,
        DateOfBirth   DATE            NOT NULL,
        CreatedAt     DATETIME        NOT NULL
    );

    INSERT INTO @DemoPets
    SELECT
        demo.UserNo,
        CONVERT(UNIQUEIDENTIFIER,
            CONCAT('88880000-2026-2000-0000-', FORMAT(demo.UserNo, '000000000000'))),
        demo.UserID,
        CONCAT(N'OC3-26-', FORMAT(demo.UserNo, '000')),
        CASE (demo.UserNo - 1) % 10
            WHEN 0 THEN N'Bơ' WHEN 1 THEN N'Milo' WHEN 2 THEN N'Mướp' WHEN 3 THEN N'Bông'
            WHEN 4 THEN N'Đậu' WHEN 5 THEN N'Kem' WHEN 6 THEN N'Lu' WHEN 7 THEN N'Miu'
            WHEN 8 THEN N'Vàng' ELSE N'Sữa' END,
        CASE WHEN demo.UserNo % 3 = 0 THEN N'Cat' ELSE N'Dog' END,
        CASE
            WHEN demo.UserNo % 3 = 0 THEN N'Mèo ta'
            WHEN demo.UserNo % 4 = 0 THEN N'Poodle'
            WHEN demo.UserNo % 4 = 1 THEN N'Corgi'
            WHEN demo.UserNo % 4 = 2 THEN N'Phốc sóc'
            ELSE N'Chó ta' END,
        CASE WHEN demo.UserNo % 2 = 0 THEN N'Male' ELSE N'Female' END,
        DATEADD(MONTH, -(8 + demo.UserNo * 2), CAST('2026-07-01' AS DATE)),
        DATEADD(MINUTE, 8 * demo.UserNo,
            DATEADD(DAY, (demo.UserNo - 1) % 10, CAST('2026-07-01T07:00:00' AS DATETIME)))
    FROM @DemoUsers demo;

    IF EXISTS
    (
        SELECT 1
        FROM dbo.Pets existing
        INNER JOIN @DemoPets demo ON existing.PublicPetCode = demo.PublicPetCode
        WHERE existing.PetID <> demo.PetID
    )
        THROW 50516, 'A synthetic pet code is already used by another pet.', 1;

    MERGE dbo.Pets WITH (HOLDLOCK) AS target
    USING @DemoPets AS source
       ON target.PetID = source.PetID
    WHEN MATCHED THEN
        UPDATE SET
            OwnerUserID = source.OwnerUserID,
            PublicPetCode = source.PublicPetCode,
            Name = source.Name,
            Species = source.Species,
            Breed = source.Breed,
            Gender = source.Gender,
            DateOfBirth = source.DateOfBirth,
            IsBirthDateEstimated = 0,
            AvatarURL = N'https://placehold.co/512x512/png?text=OC3+PET',
            IsActive = 1,
            DeletedAt = NULL,
            CreatedAt = source.CreatedAt,
            UpdatedAt = '2026-07-31T23:00:00'
    WHEN NOT MATCHED THEN
        INSERT
        (
            PetID, OwnerUserID, PublicPetCode, Name, Species, Breed, Gender,
            DateOfBirth, IsBirthDateEstimated, AvatarURL, IsActive,
            DeletedAt, CreatedAt, UpdatedAt
        )
        VALUES
        (
            source.PetID, source.OwnerUserID, source.PublicPetCode, source.Name,
            source.Species, source.Breed, source.Gender, source.DateOfBirth, 0,
            N'https://placehold.co/512x512/png?text=OC3+PET', 1,
            NULL, source.CreatedAt, '2026-07-31T23:00:00'
        );

    DECLARE @Days TABLE (DayNo INT NOT NULL PRIMARY KEY, ActivityDate DATE NOT NULL);
    INSERT INTO @Days (DayNo, ActivityDate)
    SELECT value, DATEADD(DAY, value - 1, CAST('2026-07-01' AS DATE))
    FROM (VALUES
        (1),(2),(3),(4),(5),(6),(7),(8),(9),(10),
        (11),(12),(13),(14),(15),(16),(17),(18),(19),(20),
        (21),(22),(23),(24),(25),(26),(27),(28),(29),(30),(31)
    ) AS days(value);

    DECLARE @Activity TABLE
    (
        UserNo        INT              NOT NULL,
        UserID        UNIQUEIDENTIFIER NOT NULL,
        PetID         UNIQUEIDENTIFIER NOT NULL,
        DayNo         INT              NOT NULL,
        ActivityAt    DATETIME2        NOT NULL,
        ConversationID UNIQUEIDENTIFIER NOT NULL,
        Intent        NVARCHAR(50)     NOT NULL,
        PRIMARY KEY (UserNo, DayNo)
    );

    INSERT INTO @Activity
        (UserNo, UserID, PetID, DayNo, ActivityAt, ConversationID, Intent)
    SELECT
        users.UserNo,
        users.UserID,
        pets.PetID,
        days.DayNo,
        DATEADD(MINUTE, 390 + ((users.UserNo * 37 + days.DayNo * 13) % 780),
            CAST(days.ActivityDate AS DATETIME2)),
        CONVERT(UNIQUEIDENTIFIER,
            CONCAT('88880000-2026-3000-', FORMAT(users.UserNo, '0000'), '-', FORMAT(days.DayNo, '000000000000'))),
        CASE (users.UserNo + days.DayNo) % 6
            WHEN 0 THEN N'nutrition'
            WHEN 1 THEN N'vaccine'
            WHEN 2 THEN N'symptom'
            WHEN 3 THEN N'grooming'
            WHEN 4 THEN N'behavior'
            ELSE N'general'
        END
    FROM @DemoUsers users
    CROSS JOIN @Days days
    INNER JOIN @DemoPets pets ON pets.UserNo = users.UserNo
    WHERE (users.UserNo + days.DayNo) % 3 <> 0;

    MERGE dbo.Conversations WITH (HOLDLOCK) AS target
    USING @Activity AS source
       ON target.ConversationID = source.ConversationID
    WHEN MATCHED THEN
        UPDATE SET
            UserID = source.UserID,
            PetID = source.PetID,
            Title = CONCAT(N'[DEMO] Chăm sóc thú cưng - ', CONVERT(NVARCHAR(10), source.ActivityAt, 23)),
            IsActive = 1,
            CreatedAt = source.ActivityAt,
            UpdatedAt = DATEADD(MINUTE, 3, source.ActivityAt),
            DeletedAt = NULL
    WHEN NOT MATCHED THEN
        INSERT
            (ConversationID, UserID, PetID, Title, IsActive, CreatedAt, UpdatedAt, DeletedAt)
        VALUES
            (source.ConversationID, source.UserID, source.PetID,
             CONCAT(N'[DEMO] Chăm sóc thú cưng - ', CONVERT(NVARCHAR(10), source.ActivityAt, 23)),
             1, source.ActivityAt, DATEADD(MINUTE, 3, source.ActivityAt), NULL);

    MERGE dbo.Messages WITH (HOLDLOCK) AS target
    USING
    (
        SELECT
            CONVERT(UNIQUEIDENTIFIER,
                CONCAT('88880000-2026-4000-', FORMAT(activity.UserNo, '0000'), '-', FORMAT(activity.DayNo, '000000000000'))) AS MessageID,
            activity.ConversationID,
            N'user' AS SenderRole,
            N'completed' AS Status,
            CASE activity.Intent
                WHEN N'nutrition' THEN CONCAT(N'Hôm nay bé ', pets.Name, N' nên ăn lượng thức ăn bao nhiêu?')
                WHEN N'vaccine' THEN CONCAT(N'Bé ', pets.Name, N' cần theo dõi lịch tiêm phòng thế nào?')
                WHEN N'symptom' THEN CONCAT(N'Bé ', pets.Name, N' hơi biếng ăn, mình nên theo dõi dấu hiệu nào?')
                WHEN N'grooming' THEN CONCAT(N'Bao lâu mình nên vệ sinh tai và chải lông cho ', pets.Name, N'?')
                WHEN N'behavior' THEN CONCAT(N'Làm sao giúp ', pets.Name, N' bớt lo khi ở nhà một mình?')
                ELSE CONCAT(N'Mình muốn ghi lại tình trạng hằng ngày của bé ', pets.Name, N'.')
            END AS Content,
            activity.Intent,
            N'normal' AS UrgencyLevel,
            N'monitor' AS VetRecommendation,
            CAST(0 AS BIT) AS RagUsed,
            0 AS ChunksUsed,
            CAST(NULL AS NVARCHAR(100)) AS Model,
            CAST(NULL AS NVARCHAR(MAX)) AS SourcesJson,
            0 AS TokensInput,
            0 AS TokensOutput,
            activity.ActivityAt AS CreatedAt
        FROM @Activity activity
        INNER JOIN @DemoPets pets ON pets.UserNo = activity.UserNo

        UNION ALL

        SELECT
            CONVERT(UNIQUEIDENTIFIER,
                CONCAT('88880000-2026-4100-', FORMAT(activity.UserNo, '0000'), '-', FORMAT(activity.DayNo, '000000000000'))) AS MessageID,
            activity.ConversationID,
            N'assistant' AS SenderRole,
            N'completed' AS Status,
            CASE activity.Intent
                WHEN N'nutrition' THEN N'[DEMO] Khẩu phần nên dựa trên cân nặng, tuổi và mức vận động; hãy theo dõi cân nặng mỗi tuần.'
                WHEN N'vaccine' THEN N'[DEMO] Bạn nên lưu ngày tiêm gần nhất và tạo nhắc lịch cho mũi tiếp theo theo hướng dẫn của bác sĩ thú y.'
                WHEN N'symptom' THEN N'[DEMO] Theo dõi nước uống, mức vận động và thời gian biếng ăn; đi khám nếu triệu chứng kéo dài hoặc nặng lên.'
                WHEN N'grooming' THEN N'[DEMO] Chải lông đều, kiểm tra tai mỗi tuần và chỉ vệ sinh bằng sản phẩm phù hợp cho thú cưng.'
                WHEN N'behavior' THEN N'[DEMO] Tập rời nhà theo khoảng thời gian ngắn, chuẩn bị đồ chơi và giữ lịch sinh hoạt ổn định.'
                ELSE N'[DEMO] Bạn có thể dùng ghi chú sức khỏe và nhắc lịch để theo dõi thay đổi hằng ngày.'
            END AS Content,
            activity.Intent,
            N'normal' AS UrgencyLevel,
            N'monitor' AS VetRecommendation,
            CAST(0 AS BIT) AS RagUsed,
            0 AS ChunksUsed,
            N'demo-synthetic' AS Model,
            N'[]' AS SourcesJson,
            180 + (activity.UserNo * 3) AS TokensInput,
            95 + activity.DayNo AS TokensOutput,
            DATEADD(MINUTE, 2, activity.ActivityAt) AS CreatedAt
        FROM @Activity activity
    ) AS source
       ON target.MessageID = source.MessageID
    WHEN MATCHED THEN
        UPDATE SET
            ConversationID = source.ConversationID,
            SenderRole = source.SenderRole,
            Status = source.Status,
            Content = source.Content,
            Intent = source.Intent,
            UrgencyLevel = source.UrgencyLevel,
            VetRecommendation = source.VetRecommendation,
            RagUsed = source.RagUsed,
            ChunksUsed = source.ChunksUsed,
            Model = source.Model,
            SourcesJson = source.SourcesJson,
            TokensInput = source.TokensInput,
            TokensOutput = source.TokensOutput,
            CreatedAt = source.CreatedAt,
            DeletedAt = NULL,
            IsActive = 1
    WHEN NOT MATCHED THEN
        INSERT
        (
            MessageID, ConversationID, SenderRole, Status, Content, Intent,
            UrgencyLevel, VetRecommendation, RagUsed, ChunksUsed, Model,
            SourcesJson, TokensInput, TokensOutput, CreatedAt, DeletedAt, IsActive
        )
        VALUES
        (
            source.MessageID, source.ConversationID, source.SenderRole, source.Status,
            source.Content, source.Intent, source.UrgencyLevel, source.VetRecommendation,
            source.RagUsed, source.ChunksUsed, source.Model, source.SourcesJson,
            source.TokensInput, source.TokensOutput, source.CreatedAt, NULL, 1
        );

    -- Roughly 20% of active days contain a natural follow-up exchange in
    -- the same conversation. This makes the demo less mechanically uniform.
    MERGE dbo.Messages WITH (HOLDLOCK) AS target
    USING
    (
        SELECT
            CONVERT(UNIQUEIDENTIFIER,
                CONCAT('88880000-2026-4200-', FORMAT(activity.UserNo, '0000'), '-', FORMAT(activity.DayNo, '000000000000'))) AS MessageID,
            activity.ConversationID,
            N'user' AS SenderRole,
            N'completed' AS Status,
            CASE activity.Intent
                WHEN N'vaccine' THEN N'Mình nên ghi lại những thông tin nào sau mỗi lần tiêm?'
                WHEN N'symptom' THEN N'Nếu bé đỡ hơn trong ngày thì mình tiếp tục theo dõi thế nào?'
                WHEN N'nutrition' THEN N'Mình có cần ghi lại khẩu phần và cân nặng mỗi tuần không?'
                ELSE N'Mình muốn tạo thêm một ghi chú để tiện theo dõi lâu dài.'
            END AS Content,
            activity.Intent,
            N'normal' AS UrgencyLevel,
            N'monitor' AS VetRecommendation,
            CAST(0 AS BIT) AS RagUsed,
            0 AS ChunksUsed,
            CAST(NULL AS NVARCHAR(100)) AS Model,
            CAST(NULL AS NVARCHAR(MAX)) AS SourcesJson,
            0 AS TokensInput,
            0 AS TokensOutput,
            DATEADD(MINUTE, 5, activity.ActivityAt) AS CreatedAt
        FROM @Activity activity
        WHERE (activity.UserNo + activity.DayNo) % 5 = 0

        UNION ALL

        SELECT
            CONVERT(UNIQUEIDENTIFIER,
                CONCAT('88880000-2026-4300-', FORMAT(activity.UserNo, '0000'), '-', FORMAT(activity.DayNo, '000000000000'))) AS MessageID,
            activity.ConversationID,
            N'assistant' AS SenderRole,
            N'completed' AS Status,
            CASE activity.Intent
                WHEN N'vaccine' THEN N'[DEMO] Hãy ghi ngày tiêm, tên vaccine, phản ứng sau tiêm và ngày dự kiến nhắc lại.'
                WHEN N'symptom' THEN N'[DEMO] Ghi thời điểm, mức ăn uống, vận động và triệu chứng; đi khám nếu dấu hiệu tái diễn hoặc nặng lên.'
                WHEN N'nutrition' THEN N'[DEMO] Có. Nhật ký khẩu phần và cân nặng hằng tuần giúp bạn nhận ra thay đổi sớm hơn.'
                ELSE N'[DEMO] Bạn có thể lưu ghi chú ngắn, ảnh và tạo nhắc lịch để duy trì việc theo dõi.'
            END AS Content,
            activity.Intent,
            N'normal' AS UrgencyLevel,
            N'monitor' AS VetRecommendation,
            CAST(0 AS BIT) AS RagUsed,
            0 AS ChunksUsed,
            N'demo-synthetic' AS Model,
            N'[]' AS SourcesJson,
            120 + activity.UserNo AS TokensInput,
            55 + activity.DayNo AS TokensOutput,
            DATEADD(MINUTE, 7, activity.ActivityAt) AS CreatedAt
        FROM @Activity activity
        WHERE (activity.UserNo + activity.DayNo) % 5 = 0
    ) AS source
       ON target.MessageID = source.MessageID
    WHEN MATCHED THEN
        UPDATE SET
            ConversationID = source.ConversationID,
            SenderRole = source.SenderRole,
            Status = source.Status,
            Content = source.Content,
            Intent = source.Intent,
            UrgencyLevel = source.UrgencyLevel,
            VetRecommendation = source.VetRecommendation,
            RagUsed = source.RagUsed,
            ChunksUsed = source.ChunksUsed,
            Model = source.Model,
            SourcesJson = source.SourcesJson,
            TokensInput = source.TokensInput,
            TokensOutput = source.TokensOutput,
            CreatedAt = source.CreatedAt,
            DeletedAt = NULL,
            IsActive = 1
    WHEN NOT MATCHED THEN
        INSERT
        (
            MessageID, ConversationID, SenderRole, Status, Content, Intent,
            UrgencyLevel, VetRecommendation, RagUsed, ChunksUsed, Model,
            SourcesJson, TokensInput, TokensOutput, CreatedAt, DeletedAt, IsActive
        )
        VALUES
        (
            source.MessageID, source.ConversationID, source.SenderRole, source.Status,
            source.Content, source.Intent, source.UrgencyLevel, source.VetRecommendation,
            source.RagUsed, source.ChunksUsed, source.Model, source.SourcesJson,
            source.TokensInput, source.TokensOutput, source.CreatedAt, NULL, 1
        );

    MERGE dbo.UserSessions WITH (HOLDLOCK) AS target
    USING
    (
        SELECT
            CONVERT(UNIQUEIDENTIFIER,
                CONCAT('88880000-2026-7000-', FORMAT(UserNo, '0000'), '-', FORMAT(DayNo, '000000000000'))) AS SessionID,
            UserID,
            DATEADD(MINUTE, -4, ActivityAt) AS CreatedAt,
            DATEADD(MINUTE, 8 + ((UserNo + DayNo) % 19), ActivityAt) AS LogoutAt
        FROM @Activity
    ) AS source
       ON target.SessionID = source.SessionID
    WHEN MATCHED THEN
        UPDATE SET
            UserID = source.UserID,
            RefreshTokenID = NULL,
            DeviceID = NULL,
            AccessTokenJTI = CONCAT(N'synthetic-oc3-', CONVERT(NVARCHAR(36), source.SessionID)),
            IPAddress = N'192.0.2.51',
            UserAgent = N'PetOmi Synthetic Demo Seed/2026-07',
            IsActive = 0,
            LogoutAt = source.LogoutAt,
            LastActivityAt = source.LogoutAt,
            CreatedAt = source.CreatedAt,
            ActiveRole = N'Owner',
            ActiveClinicID = NULL
    WHEN NOT MATCHED THEN
        INSERT
        (
            SessionID, UserID, RefreshTokenID, DeviceID, AccessTokenJTI,
            IPAddress, UserAgent, IsActive, LogoutAt, LastActivityAt,
            CreatedAt, ActiveRole, ActiveClinicID
        )
        VALUES
        (
            source.SessionID, source.UserID, NULL, NULL,
            CONCAT(N'synthetic-oc3-', CONVERT(NVARCHAR(36), source.SessionID)),
            N'192.0.2.51', N'PetOmi Synthetic Demo Seed/2026-07', 0,
            source.LogoutAt, source.LogoutAt, source.CreatedAt, N'Owner', NULL
        );

    MERGE dbo.PetMedicalRecords WITH (HOLDLOCK) AS target
    USING
    (
        SELECT
            CONVERT(UNIQUEIDENTIFIER,
                CONCAT('88880000-2026-5000-0000-', FORMAT(pets.UserNo, '000000000000'))) AS MedicalRecordID,
            pets.PetID,
            CASE WHEN pets.UserNo % 4 = 0 THEN N'Medication' ELSE N'Vaccine' END AS RecordType,
            CASE WHEN pets.UserNo % 4 = 0
                THEN N'[DEMO] Ghi chú tẩy giun tại nhà'
                ELSE N'[DEMO] Ghi chú tiêm phòng gần nhất' END AS Title,
            CASE WHEN pets.UserNo % 4 = 0
                THEN N'[DỮ LIỆU DEMO] Chủ nuôi tự ghi nhận lịch tẩy giun để theo dõi.'
                ELSE N'[DỮ LIỆU DEMO] Chủ nuôi tự ghi nhận mũi tiêm gần nhất; chưa liên kết phòng khám.' END AS Description,
            DATEADD(DAY, 3 + ((pets.UserNo * 5) % 25), CAST('2026-07-01' AS DATE)) AS RecordDate,
            DATEADD(MINUTE, 15 + pets.UserNo,
                CAST(DATEADD(DAY, 3 + ((pets.UserNo * 5) % 25), CAST('2026-07-01' AS DATE)) AS DATETIME)) AS CreatedAt
        FROM @DemoPets pets
    ) AS source
       ON target.MedicalRecordID = source.MedicalRecordID
    WHEN MATCHED THEN
        UPDATE SET
            PetID = source.PetID,
            RecordType = source.RecordType,
            Title = source.Title,
            Description = source.Description,
            RecordDate = source.RecordDate,
            VetName = NULL,
            ClinicName = NULL,
            MedicationName = CASE WHEN source.RecordType = N'Medication' THEN N'Thuốc tẩy giun (demo)' ELSE NULL END,
            Dosage = CASE WHEN source.RecordType = N'Medication' THEN N'Theo cân nặng (demo)' ELSE NULL END,
            CreatedAt = source.CreatedAt,
            UpdatedAt = source.CreatedAt,
            DeletedAt = NULL,
            IsActive = 1
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
            source.Description, source.RecordDate, NULL, NULL,
            CASE WHEN source.RecordType = N'Medication' THEN N'Thuốc tẩy giun (demo)' ELSE NULL END,
            CASE WHEN source.RecordType = N'Medication' THEN N'Theo cân nặng (demo)' ELSE NULL END,
            NULL, NULL, NULL, source.CreatedAt, source.CreatedAt, NULL, 1
        );

    -- Ten owners add a second, lightweight at-home observation note.
    MERGE dbo.PetMedicalRecords WITH (HOLDLOCK) AS target
    USING
    (
        SELECT
            CONVERT(UNIQUEIDENTIFIER,
                CONCAT('88880000-2026-5100-0000-', FORMAT(pets.UserNo, '000000000000'))) AS MedicalRecordID,
            pets.PetID,
            CASE WHEN pets.UserNo % 4 = 1 THEN N'Allergy' ELSE N'Illness' END AS RecordType,
            CASE WHEN pets.UserNo % 4 = 1
                THEN N'[DEMO] Nhật ký theo dõi da và lông'
                ELSE N'[DEMO] Nhật ký ăn uống và vận động' END AS Title,
            N'[DỮ LIỆU DEMO] Ghi nhận ngắn tại nhà, chưa liên kết bác sĩ hoặc phòng khám.' AS Description,
            DATEADD(DAY, 8 + ((pets.UserNo * 4) % 20), CAST('2026-07-01' AS DATE)) AS RecordDate,
            DATEADD(MINUTE, 40 + pets.UserNo,
                CAST(DATEADD(DAY, 8 + ((pets.UserNo * 4) % 20), CAST('2026-07-01' AS DATE)) AS DATETIME)) AS CreatedAt
        FROM @DemoPets pets
        WHERE pets.UserNo % 2 = 1
    ) AS source
       ON target.MedicalRecordID = source.MedicalRecordID
    WHEN MATCHED THEN
        UPDATE SET
            PetID = source.PetID,
            RecordType = source.RecordType,
            Title = source.Title,
            Description = source.Description,
            RecordDate = source.RecordDate,
            VetName = NULL,
            ClinicName = NULL,
            MedicationName = NULL,
            Dosage = NULL,
            CreatedAt = source.CreatedAt,
            UpdatedAt = source.CreatedAt,
            DeletedAt = NULL,
            IsActive = 1
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
            source.Description, source.RecordDate, NULL, NULL, NULL, NULL,
            NULL, NULL, NULL, source.CreatedAt, source.CreatedAt, NULL, 1
        );

    MERGE dbo.Reminders WITH (HOLDLOCK) AS target
    USING
    (
        SELECT
            CONVERT(UNIQUEIDENTIFIER,
                CONCAT('88880000-2026-6000-0000-', FORMAT(pets.UserNo, '000000000000'))) AS ReminderID,
            pets.OwnerUserID AS UserID,
            pets.PetID,
            N'Vaccine' AS ReminderType,
            N'CustomReminder' AS EntityType,
            N'OWNER' AS SourceType,
            pets.OwnerUserID AS CreatedByUserID,
            CONCAT(N'[DEMO] Nhắc lịch vaccine cho ', pets.Name) AS Title,
            N'[DỮ LIỆU DEMO] Kiểm tra sổ tiêm và xác nhận lịch với bác sĩ thú y.' AS Message,
            DATEADD(DAY, 14 + (pets.UserNo % 14), CAST('2026-07-01T09:00:00' AS DATETIME2)) AS RemindAt,
            N'YEARLY' AS RepeatRule,
            N'Sent' AS Status,
            CAST(0 AS BIT) AS IsEnabled,
            DATEADD(MINUTE, 25 + pets.UserNo,
                CAST(DATEADD(DAY, (pets.UserNo - 1) % 10, CAST('2026-07-01' AS DATE)) AS DATETIME2)) AS CreatedAt
        FROM @DemoPets pets

        UNION ALL

        SELECT
            CONVERT(UNIQUEIDENTIFIER,
                CONCAT('88880000-2026-6100-0000-', FORMAT(pets.UserNo, '000000000000'))) AS ReminderID,
            pets.OwnerUserID,
            pets.PetID,
            CASE WHEN pets.UserNo % 2 = 0 THEN N'Deworming' ELSE N'WeightTracking' END,
            N'CustomReminder',
            N'OWNER',
            pets.OwnerUserID,
            CASE WHEN pets.UserNo % 2 = 0
                THEN CONCAT(N'[DEMO] Nhắc tẩy giun cho ', pets.Name)
                ELSE CONCAT(N'[DEMO] Cân và ghi nhận cho ', pets.Name) END,
            N'[DỮ LIỆU DEMO] Nhắc việc chăm sóc định kỳ do chủ nuôi tự tạo.',
            DATEADD(DAY, 16 + (pets.UserNo % 12), CAST('2026-07-01T19:30:00' AS DATETIME2)),
            CASE WHEN pets.UserNo % 2 = 0 THEN N'FREQ=MONTHLY;INTERVAL=3' ELSE N'MONTHLY' END,
            CASE WHEN pets.UserNo <= 10 THEN N'Sent' ELSE N'Completed' END,
            CAST(0 AS BIT),
            DATEADD(MINUTE, 45 + pets.UserNo,
                CAST(DATEADD(DAY, 2 + ((pets.UserNo * 2) % 10), CAST('2026-07-01' AS DATE)) AS DATETIME2))
        FROM @DemoPets pets
    ) AS source
       ON target.ReminderID = source.ReminderID
    WHEN MATCHED THEN
        UPDATE SET
            UserID = source.UserID,
            PetID = source.PetID,
            ReminderType = source.ReminderType,
            EntityType = source.EntityType,
            EntityID = NULL,
            SourceType = source.SourceType,
            CreatedByUserID = source.CreatedByUserID,
            Title = source.Title,
            Message = source.Message,
            RemindAt = source.RemindAt,
            RepeatRule = source.RepeatRule,
            RepeatUntil = NULL,
            Status = source.Status,
            IsEnabled = source.IsEnabled,
            SentAt = CASE WHEN source.Status = N'Sent' THEN source.RemindAt ELSE NULL END,
            DismissedAt = NULL,
            CreatedAt = source.CreatedAt,
            UpdatedAt = source.CreatedAt
    WHEN NOT MATCHED THEN
        INSERT
        (
            ReminderID, UserID, PetID, ReminderType, EntityType, EntityID,
            SourceType, CreatedByUserID, Title, Message, RemindAt, RepeatRule,
            RepeatUntil, Status, IsEnabled, SentAt, DismissedAt, CreatedAt, UpdatedAt
        )
        VALUES
        (
            source.ReminderID, source.UserID, source.PetID, source.ReminderType,
            source.EntityType, NULL, source.SourceType, source.CreatedByUserID,
            source.Title, source.Message, source.RemindAt, source.RepeatRule, NULL,
            source.Status, source.IsEnabled,
            CASE WHEN source.Status = N'Sent' THEN source.RemindAt ELSE NULL END,
            NULL, source.CreatedAt, source.CreatedAt
        );

    -- A third reminder mirrors normal recurring home-care usage. All seeded
    -- reminders are disabled historical records so no worker dispatches them.
    MERGE dbo.Reminders WITH (HOLDLOCK) AS target
    USING
    (
        SELECT
            CONVERT(UNIQUEIDENTIFIER,
                CONCAT('88880000-2026-6200-0000-', FORMAT(pets.UserNo, '000000000000'))) AS ReminderID,
            pets.OwnerUserID AS UserID,
            pets.PetID,
            CASE WHEN pets.UserNo % 2 = 0 THEN N'Grooming' ELSE N'Custom' END AS ReminderType,
            pets.OwnerUserID AS CreatedByUserID,
            CASE WHEN pets.UserNo % 2 = 0
                THEN CONCAT(N'[DEMO] Vệ sinh tai và chải lông cho ', pets.Name)
                ELSE CONCAT(N'[DEMO] Kiểm tra ăn uống hằng tuần của ', pets.Name) END AS Title,
            DATEADD(DAY, 18 + (pets.UserNo % 10), CAST('2026-07-01T18:15:00' AS DATETIME2)) AS RemindAt,
            DATEADD(MINUTE, 60 + pets.UserNo,
                CAST(DATEADD(DAY, 3 + (pets.UserNo % 8), CAST('2026-07-01' AS DATE)) AS DATETIME2)) AS CreatedAt
        FROM @DemoPets pets
    ) AS source
       ON target.ReminderID = source.ReminderID
    WHEN MATCHED THEN
        UPDATE SET
            UserID = source.UserID,
            PetID = source.PetID,
            ReminderType = source.ReminderType,
            EntityType = N'CustomReminder',
            EntityID = NULL,
            SourceType = N'OWNER',
            CreatedByUserID = source.CreatedByUserID,
            Title = source.Title,
            Message = N'[DỮ LIỆU DEMO] Nhắc chăm sóc tại nhà do chủ nuôi tự tạo.',
            RemindAt = source.RemindAt,
            RepeatRule = N'WEEKLY',
            RepeatUntil = NULL,
            Status = N'Completed',
            IsEnabled = 0,
            SentAt = source.RemindAt,
            DismissedAt = NULL,
            CreatedAt = source.CreatedAt,
            UpdatedAt = source.CreatedAt
    WHEN NOT MATCHED THEN
        INSERT
        (
            ReminderID, UserID, PetID, ReminderType, EntityType, EntityID,
            SourceType, CreatedByUserID, Title, Message, RemindAt, RepeatRule,
            RepeatUntil, Status, IsEnabled, SentAt, DismissedAt, CreatedAt, UpdatedAt
        )
        VALUES
        (
            source.ReminderID, source.UserID, source.PetID, source.ReminderType,
            N'CustomReminder', NULL, N'OWNER', source.CreatedByUserID,
            source.Title, N'[DỮ LIỆU DEMO] Nhắc chăm sóc tại nhà do chủ nuôi tự tạo.',
            source.RemindAt, N'WEEKLY', NULL, N'Completed', 0,
            source.RemindAt, NULL, source.CreatedAt, source.CreatedAt
        );

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;

-- Verification: all returned accounts must be explicitly synthetic.
SELECT
    COUNT(DISTINCT users.UserID) AS SyntheticUsers,
    COUNT(DISTINCT pets.PetID) AS Pets,
    COUNT(DISTINCT conversations.ConversationID) AS Conversations,
    COUNT(DISTINCT CASE WHEN messages.SenderRole = N'user' THEN messages.MessageID END) AS OwnerMessages,
    COUNT(DISTINCT CASE WHEN messages.SenderRole = N'assistant' THEN messages.MessageID END) AS AiResponses,
    COUNT(DISTINCT records.MedicalRecordID) AS MedicalNotes,
    COUNT(DISTINCT reminders.ReminderID) AS Reminders
FROM dbo.Users users
LEFT JOIN dbo.Pets pets ON pets.OwnerUserID = users.UserID
LEFT JOIN dbo.Conversations conversations ON conversations.UserID = users.UserID
LEFT JOIN dbo.Messages messages ON messages.ConversationID = conversations.ConversationID
LEFT JOIN dbo.PetMedicalRecords records ON records.PetID = pets.PetID
LEFT JOIN dbo.Reminders reminders ON reminders.UserID = users.UserID
WHERE users.IsSynthetic = 1
  AND users.UserID IN
  (
      SELECT UserID
      FROM dbo.Users
      WHERE UserID IN
      (
          '77777777-2026-1000-0000-000000000001','77777777-2026-1000-0000-000000000002',
          '77777777-2026-1000-0000-000000000003','77777777-2026-1000-0000-000000000004',
          '77777777-2026-1000-0000-000000000005','77777777-2026-1000-0000-000000000006',
          '77777777-2026-1000-0000-000000000007','77777777-2026-1000-0000-000000000008',
          '77777777-2026-1000-0000-000000000009','77777777-2026-1000-0000-000000000010',
          '44444444-2026-1000-0000-000000000011','44444444-2026-1000-0000-000000000012',
          '44444444-2026-1000-0000-000000000013',
          '88880000-2026-1000-0000-000000000014','88880000-2026-1000-0000-000000000015',
          '88880000-2026-1000-0000-000000000016','88880000-2026-1000-0000-000000000017',
          '88880000-2026-1000-0000-000000000018','88880000-2026-1000-0000-000000000019',
          '88880000-2026-1000-0000-000000000020'
      )
  );

SELECT
    CAST(sessions.CreatedAt AS DATE) AS ActivityDate,
    COUNT(DISTINCT sessions.UserID) AS DailyActiveSyntheticUsers
FROM dbo.UserSessions sessions
INNER JOIN dbo.Users users ON users.UserID = sessions.UserID
WHERE users.IsSynthetic = 1
  AND sessions.CreatedAt >= '2026-07-01'
  AND sessions.CreatedAt < '2026-08-01'
GROUP BY CAST(sessions.CreatedAt AS DATE)
ORDER BY ActivityDate;
