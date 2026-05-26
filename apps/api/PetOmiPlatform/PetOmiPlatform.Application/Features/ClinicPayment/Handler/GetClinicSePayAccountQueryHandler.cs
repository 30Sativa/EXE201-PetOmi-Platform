using MediatR;
using PetOmiPlatform.Application.Features.Clinic.Authorization;
using PetOmiPlatform.Application.Features.ClinicPayment.DTOs.Response;
using PetOmiPlatform.Application.Features.ClinicPayment.Mappers;
using PetOmiPlatform.Application.Features.ClinicPayment.Query;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.ClinicPayment.Handler
{
    public class GetClinicSePayAccountQueryHandler : IRequestHandler<GetClinicSePayAccountQuery, ClinicSePayAccountResponse?>
    {
        private readonly IVetClinicRepository _vetClinicRepository;
        private readonly IClinicPaymentAccountRepository _clinicPaymentAccountRepository;

        public GetClinicSePayAccountQueryHandler(
            IVetClinicRepository vetClinicRepository,
            IClinicPaymentAccountRepository clinicPaymentAccountRepository)
        {
            _vetClinicRepository = vetClinicRepository;
            _clinicPaymentAccountRepository = clinicPaymentAccountRepository;
        }

        public async Task<ClinicSePayAccountResponse?> Handle(GetClinicSePayAccountQuery request, CancellationToken cancellationToken)
        {
            var staff = await _vetClinicRepository.GetByUserIdAndClinicIdAsync(request.StaffUserId, request.ClinicId);
            ClinicRoleGuard.RequireActiveStaff(staff);

            var account = await _clinicPaymentAccountRepository.GetActiveByClinicIdAndProviderAsync(
                request.ClinicId,
                PaymentProvider.SePay);

            return account?.ToResponse();
        }
    }
}
