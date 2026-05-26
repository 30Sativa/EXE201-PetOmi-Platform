-- =============================================
-- Migration 024: SePay integration foundation
-- Scope: Invoice payment reference, clinic bank account, payment transaction log
-- =============================================
USE PetOmni_DB;
GO

-- 1) Extend Invoices for payment provider flow
ALTER TABLE Invoices ADD
    InvoiceCode          NVARCHAR(30)   NULL,
    PaymentProvider      NVARCHAR(20)   NOT NULL CONSTRAINT DF_Invoices_PaymentProvider DEFAULT 'Manual',
    PaymentReference     NVARCHAR(100)  NULL,
    QrCodeUrl            NVARCHAR(1000) NULL,
    BankAccountNo        NVARCHAR(50)   NULL,
    BankCode             NVARCHAR(30)   NULL,
    PaidAmount           DECIMAL(18,2)  NULL,
    PaymentWebhookAt     DATETIME       NULL;
GO

UPDATE Invoices
SET InvoiceCode = CONCAT('INV', UPPER(LEFT(REPLACE(CONVERT(NVARCHAR(36), InvoiceID), '-', ''), 12)))
WHERE InvoiceCode IS NULL;
GO

ALTER TABLE Invoices
ALTER COLUMN InvoiceCode NVARCHAR(30) NOT NULL;
GO

ALTER TABLE Invoices ADD CONSTRAINT UQ_Invoices_InvoiceCode UNIQUE (InvoiceCode);
GO

ALTER TABLE Invoices ADD CONSTRAINT CHK_Invoices_PaymentProvider
    CHECK (PaymentProvider IN ('Manual', 'SePay'));
GO

ALTER TABLE Invoices DROP CONSTRAINT CHK_Invoices_PaymentMethod;
GO

ALTER TABLE Invoices ADD CONSTRAINT CHK_Invoices_PaymentMethod
    CHECK (PaymentMethod IN ('Cash', 'BankTransfer', 'SePayBankTransfer') OR PaymentMethod IS NULL);
GO

-- 2) Bank account configuration for each clinic
CREATE TABLE ClinicPaymentAccounts (
    ClinicPaymentAccountID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID()
        CONSTRAINT PK_ClinicPaymentAccounts PRIMARY KEY,
    ClinicID               UNIQUEIDENTIFIER NOT NULL,
    Provider               NVARCHAR(20)     NOT NULL,
    BankCode               NVARCHAR(30)     NOT NULL,
    BankName               NVARCHAR(100)    NULL,
    AccountNumber          NVARCHAR(50)     NOT NULL,
    AccountName            NVARCHAR(200)    NULL,
    IsActive               BIT              NOT NULL DEFAULT 1,
    CreatedAt              DATETIME         NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt              DATETIME         NULL,

    CONSTRAINT FK_ClinicPaymentAccounts_Clinic
        FOREIGN KEY (ClinicID) REFERENCES Clinics(ClinicID),
    CONSTRAINT CHK_ClinicPaymentAccounts_Provider
        CHECK (Provider IN ('SePay'))
);
GO

CREATE INDEX IX_ClinicPaymentAccounts_ClinicProvider
    ON ClinicPaymentAccounts (ClinicID, Provider, IsActive);
GO

-- 3) Payment transaction log for webhook idempotency and reconciliation
CREATE TABLE PaymentTransactions (
    PaymentTransactionID   UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID()
        CONSTRAINT PK_PaymentTransactions PRIMARY KEY,
    InvoiceID              UNIQUEIDENTIFIER NULL,
    ClinicID               UNIQUEIDENTIFIER NOT NULL,
    Provider               NVARCHAR(20)     NOT NULL,
    ProviderTransactionID  NVARCHAR(100)    NOT NULL,
    ReferenceCode          NVARCHAR(100)    NULL,
    TransferContent        NVARCHAR(500)    NULL,
    TransferType           NVARCHAR(10)     NOT NULL,
    TransferAmount         DECIMAL(18,2)    NOT NULL,
    Gateway                NVARCHAR(100)    NULL,
    AccountNumber          NVARCHAR(50)     NULL,
    TransactionDate        DATETIME         NULL,
    IsMatched              BIT              NOT NULL DEFAULT 0,
    RawPayload             NVARCHAR(MAX)    NULL,
    CreatedAt              DATETIME         NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_PaymentTransactions_Invoice
        FOREIGN KEY (InvoiceID) REFERENCES Invoices(InvoiceID),
    CONSTRAINT FK_PaymentTransactions_Clinic
        FOREIGN KEY (ClinicID) REFERENCES Clinics(ClinicID),
    CONSTRAINT CHK_PaymentTransactions_Provider
        CHECK (Provider IN ('SePay')),
    CONSTRAINT CHK_PaymentTransactions_TransferType
        CHECK (TransferType IN ('in', 'out'))
);
GO

CREATE UNIQUE INDEX UQ_PaymentTransactions_ProviderTransaction
    ON PaymentTransactions (Provider, ProviderTransactionID);
GO

CREATE INDEX IX_PaymentTransactions_Invoice
    ON PaymentTransactions (InvoiceID, CreatedAt DESC);
GO

CREATE INDEX IX_PaymentTransactions_Reconcile
    ON PaymentTransactions (ClinicID, IsMatched, CreatedAt DESC);
GO
