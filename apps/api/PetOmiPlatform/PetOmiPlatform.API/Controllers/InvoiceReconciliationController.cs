using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetOmiPlatform.API.Common;
using PetOmiPlatform.Application.Common.Models;
using PetOmiPlatform.Application.Features.Invoice.Command;
using PetOmiPlatform.Application.Features.Invoice.DTOs.Request;
using PetOmiPlatform.Application.Features.Invoice.DTOs.Response;
using PetOmiPlatform.Application.Features.Invoice.Query;

namespace PetOmiPlatform.API.Controllers
{
    /// <summary>
    /// API doi soat giao dich SePay cho thu ngan/staff clinic.
    /// </summary>
    [Route("api/invoices/sepay/reconciliation")]
    [ApiController]
    [Authorize]
    public class InvoiceReconciliationController : BaseController
    {
        public InvoiceReconciliationController(IMediator mediator) : base(mediator) { }

        /// <summary>Lay danh sach giao dich SePay can doi soat cua clinic.</summary>
        /// <remarks>
        /// Mac dinh chi lay giao dich chua matched. Dat includeMatched=true de xem lich su da xu ly.
        /// alertAfterMinutes dung de danh dau giao dich chua doi soat qua nguong can staff uu tien xu ly.
        /// </remarks>
        [HttpGet]
        public async Task<IActionResult> GetSePayReconciliation(
            [FromQuery] Guid clinicId,
            [FromQuery] int limit = 50,
            [FromQuery] bool includeMatched = false,
            [FromQuery] int alertAfterMinutes = 30)
        {
            var query = new GetSePayReconciliationQuery(clinicId, CurrentUserId, limit, includeMatched, alertAfterMinutes);
            var result = await Mediator.Send(query);
            return Ok(BaseResponse<IReadOnlyList<SePayReconciliationItemResponse>>.Ok(result));
        }

        /// <summary>Gan thu cong mot giao dich SePay vao hoa don cu the.</summary>
        /// <remarks>Dung khi auto-match khong match duoc nhung staff da xac nhan giao dich hop le.</remarks>
        [HttpPost("{paymentTransactionId:guid}/manual-match")]
        public async Task<IActionResult> ManualMatchSePayTransaction(
            Guid paymentTransactionId,
            [FromBody] ManualMatchSePayTransactionRequest request,
            [FromQuery] Guid clinicId)
        {
            var command = new ManualMatchSePayTransactionCommand(
                clinicId,
                CurrentUserId,
                paymentTransactionId,
                request.InvoiceId,
                request.ReviewNote);
            var result = await Mediator.Send(command);
            return Ok(BaseResponse<bool>.Ok(result, "Manual match giao dich SePay thanh cong."));
        }

        /// <summary>Danh dau giao dich SePay la da xu ly thu cong va bo qua.</summary>
        /// <remarks>Bat buoc reviewNote de audit va doi soat cuoi ngay.</remarks>
        [HttpPost("{paymentTransactionId:guid}/dismiss")]
        public async Task<IActionResult> DismissSePayTransaction(
            Guid paymentTransactionId,
            [FromBody] DismissSePayTransactionRequest request,
            [FromQuery] Guid clinicId)
        {
            var command = new DismissSePayTransactionCommand(
                clinicId,
                CurrentUserId,
                paymentTransactionId,
                request.ReviewNote);
            var result = await Mediator.Send(command);
            return Ok(BaseResponse<bool>.Ok(result, "Da danh dau giao dich SePay la da xu ly thu cong."));
        }
    }
}
