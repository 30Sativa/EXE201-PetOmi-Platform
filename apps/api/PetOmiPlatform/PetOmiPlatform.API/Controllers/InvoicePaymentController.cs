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
    /// API thanh toán hóa đơn: thu tiền thủ công, tạo QR SePay, xác nhận hoàn tiền thủ công.
    /// </summary>
    [Route("api/invoices")]
    [ApiController]
    [Authorize]
    public class InvoicePaymentController : BaseController
    {
        public InvoicePaymentController(IMediator mediator) : base(mediator) { }

        /// <summary>Thu tiền thủ công cho hóa đơn (tiền mặt/chuyển khoản thủ công).</summary>
        /// <remarks>
        /// MVP rule: chưa hỗ trợ partial payment.
        /// - Nếu PaidAmount nhỏ hơn FinalAmount: từ chối thanh toán.
        /// - Nếu PaidAmount lớn hơn FinalAmount: cho phép, lưu overpaid để đối soát cuối ngày.
        /// </remarks>
        [HttpPost("{id:guid}/pay")]
        public async Task<IActionResult> PayInvoice(Guid id, [FromBody] PayInvoiceRequest request, [FromQuery] Guid clinicId)
        {
            var command = new PayInvoiceCommand(clinicId, CurrentUserId, id, request);
            var result = await Mediator.Send(command);
            return Ok(BaseResponse<bool>.Ok(result, "Thanh toán hóa đơn thành công."));
        }

        /// <summary>Tạo payment request SePay (QR + transfer reference) cho hóa đơn unpaid.</summary>
        [HttpPost("{id:guid}/sepay/payment-request")]
        public async Task<IActionResult> RequestSePayPayment(
            Guid id,
            [FromBody] RequestSePayPaymentRequest request,
            [FromQuery] Guid clinicId)
        {
            var command = new RequestSePayPaymentCommand(clinicId, CurrentUserId, id, request);
            var result = await Mediator.Send(command);
            return Ok(BaseResponse<SePayPaymentRequestResponse>.Ok(result, "Tạo payment request SePay thành công."));
        }

        /// <summary>Lấy trạng thái thanh toán SePay mới nhất cho popup QR.</summary>
        [HttpGet("{id:guid}/sepay/payment-status")]
        public async Task<IActionResult> GetSePayPaymentStatus(Guid id, [FromQuery] Guid clinicId)
        {
            var query = new GetSePayPaymentStatusQuery(clinicId, CurrentUserId, id);
            var result = await Mediator.Send(query);
            return Ok(BaseResponse<SePayPaymentStatusResponse>.Ok(result));
        }

        /// <summary>Xác nhận đã hoàn tiền thủ công cho invoice đã hủy có RequiresManualRefund=true.</summary>
        /// <remarks>
        /// Dùng sau khi thu ngân đã chuyển trả tiền ngoài hệ thống cho khách.
        /// Bắt buộc có RefundNote để lưu audit và đối soát.
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
            return Ok(BaseResponse<bool>.Ok(result, "Xác nhận hoàn tiền thủ công thành công."));
        }
    }
}
