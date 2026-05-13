using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Vet.Command;
using PetOmiPlatform.Application.Features.Vet.DTOs.Response;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Features.Vet.Handler
{
    public class CreateVetProfileCommandHandler : IRequestHandler<CreateVetProfileCommand, CreateVetProfileResponse>
    {
        private readonly IVetProfileRepository _vetProfileRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUnitOfWork _unitOfWork;

        public CreateVetProfileCommandHandler(
            IVetProfileRepository vetProfileRepository,
            IUserRepository userRepository,
            IUnitOfWork unitOfWork)
        {
            _vetProfileRepository = vetProfileRepository;
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<CreateVetProfileResponse> Handle(
            CreateVetProfileCommand command,
            CancellationToken cancellationToken)
        {
            // 1. Kiểm tra user tồn tại
            var user = await _userRepository.GetByIdAsync(command.UserId)
                ?? throw new NotFoundException("Không tìm thấy tài khoản.");

            // 2. Kiểm tra user chưa có VetProfile
            var existing = await _vetProfileRepository.GetByUserIdAsync(command.UserId);
            if (existing != null)
                throw new ConflictException("Tài khoản này đã có VetProfile.");

            // 3. Tạo VetProfile
            var vetProfile = VetProfileDomain.Create(
                userId: command.UserId,
                licenseNumber: command.Request.LicenseNumber,
                specialization: command.Request.Specialization
            );

            await _vetProfileRepository.AddAsync(vetProfile);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return new CreateVetProfileResponse
            {
                VetProfileId = vetProfile.Id,
                UserId = vetProfile.UserId,
                LicenseNumber = vetProfile.LicenseNumber,
                Specialization = vetProfile.Specialization
            };
        }
    }
}