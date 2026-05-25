using MediatR;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Request;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Clinic.Command;

/// <summary>
/// Cập nhật tọa độ địa lý (GPS) và buffer time cho clinic.
/// </summary>
public record UpdateClinicLocationCommand(
    Guid UserId,
    Guid ClinicId,
    UpdateClinicLocationRequest Request
) : IRequest<ClinicLocationResponse>;
