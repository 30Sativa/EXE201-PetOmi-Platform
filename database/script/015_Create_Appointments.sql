-- =============================================
-- Migration 015: Create Appointments Table
-- Sprint 4 — Appointment Booking
-- =============================================

CREATE TABLE Appointments (
    AppointmentID       UNIQUEIDENTIFIER    NOT NULL DEFAULT NEWSEQUENTIALID(),
    ClinicID            UNIQUEIDENTIFIER    NOT NULL,
    VetClinicID         UNIQUEIDENTIFIER    NULL,       -- bác sĩ phụ trách (clinic assign sau)
    ServiceID           UNIQUEIDENTIFIER    NULL,       -- dịch vụ đặt
    PetID               UNIQUEIDENTIFIER    NOT NULL,

    BookedByUserID      UNIQUEIDENTIFIER    NOT NULL,   -- owner hoặc staff (walk-in)

    -- Thời gian lịch hẹn
    AppointmentDate     DATE                NOT NULL,
    StartTime           TIME(0)             NOT NULL,
    EndTime             TIME(0)             NOT NULL,   -- StartTime + service.DurationMins

    -- Loại lịch hẹn (VT-3.4)
    AppointmentType     VARCHAR(50)         NOT NULL DEFAULT 'Checkup',
    -- Checkup | Vaccination | Surgery | Emergency | Grooming | Followup

    -- Status machine
    Status              VARCHAR(30)         NOT NULL DEFAULT 'Pending',
    -- Pending | Confirmed | Completed | Cancelled | Rejected | Expired

    Notes               NVARCHAR(500)       NULL,       -- ghi chú từ owner lúc đặt
    CancellationReason  NVARCHAR(300)       NULL,
    IsWalkIn            BIT                 NOT NULL DEFAULT 0,
    IsLateCancellation  BIT                 NOT NULL DEFAULT 0,  -- cancel sau 2h

    ConfirmedAt         DATETIME            NULL,
    CancelledAt         DATETIME            NULL,
    CancelledByUserID   UNIQUEIDENTIFIER    NULL,

    CreatedAt           DATETIME            NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt           DATETIME            NULL,

    CONSTRAINT PK_Appointments PRIMARY KEY (AppointmentID),

    CONSTRAINT FK_Appointments_Clinic
        FOREIGN KEY (ClinicID) REFERENCES Clinics(ClinicID),

    CONSTRAINT FK_Appointments_VetClinic
        FOREIGN KEY (VetClinicID) REFERENCES VetClinic(VetClinicID),

    CONSTRAINT FK_Appointments_Service
        FOREIGN KEY (ServiceID) REFERENCES ClinicServices(ServiceID),

    CONSTRAINT FK_Appointments_Pet
        FOREIGN KEY (PetID) REFERENCES Pets(PetID),

    CONSTRAINT FK_Appointments_BookedBy
        FOREIGN KEY (BookedByUserID) REFERENCES Users(UserID),

    CONSTRAINT FK_Appointments_CancelledBy
        FOREIGN KEY (CancelledByUserID) REFERENCES Users(UserID),

    CONSTRAINT CHK_Appointments_Status
        CHECK (Status IN ('Pending','Confirmed','Completed','Cancelled','Rejected','Expired')),

    CONSTRAINT CHK_Appointments_Type
        CHECK (AppointmentType IN ('Checkup','Vaccination','Surgery','Emergency','Grooming','Followup')),

    CONSTRAINT CHK_Appointments_Time
        CHECK (EndTime > StartTime)
);

-- Index: phòng khám xem lịch theo ngày (clinic dashboard)
CREATE INDEX IX_Appointments_Clinic_Date
    ON Appointments (ClinicID, AppointmentDate, Status);

-- Index: bác sĩ check conflict khi đặt lịch mới
CREATE INDEX IX_Appointments_VetClinic_Date
    ON Appointments (VetClinicID, AppointmentDate)
    WHERE VetClinicID IS NOT NULL;

-- Index: owner xem lịch sử đặt của mình
CREATE INDEX IX_Appointments_Pet
    ON Appointments (PetID, AppointmentDate DESC);

-- Index: auto-expire query (scan Pending > 30 phút)
CREATE INDEX IX_Appointments_Pending_CreatedAt
    ON Appointments (Status, CreatedAt)
    WHERE Status = 'Pending';
