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
    /// API cau hinh tai khoan nhan tien SePay theo tung clinic.
    /// </summary>
    [Route("api/clinic-payments")]
    [ApiController]
    [Authorize]
    public class ClinicPaymentController : BaseController
    {
        public ClinicPaymentController(IMediator mediator) : base(mediator) { }

        /// <summary>Lay cau hinh tai khoan SePay cua clinic (masked account cho role khong duoc sua).</summary>
        [HttpGet("{clinicId:guid}/sepay-account")]
        public async Task<IActionResult> GetSePayAccount(Guid clinicId)
        {
            var query = new GetClinicSePayAccountQuery(clinicId, CurrentUserId);
            var result = await Mediator.Send(query);

            return result != null
                ? Ok(BaseResponse<ClinicSePayAccountResponse>.Ok(result))
                : NotFound(BaseResponse<ClinicSePayAccountResponse?>.Fail("Clinic chua cau hinh tai khoan SePay.", 404));
        }

        /// <summary>Tao moi hoac cap nhat tai khoan SePay cua clinic.</summary>
        /// <remarks>Chi ClinicOwner duoc phep sua cau hinh nhan tien.</remarks>
        [HttpPut("{clinicId:guid}/sepay-account")]
        public async Task<IActionResult> UpsertSePayAccount(
            Guid clinicId,
            [FromBody] UpsertClinicSePayAccountRequest request)
        {
            var command = new UpsertClinicSePayAccountCommand(clinicId, CurrentUserId, request);
            var result = await Mediator.Send(command);
            return Ok(BaseResponse<ClinicSePayAccountResponse>.Ok(result, "Cap nhat tai khoan SePay thanh cong."));
        }
    }
}
