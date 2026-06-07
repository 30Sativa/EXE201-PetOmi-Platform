-- ===================================================================
-- MIGRATION 035: Reconcile clinic role permissions with clinic workflow
-- Scope:
-- - Keep Vet as global mode only.
-- - Use VetClinicRoles as the source of clinic permissions.
-- - Assistant is front desk/cashier/intake: appointment, read medical notes,
--   inventory view, order/invoice, and payment reconciliation.
-- Safe to re-run.
-- ===================================================================
USE PetOmni_DB;
GO

MERGE Permissions AS target
USING (VALUES
    ('22222222-0000-0000-0000-000000000010', 'inventory:view', 'View clinic inventory'),
    ('22222222-0000-0000-0000-000000000011', 'inventory:manage', 'Create, update, stock in/out, and deactivate inventory items'),
    ('22222222-0000-0000-0000-000000000012', 'invoice:view', 'View invoices, payment status, and unpaid balances'),
    ('22222222-0000-0000-0000-000000000013', 'invoice:manage', 'Create, cancel, collect, and refund invoices'),
    ('22222222-0000-0000-0000-000000000014', 'order:manage', 'Create and confirm counter sale or prescription orders'),
    ('22222222-0000-0000-0000-000000000015', 'payment:reconcile', 'Review and match payment transactions'),
    ('22222222-0000-0000-0000-000000000016', 'payment:configure', 'Configure clinic receiving payment account')
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
    -- ClinicOwner operation permissions
    ('33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000010'),
    ('33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000011'),
    ('33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000012'),
    ('33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000013'),
    ('33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000014'),
    ('33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000015'),
    ('33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000016'),

    -- Assistant front desk/cashier permissions
    ('33333333-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000004'),
    ('33333333-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000010'),
    ('33333333-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000012'),
    ('33333333-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000013'),
    ('33333333-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000014'),
    ('33333333-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000015')
) AS src(RoleID, PermissionID)
ON target.RoleID = src.RoleID AND target.PermissionID = src.PermissionID
WHEN NOT MATCHED THEN
    INSERT (RoleID, PermissionID)
    VALUES (src.RoleID, src.PermissionID);
GO

SELECT
    vcr.RoleName AS ClinicRole,
    p.PermissionName
FROM VetClinicRoles vcr
JOIN VetClinicRolePermissions vcrp ON vcr.RoleID = vcrp.RoleID
JOIN Permissions p ON vcrp.PermissionID = p.PermissionID
ORDER BY vcr.RoleName, p.PermissionName;
GO
