using MediatR;
using PetOmiPlatform.Application.Common.Interfaces;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Behaviors
{
    public class AuditLogBehavior<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
    {
        private readonly IAuditLogRepository _auditLogRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly ICurrentUserService _currentUserService;

        public AuditLogBehavior(
            IAuditLogRepository auditLogRepository,
            IUnitOfWork unitOfWork,
            ICurrentUserService currentUserService)
        {
            _auditLogRepository = auditLogRepository;
            _unitOfWork = unitOfWork;
            _currentUserService = currentUserService;
        }

        public async Task<TResponse> Handle(
            TRequest request,
            RequestHandlerDelegate<TResponse> next,
            CancellationToken cancellationToken)
        {
            // Chỉ xử lý command implement IAuditableCommand
            if (request is not IAuditableCommand auditableCommand)
                return await next();

            // Chạy handler trước
            var response = await next();

            // Ghi AuditLog sau khi handler chạy thành công
            var auditLog = AuditLogDomain.Create(
                userId: auditableCommand.UserId,
                action: auditableCommand.Action,
                category: auditableCommand.Category,
                ipAddress: _currentUserService.IpAddress,
                userAgent: _currentUserService.UserAgent
            );

            await _auditLogRepository.AddAsync(auditLog);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return response;
        }
    }
}
