using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Pet.Command;
using PetOmiPlatform.Application.Features.Pet.DTOs.Response;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Exceptions;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Features.Pet.Handler
{
    public class GrantPetAccessCommandHandler : IRequestHandler<GrantPetAccessCommand, PetUserAccessResponse>
    {
        private readonly IPetRepository _petRepository;
        private readonly IPetUserAccessRepository _accessRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUnitOfWork _unitOfWork;

        public GrantPetAccessCommandHandler(
            IPetRepository petRepository,
            IPetUserAccessRepository accessRepository,
            IUserRepository userRepository,
            IUnitOfWork unitOfWork)
        {
            _petRepository = petRepository;
            _accessRepository = accessRepository;
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<PetUserAccessResponse> Handle(GrantPetAccessCommand command, CancellationToken cancellationToken)
        {
            var pet = await _petRepository.GetByIdAsync(command.PetId)
                ?? throw new NotFoundException("Không tìm thấy hồ sơ thú cưng.");

            pet.EnsureOwner(command.UserId);

            var targetUser = await _userRepository.GetByIdAsync(command.Request.UserId)
                ?? throw new NotFoundException("Người dùng được cấp quyền không tồn tại.");

            if (command.Request.UserId == command.UserId)
                throw new DomainException("Không thể tự cấp quyền cho chính mình.");

            var existingAccess = await _accessRepository.GetByPetAndUserAsync(command.PetId, command.Request.UserId);
            if (existingAccess != null)
                throw new DomainException("Người dùng đã có quyền truy cập. Vui lòng sử dụng endpoint cập nhật.");

            var access = PetUserAccessDomain.Create(
                petId: command.PetId,
                userId: command.Request.UserId,
                accessRole: command.Request.AccessRole,
                grantedByUserId: command.UserId,
                expiresAt: command.Request.ExpiresAt
            );

            await _accessRepository.AddAsync(access);
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
