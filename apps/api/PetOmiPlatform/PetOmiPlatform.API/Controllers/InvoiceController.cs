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
    /// API hoa don cho staff clinic: tao, xem, bao cao, va huy hoa don.
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

        /// <summary>Lay hoa don theo order ban hang tai quay.</summary>
        [HttpGet("by-order/{orderId:guid}")]
        public async Task<IActionResult> GetByOrderId(Guid orderId, [FromQuery] Guid clinicId)
        {
            var query = new GetInvoiceByOrderQuery(clinicId, CurrentUserId, orderId);
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

        /// <summary>Trend doanh thu da thu theo ngay trong khoang thoi gian de FE ve line/bar chart.</summary>
        /// <remarks>
        /// Mac dinh: neu khong truyen fromDate/toDate thi lay 14 ngay gan nhat (UTC).
        /// He thong tra du tat ca ngay trong khoang (ngay khong co doanh thu van co point = 0).
        /// Co breakdown theo payment method: Cash / BankTransfer / SePayBankTransfer.
        /// Co them so sanh voi ky truoc co cung do dai ngay (PreviousFromDate/PreviousToDate + % change).
        /// </remarks>
        [HttpGet("billing-revenue-trend")]
        public async Task<IActionResult> GetBillingRevenueTrend(
            [FromQuery] Guid clinicId,
            [FromQuery] DateOnly? fromDate = null,
            [FromQuery] DateOnly? toDate = null)
        {
            var effectiveToDate = toDate ?? DateOnly.FromDateTime(DateTime.UtcNow);
            var effectiveFromDate = fromDate ?? effectiveToDate.AddDays(-13);

            var query = new GetBillingRevenueTrendQuery(
                clinicId,
                CurrentUserId,
                effectiveFromDate,
                effectiveToDate);
            var result = await Mediator.Send(query);
            return Ok(BaseResponse<BillingRevenueTrendResponse>.Ok(result));
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

    }
}
