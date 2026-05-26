using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetOmiPlatform.Application.Features.Invoice.Command;
using PetOmiPlatform.Application.Features.Invoice.DTOs.Request;
using PetOmiPlatform.Application.Features.Invoice.DTOs.Response;
using PetOmiPlatform.Application.Features.Invoice.Query;
using PetOmiPlatform.API.Common;
using PetOmiPlatform.Application.Common.Models;

namespace PetOmiPlatform.API.Controllers
{
    [Route("api/invoices")]
    [ApiController]
    [Authorize] // Staff/Clinic
    public class InvoiceController : BaseController
    {
        public InvoiceController(IMediator mediator) : base(mediator) { }

        [HttpPost]
        public async Task<IActionResult> CreateInvoice([FromBody] CreateInvoiceRequest request, [FromQuery] Guid clinicId)
        {
            var command = new CreateInvoiceCommand(clinicId, CurrentUserId, request);
            var result = await Mediator.Send(command);
            return Ok(BaseResponse<InvoiceResponse>.Ok(result, "Tao hoa don thanh cong."));
        }

        [HttpPost("auto-compose")]
        public async Task<IActionResult> AutoComposeInvoice([FromBody] AutoComposeInvoiceRequest request, [FromQuery] Guid clinicId)
        {
            var command = new AutoComposeInvoiceCommand(clinicId, CurrentUserId, request);
            var result = await Mediator.Send(command);
            return Ok(BaseResponse<InvoiceResponse>.Ok(result, "Tao hoa don tu dong thanh cong."));
        }

        [HttpGet("by-appointment/{appointmentId:guid}")]
        public async Task<IActionResult> GetByAppointmentId(Guid appointmentId, [FromQuery] Guid clinicId)
        {
            var query = new GetInvoiceByAppointmentQuery(clinicId, CurrentUserId, appointmentId);
            var result = await Mediator.Send(query);
            return result != null
                ? Ok(BaseResponse<InvoiceResponse>.Ok(result))
                : NotFound(BaseResponse<InvoiceResponse?>.Fail("Khong tim thay hoa don.", 404));
        }

        [HttpPost("{id:guid}/pay")]
        public async Task<IActionResult> PayInvoice(Guid id, [FromBody] PayInvoiceRequest request, [FromQuery] Guid clinicId)
        {
            var command = new PayInvoiceCommand(clinicId, CurrentUserId, id, request);
            var result = await Mediator.Send(command);
            return Ok(BaseResponse<bool>.Ok(result, "Thanh toan hoa don thanh cong."));
        }

        [HttpPost("{id:guid}/sepay/payment-request")]
        public async Task<IActionResult> RequestSePayPayment(
            Guid id,
            [FromBody] RequestSePayPaymentRequest request,
            [FromQuery] Guid clinicId)
        {
            var command = new RequestSePayPaymentCommand(clinicId, CurrentUserId, id, request);
            var result = await Mediator.Send(command);
            return Ok(BaseResponse<SePayPaymentRequestResponse>.Ok(result, "Tao payment request SePay thanh cong."));
        }

        [HttpGet("sepay/reconciliation")]
        public async Task<IActionResult> GetSePayReconciliation(
            [FromQuery] Guid clinicId,
            [FromQuery] int limit = 50,
            [FromQuery] bool includeMatched = false)
        {
            var query = new GetSePayReconciliationQuery(clinicId, CurrentUserId, limit, includeMatched);
            var result = await Mediator.Send(query);
            return Ok(BaseResponse<IReadOnlyList<SePayReconciliationItemResponse>>.Ok(result));
        }

        [HttpPost("sepay/reconciliation/{paymentTransactionId:guid}/manual-match")]
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

        [HttpPost("sepay/reconciliation/{paymentTransactionId:guid}/dismiss")]
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

        [HttpPost("{id:guid}/cancel")]
        public async Task<IActionResult> CancelInvoice(Guid id, [FromQuery] Guid clinicId)
        {
            var command = new CancelInvoiceCommand(clinicId, CurrentUserId, id);
            var result = await Mediator.Send(command);
            return Ok(BaseResponse<bool>.Ok(result, "Huy hoa don thanh cong."));
        }
    }
}
