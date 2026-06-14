-- ===================================================================
-- PETOMI - MIGRATION 039
-- Create ClinicReviews table.
-- Chủ nuôi đánh giá phòng khám sau khi lịch hẹn đã hoàn thành.
-- Mỗi chủ nuôi chỉ đánh giá một phòng khám một lần (theo cặp Clinic + Owner còn hiệu lực).
-- ===================================================================

USE PetOmni_DB;
GO

IF OBJECT_ID('dbo.ClinicReviews', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ClinicReviews (
        ClinicReviewID   UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
        ClinicID         UNIQUEIDENTIFIER NOT NULL,
        OwnerUserID      UNIQUEIDENTIFIER NOT NULL,
        AppointmentID    UNIQUEIDENTIFIER NULL,
        Rating           INT              NOT NULL,
        ReviewContent    NVARCHAR(1000)   NOT NULL,
        Status           VARCHAR(30)      NOT NULL DEFAULT 'Approved',
        RejectionReason  NVARCHAR(500)    NULL,
        CreatedAt        DATETIME         NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt        DATETIME         NULL,
        DeletedAt        DATETIME         NULL,
        IsActive         BIT              NOT NULL DEFAULT 1,

        CONSTRAINT PK_ClinicReviews PRIMARY KEY (ClinicReviewID),

        CONSTRAINT FK_ClinicReviews_Clinic
            FOREIGN KEY (ClinicID) REFERENCES dbo.Clinics(ClinicID),
        CONSTRAINT FK_ClinicReviews_Owner
            FOREIGN KEY (OwnerUserID) REFERENCES dbo.Users(UserID),
        CONSTRAINT FK_ClinicReviews_Appointment
            FOREIGN KEY (AppointmentID) REFERENCES dbo.Appointments(AppointmentID),

        CONSTRAINT CHK_ClinicReviews_Rating
            CHECK (Rating >= 1 AND Rating <= 5),
        CONSTRAINT CHK_ClinicReviews_Status
            CHECK (Status IN ('Pending', 'Approved', 'Rejected'))
    );
END
GO

-- Phòng khám xem danh sách đánh giá còn hiệu lực.
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_ClinicReviews_Clinic_Active' AND object_id = OBJECT_ID('dbo.ClinicReviews')
)
BEGIN
    CREATE INDEX IX_ClinicReviews_Clinic_Active
        ON dbo.ClinicReviews (ClinicID, IsActive);
END
GO

-- Chủ nuôi xem các đánh giá của chính mình, mới nhất trước.
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_ClinicReviews_Owner_Created' AND object_id = OBJECT_ID('dbo.ClinicReviews')
)
BEGIN
    CREATE INDEX IX_ClinicReviews_Owner_Created
        ON dbo.ClinicReviews (OwnerUserID, CreatedAt DESC);
END
GO

-- Mỗi chủ nuôi chỉ có một đánh giá còn hiệu lực cho mỗi phòng khám.
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'UX_ClinicReviews_OnePerOwner' AND object_id = OBJECT_ID('dbo.ClinicReviews')
)
BEGIN
    CREATE UNIQUE INDEX UX_ClinicReviews_OnePerOwner
        ON dbo.ClinicReviews (ClinicID, OwnerUserID)
        WHERE IsActive = 1;
END
GO
