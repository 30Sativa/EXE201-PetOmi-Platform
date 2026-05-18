using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Pet.Command;
using PetOmiPlatform.Application.Features.Pet.DTOs.Response;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Features.Pet.Handler
{
    public class UpdatePetAccessCommandHandler : IRequestHandler<UpdatePetAccessCommand, PetUserAccessResponse>
    {
        private readonly IPetRepository _petRepository;
        private readonly IPetUserAccessRepository _accessRepository;
        private readonly IUnitOfWork _unitOfWork;

        public UpdatePetAccessCommandHandler(
            IPetRepository petRepository,
            IPetUserAccessRepository accessRepository,
            IUnitOfWork unitOfWork)
        {
            _petRepository = petRepository;
            _accessRepository = accessRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<PetUserAccessResponse> Handle(UpdatePetAccessCommand command, CancellationToken cancellationToken)
        {
            var pet = await _petRepository.GetByIdAsync(command.PetId)
                ?? throw new NotFoundException("Không tìm thấy hồ sơ thú cưng.");

            pet.EnsureOwner(command.UserId);

            var access = await _accessRepository.GetByIdAsync(command.AccessId)
                ?? throw new NotFoundException("Không tìm thấy quyền truy cập.");

            if (access.PetId != command.PetId)
                throw new NotFoundException("Quyền truy cập không thuộc về thú cưng này.");

            if (access.GrantedByUserId != command.UserId && pet.OwnerUserId != command.UserId)
                throw new ForbiddenException("Chỉ người đã cấp quyền hoặc chủ sở hữu mới có thể cập nhật.");

            var updatedAccess = PetUserAccessDomain.Reconstitute(
                id: access.Id,
                petId: access.PetId,
                userId: access.UserId,
                accessRole: command.Request.AccessRole,
                grantedByUserId: access.GrantedByUserId,
                expiresAt: command.Request.ExpiresAt,
                revokedAt: access.IsActive ? null : access.RevokedAt,
                isActive: access.IsActive,
                createdAt: access.CreatedAt,
                updatedAt: DateTime.UtcNow
            );

            await _accessRepository.UpdateAsync(updatedAccess);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return new PetUserAccessResponse
            {
                PetUserAccessId = updatedAccess.Id,
                PetId = updatedAccess.PetId,
                UserId = updatedAccess.UserId,
                AccessRole = updatedAccess.AccessRole,
                GrantedByUserId = updatedAccess.GrantedByUserId,
                ExpiresAt = updatedAccess.ExpiresAt,
                IsExpired = updatedAccess.IsExpired(),
                CreatedAt = updatedAccess.CreatedAt
            };
        }
    }
}
