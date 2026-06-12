using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetOmiPlatform.API.Common;
using PetOmiPlatform.API.Common.Authorization;
using PetOmiPlatform.Application.Common.Models;
using PetOmiPlatform.Application.Features.Admin.Commands;
using PetOmiPlatform.Application.Features.Admin.DTOs.Request;
using PetOmiPlatform.Application.Features.Admin.DTOs.Response;
using PetOmiPlatform.Application.Features.Admin.Queries;
using PetOmiPlatform.Application.Features.ChatSubscription.DTOs;
using PetOmiPlatform.Application.Features.ChatSubscription.Queries;
using System.Security.Claims;

namespace PetOmiPlatform.API.Controllers;

/// <summary>
/// API quản trị hệ thống dành cho Admin.
/// </summary>
[Route("api/admin")]
[ApiController]
[Authorize(Policy = Policies.AdminOnly)]
public class AdminController : BaseController
{
    public AdminController(IMediator mediator) : base(mediator) { }

    /// <summary>
    /// Tổng quan thống kê cho admin dashboard.
    /// </summary>
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var result = await Mediator.Send(new GetAdminDashboardQuery());
        return Ok(BaseResponse<AdminDashboardResponse>.Ok(result));
    }

    /// <summary>
    /// Danh sách cảnh báo cho trang admin alerts.
    /// </summary>
    [HttpGet("alerts")]
    public async Task<IActionResult> GetAlerts([FromQuery] int maxItems = 50)
    {
        var result = await Mediator.Send(new GetAdminAlertsQuery(maxItems));
        return Ok(BaseResponse<AdminAlertsResponse>.Ok(result));
    }

    /// <summary>
    /// Tong quan goi chat AI, subscription owner-pet va payment subscription gan day.
    /// </summary>
    [HttpGet("chat-subscriptions")]
    public async Task<IActionResult> GetChatSubscriptions([FromQuery] int take = 50)
    {
        var result = await Mediator.Send(new GetAdminChatSubscriptionsQuery(take));
        return Ok(BaseResponse<AdminChatSubscriptionsResponse>.Ok(result));
    }

    /// <summary>
    /// Danh sách role global, role phòng khám và ma trận quyền hiện tại.
    /// </summary>
    [HttpGet("roles")]
    public async Task<IActionResult> GetRoles()
    {
        var result = await Mediator.Send(new GetAdminRolesQuery());
        return Ok(BaseResponse<AdminRolesResponse>.Ok(result));
    }

    /// <summary>
    /// Danh sách người dùng có phân trang, có thể lọc theo trạng thái kích hoạt.
    /// </summary>
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers(
        [FromQuery] string? search,
        [FromQuery] bool? isActive,
        [FromQuery] string? role,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await Mediator.Send(new GetAdminUsersQuery(search, isActive, role, page, pageSize));
        return Ok(BaseResponse<PagedData<AdminUserListResponse>>.Ok(result));
    }

    /// <summary>
    /// Khóa hoặc mở khóa người dùng.
    /// </summary>
    [HttpPost("users/{userId:guid}/toggle-status")]
    public async Task<IActionResult> ToggleUserStatus(Guid userId, [FromBody] ToggleUserStatusRequest request)
    {
        var adminId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await Mediator.Send(new ToggleUserStatusCommand(adminId, userId, request.IsActive));
        return Ok(BaseResponse<AdminUserListResponse>.Ok(result, request.IsActive ? "Tài khoản đã được mở khóa." : "Tài khoản đã bị khóa."));
    }

    /// <summary>
    /// Gán quyền Admin cho người dùng.
    /// </summary>
    [HttpPost("users/{userId:guid}/assign-admin")]
    public async Task<IActionResult> AssignAdminRole(Guid userId)
    {
        var adminId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await Mediator.Send(new AssignAdminRoleCommand(adminId, userId));
        return Ok(BaseResponse<AdminUserListResponse>.Ok(result, "Đã gán quyền Admin."));
    }

    /// <summary>
    /// Thu hồi quyền Admin của người dùng.
    /// </summary>
    [HttpPost("users/{userId:guid}/revoke-admin")]
    public async Task<IActionResult> RevokeAdminRole(Guid userId)
    {
        var adminId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await Mediator.Send(new RevokeAdminRoleCommand(adminId, userId));
        return Ok(BaseResponse<AdminUserListResponse>.Ok(result, "Đã thu hồi quyền Admin."));
    }

    /// <summary>
    /// Lấy danh sách audit log với bộ lọc và phân trang.
    /// </summary>
    [HttpGet("audit-logs")]
    public async Task<IActionResult> GetAuditLogs(
        [FromQuery] string? category,
        [FromQuery] string? action,
        [FromQuery] Guid? userId,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await Mediator.Send(new GetAuditLogsQuery(
            category, action, userId, fromDate, toDate, page, pageSize));
        return Ok(BaseResponse<PagedData<AuditLogItemResponse>>.Ok(result));
    }

    /// <summary>
    /// Lấy tất cả cấu hình hệ thống.
    /// </summary>
    [HttpGet("settings")]
    public async Task<IActionResult> GetSettings()
    {
        var result = await Mediator.Send(new GetSystemSettingsQuery());
        return Ok(BaseResponse<List<SystemSettingResponse>>.Ok(result));
    }

    /// <summary>
    /// Cập nhật một cấu hình hệ thống.
    /// </summary>
    [HttpPut("settings/{key}")]
    public async Task<IActionResult> UpdateSetting(string key, [FromBody] UpdateSettingRequest request)
    {
        var adminId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await Mediator.Send(new UpdateSettingCommand(adminId, key, request.Value));
        return Ok(BaseResponse<SystemSettingResponse>.Ok(result, "Đã cập nhật cấu hình."));
    }
}
