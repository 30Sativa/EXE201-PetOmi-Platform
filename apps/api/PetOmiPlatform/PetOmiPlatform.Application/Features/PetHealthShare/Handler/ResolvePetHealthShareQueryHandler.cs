using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Clinic.Authorization;
using PetOmiPlatform.Application.Features.PetHealthShare.DTOs.Response;
using PetOmiPlatform.Application.Features.PetHealthShare.Query;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.PetHealthShare.Handler
{
    public class ResolvePetHealthShareQueryHandler
        : IRequestHandler<ResolvePetHealthShareQuery, PetHealthShareResolvedResponse>
    {
        private const string AccessType = "ResolveHealthShareCode";

        private readonly IClinicRepository _clinicRepository;
        private readonly IVetClinicRepository _vetClinicRepository;
        private readonly IPetRepository _petRepository;
        private readonly IPetHealthShareTokenRepository _shareTokenRepository;
        private readonly IPetHealthShareAccessLogRepository _accessLogRepository;
        private readonly IUnitOfWork _unitOfWork;

        public ResolvePetHealthShareQueryHandler(
            IClinicRepository clinicRepository,
            IVetClinicRepository vetClinicRepository,
            IPetRepository petRepository,
            IPetHealthShareTokenRepository shareTokenRepository,
            IPetHealthShareAccessLogRepository accessLogRepository,
            IUnitOfWork unitOfWork)
        {
            _clinicRepository = clinicRepository;
            _vetClinicRepository = vetClinicRepository;
            _petRepository = petRepository;
            _shareTokenRepository = shareTokenRepository;
            _accessLogRepository = accessLogRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<PetHealthShareResolvedResponse> Handle(
            ResolvePetHealthShareQuery query,
            CancellationToken cancellationToken)
        {
            var clinic = await _clinicRepository.GetByIdAsync(query.ClinicId)
                ?? throw new NotFoundException("Clinic", query.ClinicId);
            clinic.EnsureApproved();

            var staff = await _vetClinicRepository.GetByUserIdAndClinicIdAsync(
                query.RequestUserId,
                query.ClinicId);
            ClinicRoleGuard.RequireActiveStaff(staff);

            var shareCode = query.Request.ShareCode.Trim().ToUpperInvariant();
            var shareToken = await _shareTokenRepository.GetByDisplayCodeAsync(shareCode);
            if (shareToken == null)
            {
                var latestToken = await _shareTokenRepository.GetLatestByDisplayCodeAsync(shareCode);
                if (latestToken != null)
                {
                    await LogFailureAsync(
                        latestToken,
                        query,
                        "Ma chia se ho so suc khoe da bi thu hoi.",
                        cancellationToken);
                }

                throw new NotFoundException("Ma chia se ho so suc khoe khong ton tai hoac da bi thu hoi.");
            }

            var nowUtc = DateTime.UtcNow;
            if (shareToken.IsExpired(nowUtc))
            {
                await LogFailureAsync(
                    shareToken,
                    query,
                    "Ma chia se ho so suc khoe da het han.",
                    cancellationToken);
                throw new ValidationException("ShareCode", "Ma chia se ho so suc khoe da het han.");
            }

            if (shareToken.HasReachedMaxUses())
            {
                await LogFailureAsync(
                    shareToken,
                    query,
                    "Ma chia se ho so suc khoe da dat gioi han su dung.",
                    cancellationToken);
                throw new ValidationException("ShareCode", "Ma chia se ho so suc khoe da dat gioi han su dung.");
            }

            if (shareToken.ClinicId.HasValue && shareToken.ClinicId.Value != query.ClinicId)
            {
                await LogFailureAsync(
                    shareToken,
                    query,
                    "Ma chia se ho so suc khoe khong thuoc phong kham nay.",
                    cancellationToken);
                throw new ForbiddenException("Ma chia se ho so suc khoe khong thuoc phong kham nay.");
            }

            var pet = await _petRepository.GetByIdAsync(shareToken.PetId)
                ?? throw new NotFoundException("Khong tim thay ho so thu cung.");
            if (!pet.IsActive)
            {
                await LogFailureAsync(
                    shareToken,
                    query,
                    "Ho so thu cung da bi xoa.",
                    cancellationToken);
                throw new NotFoundException("Ho so thu cung da bi xoa.");
            }

            shareToken.RegisterSuccessfulUse(nowUtc);
            await _shareTokenRepository.UpdateAsync(shareToken);
            await _accessLogRepository.AddAsync(PetHealthShareAccessLogDomain.Create(
                shareTokenId: shareToken.Id,
                petId: shareToken.PetId,
                clinicId: query.ClinicId,
                accessedByUserId: query.RequestUserId,
                accessType: AccessType,
                result: PetHealthShareAccessResult.Succeeded,
                failureReason: null,
                ipAddress: query.IpAddress,
                userAgent: query.UserAgent));
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return new PetHealthShareResolvedResponse
            {
                PetId = pet.Id,
                PublicPetCode = pet.PublicPetCode,
                PetName = pet.Name,
                Scope = shareToken.Scope.ToString(),
                ExpiresAt = shareToken.ExpiresAt
            };
        }

        private async Task LogFailureAsync(
            PetHealthShareTokenDomain shareToken,
            ResolvePetHealthShareQuery query,
            string failureReason,
            CancellationToken cancellationToken)
        {
            await _accessLogRepository.AddAsync(PetHealthShareAccessLogDomain.Create(
                shareTokenId: shareToken.Id,
                petId: shareToken.PetId,
                clinicId: query.ClinicId,
                accessedByUserId: query.RequestUserId,
                accessType: AccessType,
                result: PetHealthShareAccessResult.Failed,
                failureReason: Truncate(failureReason, 200),
                ipAddress: query.IpAddress,
                userAgent: query.UserAgent));
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        private static string Truncate(string value, int maxLength)
        {
            return value.Length <= maxLength ? value : value[..maxLength];
        }
    }
}
