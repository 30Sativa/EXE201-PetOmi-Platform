IF OBJECT_ID(N'dbo.WebsiteFeedbacks', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.WebsiteFeedbacks
    (
        WebsiteFeedbackID UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT PK_WebsiteFeedbacks PRIMARY KEY,
        UserID UNIQUEIDENTIFIER NOT NULL,
        Category VARCHAR(50) NOT NULL,
        Rating INT NULL,
        Subject NVARCHAR(150) NOT NULL,
        Message NVARCHAR(2000) NOT NULL,
        PageUrl NVARCHAR(500) NULL,
        BrowserInfo NVARCHAR(300) NULL,
        Status VARCHAR(30) NOT NULL
            CONSTRAINT DF_WebsiteFeedbacks_Status DEFAULT ('New'),
        CreatedAt DATETIME NOT NULL
            CONSTRAINT DF_WebsiteFeedbacks_CreatedAt DEFAULT (GETUTCDATE()),
        UpdatedAt DATETIME NULL,
        IsActive BIT NOT NULL
            CONSTRAINT DF_WebsiteFeedbacks_IsActive DEFAULT (1),
        CONSTRAINT FK_WebsiteFeedbacks_Users FOREIGN KEY (UserID)
            REFERENCES dbo.Users(UserID),
        CONSTRAINT CK_WebsiteFeedbacks_Rating CHECK (Rating IS NULL OR Rating BETWEEN 1 AND 5)
    );

    CREATE INDEX IX_WebsiteFeedbacks_Created_Active
        ON dbo.WebsiteFeedbacks (CreatedAt DESC, IsActive);

    CREATE INDEX IX_WebsiteFeedbacks_User_Created
        ON dbo.WebsiteFeedbacks (UserID, CreatedAt DESC);

    CREATE INDEX IX_WebsiteFeedbacks_Category_Status
        ON dbo.WebsiteFeedbacks (Category, Status);
END
GO
