using Microsoft.EntityFrameworkCore;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Infrastructure.Persistence.Contexts;

namespace PetOmiPlatform.Infrastructure.Persistence.Repositories;

public sealed class AdminUserBehaviorReader : IAdminUserBehaviorReader
{
    private readonly PetOmniDbContext _context;

    public AdminUserBehaviorReader(PetOmniDbContext context)
    {
        _context = context;
    }

    public async Task<AdminUserBehaviorReadModel> ReadAsync(
        DateTime fromUtc,
        DateTime toExclusiveUtc,
        bool? isSynthetic,
        CancellationToken cancellationToken = default)
    {
        var users = await _context.Users
            .AsNoTracking()
            .Where(user =>
                (!isSynthetic.HasValue || user.IsSynthetic == isSynthetic.Value) &&
                user.CreatedAt < toExclusiveUtc &&
                user.DeletedAt == null &&
                user.UserRoles.Any(userRole =>
                    userRole.Role != null && userRole.Role.RoleName == "Owner"))
            .OrderBy(user => user.CreatedAt)
            .Select(user => new UserBehaviorUserReadModel(
                user.UserId,
                user.Email,
                user.UserProfile != null ? user.UserProfile.FullName : null,
                user.IsSynthetic,
                user.CreatedAt))
            .ToListAsync(cancellationToken);

        var pets = await _context.Pets
            .AsNoTracking()
            .Where(pet =>
                (!isSynthetic.HasValue || pet.OwnerUser.IsSynthetic == isSynthetic.Value) &&
                pet.CreatedAt < toExclusiveUtc &&
                pet.OwnerUser.UserRoles.Any(userRole =>
                    userRole.Role != null && userRole.Role.RoleName == "Owner") &&
                pet.IsActive &&
                pet.DeletedAt == null)
            .OrderBy(pet => pet.CreatedAt)
            .Select(pet => new UserBehaviorPetReadModel(
                pet.PetId,
                pet.OwnerUserId,
                pet.Name,
                pet.CreatedAt))
            .ToListAsync(cancellationToken);

        var sessions = await _context.UserSessions
            .AsNoTracking()
            .Where(session =>
                (!isSynthetic.HasValue || session.User.IsSynthetic == isSynthetic.Value) &&
                session.User.UserRoles.Any(userRole =>
                    userRole.Role != null && userRole.Role.RoleName == "Owner") &&
                session.CreatedAt >= fromUtc &&
                session.CreatedAt < toExclusiveUtc)
            .Select(session => new UserBehaviorSessionReadModel(
                session.UserId,
                session.CreatedAt,
                session.LogoutAt))
            .ToListAsync(cancellationToken);

        var messages = await _context.ChatMessages
            .AsNoTracking()
            .Where(message =>
                message.IsActive &&
                message.Conversation != null &&
                message.Conversation.User != null &&
                (!isSynthetic.HasValue || message.Conversation.User.IsSynthetic == isSynthetic.Value) &&
                message.Conversation.User.UserRoles.Any(userRole =>
                    userRole.Role != null && userRole.Role.RoleName == "Owner") &&
                message.CreatedAt >= fromUtc &&
                message.CreatedAt < toExclusiveUtc)
            .Select(message => new UserBehaviorMessageReadModel(
                message.MessageId,
                message.ConversationId,
                message.Conversation!.UserId,
                message.SenderRole,
                message.Content,
                message.Intent,
                message.CreatedAt))
            .ToListAsync(cancellationToken);

        var medicalNotes = await _context.PetMedicalRecords
            .AsNoTracking()
            .Where(record =>
                record.IsActive &&
                record.DeletedAt == null &&
                (!isSynthetic.HasValue || record.Pet.OwnerUser.IsSynthetic == isSynthetic.Value) &&
                record.Pet.OwnerUser.UserRoles.Any(userRole =>
                    userRole.Role != null && userRole.Role.RoleName == "Owner") &&
                record.CreatedAt >= fromUtc &&
                record.CreatedAt < toExclusiveUtc)
            .Select(record => new UserBehaviorMedicalNoteReadModel(
                record.MedicalRecordId,
                record.Pet.OwnerUserId,
                record.CreatedAt))
            .ToListAsync(cancellationToken);

        var reminders = await _context.Reminders
            .AsNoTracking()
            .Where(reminder =>
                (!isSynthetic.HasValue || reminder.User.IsSynthetic == isSynthetic.Value) &&
                reminder.User.UserRoles.Any(userRole =>
                    userRole.Role != null && userRole.Role.RoleName == "Owner") &&
                reminder.CreatedAt >= fromUtc &&
                reminder.CreatedAt < toExclusiveUtc)
            .Select(reminder => new UserBehaviorReminderReadModel(
                reminder.ReminderId,
                reminder.UserId,
                reminder.CreatedAt))
            .ToListAsync(cancellationToken);

        return new AdminUserBehaviorReadModel
        {
            Users = users,
            Pets = pets,
            Sessions = sessions,
            Messages = messages,
            MedicalNotes = medicalNotes,
            Reminders = reminders
        };
    }
}
