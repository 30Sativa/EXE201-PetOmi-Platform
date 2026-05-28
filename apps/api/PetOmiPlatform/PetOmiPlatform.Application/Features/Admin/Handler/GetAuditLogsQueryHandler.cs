using MediatR;
using PetOmiPlatform.Application.Common.Models;
using PetOmiPlatform.Application.Features.Admin.DTOs.Response;
using PetOmiPlatform.Application.Features.Admin.Queries;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Admin.Handler;

public class GetAuditLogsQueryHandler : IRequestHandler<GetAuditLogsQuery, PagedData<AuditLogItemResponse>>
{
    private readonly IAuditLogRepository _auditLogRepository;

    public GetAuditLogsQueryHandler(IAuditLogRepository auditLogRepository)
    {
        _auditLogRepository = auditLogRepository;
    }

    public async Task<PagedData<AuditLogItemResponse>> Handle(
        GetAuditLogsQuery request,
        CancellationToken cancellationToken)
    {
        var (items, total) = await _auditLogRepository.GetPagedAsync(
            request.Category,
            request.Action,
            request.UserId,
            request.FromDate,
            request.ToDate,
            request.Page,
            request.PageSize);

        var responseItems = items.Select(a => new AuditLogItemResponse
        {
            AuditLogId = a.Id,
            UserId = a.UserId,
            UserEmail = a.UserEmail,
            UserFullName = null,
            Action = a.Action,
            EntityType = a.EntityType,
            EntityId = a.EntityId,
            Severity = a.Severity,
            Category = a.Category,
            IpAddress = a.IpAddress,
            CreatedAt = a.CreatedAt
        }).ToList();

        return new PagedData<AuditLogItemResponse>
        {
            Items = responseItems,
            Meta = new PaginationMeta<AuditLogItemResponse>
            {
                PageNumber = request.Page,
                PageSize = request.PageSize,
                TotalRecords = total
            }
        };
    }
}
