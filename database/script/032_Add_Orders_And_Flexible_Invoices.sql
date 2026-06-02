-- =============================================
-- Migration 032: Orders + flexible invoice sources
-- Scope:
-- - Retail counter sales without appointment
-- - Invoice can come from Appointment, Order, or Mixed
-- =============================================
USE PetOmni_DB;
GO

-- 1) Orders for counter sales / prescription dispensing / mixed retail
CREATE TABLE Orders (
    OrderID          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID()
        CONSTRAINT PK_Orders PRIMARY KEY,
    ClinicID         UNIQUEIDENTIFIER NOT NULL,
    CustomerUserID   UNIQUEIDENTIFIER NULL,
    PetID            UNIQUEIDENTIFIER NULL,
    AppointmentID    UNIQUEIDENTIFIER NULL,
    OrderType        NVARCHAR(30) NOT NULL DEFAULT 'Retail',
    Status           NVARCHAR(30) NOT NULL DEFAULT 'Draft',
    TotalAmount      DECIMAL(18,2) NOT NULL DEFAULT 0,
    Notes            NVARCHAR(500) NULL,
    CreatedByUserID  UNIQUEIDENTIFIER NOT NULL,
    CreatedAt        DATETIME NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt        DATETIME NULL,
    ConfirmedAt      DATETIME NULL,
    PaidAt           DATETIME NULL,
    CancelledAt      DATETIME NULL,

    CONSTRAINT FK_Orders_Clinic
        FOREIGN KEY (ClinicID) REFERENCES Clinics(ClinicID),
    CONSTRAINT FK_Orders_CustomerUser
        FOREIGN KEY (CustomerUserID) REFERENCES Users(UserID),
    CONSTRAINT FK_Orders_Pet
        FOREIGN KEY (PetID) REFERENCES Pets(PetID),
    CONSTRAINT FK_Orders_Appointment
        FOREIGN KEY (AppointmentID) REFERENCES Appointments(AppointmentID),
    CONSTRAINT FK_Orders_CreatedBy
        FOREIGN KEY (CreatedByUserID) REFERENCES Users(UserID),
    CONSTRAINT CHK_Orders_OrderType
        CHECK (OrderType IN ('Retail', 'Prescription', 'Mixed')),
    CONSTRAINT CHK_Orders_Status
        CHECK (Status IN ('Draft', 'Confirmed', 'Invoiced', 'Paid', 'Cancelled')),
    CONSTRAINT CHK_Orders_TotalAmount
        CHECK (TotalAmount >= 0)
);
GO

CREATE INDEX IX_Orders_Clinic_CreatedAt
    ON Orders(ClinicID, CreatedAt DESC);
GO

CREATE INDEX IX_Orders_Clinic_Status
    ON Orders(ClinicID, Status);
GO

CREATE TABLE OrderItems (
    OrderItemID     UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID()
        CONSTRAINT PK_OrderItems PRIMARY KEY,
    OrderID         UNIQUEIDENTIFIER NOT NULL,
    InventoryItemID UNIQUEIDENTIFIER NOT NULL,
    Description     NVARCHAR(300) NOT NULL,
    Quantity        INT NOT NULL DEFAULT 1,
    UnitPrice       DECIMAL(18,2) NOT NULL,
    TotalPrice      DECIMAL(18,2) NOT NULL,
    SourceType      NVARCHAR(30) NOT NULL DEFAULT 'Retail',
    PrescriptionID  UNIQUEIDENTIFIER NULL,
    CreatedAt       DATETIME NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_OrderItems_Order
        FOREIGN KEY (OrderID) REFERENCES Orders(OrderID) ON DELETE CASCADE,
    CONSTRAINT FK_OrderItems_Inventory
        FOREIGN KEY (InventoryItemID) REFERENCES Inventory(ItemID),
    CONSTRAINT FK_OrderItems_Prescription
        FOREIGN KEY (PrescriptionID) REFERENCES Prescriptions(PrescriptionID),
    CONSTRAINT CHK_OrderItems_Quantity
        CHECK (Quantity > 0),
    CONSTRAINT CHK_OrderItems_Price
        CHECK (UnitPrice >= 0 AND TotalPrice >= 0),
    CONSTRAINT CHK_OrderItems_SourceType
        CHECK (SourceType IN ('Retail', 'Prescription'))
);
GO

CREATE INDEX IX_OrderItems_OrderID
    ON OrderItems(OrderID);
GO

CREATE INDEX IX_OrderItems_InventoryItemID
    ON OrderItems(InventoryItemID);
GO

-- 2) Allow invoices to be created from Appointment, Order, or both
ALTER TABLE Invoices ADD
    OrderID UNIQUEIDENTIFIER NULL,
    InvoiceSource NVARCHAR(20) NOT NULL
        CONSTRAINT DF_Invoices_InvoiceSource DEFAULT 'Appointment';
GO

ALTER TABLE Invoices DROP CONSTRAINT FK_Invoices_Appointment;
GO

ALTER TABLE Invoices ALTER COLUMN AppointmentID UNIQUEIDENTIFIER NULL;
GO

ALTER TABLE Invoices ADD CONSTRAINT FK_Invoices_Appointment
    FOREIGN KEY (AppointmentID) REFERENCES Appointments(AppointmentID);
GO

ALTER TABLE Invoices ADD CONSTRAINT FK_Invoices_Order
    FOREIGN KEY (OrderID) REFERENCES Orders(OrderID);
GO

ALTER TABLE Invoices ADD CONSTRAINT CHK_Invoices_Source
    CHECK (InvoiceSource IN ('Appointment', 'Order', 'Mixed'));
GO

ALTER TABLE Invoices ADD CONSTRAINT CHK_Invoices_SourceRefs
    CHECK (
        (InvoiceSource = 'Appointment' AND AppointmentID IS NOT NULL AND OrderID IS NULL)
        OR (InvoiceSource = 'Order' AND OrderID IS NOT NULL AND AppointmentID IS NULL)
        OR (InvoiceSource = 'Mixed' AND AppointmentID IS NOT NULL AND OrderID IS NOT NULL)
    );
GO

DROP INDEX IX_Invoices_AppointmentID_Active ON Invoices;
GO

CREATE UNIQUE INDEX IX_Invoices_AppointmentID_Active
    ON Invoices(AppointmentID)
    WHERE AppointmentID IS NOT NULL AND Status IN ('Unpaid', 'Paid');
GO

CREATE UNIQUE INDEX IX_Invoices_OrderID_Active
    ON Invoices(OrderID)
    WHERE OrderID IS NOT NULL AND Status IN ('Unpaid', 'Paid');
GO

-- 3) Track source item links at invoice line level
ALTER TABLE InvoiceItems ADD
    OrderItemID UNIQUEIDENTIFIER NULL,
    PrescriptionID UNIQUEIDENTIFIER NULL;
GO

ALTER TABLE InvoiceItems ADD CONSTRAINT FK_InvoiceItems_OrderItem
    FOREIGN KEY (OrderItemID) REFERENCES OrderItems(OrderItemID);
GO

ALTER TABLE InvoiceItems ADD CONSTRAINT FK_InvoiceItems_Prescription
    FOREIGN KEY (PrescriptionID) REFERENCES Prescriptions(PrescriptionID);
GO

ALTER TABLE InvoiceItems DROP CONSTRAINT CHK_InvoiceItems_Type;
GO

ALTER TABLE InvoiceItems ADD CONSTRAINT CHK_InvoiceItems_Type
    CHECK (ItemType IN ('Service', 'Medication', 'Product', 'Other'));
GO
