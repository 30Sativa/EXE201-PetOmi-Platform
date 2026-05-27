-- =============================================
-- Migration 025: Add manual reconciliation review metadata
-- Scope: Store review note and reviewer when staff manually resolves SePay transactions
-- =============================================
USE PetOmni_DB;
GO

ALTER TABLE PaymentTransactions ADD
    ReviewNote       NVARCHAR(500)   NULL,
    ReviewedByUserID UNIQUEIDENTIFIER NULL,
    ReviewedAt       DATETIME        NULL;
GO

