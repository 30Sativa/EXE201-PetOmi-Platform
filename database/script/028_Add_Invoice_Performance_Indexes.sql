-- =============================================
-- Migration 028: Add invoice performance indexes for billing dashboard/report APIs
-- Scope: speed up paid revenue trend and unpaid aging scans
-- =============================================
USE PetOmni_DB;
GO

-- Trend revenue query: filter by ClinicID + Status='Paid' + PaidAt range
-- and aggregate PaidAmount/FinalAmount with PaymentMethod breakdown.
CREATE INDEX IX_Invoices_Clinic_PaidAt_Paid
    ON Invoices (ClinicID, PaidAt)
    INCLUDE (PaymentMethod, PaidAmount, FinalAmount)
    WHERE Status = 'Paid' AND PaidAt IS NOT NULL;
GO

-- Unpaid aging query: filter by ClinicID + Status='Unpaid' and sort by CreatedAt.
CREATE INDEX IX_Invoices_Clinic_Unpaid_CreatedAt
    ON Invoices (ClinicID, CreatedAt)
    INCLUDE (FinalAmount)
    WHERE Status = 'Unpaid';
GO

