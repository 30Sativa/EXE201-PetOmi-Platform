namespace PetOmiPlatform.Application.Features.ClinicPayment.DTOs.Response
{
    public class ClinicSePayAccountResponse
    {
        public Guid ClinicId { get; set; }
        public string Provider { get; set; } = "SePay";
        public string BankCode { get; set; } = string.Empty;
        public string? BankName { get; set; }
        public string AccountNumberMasked { get; set; } = string.Empty;
        public string? AccountName { get; set; }
        public bool IsActive { get; set; }
    }
}
