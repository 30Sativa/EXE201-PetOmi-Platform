-- ===================================================================
-- SEED 043: Fake UserSessions for "Average Time on Web" demo
-- ===================================================================
-- Mục tiêu : Average Time on Web hiển thị ~2–3 phút trên Admin Dashboard
--
-- Cách tính của GetAverageSessionDurationMinutesAsync:
--   1. Lọc:  CreatedAt >= NOW() - 30 ngày  AND  ActiveRole = 'Owner'
--   2. Tính: DateDiffSecond(CreatedAt, LogoutAt ?? (IsActive ? NOW() : LastActivityAt))
--   3. Lọc:  seconds >= 0 AND seconds <= 480*60 (tối đa 8h)
--   4. AVG(seconds) / 60 → làm tròn 1 chữ số thập phân
--
-- Để đạt trung bình 2–3 phút  →  mỗi session kéo dài 120–200 giây
-- Script tạo 15 session đã kết thúc (LogoutAt có giá trị) cho 3 Owner demo
-- => AVG ≈ 2.5 phút ✓
-- ===================================================================
-- Phụ thuộc: 034_Seed_Demo_Clinic_Data.sql phải chạy trước
--            (tạo ra @OwnerMaiUserID, @OwnerAnhUserID, @OwnerQuyenUserID)
-- ===================================================================

USE PetOmni_DB;
GO

SET NOCOUNT ON;

DECLARE @Now DATETIME = GETUTCDATE();

-- UserID của 3 Owner demo (khớp với script 034)
DECLARE @OwnerMaiUserID   UNIQUEIDENTIFIER = '44444444-2026-1000-0000-000000000011';
DECLARE @OwnerAnhUserID   UNIQUEIDENTIFIER = '44444444-2026-1000-0000-000000000012';
DECLARE @OwnerQuyenUserID UNIQUEIDENTIFIER = '44444444-2026-1000-0000-000000000013';

-- ===================================================================
-- MERGE: idempotent – chạy lại không tạo trùng
-- Cột bắt buộc: SessionID, UserID, IsActive, LastActivityAt, CreatedAt
-- Cột quan trọng cho tính toán: ActiveRole, LogoutAt, CreatedAt
--
-- Phân phối thời gian session (seconds):
--   90, 120, 150, 180, 200  → AVG = 148s ≈ 2.5 phút
-- Trải đều 15 phiên trong 30 ngày gần nhất
-- ===================================================================

MERGE dbo.UserSessions AS target
USING (VALUES

    -- OwnerMai: 5 phiên, trải từ 25 ngày trước đến hôm nay
    ('55550000-0001-0000-0000-000000000001', @OwnerMaiUserID,
        DATEADD(SECOND, -90,  DATEADD(DAY, -25, @Now)),   -- CreatedAt
        DATEADD(DAY, -25, @Now),                           -- LogoutAt  (+90s)
        DATEADD(DAY, -25, @Now),                           -- LastActivityAt
        0),
    ('55550000-0001-0000-0000-000000000002', @OwnerMaiUserID,
        DATEADD(SECOND, -120, DATEADD(DAY, -18, @Now)),
        DATEADD(DAY, -18, @Now),
        DATEADD(DAY, -18, @Now),
        0),
    ('55550000-0001-0000-0000-000000000003', @OwnerMaiUserID,
        DATEADD(SECOND, -150, DATEADD(DAY, -12, @Now)),
        DATEADD(DAY, -12, @Now),
        DATEADD(DAY, -12, @Now),
        0),
    ('55550000-0001-0000-0000-000000000004', @OwnerMaiUserID,
        DATEADD(SECOND, -180, DATEADD(DAY, -6, @Now)),
        DATEADD(DAY, -6, @Now),
        DATEADD(DAY, -6, @Now),
        0),
    ('55550000-0001-0000-0000-000000000005', @OwnerMaiUserID,
        DATEADD(SECOND, -200, DATEADD(DAY, -1, @Now)),
        DATEADD(DAY, -1, @Now),
        DATEADD(DAY, -1, @Now),
        0),

    -- OwnerAnh: 5 phiên
    ('55550000-0002-0000-0000-000000000001', @OwnerAnhUserID,
        DATEADD(SECOND, -120, DATEADD(DAY, -28, @Now)),
        DATEADD(DAY, -28, @Now),
        DATEADD(DAY, -28, @Now),
        0),
    ('55550000-0002-0000-0000-000000000002', @OwnerAnhUserID,
        DATEADD(SECOND, -150, DATEADD(DAY, -20, @Now)),
        DATEADD(DAY, -20, @Now),
        DATEADD(DAY, -20, @Now),
        0),
    ('55550000-0002-0000-0000-000000000003', @OwnerAnhUserID,
        DATEADD(SECOND, -180, DATEADD(DAY, -14, @Now)),
        DATEADD(DAY, -14, @Now),
        DATEADD(DAY, -14, @Now),
        0),
    ('55550000-0002-0000-0000-000000000004', @OwnerAnhUserID,
        DATEADD(SECOND, -200, DATEADD(DAY, -8, @Now)),
        DATEADD(DAY, -8, @Now),
        DATEADD(DAY, -8, @Now),
        0),
    ('55550000-0002-0000-0000-000000000005', @OwnerAnhUserID,
        DATEADD(SECOND, -90,  DATEADD(DAY, -2, @Now)),
        DATEADD(DAY, -2, @Now),
        DATEADD(DAY, -2, @Now),
        0),

    -- OwnerQuyen: 5 phiên
    ('55550000-0003-0000-0000-000000000001', @OwnerQuyenUserID,
        DATEADD(SECOND, -200, DATEADD(DAY, -27, @Now)),
        DATEADD(DAY, -27, @Now),
        DATEADD(DAY, -27, @Now),
        0),
    ('55550000-0003-0000-0000-000000000002', @OwnerQuyenUserID,
        DATEADD(SECOND, -180, DATEADD(DAY, -19, @Now)),
        DATEADD(DAY, -19, @Now),
        DATEADD(DAY, -19, @Now),
        0),
    ('55550000-0003-0000-0000-000000000003', @OwnerQuyenUserID,
        DATEADD(SECOND, -120, DATEADD(DAY, -10, @Now)),
        DATEADD(DAY, -10, @Now),
        DATEADD(DAY, -10, @Now),
        0),
    ('55550000-0003-0000-0000-000000000004', @OwnerQuyenUserID,
        DATEADD(SECOND, -150, DATEADD(DAY, -5, @Now)),
        DATEADD(DAY, -5, @Now),
        DATEADD(DAY, -5, @Now),
        0),
    ('55550000-0003-0000-0000-000000000005', @OwnerQuyenUserID,
        DATEADD(SECOND, -90,  DATEADD(HOUR, -3, @Now)),
        DATEADD(HOUR, -3, @Now),
        DATEADD(HOUR, -3, @Now),
        0)

) AS src(
    SessionID,
    UserID,
    CreatedAt,
    LogoutAt,
    LastActivityAt,
    IsActive
)
ON target.SessionID = src.SessionID

WHEN MATCHED THEN
    UPDATE SET
        UserID         = src.UserID,
        CreatedAt      = src.CreatedAt,
        LogoutAt       = src.LogoutAt,
        LastActivityAt = src.LastActivityAt,
        IsActive       = src.IsActive,
        ActiveRole     = N'Owner'

WHEN NOT MATCHED THEN
    INSERT (
        SessionID,
        UserID,
        RefreshTokenID,
        DeviceID,
        AccessTokenJTI,
        IPAddress,
        UserAgent,
        IsActive,
        LogoutAt,
        LastActivityAt,
        CreatedAt,
        ActiveRole,
        ActiveClinicID
    )
    VALUES (
        src.SessionID,
        src.UserID,
        NULL,                           -- RefreshTokenID: không cần FK demo
        NULL,                           -- DeviceID: không cần FK demo
        N'demo-jti-' + CAST(src.SessionID AS NVARCHAR(36)),
        N'127.0.0.1',
        N'Demo/Seed Script',
        src.IsActive,
        src.LogoutAt,
        src.LastActivityAt,
        src.CreatedAt,
        N'Owner',                       -- ← khớp với filter trong GetAverageSessionDurationMinutesAsync
        NULL                            -- ActiveClinicID: null vì là Owner
    );

GO

-- ===================================================================
-- VERIFY: Kiểm tra kết quả sau seed
-- ===================================================================
-- Xem tất cả session vừa seed
SELECT
    SessionID,
    UserID,
    CreatedAt,
    LogoutAt,
    LastActivityAt,
    IsActive,
    ActiveRole,
    DATEDIFF(SECOND, CreatedAt, LogoutAt) AS DurationSeconds,
    CAST(DATEDIFF(SECOND, CreatedAt, LogoutAt) AS FLOAT) / 60.0 AS DurationMinutes
FROM dbo.UserSessions
WHERE SessionID IN (
    '55550000-0001-0000-0000-000000000001',
    '55550000-0001-0000-0000-000000000002',
    '55550000-0001-0000-0000-000000000003',
    '55550000-0001-0000-0000-000000000004',
    '55550000-0001-0000-0000-000000000005',
    '55550000-0002-0000-0000-000000000001',
    '55550000-0002-0000-0000-000000000002',
    '55550000-0002-0000-0000-000000000003',
    '55550000-0002-0000-0000-000000000004',
    '55550000-0002-0000-0000-000000000005',
    '55550000-0003-0000-0000-000000000001',
    '55550000-0003-0000-0000-000000000002',
    '55550000-0003-0000-0000-000000000003',
    '55550000-0003-0000-0000-000000000004',
    '55550000-0003-0000-0000-000000000005'
)
ORDER BY UserID, CreatedAt;

-- Mô phỏng đúng logic của GetAverageSessionDurationMinutesAsync
DECLARE @NowCheck DATETIME = GETUTCDATE();
DECLARE @WindowStart DATETIME = DATEADD(DAY, -30, @NowCheck);
DECLARE @MaxSessionSeconds INT = 480 * 60; -- 28800

SELECT
    COUNT(*)                                          AS TotalSessions,
    AVG(CAST(DurationSec AS FLOAT)) / 60.0           AS AvgMinutes_Float,
    ROUND(AVG(CAST(DurationSec AS FLOAT)) / 60.0, 1) AS AvgMinutes_Rounded
FROM (
    SELECT
        DATEDIFF(SECOND,
            s.CreatedAt,
            ISNULL(s.LogoutAt, CASE WHEN s.IsActive = 1 THEN @NowCheck ELSE s.LastActivityAt END)
        ) AS DurationSec
    FROM dbo.UserSessions s
    WHERE s.CreatedAt >= @WindowStart
      AND s.ActiveRole = N'Owner'
) t
WHERE DurationSec >= 0
  AND DurationSec <= @MaxSessionSeconds;

GO
