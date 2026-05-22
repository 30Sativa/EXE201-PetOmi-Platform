
/*
===========================================================
016_Create_Reminders.sql
===========================================================
Mục đích:
- Nhắc vaccine
- Nhắc uống thuốc
- Nhắc tái khám
- Reminder cá nhân của owner
===========================================================
*/

CREATE TABLE Reminders
(
    -- ID reminder
    ReminderID UNIQUEIDENTIFIER NOT NULL
        PRIMARY KEY DEFAULT NEWSEQUENTIALID(),

    -- User nhận thông báo
    UserID UNIQUEIDENTIFIER NOT NULL,

    -- Pet liên quan (có thể null nếu reminder chung)
    PetID UNIQUEIDENTIFIER NULL,

    -- Loại reminder nghiệp vụ
    ReminderType NVARCHAR(50) NOT NULL,
    /*
        Ví dụ:
        - Vaccine
        - Medication
        - FollowUp
        - Deworming
        - Grooming
        - WeightTracking
        - Custom
    */

    -- Reminder được tạo từ entity nào
    EntityType NVARCHAR(50) NULL,
    /*
        Ví dụ:
        - PetMedicalRecord
        - Prescription
        - Appointment
        - CustomReminder
    */

    -- ID của entity gốc
    EntityID UNIQUEIDENTIFIER NULL,

    -- Reminder được tạo bởi ai
    SourceType NVARCHAR(30) NOT NULL
        DEFAULT 'SYSTEM',
    /*
        SYSTEM = tự sinh
        VET    = bác sĩ tạo
        OWNER  = owner tự tạo
    */

    -- User tạo reminder
    CreatedByUserID UNIQUEIDENTIFIER NULL,

    -- Tiêu đề reminder
    Title NVARCHAR(200) NOT NULL,

    -- Nội dung reminder
    Message NVARCHAR(1000) NULL,

    -- Thời điểm gửi nhắc
    RemindAt DATETIME2 NOT NULL,

    -- Rule lặp
    RepeatRule NVARCHAR(1000) NULL,
    /*
        Ví dụ:
        DAILY
        WEEKLY
        MONTHLY
        YEARLY

        hoặc:
        FREQ=DAILY;INTERVAL=1
    */

    -- Ngày kết thúc lặp
    RepeatUntil DATETIME2 NULL,

    -- Trạng thái reminder
    Status NVARCHAR(30) NOT NULL
        DEFAULT 'Pending',
    /*
        Pending
        Sent
        Dismissed
        Cancelled
        Completed
    */

    -- Có đang active không
    IsEnabled BIT NOT NULL
        DEFAULT 1,

    -- Thời điểm đã gửi
    SentAt DATETIME2 NULL,

    -- Thời điểm user dismiss
    DismissedAt DATETIME2 NULL,

    -- Ngày tạo
    CreatedAt DATETIME2 NOT NULL
        DEFAULT SYSUTCDATETIME(),

    -- Ngày update cuối
    UpdatedAt DATETIME2 NULL,

    -- ==============================
    -- FOREIGN KEYS
    -- ==============================

    CONSTRAINT FK_Reminders_User
        FOREIGN KEY (UserID)
        REFERENCES Users(UserID),

    CONSTRAINT FK_Reminders_Pet
        FOREIGN KEY (PetID)
        REFERENCES Pets(PetID),

    CONSTRAINT FK_Reminders_CreatedBy
        FOREIGN KEY (CreatedByUserID)
        REFERENCES Users(UserID)
);

