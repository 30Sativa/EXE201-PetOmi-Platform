
/*
===========================================================
017_Create_ReminderPreferences.sql
===========================================================
Mục đích:
Lưu setting reminder của user
===========================================================
*/

CREATE TABLE ReminderPreferences
(
    -- ID setting
    PreferenceID UNIQUEIDENTIFIER NOT NULL
        PRIMARY KEY DEFAULT NEWSEQUENTIALID(),

    -- User sở hữu setting
    UserID UNIQUEIDENTIFIER NOT NULL,

    -- Loại reminder
    ReminderType NVARCHAR(50) NOT NULL,
    /*
        Vaccine
        Medication
        FollowUp
        Grooming
        ...
    */

    -- Có bật reminder không
    IsEnabled BIT NOT NULL
        DEFAULT 1,

    -- Nhắc trước bao nhiêu phút
    RemindBeforeMinutes INT NULL,

    -- Kênh gửi thông báo
    Channel NVARCHAR(100) NOT NULL
        DEFAULT 'PushEmail',
    /*
        Push
        Email
        PushEmail
        PushEmailSMS
    */

    -- Ngày tạo
    CreatedAt DATETIME2 NOT NULL
        DEFAULT SYSUTCDATETIME(),

    -- Ngày update cuối
    UpdatedAt DATETIME2 NULL,

    -- ==============================
    -- FOREIGN KEYS
    -- ==============================

    CONSTRAINT FK_ReminderPreferences_User
        FOREIGN KEY (UserID)
        REFERENCES Users(UserID)
);

