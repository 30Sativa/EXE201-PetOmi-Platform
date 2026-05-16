-- ===================================================================
-- PET ADVISOR AI - SEED DATA: DỮ LIỆU MẪU ĐỂ TEST
-- Chạy sau: 001 → 002 → 003 → 004 → 005
--
-- Tạo sẵn:
--   2 Owner accounts  (owner1@test.com / owner2@test.com)
--   1 Admin account   (admin@test.com)
--   5 Pets            (3 của owner1, 2 của owner2)
--
-- Mật khẩu tất cả accounts: Test@1234
-- BCrypt hash của "Test@1234": $2a$11$nBGBpelB7p.UPmKCN.4lf.1HoRXcKxY8WcagkBZs1gMORJHnhBi2
-- ===================================================================

USE PetOmni_DB;
GO

-- ===================================================================
-- PHẦN 1: TEST USERS
-- ===================================================================

-- Xóa dữ liệu cũ nếu chạy lại script (tránh lỗi UNIQUE constraint)
DELETE FROM Pets            WHERE OwnerUserID IN ('AAAA0001-0000-0000-0000-000000000001', 'AAAA0001-0000-0000-0000-000000000002');
DELETE FROM UserRoles       WHERE UserID IN ('AAAA0001-0000-0000-0000-000000000001', 'AAAA0001-0000-0000-0000-000000000002', 'AAAA0001-0000-0000-0000-000000000099');
DELETE FROM UserProfiles    WHERE UserID IN ('AAAA0001-0000-0000-0000-000000000001', 'AAAA0001-0000-0000-0000-000000000002', 'AAAA0001-0000-0000-0000-000000000099');
DELETE FROM Users           WHERE UserID IN ('AAAA0001-0000-0000-0000-000000000001', 'AAAA0001-0000-0000-0000-000000000002', 'AAAA0001-0000-0000-0000-000000000099');
GO

-- Tạo 3 users test
INSERT INTO Users (UserID, Email, NormalizedEmail, PasswordHash, EmailVerified, IsActive, CreatedAt) VALUES
    -- Chủ nuôi 1 — có 3 pets
    ('AAAA0001-0000-0000-0000-000000000001',
     'owner1@test.com', 'owner1@test.com',
     '$2a$11$nBGBpelB7p.UPmKCN.4lf.1HoRXcKxY8WcagkBZs1gMORJHnhBi2',
     1, 1, GETUTCDATE()),

    -- Chủ nuôi 2 — có 2 pets
    ('AAAA0001-0000-0000-0000-000000000002',
     'owner2@test.com', 'owner2@test.com',
     '$2a$11$nBGBpelB7p.UPmKCN.4lf.1HoRXcKxY8WcagkBZs1gMORJHnhBi2',
     1, 1, GETUTCDATE()),

    -- Admin
    ('AAAA0001-0000-0000-0000-000000000099',
     'admin@test.com', 'admin@test.com',
     '$2a$11$nBGBpelB7p.UPmKCN.4lf.1HoRXcKxY8WcagkBZs1gMORJHnhBi2',
     1, 1, GETUTCDATE());
GO

-- Tạo UserProfiles cho 3 users
INSERT INTO UserProfiles (UserID, FullName, Phone, CreatedAt) VALUES
    ('AAAA0001-0000-0000-0000-000000000001', N'Nguyễn Văn An',  '0901111111', GETUTCDATE()),
    ('AAAA0001-0000-0000-0000-000000000002', N'Trần Thị Bình',  '0902222222', GETUTCDATE()),
    ('AAAA0001-0000-0000-0000-000000000099', N'Admin PetOmi',   '0909999999', GETUTCDATE());
GO

-- Gán role: 2 Owner, 1 Admin
-- RoleID lấy từ seed 004: Owner = '11111111-0000-0000-0000-000000000001', Admin = '11111111-0000-0000-0000-000000000002'
INSERT INTO UserRoles (UserID, RoleID) VALUES
    ('AAAA0001-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001'), -- owner1 → Owner
    ('AAAA0001-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001'), -- owner2 → Owner
    ('AAAA0001-0000-0000-0000-000000000099', '11111111-0000-0000-0000-000000000002'); -- admin  → Admin
GO

-- ===================================================================
-- PHẦN 2: PETS (dữ liệu mẫu đa dạng để test các case)
-- ===================================================================

INSERT INTO Pets (PetID, OwnerUserID, Name, Species, Breed, Gender, IsNeutered,
                  DateOfBirth, IsBirthDateEstimated, AvatarURL, Color, IsActive, CreatedAt) VALUES

    -- ── Owner 1 có 3 pets ──────────────────────────────────────────

    -- Pet 1: Chó đầy đủ thông tin, ngày sinh chính xác
    ('BBBB0001-0000-0000-0000-000000000001',
     'AAAA0001-0000-0000-0000-000000000001',
     N'Milo',                   -- Tên
     'Dog',                     -- Loài
     N'Golden Retriever',       -- Giống
     'Male',                    -- Giới tính
     'Yes',                     -- Đã triệt sản
     '2021-03-15',              -- Ngày sinh chính xác
     0,                         -- IsBirthDateEstimated = false
     NULL,                      -- Chưa có ảnh
     N'Vàng ánh kim',           -- Màu lông
     1,                         -- IsActive
     GETUTCDATE()),

    -- Pet 2: Mèo, ngày sinh ước tính
    ('BBBB0001-0000-0000-0000-000000000002',
     'AAAA0001-0000-0000-0000-000000000001',
     N'Luna',
     'Cat',
     N'Mèo Ta',
     'Female',
     'No',
     '2022-06-01',              -- Ước tính tháng 6/2022
     1,                         -- IsBirthDateEstimated = true (chỉ nhớ khoảng)
     NULL,
     N'Trắng pha đen (tam thể)',
     1,
     GETUTCDATE()),

    -- Pet 3: Chó, không nhớ ngày sinh, chưa rõ giới tính
    ('BBBB0001-0000-0000-0000-000000000003',
     'AAAA0001-0000-0000-0000-000000000001',
     N'Bông',
     'Dog',
     N'Poodle',
     'Unknown',                 -- Chưa rõ giới tính
     'Unknown',                 -- Chưa rõ triệt sản
     NULL,                      -- Không nhớ ngày sinh
     0,
     NULL,
     N'Trắng xoăn',
     1,
     GETUTCDATE()),

    -- ── Owner 2 có 2 pets ──────────────────────────────────────────

    -- Pet 4: Mèo Ba Tư đầy đủ thông tin
    ('BBBB0001-0000-0000-0000-000000000004',
     'AAAA0001-0000-0000-0000-000000000002',
     N'Coco',
     'Cat',
     N'Ba Tư (Persian)',
     'Female',
     'Yes',
     '2020-11-20',
     0,
     NULL,
     N'Cam nhạt (cream)',
     1,
     GETUTCDATE()),

    -- Pet 5: Pet đã bị xóa mềm — để test soft delete
    ('BBBB0001-0000-0000-0000-000000000005',
     'AAAA0001-0000-0000-0000-000000000002',
     N'Rex',                    -- Pet đã xóa, không nên hiện trong list
     'Dog',
     N'Corgi',
     'Male',
     'No',
     '2019-05-10',
     0,
     NULL,
     N'Vàng nâu',
     0,                         -- IsActive = false (đã xóa mềm)
     DATEADD(DAY, -30, GETUTCDATE())); -- Tạo từ 30 ngày trước

-- Cập nhật DeletedAt cho pet đã xóa
UPDATE Pets
SET DeletedAt = DATEADD(DAY, -5, GETUTCDATE()),   -- Xóa cách đây 5 ngày
    UpdatedAt = DATEADD(DAY, -5, GETUTCDATE())
WHERE PetID = 'BBBB0001-0000-0000-0000-000000000005';
GO

-- ===================================================================
-- PHẦN 3: VERIFY — Chạy để kiểm tra dữ liệu đã seed đúng chưa
-- ===================================================================

-- Danh sách users test
SELECT
    u.Email,
    up.FullName,
    r.RoleName,
    u.EmailVerified,
    u.IsActive
FROM Users u
JOIN UserProfiles up ON u.UserID = up.UserID
JOIN UserRoles ur ON u.UserID = ur.UserID
JOIN Roles r ON ur.RoleID = r.RoleID
WHERE u.Email LIKE '%@test.com'
ORDER BY r.RoleName, u.Email;

-- Danh sách pets theo owner (chỉ active)
SELECT
    up.FullName     AS Owner,
    p.Name          AS PetName,
    p.Species,
    p.Breed,
    p.Gender,
    p.IsNeutered,
    p.DateOfBirth,
    p.IsBirthDateEstimated,
    p.IsActive
FROM Pets p
JOIN Users u ON p.OwnerUserID = u.UserID
JOIN UserProfiles up ON u.UserID = up.UserID
WHERE u.Email LIKE '%@test.com'
ORDER BY up.FullName, p.CreatedAt;

-- Tổng: active vs deleted
SELECT
    IsActive,
    COUNT(*) AS TotalPets
FROM Pets
GROUP BY IsActive;
GO
