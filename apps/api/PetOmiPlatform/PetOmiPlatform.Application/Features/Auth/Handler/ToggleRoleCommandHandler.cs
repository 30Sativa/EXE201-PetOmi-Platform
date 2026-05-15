using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Auth.Command;
using PetOmiPlatform.Application.Features.Auth.DTOs.Response;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Common.Constants;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Features.Auth.Handler
{
    public class ToggleRoleCommandHandler : IRequestHandler<ToggleRoleCommand, ToggleRoleResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly IVetProfileRepository _vetProfileRepository;
        private readonly IVetClinicRepository _vetClinicRepository;
        private readonly IJwtService _jwtService;

        public ToggleRoleCommandHandler(
            IUserRepository userRepository,
            IVetProfileRepository vetProfileRepository,
            IVetClinicRepository vetClinicRepository,
            IJwtService jwtService)
        {
            _userRepository = userRepository;
            _vetProfileRepository = vetProfileRepository;
            _vetClinicRepository = vetClinicRepository;
            _jwtService = jwtService;
        }

        public async Task<ToggleRoleResponse> Handle(
            ToggleRoleCommand command,
            CancellationToken cancellationToken)
        {
            // 1. Kiểm tra user tồn tại
            var user = await _userRepository.GetByIdAsync(command.UserId)
                ?? throw new NotFoundException("Không tìm thấy tài khoản.");

            // 2. Toggle sang Owner — không cần check thêm gì
            if (command.TargetRole == RoleConstants.Owner)
            {
                var ownerToken = _jwtService.GenerateTokenWithRole(user, RoleConstants.Owner);
                return new ToggleRoleResponse
                {
                    AccessToken = ownerToken,
                    ActiveRole = RoleConstants.Owner,
                    ActiveClinicId = null
                };
            }

            // 3. Toggle sang Vet — check đủ điều kiện
            // 3a. Kiểm tra có VetProfile không
            var vetProfile = await _vetProfileRepository.GetByUserIdAsync(command.UserId)
                ?? throw new ForbiddenException("Bạn cần tạo VetProfile trước khi chuyển sang Vet mode.");

            // 3b. Kiểm tra có thuộc clinic được chỉ định không
            var isInClinic = await _vetClinicRepository.ExistsAsync(
                vetProfile.Id, command.ClinicId!.Value);
            if (!isInClinic)
                throw new ForbiddenException("Bạn không thuộc phòng khám này.");

            // 3c. Kiểm tra clinic đã được duyệt chưa
            var isApproved = await _vetClinicRepository.IsClinicApprovedAsync(
                command.ClinicId!.Value);
            if (!isApproved)
                throw new ForbiddenException("Phòng khám chưa được duyệt.");

            // 4. Issue JWT mới với ActiveRole = Vet + ActiveClinicId
            var vetToken = _jwtService.GenerateTokenWithRole(
                user, RoleConstants.Vet, command.ClinicId);

            return new ToggleRoleResponse
            {
                AccessToken = vetToken,
                ActiveRole = RoleConstants.Vet,
                ActiveClinicId = command.ClinicId
            };
        }
    }
}
