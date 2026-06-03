namespace PetOmiPlatform.Application.Interfaces
{
    public interface ISePayService
    {
        string BuildQrImageUrl(string accountNumber, string bankCode, decimal amount, string transferContent);
        string GeneratePaymentReference();
        bool IsValidPaymentReference(string paymentReference);
    }
}
