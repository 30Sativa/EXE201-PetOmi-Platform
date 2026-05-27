-- =============================================
-- Migration 026: Add invoice cancellation policy fields
-- Scope: Track cancellation reason/reviewer and manual refund flag for paid invoices
-- =============================================
USE PetOmni_DB;
GO

ALTER TABLE Invoices ADD
    CancellationReason   NVARCHAR(500)    NULL,
    CancelledByUserID    UNIQUEIDENTIFIER NULL,
    CancelledAt          DATETIME         NULL,
    RequiresManualRefund BIT              NOT NULL CONSTRAINT DF_Invoices_RequiresManualRefund DEFAULT 0;
GO

ALTER TABLE Invoices
ADD CONSTRAINT FK_Invoices_CancelledByUser
    FOREIGN KEY (CancelledByUserID) REFERENCES Users(UserID);
GO

CREATE INDEX IX_Invoices_ManualRefund
    ON Invoices (ClinicID, RequiresManualRefund, CreatedAt DESC)
    WHERE RequiresManualRefund = 1;
GO

