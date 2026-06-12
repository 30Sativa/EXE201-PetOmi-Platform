namespace PetOmiPlatform.Application.Interfaces
{
    public interface ISePayService
    {
        string BuildQrImageUrl(string accountNumber, string bankCode, decimal amount, string transferContent);
        string GeneratePaymentReference();
        bool IsValidPaymentReference(string paymentReference);
        SePayPlatformAccount? GetPlatformPaymentAccount();
    }

    public class SePayPlatformAccount
    {
        public string BankAccountNo { get; set; } = string.Empty;
        public string BankCode { get; set; } = string.Empty;
    }
}
