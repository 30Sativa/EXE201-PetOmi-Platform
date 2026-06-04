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
    /// API đối soát giao dịch SePay cho thu ngân/staff clinic.
    /// </summary>
    [Route("api/invoices/sepay/reconciliation")]
    [ApiController]
    [Authorize]
    public class InvoiceReconciliationController : BaseController
    {
        public InvoiceReconciliationController(IMediator mediator) : base(mediator) { }

        /// <summary>Lấy danh sách giao dịch SePay cần đối soát của clinic.</summary>
        /// <remarks>
        /// Mặc định chỉ lấy giao dịch chưa matched. Đặt includeMatched=true để xem lịch sử đã xử lý.
        /// alertAfterMinutes dùng để đánh dấu giao dịch chưa đối soát quá ngưỡng cần staff ưu tiên xử lý.
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

        /// <summary>Gán thủ công một giao dịch SePay vào hóa đơn cụ thể.</summary>
        /// <remarks>Dùng khi auto-match không match được nhưng staff đã xác nhận giao dịch hợp lệ.</remarks>
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
            return Ok(BaseResponse<bool>.Ok(result, "Manual match giao dịch SePay thành công."));
        }

        /// <summary>Đánh dấu giao dịch SePay là đã xử lý thủ công và bỏ qua.</summary>
        /// <remarks>Bắt buộc reviewNote để audit và đối soát cuối ngày.</remarks>
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
            return Ok(BaseResponse<bool>.Ok(result, "Đã đánh dấu giao dịch SePay là đã xử lý thủ công."));
        }
    }
}
