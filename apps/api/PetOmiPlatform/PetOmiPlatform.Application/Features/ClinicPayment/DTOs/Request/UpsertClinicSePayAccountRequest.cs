namespace PetOmiPlatform.Application.Features.ClinicPayment.DTOs.Request
{
    public class UpsertClinicSePayAccountRequest
    {
        public string BankCode { get; set; } = string.Empty;
        public string AccountNumber { get; set; } = string.Empty;
        public string? BankName { get; set; }
        public string? AccountName { get; set; }
    }
}
