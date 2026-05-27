using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetOmiPlatform.API.Common;
using PetOmiPlatform.Application.Common.Models;
using PetOmiPlatform.Application.Features.Invoice.Command;
using PetOmiPlatform.Application.Features.Invoice.DTOs.Request;
using PetOmiPlatform.Application.Features.Invoice.DTOs.Response;

namespace PetOmiPlatform.API.Controllers
{
    /// <summary>
    /// API thanh toan hoa don: thu tien thu cong, tao QR SePay, xac nhan hoan tien thu cong.
    /// </summary>
    [Route("api/invoices")]
    [ApiController]
    [Authorize]
    public class InvoicePaymentController : BaseController
    {
        public InvoicePaymentController(IMediator mediator) : base(mediator) { }

        /// <summary>Thu tien thu cong cho hoa don (tien mat/chuyen khoan thu cong).</summary>
        /// <remarks>
        /// MVP rule: chua ho tro partial payment.
        /// - Neu PaidAmount nho hon FinalAmount: tu choi thanh toan.
        /// - Neu PaidAmount lon hon FinalAmount: cho phep, luu overpaid de doi soat cuoi ngay.
        /// </remarks>
        [HttpPost("{id:guid}/pay")]
        public async Task<IActionResult> PayInvoice(Guid id, [FromBody] PayInvoiceRequest request, [FromQuery] Guid clinicId)
        {
            var command = new PayInvoiceCommand(clinicId, CurrentUserId, id, request);
            var result = await Mediator.Send(command);
            return Ok(BaseResponse<bool>.Ok(result, "Thanh toan hoa don thanh cong."));
        }

        /// <summary>Tao payment request SePay (QR + transfer reference) cho hoa don unpaid.</summary>
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

        /// <summary>Xac nhan da hoan tien thu cong cho invoice da huy co RequiresManualRefund=true.</summary>
        /// <remarks>
        /// Dung sau khi thu ngan da chuyen tra tien ngoai he thong cho khach.
        /// Bat buoc co RefundNote de luu audit va doi soat.
        /// </remarks>
        [HttpPost("{id:guid}/refund-confirmation")]
        public async Task<IActionResult> ConfirmManualRefund(
            Guid id,
            [FromBody] ConfirmManualRefundRequest request,
            [FromQuery] Guid clinicId)
        {
            var command = new ConfirmManualRefundCommand(
                clinicId,
                CurrentUserId,
                id,
                request.RefundNote);
            var result = await Mediator.Send(command);
            return Ok(BaseResponse<bool>.Ok(result, "Xac nhan hoan tien thu cong thanh cong."));
        }
    }
}
