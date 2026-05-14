using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Infrastructure.Common.Settings;
using Resend;

namespace PetOmiPlatform.Infrastructure.Services
{
    public class EmailService : IEmailService
    {
        private readonly ResendClient _resendClient;
        private readonly IConfiguration _configuration;
        public EmailService(
            ResendClient resendClient,
            IConfiguration configuration)
        {
            _resendClient = resendClient;
            _configuration = configuration;
        }
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
            var fromEmail = _configuration["Resend:FromEmail"];

            var message = new EmailMessage
            {
                From = fromEmail,
                To = toEmail,
                Subject = subject,
                HtmlBody = body
            };

            await _resendClient.EmailSendAsync(message);
        }
    }
}
