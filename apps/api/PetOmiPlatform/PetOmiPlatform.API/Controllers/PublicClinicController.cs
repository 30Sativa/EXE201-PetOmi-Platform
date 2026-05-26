using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetOmiPlatform.API.Common;
using PetOmiPlatform.Application.Common.Models;
using PetOmiPlatform.Application.Features.Clinic.Command;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;

namespace PetOmiPlatform.API.Controllers
{
    [Route("api/public/clinics")]
    [ApiController]
    public class PublicClinicController : BaseController
    {
        public PublicClinicController(IMediator mediator) : base(mediator) { }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> SearchClinics(
            [FromQuery] double? latitude,
            [FromQuery] double? longitude,
            [FromQuery] string? city,
            [FromQuery] string? keyword,
            [FromQuery] int radiusKm = 10,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var result = await Mediator.Send(new SearchClinicsQuery(
                latitude, longitude, city, keyword, radiusKm, page, pageSize));
            return Ok(BaseResponse<PagedSearchClinicsResponse>.Ok(result));
        }

        [HttpGet("{clinicId:guid}/profile")]
        [AllowAnonymous]
        public async Task<IActionResult> GetClinicProfile(Guid clinicId)
        {
            var result = await Mediator.Send(new GetClinicPublicQuery(clinicId));
            return Ok(BaseResponse<ClinicPublicResponse>.Ok(result));
        }
    }
}
