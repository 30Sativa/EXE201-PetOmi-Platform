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
    /// API hóa đơn cho staff clinic: tạo, xem, báo cáo và hủy hóa đơn.
    /// </summary>
    [Route("api/invoices")]
    [ApiController]
    [Authorize] // Staff/Clinic
    public class InvoiceController : BaseController
    {
        public InvoiceController(IMediator mediator) : base(mediator) { }

        /// <summary>Tạo hóa đơn thủ công từ appointment/examination và danh sách items FE gửi lên.</summary>
        [HttpPost]
        public async Task<IActionResult> CreateInvoice([FromBody] CreateInvoiceRequest request, [FromQuery] Guid clinicId)
        {
            var command = new CreateInvoiceCommand(clinicId, CurrentUserId, request);
            var result = await Mediator.Send(command);
            return Ok(BaseResponse<InvoiceResponse>.Ok(result, "Tạo hóa đơn thành công."));
        }

        /// <summary>Tạo hóa đơn tự động từ service của lịch hẹn và toa thuốc của phiếu khám.</summary>
        /// <remarks>
        /// - includeService=true: lấy giá dịch vụ từ appointment.ServiceId.
        /// - includePrescriptions=true: tạo dòng medication từ prescriptions (lấy đơn giá từ inventory nếu có).
        /// - Kết quả có trường warnings để FE cảnh báo thu ngân trước khi thu tiền.
        /// </remarks>
        [HttpPost("auto-compose")]
        public async Task<IActionResult> AutoComposeInvoice([FromBody] AutoComposeInvoiceRequest request, [FromQuery] Guid clinicId)
        {
            var command = new AutoComposeInvoiceCommand(clinicId, CurrentUserId, request);
            var result = await Mediator.Send(command);
            return Ok(BaseResponse<InvoiceResponse>.Ok(result, "Tạo hóa đơn tự động thành công."));
        }

        /// <summary>Lấy hóa đơn theo appointment để FE bind màn hình khám/thu ngân.</summary>
        [HttpGet("by-appointment/{appointmentId:guid}")]
        public async Task<IActionResult> GetByAppointmentId(Guid appointmentId, [FromQuery] Guid clinicId)
        {
            var query = new GetInvoiceByAppointmentQuery(clinicId, CurrentUserId, appointmentId);
            var result = await Mediator.Send(query);
            return result != null
                ? Ok(BaseResponse<InvoiceResponse>.Ok(result))
                : NotFound(BaseResponse<InvoiceResponse?>.Fail("Không tìm thấy hóa đơn.", 404));
        }

        /// <summary>Lấy hóa đơn theo order bán hàng tại quầy.</summary>
        [HttpGet("by-order/{orderId:guid}")]
        public async Task<IActionResult> GetByOrderId(Guid orderId, [FromQuery] Guid clinicId)
        {
            var query = new GetInvoiceByOrderQuery(clinicId, CurrentUserId, orderId);
            var result = await Mediator.Send(query);
            return result != null
                ? Ok(BaseResponse<InvoiceResponse>.Ok(result))
                : NotFound(BaseResponse<InvoiceResponse?>.Fail("Không tìm thấy hóa đơn.", 404));
        }

        /// <summary>Danh sách hóa đơn chưa thanh toán theo tuổi nợ (aging) để thu ngân ưu tiên thu nợ.</summary>
        /// <remarks>
        /// Trả về các hóa đơn status Unpaid, sắp xếp theo PendingDays giảm dần.
        /// Dùng minAgeDays để lọc hóa đơn nợ từ N ngày trở lên.
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

        /// <summary>Tổng quan billing cho dashboard FE: nợ hiện tại, đối soát SePay, pending manual refund, bucket công nợ, lượt khám hôm nay, doanh thu hôm nay, low-stock.</summary>
        [HttpGet("billing-summary")]
        public async Task<IActionResult> GetBillingSummary([FromQuery] Guid clinicId)
        {
            var query = new GetBillingDashboardSummaryQuery(clinicId, CurrentUserId);
            var result = await Mediator.Send(query);
            return Ok(BaseResponse<BillingDashboardSummaryResponse>.Ok(result));
        }

        /// <summary>Trend doanh thu đã thu theo ngày trong khoảng thời gian để FE vẽ line/bar chart.</summary>
        /// <remarks>
        /// Mặc định: nếu không truyền fromDate/toDate thì lấy 14 ngày gần nhất (UTC).
        /// Hệ thống trả đủ tất cả ngày trong khoảng (ngày không có doanh thu vẫn có point = 0).
        /// Có breakdown theo payment method: Cash / BankTransfer / SePayBankTransfer.
        /// Có thêm so sánh với kỳ trước có cùng độ dài ngày (PreviousFromDate/PreviousToDate + % change).
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

        /// <summary>Danh sách hóa đơn đã hủy nhưng chưa xác nhận hoàn tiền thủ công.</summary>
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

        /// <summary>Hủy hóa đơn; nếu hóa đơn đã paid thì bắt buộc nhập lý do để đối soát hoàn tiền thủ công.</summary>
        /// <remarks>
        /// MVP policy:
        /// - Không auto refund trên hệ thống.
        /// - Invoice đã paid khi hủy sẽ được đánh dấu RequiresManualRefund=true để thu ngân xử lý ngoài hệ thống.
        /// </remarks>
        [HttpPost("{id:guid}/cancel")]
        public async Task<IActionResult> CancelInvoice(
            Guid id,
            [FromBody] CancelInvoiceRequest? request,
            [FromQuery] Guid clinicId)
        {
            var command = new CancelInvoiceCommand(clinicId, CurrentUserId, id, request?.CancelReason);
            var result = await Mediator.Send(command);
            return Ok(BaseResponse<bool>.Ok(result, "Hủy hóa đơn thành công."));
        }

    }
}
