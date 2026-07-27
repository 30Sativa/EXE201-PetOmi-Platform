-- Ensure the account-wide Premium plan description is stored with Vietnamese diacritics.

UPDATE dbo.ChatSubscriptionPlans
SET Description = N'Một gói dùng chung cho tất cả thú cưng của bạn: nhiều lượt nhắn hơn, phản hồi nhanh hơn, tư vấn sâu theo hồ sơ và gửi được ảnh cho AI xem.',
    UpdatedAt = GETUTCDATE()
WHERE Code = N'premium';
GO
