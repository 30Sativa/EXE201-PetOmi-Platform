using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetOmiPlatform.API.Common;
using PetOmiPlatform.Application.Features.ClinicReview.Command;
using PetOmiPlatform.Application.Features.ClinicReview.DTOs.Request;
using PetOmiPlatform.Application.Features.ClinicReview.DTOs.Response;
using PetOmiPlatform.Application.Features.ClinicReview.Query;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PetOmiPlatform.API.Controllers
{
    [Route("api/clinic-reviews")]
    [ApiController]
    [Authorize]
    public class ClinicReviewController : BaseController
    {
        public ClinicReviewController(IMediator mediator) : base(mediator) { }

        /// <summary>
        /// Chủ nuôi gửi đánh giá cho một phòng khám (kèm lịch hẹn đã hoàn thành nếu có).
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateReview([FromBody] CreateClinicReviewRequest request)
        {
            var result = await Mediator.Send(new CreateClinicReviewCommand(CurrentUserId, request));
            return Ok(BaseResponse<ClinicReviewResponse>.Ok(result, "Gửi đánh giá thành công."));
        }

        /// <summary>
        /// Lấy danh sách đánh giá đã gửi của chủ nuôi đang đăng nhập.
        /// </summary>
        [HttpGet("mine")]
        public async Task<IActionResult> GetMyReviews()
        {
            var result = await Mediator.Send(new GetMyClinicReviewsQuery(CurrentUserId));
            return Ok(BaseResponse<List<ClinicReviewResponse>>.Ok(result));
        }

        /// <summary>
        /// Lấy đánh giá công khai (đã duyệt) và điểm trung bình của một phòng khám.
        /// </summary>
        [HttpGet("clinic/{clinicId:guid}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetClinicReviews(Guid clinicId)
        {
            var result = await Mediator.Send(new GetClinicReviewsQuery(clinicId));
            return Ok(BaseResponse<ClinicReviewSummaryResponse>.Ok(result));
        }
    }
}
