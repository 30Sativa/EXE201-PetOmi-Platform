namespace PetOmiPlatform.Domain.Common.Enums;

public enum ChatSubscriptionScopeType
{
    OwnerPet,
    Clinic
}

public enum ChatSubscriptionStatus
{
    Active,
    Expired,
    Cancelled
}

public enum ChatSubscriptionPaymentStatus
{
    Pending,
    Paid,
    Expired,
    Cancelled
}
