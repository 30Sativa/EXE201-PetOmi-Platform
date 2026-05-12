using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Interfaces
{
    public interface IEmailService
    {
        Task SendEmailVerificationAsync(string toEmail, string verificationLink);
        Task SendPasswordResetAsync(string toEmail, string resetLink);
    }
}
