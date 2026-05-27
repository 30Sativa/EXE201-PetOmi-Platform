namespace PetOmiPlatform.Infrastructure.Common.Settings
{
    public class SePaySettings
    {
        public string QrBaseUrl { get; set; } = "https://qr.sepay.vn/img";
        public string? WebhookApiKey { get; set; }
        public string? WebhookSecret { get; set; }
        public bool RequireHmacSignature { get; set; } = false;
        public int MaxTimestampSkewSeconds { get; set; } = 300;
    }
}
