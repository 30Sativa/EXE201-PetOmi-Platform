-- ===================================================================
-- PET ADVISOR AI - MIGRATION 008
-- Tạo bảng PetPhotos: avatar + gallery ảnh thú cưng
-- ===================================================================

USE PetOmni_DB;
GO

CREATE TABLE PetPhotos (
    PhotoID   UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWSEQUENTIALID(), -- Khóa chính GUID
    PetID     UNIQUEIDENTIFIER NOT NULL,                                       -- Liên kết thú cưng
    ImageURL  NVARCHAR(500)    NOT NULL,                                       -- URL ảnh
    Caption   NVARCHAR(255)    NULL,                                           -- Caption / mô tả ảnh
    IsAvatar  BIT              NOT NULL DEFAULT 0,                             -- Ảnh này có đang được dùng làm avatar không
    TakenAt   DATETIME         NULL,                                           -- Thời điểm chụp nếu có
    CreatedAt DATETIME         NOT NULL DEFAULT GETUTCDATE(),                  -- Ngày upload / tạo record
    DeletedAt DATETIME         NULL,                                           -- Xóa mềm ảnh khỏi gallery
    IsActive  BIT              NOT NULL DEFAULT 1,                             -- Ảnh còn hoạt động? 0=xóa mềm

    CONSTRAINT FK_PetPhotos_Pet
        FOREIGN KEY (PetID) REFERENCES Pets(PetID)
);
GO
