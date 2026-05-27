-- =============================================
-- Migration 027: Add manual refund confirmation fields
-- Scope: Track who confirmed out-of-system refund for cancelled paid invoices
-- =============================================
USE PetOmni_DB;
GO

ALTER TABLE Invoices ADD
    RefundNote              NVARCHAR(500)    NULL,
    RefundConfirmedByUserID UNIQUEIDENTIFIER NULL,
    RefundConfirmedAt       DATETIME         NULL;
GO

ALTER TABLE Invoices
ADD CONSTRAINT FK_Invoices_RefundConfirmedByUser
    FOREIGN KEY (RefundConfirmedByUserID) REFERENCES Users(UserID);
GO

CREATE INDEX IX_Invoices_PendingManualRefund
    ON Invoices (ClinicID, Status, RequiresManualRefund, RefundConfirmedAt, CreatedAt DESC)
    WHERE Status = 'Cancelled' AND RequiresManualRefund = 1 AND RefundConfirmedAt IS NULL;
GO

