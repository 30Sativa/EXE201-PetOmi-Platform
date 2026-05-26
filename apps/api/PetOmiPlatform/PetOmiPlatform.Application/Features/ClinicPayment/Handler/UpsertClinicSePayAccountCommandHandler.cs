using MediatR;
using PetOmiPlatform.Application.Features.Clinic.Authorization;
using PetOmiPlatform.Application.Features.ClinicPayment.Command;
using PetOmiPlatform.Application.Features.ClinicPayment.DTOs.Response;
using PetOmiPlatform.Application.Features.ClinicPayment.Mappers;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.ClinicPayment.Handler
{
    public class UpsertClinicSePayAccountCommandHandler : IRequestHandler<UpsertClinicSePayAccountCommand, ClinicSePayAccountResponse>
    {
        private readonly IVetClinicRepository _vetClinicRepository;
        private readonly IClinicPaymentAccountRepository _clinicPaymentAccountRepository;
        private readonly IUnitOfWork _unitOfWork;

        public UpsertClinicSePayAccountCommandHandler(
            IVetClinicRepository vetClinicRepository,
            IClinicPaymentAccountRepository clinicPaymentAccountRepository,
            IUnitOfWork unitOfWork)
        {
            _vetClinicRepository = vetClinicRepository;
            _clinicPaymentAccountRepository = clinicPaymentAccountRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ClinicSePayAccountResponse> Handle(UpsertClinicSePayAccountCommand request, CancellationToken cancellationToken)
        {
            var staff = await _vetClinicRepository.GetByUserIdAndClinicIdAsync(request.StaffUserId, request.ClinicId);
            ClinicRoleGuard.RequireClinicOwner(staff);

            var normalizedBankCode = request.Payload.BankCode.Trim();
            var normalizedAccountNumber = request.Payload.AccountNumber.Trim();
            var normalizedBankName = request.Payload.BankName?.Trim();
            var normalizedAccountName = request.Payload.AccountName?.Trim();

            await _clinicPaymentAccountRepository.UpsertActiveSePayAccountAsync(
                request.ClinicId,
                normalizedBankCode,
                normalizedAccountNumber,
                normalizedBankName,
                normalizedAccountName);

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var account = await _clinicPaymentAccountRepository.GetActiveByClinicIdAndProviderAsync(
                request.ClinicId,
                PaymentProvider.SePay);

            if (account == null)
            {
                account = ClinicPaymentAccountDomain.Create(
                    request.ClinicId,
                    PaymentProvider.SePay,
                    normalizedBankCode,
                    normalizedAccountNumber,
                    normalizedBankName,
                    normalizedAccountName);
            }

            return account.ToResponse();
        }
    }
}
