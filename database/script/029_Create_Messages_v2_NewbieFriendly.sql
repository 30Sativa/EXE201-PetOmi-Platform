-- ===================================================================
-- PET ADVISOR AI - MIGRATION 022
-- Tạo bảng Messages trong SQL Server Core Backend
-- Lưu lịch sử chat để frontend/core backend đọc lại
-- Raw request/response và latency breakdown không lưu ở đây, để logging service xử lý
-- ===================================================================

USE PetOmni_DB;
GO

CREATE TABLE Messages (
    MessageID         UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWSEQUENTIALID(), -- Khóa chính GUID của message
    ConversationID    UNIQUEIDENTIFIER NOT NULL,                                       -- Message thuộc conversation nào
    SenderRole        NVARCHAR(20)     NOT NULL,                                       -- user / assistant / system
    Content           NVARCHAR(MAX)    NOT NULL,                                       -- Nội dung tin nhắn
    Intent            NVARCHAR(50)     NULL,                                           -- nutrition / symptom / vaccine / general / emergency
    UrgencyLevel      NVARCHAR(20)     NULL,                                           -- critical / high / normal
    VetRecommendation NVARCHAR(20)     NULL,                                           -- urgent / watch / monitor / none
    RagUsed           BIT              NOT NULL DEFAULT 0,                             -- Assistant có dùng RAG không
    ChunksUsed        INT              NOT NULL DEFAULT 0,                             -- Số knowledge chunks đưa vào prompt
    Model             NVARCHAR(100)    NULL,                                           -- Model LLM nếu có gọi GPT
    TokensInput       INT              NOT NULL DEFAULT 0,                             -- Token input
    TokensOutput      INT              NOT NULL DEFAULT 0,                             -- Token output
    CreatedAt         DATETIME         NOT NULL DEFAULT GETUTCDATE(),                  -- Thời điểm tạo message UTC
    DeletedAt         DATETIME         NULL,                                           -- Thời điểm xóa mềm
    IsActive          BIT              NOT NULL DEFAULT 1,                             -- 1=còn dùng, 0=đã xóa mềm

    CONSTRAINT FK_Messages_Conversation
        FOREIGN KEY (ConversationID) REFERENCES Conversations(ConversationID),          -- FK tới Conversations

    CONSTRAINT CK_Messages_SenderRole
        CHECK (SenderRole IN ('user', 'assistant', 'system')),                         -- Chỉ cho 3 role hợp lệ

    CONSTRAINT CK_Messages_Intent
        CHECK (Intent IS NULL OR Intent IN ('nutrition', 'symptom', 'vaccine', 'general', 'emergency')), -- Intent hợp lệ

    CONSTRAINT CK_Messages_UrgencyLevel
        CHECK (UrgencyLevel IS NULL OR UrgencyLevel IN ('critical', 'high', 'normal')), -- Urgency hợp lệ

    CONSTRAINT CK_Messages_VetRecommendation
        CHECK (VetRecommendation IS NULL OR VetRecommendation IN ('urgent', 'watch', 'monitor', 'none')) -- Enum text, không dùng emoji
);
GO

CREATE INDEX IX_Messages_Conversation_CreatedAt
ON Messages (ConversationID, CreatedAt DESC)
WHERE IsActive = 1;                                                                   -- Lấy lịch sử chat mới nhất
GO

CREATE INDEX IX_Messages_Conversation_Role_CreatedAt
ON Messages (ConversationID, SenderRole, CreatedAt DESC)
WHERE IsActive = 1;                                                                   -- Lấy message theo role nếu cần
GO
