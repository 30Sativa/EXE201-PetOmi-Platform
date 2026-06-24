using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetOmiPlatform.API.Common;
using PetOmiPlatform.Application.Common.Models;
using PetOmiPlatform.Application.Features.Promotions.Commands;
using PetOmiPlatform.Application.Features.Promotions.DTOs;
using PetOmiPlatform.Application.Features.Promotions.Queries;

namespace PetOmiPlatform.API.Controllers;

/// <summary>
/// API uu dai Premium: free trial, early-bird, va referral (gioi thieu ban be).
/// </summary>
[Route("api/promotions")]
[ApiController]
[Authorize]
public class PromotionsController : BaseController
{
    public PromotionsController(IMediator mediator) : base(mediator)
    {
    }

    /// <summary>Lay trang thai 3 uu dai cho user hien tai (de hien tren trang AI Plan).</summary>
    [HttpGet("offers")]
    public async Task<IActionResult> GetOffers()
    {
        var result = await Mediator.Send(new GetPromotionOffersQuery(CurrentUserId));
        return Ok(BaseResponse<PromotionOffersResponse>.Ok(result));
    }

    /// <summary>Lay ma gioi thieu + thong ke referral cua user hien tai.</summary>
    [HttpGet("referral")]
    public async Task<IActionResult> GetReferral()
    {
        var result = await Mediator.Send(new GetReferralInfoQuery(CurrentUserId));
        return Ok(BaseResponse<ReferralInfoResponse>.Ok(result));
    }

    /// <summary>Kich hoat dung thu Premium mien phi (moi user 1 lan).</summary>
    [HttpPost("trial/activate")]
    public async Task<IActionResult> ActivateTrial()
    {
        var result = await Mediator.Send(new ActivateTrialCommand(CurrentUserId));
        return Ok(BaseResponse<ActivateTrialResponse>.Ok(result, "Da kich hoat dung thu Premium."));
    }
}
