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

            access.UpdateInfo(
                accessRole: command.Request.AccessRole,
                expiresAt: command.Request.ExpiresAt
            );

            await _accessRepository.UpdateAsync(access);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return new PetUserAccessResponse
            {
                PetUserAccessId = access.Id,
                PetId = access.PetId,
                UserId = access.UserId,
                AccessRole = access.AccessRole,
                GrantedByUserId = access.GrantedByUserId,
                ExpiresAt = access.ExpiresAt,
                IsExpired = access.IsExpired(),
                CreatedAt = access.CreatedAt
            };
        }
    }
}
