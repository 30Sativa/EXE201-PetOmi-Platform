-- =====================================================================
-- ROLLBACK 051: Remove only the OC3 July 2026 synthetic seed records.
--
-- This keeps the 13 pre-existing .test owners from seeds 034/047 and only
-- clears their IsSynthetic marker. The seven demo.oc3.* accounts created by
-- seed 051 are deleted after their seeded child records are removed.
--
-- Run only on the same local/demo/staging database used for seed 051.
-- Deliberately change @AllowSyntheticDemoRollback from 0 to 1 first.
-- =====================================================================

USE PetOmni_DB;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @AllowSyntheticDemoRollback BIT = 0;

IF @AllowSyntheticDemoRollback <> 1
BEGIN
    THROW 50520,
        'Safety stop: set @AllowSyntheticDemoRollback = 1 only on local/demo/staging.',
        1;
END;

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @ExistingOwners TABLE (UserID UNIQUEIDENTIFIER NOT NULL PRIMARY KEY);
    INSERT INTO @ExistingOwners (UserID)
    VALUES
        ('77777777-2026-1000-0000-000000000001'),
        ('77777777-2026-1000-0000-000000000002'),
        ('77777777-2026-1000-0000-000000000003'),
        ('77777777-2026-1000-0000-000000000004'),
        ('77777777-2026-1000-0000-000000000005'),
        ('77777777-2026-1000-0000-000000000006'),
        ('77777777-2026-1000-0000-000000000007'),
        ('77777777-2026-1000-0000-000000000008'),
        ('77777777-2026-1000-0000-000000000009'),
        ('77777777-2026-1000-0000-000000000010'),
        ('44444444-2026-1000-0000-000000000011'),
        ('44444444-2026-1000-0000-000000000012'),
        ('44444444-2026-1000-0000-000000000013');

    DECLARE @NewOwners TABLE (UserID UNIQUEIDENTIFIER NOT NULL PRIMARY KEY);
    INSERT INTO @NewOwners (UserID)
    VALUES
        ('88880000-2026-1000-0000-000000000014'),
        ('88880000-2026-1000-0000-000000000015'),
        ('88880000-2026-1000-0000-000000000016'),
        ('88880000-2026-1000-0000-000000000017'),
        ('88880000-2026-1000-0000-000000000018'),
        ('88880000-2026-1000-0000-000000000019'),
        ('88880000-2026-1000-0000-000000000020');

    DELETE message
    FROM dbo.Messages message
    WHERE CONVERT(CHAR(36), message.MessageID) LIKE '88880000-2026-4%';

    DELETE session
    FROM dbo.UserSessions session
    WHERE CONVERT(CHAR(36), session.SessionID) LIKE '88880000-2026-7000-%';

    DELETE reminder
    FROM dbo.Reminders reminder
    WHERE CONVERT(CHAR(36), reminder.ReminderID) LIKE '88880000-2026-6%';

    DELETE record
    FROM dbo.PetMedicalRecords record
    WHERE CONVERT(CHAR(36), record.MedicalRecordID) LIKE '88880000-2026-5%';

    DELETE conversation
    FROM dbo.Conversations conversation
    WHERE CONVERT(CHAR(36), conversation.ConversationID) LIKE '88880000-2026-3000-%';

    DELETE pet
    FROM dbo.Pets pet
    WHERE CONVERT(CHAR(36), pet.PetID) LIKE '88880000-2026-2000-%';

    DELETE userRole
    FROM dbo.UserRoles userRole
    INNER JOIN @NewOwners owner ON owner.UserID = userRole.UserID;

    DELETE profile
    FROM dbo.UserProfiles profile
    INNER JOIN @NewOwners owner ON owner.UserID = profile.UserID;

    DELETE account
    FROM dbo.Users account
    INNER JOIN @NewOwners owner ON owner.UserID = account.UserID
    WHERE account.IsSynthetic = 1
      AND account.NormalizedEmail LIKE N'demo.oc3.%@petomi.test';

    UPDATE account
    SET IsSynthetic = 0
    FROM dbo.Users account
    INNER JOIN @ExistingOwners owner ON owner.UserID = account.UserID
    WHERE account.IsSynthetic = 1
      AND account.NormalizedEmail LIKE N'demo.%@petomi.test';

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
