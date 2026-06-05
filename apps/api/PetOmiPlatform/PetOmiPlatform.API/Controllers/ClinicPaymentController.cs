using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetOmiPlatform.API.Common;
using PetOmiPlatform.Application.Common.Models;
using PetOmiPlatform.Application.Features.ClinicPayment.Command;
using PetOmiPlatform.Application.Features.ClinicPayment.DTOs.Request;
using PetOmiPlatform.Application.Features.ClinicPayment.DTOs.Response;
using PetOmiPlatform.Application.Features.ClinicPayment.Query;

namespace PetOmiPlatform.API.Controllers
{
    /// <summary>
    /// API cấu hình tài khoản nhận tiền SePay theo từng clinic.
    /// </summary>
    [Route("api/clinic-payments")]
    [ApiController]
    [Authorize]
    public class ClinicPaymentController : BaseController
    {
        public ClinicPaymentController(IMediator mediator) : base(mediator) { }

        /// <summary>Lấy cấu hình tài khoản SePay của clinic (masked account cho role không được sửa).</summary>
        [HttpGet("{clinicId:guid}/sepay-account")]
        public async Task<IActionResult> GetSePayAccount(Guid clinicId)
        {
            var query = new GetClinicSePayAccountQuery(clinicId, CurrentUserId);
            var result = await Mediator.Send(query);

            return result != null
                ? Ok(BaseResponse<ClinicSePayAccountResponse>.Ok(result))
                : NotFound(BaseResponse<ClinicSePayAccountResponse?>.Fail("Clinic chưa cấu hình tài khoản SePay.", 404));
        }

        /// <summary>Tạo mới hoặc cập nhật tài khoản SePay của clinic.</summary>
        /// <remarks>Chỉ ClinicOwner được phép sửa cấu hình nhận tiền.</remarks>
        [HttpPut("{clinicId:guid}/sepay-account")]
        public async Task<IActionResult> UpsertSePayAccount(
            Guid clinicId,
            [FromBody] UpsertClinicSePayAccountRequest request)
        {
            var command = new UpsertClinicSePayAccountCommand(clinicId, CurrentUserId, request);
            var result = await Mediator.Send(command);
            return Ok(BaseResponse<ClinicSePayAccountResponse>.Ok(result, "Cập nhật tài khoản SePay thành công."));
        }
    }
}
