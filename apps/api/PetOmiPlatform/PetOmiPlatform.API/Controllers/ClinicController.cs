using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetOmiPlatform.API.Common;
using PetOmiPlatform.Application.Common.Models;
using PetOmiPlatform.Application.Features.Clinic.Command;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Request;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;

namespace PetOmiPlatform.API.Controllers
{
    [Route("api/clinic")]
    [ApiController]
    [Authorize]
    public class ClinicController : BaseController
    {
        public ClinicController(IMediator mediator) : base(mediator) { }

        /// <summary>Tao phong kham moi o trang thai Pending.</summary>
        [HttpPost]
        public async Task<IActionResult> CreateClinic([FromBody] CreateClinicRequest request)
        {
            var result = await Mediator.Send(new CreateClinicCommand(CurrentUserId, request));
            return Ok(BaseResponse<CreateClinicResponse>.Ok(result, "Dang ky phong kham thanh cong. Vui long cho Admin duyet."));
        }

        /// <summary>Lay thong tin clinic hien tai cua user dang dang nhap.</summary>
        [HttpGet("my-clinic")]
        public async Task<IActionResult> GetMyClinic()
        {
            var result = await Mediator.Send(new GetMyClinicQuery(CurrentUserId));
            return Ok(BaseResponse<GetMyClinicResponse?>.Ok(result));
        }

        /// <summary>Gan staff vao phong kham (chi ClinicOwner).</summary>
        [HttpPost("{clinicId:guid}/staff")]
        public async Task<IActionResult> AssignStaff(Guid clinicId, [FromBody] AssignStaffRequest request)
        {
            await Mediator.Send(new AssignStaffCommand(CurrentUserId, clinicId, request));
            return Ok(BaseResponse<object>.Ok(null, "Gan staff thanh cong."));
        }

        /// <summary>Cap nhat vai tro staff (PrimaryVet/Assistant), chi ClinicOwner.</summary>
        [HttpPut("{clinicId:guid}/staff/{vetClinicId:guid}/role")]
        public async Task<IActionResult> UpdateStaffRole(
            Guid clinicId,
            Guid vetClinicId,
            [FromBody] UpdateClinicStaffRoleRequest request)
        {
            var result = await Mediator.Send(new UpdateClinicStaffRoleCommand(CurrentUserId, clinicId, vetClinicId, request));
            return Ok(BaseResponse<bool>.Ok(result, "Cap nhat vai tro staff thanh cong."));
        }

        /// <summary>Ngung hoat dong staff (soft deactivate), chi ClinicOwner.</summary>
        [HttpPost("{clinicId:guid}/staff/{vetClinicId:guid}/deactivate")]
        public async Task<IActionResult> DeactivateStaff(
            Guid clinicId,
            Guid vetClinicId,
            [FromBody] DeactivateClinicStaffRequest request)
        {
            var result = await Mediator.Send(new DeactivateClinicStaffCommand(CurrentUserId, clinicId, vetClinicId, request));
            return Ok(BaseResponse<bool>.Ok(result, "Da ngung hoat dong staff."));
        }

        /// <summary>ClinicOwner nop lai ho so sau khi bi Reject.</summary>
        [HttpPatch("{clinicId:guid}/resubmit")]
        public async Task<IActionResult> Resubmit(Guid clinicId, [FromBody] ResubmitClinicRequest request)
        {
            var result = await Mediator.Send(new ResubmitClinicCommand(CurrentUserId, clinicId, request));
            return Ok(BaseResponse<GetMyClinicResponse>.Ok(result, "Da nop lai ho so. Vui long cho Admin duyet."));
        }

        /// <summary>Cap nhat thong tin phong kham (chi khi Approved).</summary>
        [HttpPut("{clinicId:guid}/info")]
        public async Task<IActionResult> UpdateInfo(Guid clinicId, [FromBody] UpdateClinicInfoRequest request)
        {
            var result = await Mediator.Send(new UpdateClinicInfoCommand(CurrentUserId, clinicId, request));
            return Ok(BaseResponse<GetMyClinicResponse>.Ok(result, "Cap nhat thong tin phong kham thanh cong."));
        }

        /// <summary>Cap nhat toa do GPS va buffer time cho appointment.</summary>
        [HttpPatch("{clinicId:guid}/location")]
        public async Task<IActionResult> UpdateLocation(Guid clinicId, [FromBody] UpdateClinicLocationRequest request)
        {
            var result = await Mediator.Send(new UpdateClinicLocationCommand(CurrentUserId, clinicId, request));
            return Ok(BaseResponse<ClinicLocationResponse>.Ok(result, "Cap nhat vi tri phong kham thanh cong."));
        }

        /// <summary>Lay public profile cua phong kham va danh sach dich vu dang active.</summary>
        [HttpGet("{clinicId:guid}/public")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPublicProfile(Guid clinicId)
        {
            var result = await Mediator.Send(new GetClinicPublicQuery(clinicId));
            return Ok(BaseResponse<ClinicPublicResponse>.Ok(result));
        }

        /// <summary>Lay danh sach bac si/staff active cua clinic de FE quan ly noi bo.</summary>
        [HttpGet("{clinicId:guid}/doctors")]
        public async Task<IActionResult> GetClinicDoctors(Guid clinicId)
        {
            var result = await Mediator.Send(new GetClinicDoctorsQuery(CurrentUserId, clinicId));
            return Ok(BaseResponse<IReadOnlyList<ClinicDoctorListItemResponse>>.Ok(result));
        }

        /// <summary>Them dich vu moi vao phong kham.</summary>
        [HttpPost("{clinicId:guid}/services")]
        public async Task<IActionResult> AddService(Guid clinicId, [FromBody] AddClinicServiceRequest request)
        {
            var result = await Mediator.Send(new AddClinicServiceCommand(CurrentUserId, clinicId, request));
            return Ok(BaseResponse<ClinicServiceResponse>.Ok(result, "Them dich vu thanh cong."));
        }

        /// <summary>Cap nhat thong tin dich vu.</summary>
        [HttpPut("{clinicId:guid}/services/{serviceId:guid}")]
        public async Task<IActionResult> UpdateService(
            Guid clinicId,
            Guid serviceId,
            [FromBody] UpdateClinicServiceRequest request)
        {
            var result = await Mediator.Send(new UpdateClinicServiceCommand(CurrentUserId, clinicId, serviceId, request));
            return Ok(BaseResponse<ClinicServiceResponse>.Ok(result, "Cap nhat dich vu thanh cong."));
        }

        /// <summary>Xoa mem dich vu (IsActive = false).</summary>
        [HttpDelete("{clinicId:guid}/services/{serviceId:guid}")]
        public async Task<IActionResult> DeleteService(Guid clinicId, Guid serviceId)
        {
            await Mediator.Send(new DeleteClinicServiceCommand(CurrentUserId, clinicId, serviceId));
            return Ok(BaseResponse<object>.Ok(null, "Da xoa dich vu."));
        }
    }
}
