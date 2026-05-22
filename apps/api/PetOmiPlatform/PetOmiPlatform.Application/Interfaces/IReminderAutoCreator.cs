using PetOmiPlatform.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Interfaces
{
    public interface IReminderAutoCreator
    {
        Task<List<ReminderDomain>> CreateRemindersFromMedicalRecordAsync(
            PetMedicalRecordDomain medicalRecord,
            Guid ownerUserId,
            string? petName,
            CancellationToken ct = default);

        Task<List<ReminderDomain>> CreateReminderFromAppointmentAsync(
            Guid appointmentId,
            Guid petId,
            Guid ownerUserId,
            DateOnly appointmentDate,
            string? petName,
            CancellationToken ct = default);
    }
}
