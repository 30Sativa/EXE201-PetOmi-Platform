using PetOmiPlatform.Domain.Common;
using PetOmiPlatform.Domain.Exceptions;
using PetOmiPlatform.Domain.Interfaces.Services;
using PetOmiPlatform.Domain.ValueObjects;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Domain.Entities
{
    public class UserDomain : BaseEntity
    {
        public Email Email { get; private set; }
        public PasswordHash PasswordHash { get; private set; }

        public bool EmailVerified { get; private set; }
        public int FailedLoginAttempts { get; private set; }
        public DateTime? LockoutUntil { get; private set; }

        public DateTime CreatedAt { get; private set; }
        public DateTime? UpdatedAt { get; private set; }
        public DateTime? LastLoginAt { get; private set; }
        public DateTime? DeletedAt { get; private set; }

        public bool IsActive { get; private set; }

        // === Constructors ===
        // Private constructor for EF Core and reconstitution
        private UserDomain() { }


        // Factory method for creating a new user
        private UserDomain(Email email, PasswordHash passwordHash)
        {
            Id = Guid.NewGuid();
            Email = email;
            PasswordHash = passwordHash;
            EmailVerified = false;
            FailedLoginAttempts = 0;
            LockoutUntil = null;
            CreatedAt = DateTime.UtcNow;
            IsActive = true;
        }

        public static UserDomain Reconstitute(
            Guid id,
            string email,
            string passwordHash,
            bool emailVerified,
            int failedLoginAttempts,
            DateTime? lockoutUntil,
            DateTime createdAt,
            DateTime? updatedAt,
            DateTime? lastLoginAt,
            DateTime? deletedAt,
            bool isActive)
        {
            var user = new UserDomain
            {
                Id = id,
                Email = new Email(email),
                PasswordHash = passwordHash != null ? new PasswordHash(passwordHash) : null,
                EmailVerified = emailVerified,
                FailedLoginAttempts = failedLoginAttempts,
                LockoutUntil = lockoutUntil,
                CreatedAt = createdAt,
                UpdatedAt = updatedAt,
                LastLoginAt = lastLoginAt,
                DeletedAt = deletedAt,
                IsActive = isActive
            };
            return user;
        }
        // === Factory Methods (Creation Logic) ===

        public static UserDomain Create(Email email, PasswordHash password)
        {
            return new UserDomain(email, password);
        }

        // === Behavior Methods (Domain Logic) ===

        public void ValidateLogin(string password, IPasswordHasher passwordHasher) 
        {
            EnsureCanLogin();
            if (PasswordHash == null)
                throw new DomainException("Tài khoản này đăng nhập bằng mạng xã hội, không có mật khẩu.");
            if (!passwordHasher.Verify(password, PasswordHash.Value))
            {
                RecordLoginFailure();
                throw new DomainException("Mật khẩu không đúng.");
            }
            RecordLoginSuccess();
        }


        public void VerifyEmail()
        {
            if (EmailVerified) { throw new DomainException("Email đã được xác minh trước đó. "); }
            EmailVerified = true;
            UpdatedAt = DateTime.UtcNow;
        }

        public void RecordLoginSuccess()    
        {
            FailedLoginAttempts = 0;
            LockoutUntil = null;
            LastLoginAt = DateTime.UtcNow;
        }

        public void RecordLoginFailure(int maxAttemps = 5, int lockMinutes = 15)
        {
            FailedLoginAttempts++;
            if (FailedLoginAttempts >= maxAttemps)
            {
                LockoutUntil = DateTime.UtcNow.AddMinutes(lockMinutes);
            }
            UpdatedAt = DateTime.UtcNow;
        }

        // Dùng để kiểm tra xem tài khoản có đang bị khoá hay không (do vượt quá số lần đăng nhập thất bại)
        public bool IsLocked()
        {
            return LockoutUntil.HasValue && LockoutUntil > DateTime.UtcNow;
        }


        public void EnsureCanLogin()
        {
            if (!IsActive)
                throw new DomainException("Tài khoản đã bị khoá hoặc xoá.");
            if (IsLocked())
                throw new DomainException($"Tài khoản đang bị khoá đến {LockoutUntil.Value}.");
        }   

        public void ChangePassword(PasswordHash newPasswordHash)
        {
            PasswordHash = newPasswordHash;
            UpdatedAt = DateTime.UtcNow;
        }
        // Dùng để khoá tài khoản tạm thời vì một lý do nào đó (ví dụ: vi phạm chính sách, yêu cầu từ người dùng, v.v.)
        public void Deactivate()
        {
            IsActive = false;
            UpdatedAt = DateTime.UtcNow;
        }

        public void Activate()
        {
            IsActive = true;
            UpdatedAt = DateTime.UtcNow;
        }
        // Dùng để xoá tài khoản một cách mềm mại, vẫn giữ lại dữ liệu nhưng đánh dấu là đã xoá
        public void SoftDelete()
        {
            IsActive = false;
            DeletedAt = DateTime.UtcNow;
        }
    }
}
