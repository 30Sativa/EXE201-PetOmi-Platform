using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Feature.Auth.DTOs.Response;
using PetOmiPlatform.Application.Features.Auth.Command;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Domain.ValueObjects;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Features.Auth.Handler
{
    public class RegisterCommandHandler : IRequestHandler<RegisterCommand, RegisterResponse>
    {
        private readonly IUserRepository _userRepository;
        private readonly IPasswordHasher _passwordHasher;
        private readonly IUnitOfWork _unitOfWork;

        public RegisterCommandHandler(IUserRepository userRepository, IPasswordHasher passwordHasher, IUnitOfWork unitOfWork)
        {
            _userRepository = userRepository;
            _passwordHasher = passwordHasher;
            _unitOfWork = unitOfWork;
        }




        public async Task<RegisterResponse> Handle(RegisterCommand request, CancellationToken cancellationToken)
        {
            var email = new Email(request.Request.Email);

            //check if user already exists
            var existingUser = await _userRepository.GetByNormalizedEmail(email.NormalizedValue);
            if (existingUser != null)
            {
                throw new ConflictException("Email này đã được sử dụng.");
            }

            //hash password
            var password = _passwordHasher.Hash(request.Request.Password);


            //create user
            var user = UserDomain.Create(email, new PasswordHash(password));

            await _userRepository.AddAsync(user);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return new RegisterResponse
            {
                UserId = user.Id,
                Email = user.Email.Value
            };
        }
    }

}