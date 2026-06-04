using Microsoft.EntityFrameworkCore;
using PetOmiPlatform.Application.Features.PetAi.DTOs.Response;
using PetOmiPlatform.Application.Features.PetAi.Interfaces;
using PetOmiPlatform.Infrastructure.Persistence.Contexts;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PetOmiPlatform.Infrastructure.Persistence.Repositories.PetAi;

public class PetAiRepository : IPetAiRepository
{
    private readonly PetOmniDbContext _context;

    public PetAiRepository(PetOmniDbContext context)
    {
        _context = context;
    }

    public async Task<PetBasicContextResponse?> GetBasicContextAsync(Guid petId)
    {
        var pet = await _context.Pets
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.PetId == petId && p.IsActive);

        if (pet == null) return null;

        int? ageMonths = null;
        string? ageFormatted = null;

        if (pet.DateOfBirth.HasValue)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var birth = pet.DateOfBirth.Value;
            ageMonths = (today.Year - birth.Year) * 12 + (today.Month - birth.Month);
            if (ageMonths < 0) ageMonths = 0;

            var years = ageMonths / 12;
            var months = ageMonths % 12;
            if (years == 0)
                ageFormatted = $"{months} months";
            else if (months == 0)
                ageFormatted = $"{years} year{(years > 1 ? "s" : "")}";
            else
                ageFormatted = $"{years}y {months}m";
        }

        return new PetBasicContextResponse
        {
            PetId = pet.PetId,
            Name = pet.Name,
            Species = pet.Species,
            Breed = pet.Breed,
            Gender = pet.Gender,
            DateOfBirth = pet.DateOfBirth,
            IsBirthDateEstimated = pet.IsBirthDateEstimated,
            AvatarUrl = pet.AvatarUrl,
            OwnerUserId = pet.OwnerUserId,
            CreatedAt = pet.CreatedAt,
            AgeMonths = ageMonths,
            AgeFormatted = ageFormatted
        };
    }

    public async Task<PetMedicalSummaryResponse?> GetMedicalSummaryAsync(Guid petId)
    {
        var petExists = await _context.Pets
            .AsNoTracking()
            .AnyAsync(p => p.PetId == petId && p.IsActive);

        if (!petExists) return null;

        var healthProfile = await _context.PetHealthProfiles
            .AsNoTracking()
            .Where(h => h.PetId == petId)
            .Select(h => new PetHealthProfileDto
            {
                PetHealthProfileId = h.PetHealthProfileId,
                CurrentWeightKg = h.CurrentWeightKg,
                IsNeutered = h.IsNeutered,
                Allergies = h.Allergies,
                ChronicConditions = h.ChronicConditions,
                MicrochipNumber = h.MicrochipNumber,
                Color = h.Color,
                UpdatedAt = h.UpdatedAt ?? h.CreatedAt
            })
            .FirstOrDefaultAsync();

        var recentWeightLogs = await _context.PetWeightLogs
            .AsNoTracking()
            .Where(w => w.PetId == petId)
            .OrderByDescending(w => w.MeasuredAt)
            .Take(20)
            .Select(w => new PetWeightLogDto
            {
                WeightLogId = w.WeightLogId,
                WeightKg = w.WeightKg,
                MeasuredAt = w.MeasuredAt,
                Note = w.Note,
                Source = w.Source,
                CreatedAt = w.CreatedAt
            })
            .ToListAsync();

        var vaccinations = await _context.PetMedicalRecords
            .AsNoTracking()
            .Where(r => r.PetId == petId
                && r.IsActive
                && (r.RecordType == "Vaccine" || r.RecordType == "Vaccination"))
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new PetVaccinationDto
            {
                MedicalRecordId = r.MedicalRecordId,
                Title = r.Title,
                RecordType = r.RecordType,
                ClinicName = r.ClinicName,
                VetName = r.VetName,
                MedicationName = r.MedicationName,
                Dosage = r.Dosage,
                RecordDate = r.RecordDate,
                CreatedAt = r.CreatedAt
            })
            .ToListAsync();

        var medicalRecords = await _context.PetMedicalRecords
            .AsNoTracking()
            .Where(r => r.PetId == petId
                && r.IsActive
                && r.RecordType != "Vaccine"
                && r.RecordType != "Vaccination")
            .OrderByDescending(r => r.CreatedAt)
            .Take(20)
            .Select(r => new PetMedicalRecordDto
            {
                MedicalRecordId = r.MedicalRecordId,
                Title = r.Title,
                RecordType = r.RecordType,
                Description = r.Description,
                RecordDate = r.RecordDate,
                ClinicName = r.ClinicName,
                VetName = r.VetName,
                MedicationName = r.MedicationName,
                Dosage = r.Dosage,
                StartDate = r.StartDate,
                EndDate = r.EndDate,
                AttachmentUrl = r.AttachmentUrl,
                CreatedAt = r.CreatedAt
            })
            .ToListAsync();

        return new PetMedicalSummaryResponse
        {
            PetId = petId,
            HealthProfile = healthProfile,
            RecentWeightLogs = recentWeightLogs,
            Vaccinations = vaccinations,
            MedicalRecords = medicalRecords
        };
    }

    public async Task<RecentMessagesResponse?> GetRecentMessagesAsync(Guid conversationId, int take = 20)
    {
        var conv = await _context.Conversations
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.ConversationId == conversationId && c.IsActive);

        if (conv == null) return null;

        var messages = await _context.ChatMessages
            .AsNoTracking()
            .Where(m => m.ConversationId == conversationId && m.IsActive)
            .OrderByDescending(m => m.CreatedAt)
            .Take(take)
            .OrderBy(m => m.CreatedAt)
            .Select(m => new ConversationMessageDto
            {
                MessageId = m.MessageId,
                SenderRole = m.SenderRole,
                Content = m.Content,
                Intent = m.Intent,
                UrgencyLevel = m.UrgencyLevel,
                RagUsed = m.RagUsed,
                ChunksUsed = m.ChunksUsed,
                Model = m.Model,
                TokensInput = m.TokensInput,
                TokensOutput = m.TokensOutput,
                CreatedAt = m.CreatedAt
            })
            .ToListAsync();

        var totalCount = await _context.ChatMessages
            .AsNoTracking()
            .CountAsync(m => m.ConversationId == conversationId && m.IsActive);

        return new RecentMessagesResponse
        {
            ConversationId = conv.ConversationId,
            UserId = conv.UserId,
            PetId = conv.PetId,
            Title = conv.Title,
            Messages = messages,
            TotalCount = totalCount
        };
    }
}
