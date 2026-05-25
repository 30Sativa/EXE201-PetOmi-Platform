using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetOmiPlatform.Application.Features.Invoice.Command;
using PetOmiPlatform.Application.Features.Invoice.DTOs.Request;
using PetOmiPlatform.Application.Features.Invoice.DTOs.Response;
using PetOmiPlatform.Application.Features.Invoice.Query;
using PetOmiPlatform.API.Common;
using PetOmiPlatform.Application.Common.Models;
using System.Security.Claims;

namespace PetOmiPlatform.API.Controllers
{
    [Route("api/invoices")]
    [ApiController]
    [Authorize] // Staff/Clinic
    public class InvoiceController : BaseController
    {
        public InvoiceController(IMediator mediator) : base(mediator) { }

        private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpPost]
        public async Task<IActionResult> CreateInvoice([FromBody] CreateInvoiceRequest request, [FromQuery] Guid clinicId)
        {
            var command = new CreateInvoiceCommand(clinicId, CurrentUserId, request);
            var result = await Mediator.Send(command);
            return Ok(BaseResponse<InvoiceResponse>.Ok(result, "Tao hoa don thanh cong."));
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

        [HttpPost("{id:guid}/cancel")]
        public async Task<IActionResult> CancelInvoice(Guid id, [FromQuery] Guid clinicId)
        {
            var command = new CancelInvoiceCommand(clinicId, CurrentUserId, id);
            var result = await Mediator.Send(command);
            return Ok(BaseResponse<bool>.Ok(result, "Huy hoa don thanh cong."));
        }
    }
}
