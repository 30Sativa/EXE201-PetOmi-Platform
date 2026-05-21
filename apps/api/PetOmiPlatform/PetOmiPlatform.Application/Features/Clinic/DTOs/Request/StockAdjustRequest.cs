namespace PetOmiPlatform.Application.Features.Clinic.DTOs.Request
{
    public class StockAdjustRequest
    {
        public int Amount { get; set; }  // dương = nhập vào, âm = không dùng — dùng endpoint riêng
        public string? Note { get; set; }
    }
}
