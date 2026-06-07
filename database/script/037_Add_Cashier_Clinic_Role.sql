-- ===================================================================
-- MIGRATION 037: Add dedicated Cashier clinic role
-- Scope:
-- - Cashier owns billing, counter orders, and payment reconciliation.
-- - Assistant returns to intake/front-desk support without billing write.
-- Safe to re-run after 004 and/or 035.
-- ===================================================================
USE PetOmni_DB;
GO

MERGE VetClinicRoles AS target
USING (VALUES
    ('33333333-0000-0000-0000-000000000004', 'Cashier')
) AS src(RoleID, RoleName)
ON target.RoleID = src.RoleID
WHEN MATCHED THEN
    UPDATE SET RoleName = src.RoleName
WHEN NOT MATCHED THEN
    INSERT (RoleID, RoleName)
    VALUES (src.RoleID, src.RoleName);
GO

MERGE Permissions AS target
USING (VALUES
    ('22222222-0000-0000-0000-000000000005', 'appointment:view', 'Xem lich hen cua phong kham'),
    ('22222222-0000-0000-0000-000000000010', 'inventory:view', 'Xem kho thuoc va vat tu phong kham'),
    ('22222222-0000-0000-0000-000000000012', 'invoice:view', 'Xem hoa don, trang thai thanh toan va cong no'),
    ('22222222-0000-0000-0000-000000000013', 'invoice:manage', 'Tao, huy, thu tien va hoan tien hoa don'),
    ('22222222-0000-0000-0000-000000000014', 'order:manage', 'Tao va xac nhan don ban tai quay hoac cap phat thuoc'),
    ('22222222-0000-0000-0000-000000000015', 'payment:reconcile', 'Doi soat va khop giao dich thanh toan')
) AS src(PermissionID, PermissionName, Description)
ON target.PermissionID = src.PermissionID
WHEN MATCHED THEN
    UPDATE SET PermissionName = src.PermissionName, Description = src.Description
WHEN NOT MATCHED THEN
    INSERT (PermissionID, PermissionName, Description)
    VALUES (src.PermissionID, src.PermissionName, src.Description);
GO

MERGE VetClinicRolePermissions AS target
USING (VALUES
    ('33333333-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000005'),
    ('33333333-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000010'),
    ('33333333-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000012'),
    ('33333333-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000013'),
    ('33333333-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000014'),
    ('33333333-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000015')
) AS src(RoleID, PermissionID)
ON target.RoleID = src.RoleID AND target.PermissionID = src.PermissionID
WHEN NOT MATCHED THEN
    INSERT (RoleID, PermissionID)
    VALUES (src.RoleID, src.PermissionID);
GO

-- Remove cashier-only permissions from Assistant if migration 035 granted them.
DELETE FROM VetClinicRolePermissions
WHERE RoleID = '33333333-0000-0000-0000-000000000003'
  AND PermissionID IN (
    '22222222-0000-0000-0000-000000000010',
    '22222222-0000-0000-0000-000000000012',
    '22222222-0000-0000-0000-000000000013',
    '22222222-0000-0000-0000-000000000014',
    '22222222-0000-0000-0000-000000000015'
  );
GO

SELECT
    vcr.RoleName AS ClinicRole,
    p.PermissionName
FROM VetClinicRoles vcr
JOIN VetClinicRolePermissions vcrp ON vcr.RoleID = vcrp.RoleID
JOIN Permissions p ON vcrp.PermissionID = p.PermissionID
WHERE vcr.RoleName IN ('Assistant', 'Cashier')
ORDER BY vcr.RoleName, p.PermissionName;
GO
