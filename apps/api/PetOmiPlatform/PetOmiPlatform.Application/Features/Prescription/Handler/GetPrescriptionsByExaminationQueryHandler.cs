using MediatR;
using PetOmiPlatform.Application.Features.Prescription.DTOs.Response;
using PetOmiPlatform.Application.Features.Prescription.Query;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Prescription.Handler
{
    public class GetPrescriptionsByExaminationQueryHandler : IRequestHandler<GetPrescriptionsByExaminationQuery, IEnumerable<PrescriptionItemResponse>>
    {
        private readonly IPrescriptionRepository _prescriptionRepository;

        public GetPrescriptionsByExaminationQueryHandler(IPrescriptionRepository prescriptionRepository)
        {
            _prescriptionRepository = prescriptionRepository;
        }

        public async Task<IEnumerable<PrescriptionItemResponse>> Handle(GetPrescriptionsByExaminationQuery request, CancellationToken cancellationToken)
        {
            var prescriptions = await _prescriptionRepository.GetByExaminationIdAsync(request.ExaminationId);

            return prescriptions.Select(p => new PrescriptionItemResponse
            {
                Id = p.Id,
                ExaminationId = p.ExaminationId,
                MedicationName = p.MedicationName,
                Dosage = p.Dosage,
                Frequency = p.Frequency,
                DurationDays = p.DurationDays,
                Instructions = p.Instructions,
                InventoryItemId = p.InventoryItemId,
                CreatedAt = p.CreatedAt
            });
        }
    }
}
