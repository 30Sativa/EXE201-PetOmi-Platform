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
    /// <summary>
    /// API hoa don cho staff clinic: tao, thu tien, va doi soat SePay.
    /// </summary>
    [Route("api/invoices")]
    [ApiController]
    [Authorize] // Staff/Clinic
    public class InvoiceController : BaseController
    {
        public InvoiceController(IMediator mediator) : base(mediator) { }

        /// <summary>Tao hoa don thu cong tu appointment/examination va danh sach items FE gui len.</summary>
        [HttpPost]
        public async Task<IActionResult> CreateInvoice([FromBody] CreateInvoiceRequest request, [FromQuery] Guid clinicId)
        {
            var command = new CreateInvoiceCommand(clinicId, CurrentUserId, request);
            var result = await Mediator.Send(command);
            return Ok(BaseResponse<InvoiceResponse>.Ok(result, "Tao hoa don thanh cong."));
        }

        /// <summary>Tao hoa don tu dong tu service cua lich hen va toa thuoc cua phieu kham.</summary>
        /// <remarks>
        /// - includeService=true: lay gia dich vu tu appointment.ServiceId.
        /// - includePrescriptions=true: tao dong medication tu prescriptions (lay don gia tu inventory neu co).
        /// - Ket qua co truong warnings de FE canh bao thu ngan truoc khi thu tien.
        /// </remarks>
        [HttpPost("auto-compose")]
        public async Task<IActionResult> AutoComposeInvoice([FromBody] AutoComposeInvoiceRequest request, [FromQuery] Guid clinicId)
        {
            var command = new AutoComposeInvoiceCommand(clinicId, CurrentUserId, request);
            var result = await Mediator.Send(command);
            return Ok(BaseResponse<InvoiceResponse>.Ok(result, "Tao hoa don tu dong thanh cong."));
        }

        /// <summary>Lay hoa don theo appointment de FE bind man hinh kham/thu ngan.</summary>
        [HttpGet("by-appointment/{appointmentId:guid}")]
        public async Task<IActionResult> GetByAppointmentId(Guid appointmentId, [FromQuery] Guid clinicId)
        {
            var query = new GetInvoiceByAppointmentQuery(clinicId, CurrentUserId, appointmentId);
            var result = await Mediator.Send(query);
            return result != null
                ? Ok(BaseResponse<InvoiceResponse>.Ok(result))
                : NotFound(BaseResponse<InvoiceResponse?>.Fail("Khong tim thay hoa don.", 404));
        }

        /// <summary>Danh sach hoa don chua thanh toan theo tuoi no (aging) de thu ngan uu tien thu no.</summary>
        /// <remarks>
        /// Tra ve cac hoa don status Unpaid, sap xep theo PendingDays giam dan.
        /// Dung minAgeDays de loc hoa don no tu N ngay tro len.
        /// </remarks>
        [HttpGet("unpaid-aging")]
        public async Task<IActionResult> GetUnpaidAgingInvoices(
            [FromQuery] Guid clinicId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50,
            [FromQuery] int minAgeDays = 0)
        {
            var query = new GetInvoiceAgingQuery(clinicId, CurrentUserId, page, pageSize, minAgeDays);
            var result = await Mediator.Send(query);
            return Ok(BaseResponse<IReadOnlyList<InvoiceAgingItemResponse>>.Ok(result));
        }

        /// <summary>Tong quan billing cho dashboard FE: no hien tai, doi soat SePay, pending manual refund, bucket cong no, luot kham hom nay, doanh thu hom nay, low-stock.</summary>
        [HttpGet("billing-summary")]
        public async Task<IActionResult> GetBillingSummary([FromQuery] Guid clinicId)
        {
            var query = new GetBillingDashboardSummaryQuery(clinicId, CurrentUserId);
            var result = await Mediator.Send(query);
            return Ok(BaseResponse<BillingDashboardSummaryResponse>.Ok(result));
        }

        /// <summary>Danh sach hoa don da huy nhung chua xac nhan hoan tien thu cong.</summary>
        [HttpGet("manual-refunds/pending")]
        public async Task<IActionResult> GetPendingManualRefunds(
            [FromQuery] Guid clinicId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            var query = new GetPendingManualRefundsQuery(clinicId, CurrentUserId, page, pageSize);
            var result = await Mediator.Send(query);
            return Ok(BaseResponse<IReadOnlyList<PendingManualRefundItemResponse>>.Ok(result));
        }

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

        /// <summary>Lay danh sach giao dich SePay can doi soat cua clinic.</summary>
        /// <remarks>
        /// Mac dinh chi lay giao dich chua matched. Dat includeMatched=true de xem lich su da xu ly.
        /// alertAfterMinutes dung de danh dau giao dich chua doi soat qua nguong can staff uu tien xu ly.
        /// </remarks>
        [HttpGet("sepay/reconciliation")]
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

        /// <summary>Danh dau giao dich SePay la da xu ly thu cong va bo qua.</summary>
        /// <remarks>Bat buoc reviewNote de audit va doi soat cuoi ngay.</remarks>
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

        /// <summary>Huy hoa don; neu hoa don da paid thi bat buoc nhap ly do de doi soat hoan tien thu cong.</summary>
        /// <remarks>
        /// MVP policy:
        /// - Khong auto refund tren he thong.
        /// - Invoice da paid khi huy se duoc danh dau RequiresManualRefund=true de thu ngan xu ly ngoai he thong.
        /// </remarks>
        [HttpPost("{id:guid}/cancel")]
        public async Task<IActionResult> CancelInvoice(
            Guid id,
            [FromBody] CancelInvoiceRequest? request,
            [FromQuery] Guid clinicId)
        {
            var command = new CancelInvoiceCommand(clinicId, CurrentUserId, id, request?.CancelReason);
            var result = await Mediator.Send(command);
            return Ok(BaseResponse<bool>.Ok(result, "Huy hoa don thanh cong."));
        }

        /// <summary>Xac nhan da hoan tien thu cong cho invoice da huy co co RequiresManualRefund.</summary>
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
