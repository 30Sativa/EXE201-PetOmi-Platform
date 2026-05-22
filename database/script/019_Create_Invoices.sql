-- =============================================
-- Migration 019: Create Invoices + InvoiceItems tables
-- Sprint 5 — Patient Flow (Hóa đơn & Thanh toán)
-- MVP: Cash/Transfer, không có tax, có discount header-level
-- =============================================
USE PetOmni_DB;
GO

CREATE TABLE Invoices (
    InvoiceID           UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWSEQUENTIALID()
                        CONSTRAINT PK_Invoices PRIMARY KEY,

    AppointmentID       UNIQUEIDENTIFIER    NOT NULL,   -- FK → Appointments
    ExaminationID       UNIQUEIDENTIFIER    NULL,       -- FK → MedicalExaminations (optional)
    ClinicID            UNIQUEIDENTIFIER    NOT NULL,   -- FK → Clinics

    -- Số tiền
    TotalAmount         DECIMAL(18,2)       NOT NULL,   -- tổng trước giảm giá
    DiscountAmount      DECIMAL(18,2)       NOT NULL DEFAULT 0,  -- giảm giá (VND)
    FinalAmount         DECIMAL(18,2)       NOT NULL,   -- = TotalAmount - DiscountAmount

    -- Trạng thái
    Status              NVARCHAR(20)        NOT NULL DEFAULT 'Unpaid',
    -- Unpaid | Paid | Cancelled

    -- Thanh toán
    PaymentMethod       NVARCHAR(30)        NULL,       -- Cash | BankTransfer
    PaidAt              DATETIME            NULL,

    Notes               NVARCHAR(500)       NULL,

    CreatedAt           DATETIME            NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt           DATETIME            NULL,

    CONSTRAINT FK_Invoices_Appointment
        FOREIGN KEY (AppointmentID) REFERENCES Appointments(AppointmentID),

    CONSTRAINT FK_Invoices_Examination
        FOREIGN KEY (ExaminationID) REFERENCES MedicalExaminations(ExaminationID),

    CONSTRAINT FK_Invoices_Clinic
        FOREIGN KEY (ClinicID) REFERENCES Clinics(ClinicID),

    CONSTRAINT CHK_Invoices_Status
        CHECK (Status IN ('Unpaid', 'Paid', 'Cancelled')),

    CONSTRAINT CHK_Invoices_PaymentMethod
        CHECK (PaymentMethod IN ('Cash', 'BankTransfer') OR PaymentMethod IS NULL),

    CONSTRAINT CHK_Invoices_FinalAmount
        CHECK (FinalAmount >= 0),

    CONSTRAINT CHK_Invoices_Discount
        CHECK (DiscountAmount >= 0 AND DiscountAmount <= TotalAmount)
);
GO

-- Mỗi appointment chỉ có 1 invoice active (Unpaid hoặc Paid)
CREATE UNIQUE INDEX IX_Invoices_AppointmentID_Active
    ON Invoices (AppointmentID)
    WHERE Status IN ('Unpaid', 'Paid');
GO

CREATE INDEX IX_Invoices_ClinicID
    ON Invoices (ClinicID, CreatedAt DESC);
GO

-- =============================================
-- InvoiceItems: chi tiết từng dòng trong hóa đơn
-- =============================================
CREATE TABLE InvoiceItems (
    InvoiceItemID       UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWSEQUENTIALID()
                        CONSTRAINT PK_InvoiceItems PRIMARY KEY,

    InvoiceID           UNIQUEIDENTIFIER    NOT NULL,   -- FK → Invoices

    -- Loại dòng
    ItemType            NVARCHAR(30)        NOT NULL,
    -- Service | Medication | Other

    Description         NVARCHAR(300)       NOT NULL,   -- tên hiển thị
    Quantity            INT                 NOT NULL DEFAULT 1,
    UnitPrice           DECIMAL(18,2)       NOT NULL,
    TotalPrice          DECIMAL(18,2)       NOT NULL,   -- = Quantity * UnitPrice

    -- Optional links
    ServiceID           UNIQUEIDENTIFIER    NULL,       -- FK → ClinicServices
    InventoryItemID     UNIQUEIDENTIFIER    NULL,       -- FK → Inventory

    CONSTRAINT FK_InvoiceItems_Invoice
        FOREIGN KEY (InvoiceID) REFERENCES Invoices(InvoiceID)
            ON DELETE CASCADE,

    CONSTRAINT FK_InvoiceItems_Service
        FOREIGN KEY (ServiceID) REFERENCES ClinicServices(ServiceID),

    CONSTRAINT FK_InvoiceItems_Inventory
        FOREIGN KEY (InventoryItemID) REFERENCES Inventory(ItemID),

    CONSTRAINT CHK_InvoiceItems_Type
        CHECK (ItemType IN ('Service', 'Medication', 'Other')),

    CONSTRAINT CHK_InvoiceItems_Quantity
        CHECK (Quantity > 0),

    CONSTRAINT CHK_InvoiceItems_Price
        CHECK (UnitPrice >= 0 AND TotalPrice >= 0)
);
GO

CREATE INDEX IX_InvoiceItems_InvoiceID
    ON InvoiceItems (InvoiceID);
GO
