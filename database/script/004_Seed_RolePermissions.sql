-- ===================================================================
-- PET ADVISOR AI - SEED DATA: ROLES & PERMISSIONS
-- Chạy sau: 001_Init_AuthDatabase.sql + 003_Add_RoleContext_To_Sessions.sql
-- ===================================================================

USE PetOmni_DB;
GO

-- ===================================================================
-- PHẦN 1: GLOBAL ROLES (chỉ 2, không có Vet)
-- ===================================================================

INSERT INTO Roles (RoleID, RoleName) VALUES
    ('11111111-0000-0000-0000-000000000001', 'Owner'),  -- Chủ nuôi, auto gán khi đăng ký
    ('11111111-0000-0000-0000-000000000002', 'Admin');  -- Quản trị viên, gán thủ công
-- Bảng Permissions và RolePermissions (global) giữ trống ở giai đoạn này
-- Mở ra khi cần phân quyền Admin theo role con (support, moderator, finance...)

GO

-- ===================================================================
-- PHẦN 2: CLINIC-SCOPED PERMISSIONS
-- Dùng chung bảng Permissions, phân biệt bằng naming convention
-- ===================================================================

INSERT INTO Permissions (PermissionID, PermissionName, Description) VALUES
    -- Clinic management (chỉ ClinicOwner)
    ('22222222-0000-0000-0000-000000000001', 'clinic:manage-staff',  'Thêm/xóa/đổi role bác sĩ trong clinic'),
    ('22222222-0000-0000-0000-000000000002', 'clinic:edit-info',     'Sửa thông tin phòng khám'),
    ('22222222-0000-0000-0000-000000000003', 'clinic:view-reports',  'Xem báo cáo doanh thu, hiệu suất'),

    -- Appointment
    ('22222222-0000-0000-0000-000000000004', 'appointment:manage',   'Tạo/sửa/hủy lịch hẹn'),
    ('22222222-0000-0000-0000-000000000005', 'appointment:view',     'Xem lịch hẹn'),

    -- Medical record
    ('22222222-0000-0000-0000-000000000006', 'medical-record:write', 'Ghi kết quả khám, chẩn đoán'),
    ('22222222-0000-0000-0000-000000000007', 'medical-record:read',  'Xem hồ sơ bệnh nhân'),

    -- Prescription & Diagnosis
    ('22222222-0000-0000-0000-000000000008', 'prescription:create',  'Kê đơn thuốc'),
    ('22222222-0000-0000-0000-000000000009', 'diagnosis:create',     'Tạo chẩn đoán chính thức');

GO

-- ===================================================================
-- PHẦN 3: CLINIC-SCOPED ROLES
-- ===================================================================

INSERT INTO VetClinicRoles (RoleID, RoleName) VALUES
    ('33333333-0000-0000-0000-000000000001', 'ClinicOwner'),  -- Chủ PK, auto gán khi tạo clinic
    ('33333333-0000-0000-0000-000000000002', 'PrimaryVet'),   -- Bác sĩ chính, ClinicOwner gán
    ('33333333-0000-0000-0000-000000000003', 'Assistant');    -- Bác sĩ phụ, ClinicOwner gán

GO

-- ===================================================================
-- PHẦN 4: CLINIC ROLE - PERMISSIONS MAPPING
--
-- ClinicOwner : full quyền
-- PrimaryVet  : khám + kê đơn, không quản lý clinic
-- Assistant   : chỉ xem + lịch hẹn, không kê đơn
-- ===================================================================

INSERT INTO VetClinicRolePermissions (RoleID, PermissionID) VALUES

    -- ClinicOwner: full
    ('33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001'), -- clinic:manage-staff
    ('33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000002'), -- clinic:edit-info
    ('33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000003'), -- clinic:view-reports
    ('33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000004'), -- appointment:manage
    ('33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000005'), -- appointment:view
    ('33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000006'), -- medical-record:write
    ('33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000007'), -- medical-record:read
    ('33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000008'), -- prescription:create
    ('33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000009'), -- diagnosis:create

    -- PrimaryVet: khám + kê đơn
    ('33333333-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000004'), -- appointment:manage
    ('33333333-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000005'), -- appointment:view
    ('33333333-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000006'), -- medical-record:write
    ('33333333-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000007'), -- medical-record:read
    ('33333333-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000008'), -- prescription:create
    ('33333333-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000009'), -- diagnosis:create

    -- Assistant: chỉ xem
    ('33333333-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000005'), -- appointment:view
    ('33333333-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000007'); -- medical-record:read

GO

-- ===================================================================
-- VERIFY (chạy để kiểm tra sau seed)
-- ===================================================================

-- Kiểm tra Global Roles
SELECT RoleName FROM Roles ORDER BY RoleName;

-- Kiểm tra Clinic Roles + số permission mỗi role
SELECT
    vcr.RoleName,
    COUNT(vcrp.PermissionID) AS TotalPermissions
FROM VetClinicRoles vcr
LEFT JOIN VetClinicRolePermissions vcrp ON vcr.RoleID = vcrp.RoleID
GROUP BY vcr.RoleName
ORDER BY vcr.RoleName;

-- Kiểm tra chi tiết permission từng role
SELECT
    vcr.RoleName   AS ClinicRole,
    p.PermissionName
FROM VetClinicRoles vcr
JOIN VetClinicRolePermissions vcrp ON vcr.RoleID = vcrp.RoleID
JOIN Permissions p ON vcrp.PermissionID = p.PermissionID
ORDER BY vcr.RoleName, p.PermissionName;