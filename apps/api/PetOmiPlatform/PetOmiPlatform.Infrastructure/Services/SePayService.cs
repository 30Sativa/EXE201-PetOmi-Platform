using Microsoft.Extensions.Options;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Infrastructure.Common.Settings;

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
    }
}
