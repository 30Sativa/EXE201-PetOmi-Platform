using System.Net;
using System.Net.Mail;
using PetOmiPlatform.Application.Interfaces;
using Microsoft.Extensions.Options;
using PetOmiPlatform.Infrastructure.Common.Settings;

namespace PetOmiPlatform.Infrastructure.Services
{
    public class EmailService : IEmailService
    {
        private readonly SmtpSettings _settings;

        public EmailService(IOptions<SmtpSettings> settings)
            => _settings = settings.Value;

        public async Task SendEmailVerificationAsync(string toEmail, string verificationLink)
        {
            var subject = "Xác minh email của bạn - PetOmi";
            var body = $@"
                <h2>Xin chào!</h2>
                <p>Vui lòng click vào link bên dưới để xác minh email:</p>
                <a href='{verificationLink}'>Xác minh email</a>
                <p>Link có hiệu lực trong 24 giờ.</p>
                <p>Nếu bạn không đăng ký, hãy bỏ qua email này.</p>
            ";
            await SendAsync(toEmail, subject, body);
        }

        public async Task SendPasswordResetAsync(string toEmail, string resetLink)
        {
            var subject = "Đặt lại mật khẩu - PetOmi";
            var body = $@"
                <h2>Xin chào!</h2>
                <p>Vui lòng click vào link bên dưới để đặt lại mật khẩu:</p>
                <a href='{resetLink}'>Đặt lại mật khẩu</a>
                <p>Link có hiệu lực trong 1 giờ.</p>
                <p>Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
            ";
            await SendAsync(toEmail, subject, body);
        }

        private async Task SendAsync(string toEmail, string subject, string body)
        {
            using var client = new SmtpClient(_settings.Host, _settings.Port)
            {
                Credentials = new NetworkCredential(_settings.Username, _settings.Password),
                EnableSsl = true
            };

            var message = new MailMessage
            {
                From = new MailAddress(_settings.From, "PetOmi Platform"),
                Subject = subject,
                Body = body,
                IsBodyHtml = true
            };
            message.To.Add(toEmail);

            await client.SendMailAsync(message);
        }
    }
}
