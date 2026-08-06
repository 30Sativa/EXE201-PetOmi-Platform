using Microsoft.EntityFrameworkCore;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Infrastructure.Persistence.Contexts;

namespace PetOmiPlatform.Infrastructure.Persistence.Repositories;

public sealed class AdminUserDemographicsReader : IAdminUserDemographicsReader
{
    private const int TopLocationCount = 5;
    private readonly PetOmniDbContext _context;

    public AdminUserDemographicsReader(PetOmniDbContext context)
    {
        _context = context;
    }

    public async Task<AdminUserDemographicsReadModel> ReadAsync(
        DateOnly asOfDate,
        CancellationToken cancellationToken = default)
    {
        var users = _context.Users
            .AsNoTracking()
            .Where(user => !user.IsSynthetic);

        var cutoff18 = asOfDate.AddYears(-18);
        var cutoff25 = asOfDate.AddYears(-25);
        var cutoff35 = asOfDate.AddYears(-35);
        var cutoff45 = asOfDate.AddYears(-45);

        var ageCounts = await users
            .Select(user =>
                user.UserProfile == null ||
                user.UserProfile.DateOfBirth == null ||
                user.UserProfile.DateOfBirth > asOfDate
                    ? "unknown"
                    : user.UserProfile.DateOfBirth > cutoff18
                        ? "under-18"
                        : user.UserProfile.DateOfBirth > cutoff25
                            ? "18-24"
                            : user.UserProfile.DateOfBirth > cutoff35
                                ? "25-34"
                                : user.UserProfile.DateOfBirth > cutoff45
                                    ? "35-44"
                                    : "45-plus")
            .GroupBy(key => key)
            .Select(group => new { Key = group.Key, Count = group.Count() })
            .ToDictionaryAsync(item => item.Key, item => item.Count, cancellationToken);

        var rawAddressCounts = await users
            .Select(user => user.UserProfile != null ? user.UserProfile.Address : null)
            .GroupBy(address => address)
            .Select(group => new { Address = group.Key, Count = group.Count() })
            .ToListAsync(cancellationToken);

        var ageGroups = new[]
        {
            new AdminDemographicBucketReadModel("under-18", "Dưới 18", GetCount(ageCounts, "under-18")),
            new AdminDemographicBucketReadModel("18-24", "18-24", GetCount(ageCounts, "18-24")),
            new AdminDemographicBucketReadModel("25-34", "25-34", GetCount(ageCounts, "25-34")),
            new AdminDemographicBucketReadModel("35-44", "35-44", GetCount(ageCounts, "35-44")),
            new AdminDemographicBucketReadModel("45-plus", "45+", GetCount(ageCounts, "45-plus")),
            new AdminDemographicBucketReadModel("unknown", "Chưa cập nhật", GetCount(ageCounts, "unknown"))
        };

        var groupedLocations = rawAddressCounts
            .Select(item => new { Location = ExtractLocation(item.Address), item.Count })
            .Where(item => item.Location != null)
            .GroupBy(item => item.Location!, StringComparer.OrdinalIgnoreCase)
            .Select(group => new { Label = group.Key, Count = group.Sum(item => item.Count) })
            .OrderByDescending(item => item.Count)
            .ThenBy(item => item.Label)
            .ToList();

        var locations = groupedLocations
            .Take(TopLocationCount)
            .Select(item => new AdminDemographicBucketReadModel(item.Label, item.Label, item.Count))
            .ToList();

        var otherLocationCount = groupedLocations
            .Skip(TopLocationCount)
            .Sum(item => item.Count);
        if (otherLocationCount > 0)
        {
            locations.Add(new AdminDemographicBucketReadModel("other", "Khu vực khác", otherLocationCount));
        }

        var unknownLocationCount = rawAddressCounts
            .Where(item => ExtractLocation(item.Address) == null)
            .Sum(item => item.Count);
        if (unknownLocationCount > 0)
        {
            locations.Add(new AdminDemographicBucketReadModel("unknown", "Chưa cập nhật", unknownLocationCount));
        }

        return new AdminUserDemographicsReadModel
        {
            AgeGroups = ageGroups.ToList(),
            Locations = locations
        };
    }

    private static int GetCount(IReadOnlyDictionary<string, int> counts, string key) =>
        counts.TryGetValue(key, out var count) ? count : 0;

    private static string? ExtractLocation(string? address)
    {
        if (string.IsNullOrWhiteSpace(address)) return null;

        var parts = address.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
        return parts.Length == 0 ? null : parts[^1];
    }
}
