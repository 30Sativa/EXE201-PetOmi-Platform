using MediatR;
using PetOmiPlatform.Application.Features.Admin.DTOs.Response;
using System.Collections.Generic;

namespace PetOmiPlatform.Application.Features.Admin.Queries;

public record GetSystemSettingsQuery() : IRequest<List<SystemSettingResponse>>;
