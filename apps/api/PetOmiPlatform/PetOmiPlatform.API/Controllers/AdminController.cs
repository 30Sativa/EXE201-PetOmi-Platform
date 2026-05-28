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
using System.Security.Claims;

namespace PetOmiPlatform.API.Controllers;

[Route("api/admin")]
[ApiController]
[Authorize(Policy = Policies.AdminOnly)]
public class AdminController : BaseController
{
    public AdminController(IMediator mediator) : base(mediator) { }

    /// <summary>
    /// Tong quan thong ke cho admin dashboard.
    /// </summary>
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var result = await Mediator.Send(new GetAdminDashboardQuery());
        return Ok(BaseResponse<AdminDashboardResponse>.Ok(result));
    }

    /// <summary>
    /// Danh sach nguoi dung co phan trang, co the loc theo trang thai kich hoat.
    /// </summary>
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers(
        [FromQuery] string? search,
        [FromQuery] bool? isActive,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await Mediator.Send(new GetAdminUsersQuery(search, isActive, page, pageSize));
        return Ok(BaseResponse<PagedData<AdminUserListResponse>>.Ok(result));
    }

    /// <summary>
    /// Khoa hoac mo khoa nguoi dung.
    /// </summary>
    [HttpPost("users/{userId:guid}/toggle-status")]
    public async Task<IActionResult> ToggleUserStatus(Guid userId, [FromBody] ToggleUserStatusRequest request)
    {
        var adminId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await Mediator.Send(new ToggleUserStatusCommand(adminId, userId, request.IsActive));
        return Ok(BaseResponse<AdminUserListResponse>.Ok(result, request.IsActive ? "Tai khoan da duoc mo khoa." : "Tai khoan da bi khoa."));
    }

    /// <summary>
    /// Gan quyen Admin cho nguoi dung.
    /// </summary>
    [HttpPost("users/{userId:guid}/assign-admin")]
    public async Task<IActionResult> AssignAdminRole(Guid userId)
    {
        var adminId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await Mediator.Send(new AssignAdminRoleCommand(adminId, userId));
        return Ok(BaseResponse<AdminUserListResponse>.Ok(result, "Da gan quyen Admin."));
    }

    /// <summary>
    /// Thu hoi quyen Admin cua nguoi dung.
    /// </summary>
    [HttpPost("users/{userId:guid}/revoke-admin")]
    public async Task<IActionResult> RevokeAdminRole(Guid userId)
    {
        var adminId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await Mediator.Send(new RevokeAdminRoleCommand(adminId, userId));
        return Ok(BaseResponse<AdminUserListResponse>.Ok(result, "Da thu hoi quyen Admin."));
    }

    /// <summary>
    /// Lay danh sach audit log voi loc va phan trang.
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
    /// Lay tat ca cau hinh he thong.
    /// </summary>
    [HttpGet("settings")]
    public async Task<IActionResult> GetSettings()
    {
        var result = await Mediator.Send(new GetSystemSettingsQuery());
        return Ok(BaseResponse<List<SystemSettingResponse>>.Ok(result));
    }

    /// <summary>
    /// Cap nhat mot cau hinh he thong.
    /// </summary>
    [HttpPut("settings/{key}")]
    public async Task<IActionResult> UpdateSetting(string key, [FromBody] UpdateSettingRequest request)
    {
        var adminId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var result = await Mediator.Send(new UpdateSettingCommand(adminId, key, request.Value));
        return Ok(BaseResponse<SystemSettingResponse>.Ok(result, "Da cap nhat cau hinh."));
    }
}
