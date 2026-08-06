using Microsoft.EntityFrameworkCore;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Infrastructure.Persistence.Contexts;

namespace PetOmiPlatform.Infrastructure.Persistence.Repositories;

public sealed class AdminSyntheticActivityReader : IAdminSyntheticActivityReader
{
    private readonly PetOmniDbContext _context;

    public AdminSyntheticActivityReader(PetOmniDbContext context)
    {
        _context = context;
    }

    public async Task<AdminSyntheticActivityReadModel> ReadAsync(
        DateTime fromUtc,
        DateTime toExclusiveUtc,
        bool isSynthetic,
        CancellationToken cancellationToken = default)
    {
        var users = await _context.Users
            .AsNoTracking()
            .Where(user =>
                user.IsSynthetic == isSynthetic &&
                user.DeletedAt == null &&
                user.UserRoles.Any(userRole =>
                    userRole.Role != null && userRole.Role.RoleName == "Owner"))
            .OrderBy(user => user.CreatedAt)
            .Select(user => new SyntheticActivityUserReadModel(
                user.UserId,
                user.Email,
                user.UserProfile != null ? user.UserProfile.FullName : null,
                user.CreatedAt))
            .ToListAsync(cancellationToken);

        var pets = await _context.Pets
            .AsNoTracking()
            .Where(pet =>
                pet.OwnerUser.IsSynthetic == isSynthetic &&
                pet.OwnerUser.UserRoles.Any(userRole =>
                    userRole.Role != null && userRole.Role.RoleName == "Owner") &&
                pet.IsActive &&
                pet.DeletedAt == null)
            .OrderBy(pet => pet.CreatedAt)
            .Select(pet => new SyntheticActivityPetReadModel(
                pet.PetId,
                pet.OwnerUserId,
                pet.Name,
                pet.CreatedAt))
            .ToListAsync(cancellationToken);

        var sessions = await _context.UserSessions
            .AsNoTracking()
            .Where(session =>
                session.User.IsSynthetic == isSynthetic &&
                session.User.UserRoles.Any(userRole =>
                    userRole.Role != null && userRole.Role.RoleName == "Owner") &&
                session.CreatedAt >= fromUtc &&
                session.CreatedAt < toExclusiveUtc)
            .Select(session => new SyntheticActivitySessionReadModel(
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
                message.Conversation.User.IsSynthetic == isSynthetic &&
                message.Conversation.User.UserRoles.Any(userRole =>
                    userRole.Role != null && userRole.Role.RoleName == "Owner") &&
                message.CreatedAt >= fromUtc &&
                message.CreatedAt < toExclusiveUtc)
            .Select(message => new SyntheticActivityMessageReadModel(
                message.MessageId,
                message.ConversationId,
                message.Conversation!.UserId,
                message.SenderRole,
                message.CreatedAt))
            .ToListAsync(cancellationToken);

        var medicalNotes = await _context.PetMedicalRecords
            .AsNoTracking()
            .Where(record =>
                record.IsActive &&
                record.DeletedAt == null &&
                record.Pet.OwnerUser.IsSynthetic == isSynthetic &&
                record.Pet.OwnerUser.UserRoles.Any(userRole =>
                    userRole.Role != null && userRole.Role.RoleName == "Owner") &&
                record.CreatedAt >= fromUtc &&
                record.CreatedAt < toExclusiveUtc)
            .Select(record => new SyntheticActivityMedicalNoteReadModel(
                record.MedicalRecordId,
                record.Pet.OwnerUserId,
                record.CreatedAt))
            .ToListAsync(cancellationToken);

        var reminders = await _context.Reminders
            .AsNoTracking()
            .Where(reminder =>
                reminder.User.IsSynthetic == isSynthetic &&
                reminder.User.UserRoles.Any(userRole =>
                    userRole.Role != null && userRole.Role.RoleName == "Owner") &&
                reminder.CreatedAt >= fromUtc &&
                reminder.CreatedAt < toExclusiveUtc)
            .Select(reminder => new SyntheticActivityReminderReadModel(
                reminder.ReminderId,
                reminder.UserId,
                reminder.CreatedAt))
            .ToListAsync(cancellationToken);

        return new AdminSyntheticActivityReadModel
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
