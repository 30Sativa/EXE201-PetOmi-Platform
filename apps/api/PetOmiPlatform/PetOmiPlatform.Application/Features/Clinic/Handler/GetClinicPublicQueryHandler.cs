using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Clinic.Command;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Clinic.Handler
{
    public class GetClinicPublicQueryHandler : IRequestHandler<GetClinicPublicQuery, ClinicPublicResponse>
    {
        private readonly IClinicRepository _clinicRepository;
        private readonly IClinicServiceRepository _serviceRepository;

        public GetClinicPublicQueryHandler(
            IClinicRepository clinicRepository,
            IClinicServiceRepository serviceRepository)
        {
            _clinicRepository = clinicRepository;
            _serviceRepository = serviceRepository;
        }

        public async Task<ClinicPublicResponse> Handle(GetClinicPublicQuery request, CancellationToken cancellationToken)
        {
            var clinic = await _clinicRepository.GetByIdAsync(request.ClinicId)
                ?? throw new NotFoundException("Không tìm thấy phòng khám.");

            // Chỉ trả về clinic đã Approved
            clinic.EnsureApproved();

            // Lấy danh sách dịch vụ active
            var services = await _serviceRepository.GetByClinicIdAsync(clinic.Id, activeOnly: true);

            return new ClinicPublicResponse
            {
                ClinicId = clinic.Id,
                ClinicName = clinic.ClinicName,
                Address = clinic.Address,
                Phone = clinic.Phone,
                Email = clinic.Email,
                LogoUrl = clinic.LogoUrl,
                Description = clinic.Description,
                OpeningHours = clinic.OpeningHours,
                Services = services.Select(s => new ClinicServiceResponse
                {
                    ServiceId = s.Id,
                    ServiceName = s.ServiceName,
                    Description = s.Description,
                    Price = s.Price,
                    DurationMins = s.DurationMins,
                    IsActive = s.IsActive
                }).ToList()
            };
        }
    }
}
