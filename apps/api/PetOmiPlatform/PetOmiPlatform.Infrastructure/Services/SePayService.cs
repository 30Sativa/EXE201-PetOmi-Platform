using Microsoft.Extensions.Options;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Infrastructure.Common.Settings;
using System.Security.Cryptography;
using System.Text.RegularExpressions;

namespace PetOmiPlatform.Infrastructure.Services
{
    public class SePayService : ISePayService
    {
        private readonly SePaySettings _settings;

        public SePayService(IOptions<SePaySettings> settings)
        {
            _settings = settings.Value;
        }

        public string BuildQrImageUrl(string accountNumber, string bankCode, decimal amount, string transferContent)
        {
            var encodedContent = Uri.EscapeDataString(transferContent);
            var amountValue = decimal.ToInt64(decimal.Truncate(amount));
            return $"{_settings.QrBaseUrl}?acc={accountNumber}&bank={bankCode}&amount={amountValue}&des={encodedContent}";
        }

        public string GeneratePaymentReference()
        {
            var prefix = NormalizePrefix(_settings.PaymentReferencePrefix);
            var digits = Math.Clamp(_settings.PaymentReferenceDigits, 6, 8);
            var upperBound = (int)Math.Pow(10, digits);
            var number = RandomNumberGenerator.GetInt32(0, upperBound);

            return $"{prefix}{number.ToString().PadLeft(digits, '0')}";
        }

        public bool IsValidPaymentReference(string paymentReference)
        {
            if (string.IsNullOrWhiteSpace(paymentReference))
            {
                return false;
            }

            var prefix = NormalizePrefix(_settings.PaymentReferencePrefix);
            var digits = Math.Clamp(_settings.PaymentReferenceDigits, 6, 8);
            return Regex.IsMatch(
                paymentReference.Trim(),
                $"^{Regex.Escape(prefix)}\\d{{{digits}}}$",
                RegexOptions.IgnoreCase);
        }

        public SePayPlatformAccount? GetPlatformPaymentAccount()
        {
            if (string.IsNullOrWhiteSpace(_settings.PlatformBankAccountNo) ||
                string.IsNullOrWhiteSpace(_settings.PlatformBankCode))
            {
                return null;
            }

            return new SePayPlatformAccount
            {
                BankAccountNo = _settings.PlatformBankAccountNo.Trim(),
                BankCode = _settings.PlatformBankCode.Trim().ToUpperInvariant()
            };
        }

        private static string NormalizePrefix(string? prefix)
        {
            return string.IsNullOrWhiteSpace(prefix)
                ? "POM"
                : prefix.Trim().ToUpperInvariant();
        }
    }
}
