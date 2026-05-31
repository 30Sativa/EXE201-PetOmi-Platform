-- ===================================================================
-- PET ADVISOR AI - MIGRATION 021
-- Tạo bảng Conversations trong SQL Server Core Backend
-- Lưu phiên chat ở Core Backend, không lưu trong PostgreSQL AI Service
-- Không cache pet metadata; mỗi lần chat AI Service lấy pet context từ Core Backend
-- ===================================================================

USE PetOmni_DB;
GO

CREATE TABLE Conversations (
    ConversationID UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWSEQUENTIALID(), -- Khóa chính GUID của conversation
    UserID         UNIQUEIDENTIFIER NOT NULL,                                       -- User sở hữu conversation
    PetID          UNIQUEIDENTIFIER NULL,                                           -- Pet liên quan, NULL nếu chat general
    Title          NVARCHAR(200)    NULL,                                           -- Tiêu đề ngắn để hiển thị danh sách chat
    IsActive       BIT              NOT NULL DEFAULT 1,                             -- 1=còn dùng, 0=đã xóa mềm
    CreatedAt      DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),              -- Thời điểm tạo UTC
    UpdatedAt      DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME(),              -- Thời điểm có message mới nhất
    DeletedAt      DATETIME         NULL,                                           -- Thời điểm xóa mềm, NULL nếu chưa xóa

    CONSTRAINT FK_Conversations_User
        FOREIGN KEY (UserID) REFERENCES Users(UserID),                              -- FK tới bảng Users

    CONSTRAINT FK_Conversations_Pet
        FOREIGN KEY (PetID) REFERENCES Pets(PetID)                                  -- FK tới bảng Pets
);
GO

CREATE INDEX IX_Conversations_User_UpdatedAt
ON Conversations (UserID, UpdatedAt DESC, CreatedAt DESC)
WHERE IsActive = 1;                                                                 -- Lấy list conversation còn active theo user
GO

CREATE INDEX IX_Conversations_Pet_UpdatedAt
ON Conversations (PetID, UpdatedAt DESC, CreatedAt DESC)
WHERE PetID IS NOT NULL AND IsActive = 1;                                           -- Lấy conversation theo pet
GO
