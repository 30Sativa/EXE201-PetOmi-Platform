using PetOmiPlatform.Domain.Common;
using System;

namespace PetOmiPlatform.Domain.Entities;

public class ConversationDomain : BaseEntity
{
    public Guid UserId { get; private set; }
    public Guid? PetId { get; private set; }
    public string? Title { get; private set; }
    public bool IsActive { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }
    public DateTime? DeletedAt { get; private set; }

    private ConversationDomain() { }

    public static ConversationDomain Create(Guid userId, Guid? petId = null, string? title = null)
    {
        return new ConversationDomain
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            PetId = petId,
            Title = title ?? "New conversation",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    public static ConversationDomain Reconstitute(
        Guid id,
        Guid userId,
        Guid? petId,
        string? title,
        bool isActive,
        DateTime createdAt,
        DateTime? updatedAt,
        DateTime? deletedAt)
    {
        return new ConversationDomain
        {
            Id = id,
            UserId = userId,
            PetId = petId,
            Title = title,
            IsActive = isActive,
            CreatedAt = createdAt,
            UpdatedAt = updatedAt,
            DeletedAt = deletedAt
        };
    }

    public void SoftDelete()
    {
        if (!IsActive) return;
        IsActive = false;
        DeletedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateTitle(string title)
    {
        if (string.IsNullOrWhiteSpace(title)) return;
        Title = title.Length > 200 ? title[..200] : title;
        UpdatedAt = DateTime.UtcNow;
    }

    public void AttachPet(Guid petId)
    {
        if (PetId.HasValue) return;

        PetId = petId;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Touch()
    {
        UpdatedAt = DateTime.UtcNow;
    }
}
