namespace PetOmiPlatform.Application.Features.ChatSubscription;

internal static class ChatSubscriptionUtcDateTime
{
    public static DateTime Normalize(DateTime value)
    {
        return value.Kind == DateTimeKind.Utc
            ? value
            : DateTime.SpecifyKind(value, DateTimeKind.Utc);
    }

    public static DateTime? Normalize(DateTime? value)
    {
        return value.HasValue ? Normalize(value.Value) : null;
    }
}
