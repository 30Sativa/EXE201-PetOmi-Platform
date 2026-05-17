-- ===================================================================
-- PET ADVISOR AI - MIGRATION 009
-- Tạo bảng PetUserAccess: chia sẻ quyền truy cập pet cho family/user khác
-- Không dùng CHECK constraint cho AccessRole vì validation xử lý ở Application layer
-- ===================================================================

USE PetOmni_DB;
GO

CREATE TABLE PetUserAccess (
    PetUserAccessID UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWSEQUENTIALID(), -- Khóa chính GUID
    PetID           UNIQUEIDENTIFIER NOT NULL,                                       -- Pet được chia sẻ
    UserID          UNIQUEIDENTIFIER NOT NULL,                                       -- User được cấp quyền
    AccessRole      NVARCHAR(50)     NOT NULL,                                       -- Owner / Editor / Viewer, validation trong code
    GrantedByUserID UNIQUEIDENTIFIER NULL,                                           -- User đã cấp quyền
    ExpiresAt       DATETIME         NULL,                                           -- NULL=không hết hạn, có giá trị=tự hết hạn
    RevokedAt       DATETIME         NULL,                                           -- Thời điểm thu hồi quyền nếu có
    IsActive        BIT              NOT NULL DEFAULT 1,                             -- Quyền còn hiệu lực về mặt trạng thái
    CreatedAt       DATETIME         NOT NULL DEFAULT GETUTCDATE(),                  -- Ngày cấp quyền
    UpdatedAt       DATETIME         NULL,                                           -- Lần cập nhật gần nhất

    CONSTRAINT FK_PetUserAccess_Pet
        FOREIGN KEY (PetID) REFERENCES Pets(PetID),
    CONSTRAINT FK_PetUserAccess_User
        FOREIGN KEY (UserID) REFERENCES Users(UserID),
    CONSTRAINT FK_PetUserAccess_GrantedByUser
        FOREIGN KEY (GrantedByUserID) REFERENCES Users(UserID),
    CONSTRAINT UQ_PetUserAccess_Pet_User_Role
        UNIQUE (PetID, UserID, AccessRole)
);
GO
