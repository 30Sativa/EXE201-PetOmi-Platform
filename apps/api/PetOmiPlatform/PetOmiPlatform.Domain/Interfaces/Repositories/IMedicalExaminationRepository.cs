using PetOmiPlatform.Domain.Entities;

namespace PetOmiPlatform.Domain.Interfaces.Repositories
{
    public interface IMedicalExaminationRepository
    {
        Task AddAsync(MedicalExaminationDomain examination);
        Task<MedicalExaminationDomain?> GetByIdAsync(Guid examinationId);
        Task<MedicalExaminationDomain?> GetByAppointmentIdAsync(Guid appointmentId);
        Task<IEnumerable<MedicalExaminationDomain>> GetByPetIdAsync(Guid petId, int page, int pageSize);
        Task UpdateAsync(MedicalExaminationDomain examination);
    }
}
