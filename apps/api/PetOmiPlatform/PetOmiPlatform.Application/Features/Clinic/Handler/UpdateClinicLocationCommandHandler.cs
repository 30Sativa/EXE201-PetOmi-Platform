using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Clinic.Command;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Clinic.Handler;

public class UpdateClinicLocationCommandHandler
    : IRequestHandler<UpdateClinicLocationCommand, ClinicLocationResponse>
{
    private readonly IClinicRepository _clinicRepository;
    private readonly IVetClinicRepository _vetClinicRepository;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateClinicLocationCommandHandler(
        IClinicRepository clinicRepository,
        IVetClinicRepository vetClinicRepository,
        IUnitOfWork unitOfWork)
    {
        _clinicRepository = clinicRepository;
        _vetClinicRepository = vetClinicRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<ClinicLocationResponse> Handle(
        UpdateClinicLocationCommand command, CancellationToken cancellationToken)
    {
        var isOwner = await _vetClinicRepository.IsClinicOwnerAsync(
            command.UserId, command.ClinicId);
        if (!isOwner)
            throw new ForbiddenException("Bạn không có quyền cập nhật thông tin phòng khám này.");

        var clinic = await _clinicRepository.GetByIdAsync(command.ClinicId)
            ?? throw new NotFoundException("Clinic", command.ClinicId);

        clinic.UpdateLocation(
            command.Request.Latitude,
            command.Request.Longitude,
            command.Request.AppointmentBufferMins);

        await _clinicRepository.UpdateAsync(clinic);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new ClinicLocationResponse
        {
            ClinicId = clinic.Id,
            Latitude = clinic.Latitude,
            Longitude = clinic.Longitude,
            AppointmentBufferMins = clinic.AppointmentBufferMins
        };
    }
}
