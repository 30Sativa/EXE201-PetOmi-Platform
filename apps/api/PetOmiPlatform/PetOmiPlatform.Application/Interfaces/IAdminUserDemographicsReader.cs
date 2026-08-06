namespace PetOmiPlatform.Application.Interfaces;

public interface IAdminUserDemographicsReader
{
    Task<AdminUserDemographicsReadModel> ReadAsync(
        DateOnly asOfDate,
        CancellationToken cancellationToken = default);
}

public sealed class AdminUserDemographicsReadModel
{
    public List<AdminDemographicBucketReadModel> AgeGroups { get; init; } = new();
    public List<AdminDemographicBucketReadModel> Locations { get; init; } = new();
}

public sealed record AdminDemographicBucketReadModel(
    string Key,
    string Label,
    int Count);
