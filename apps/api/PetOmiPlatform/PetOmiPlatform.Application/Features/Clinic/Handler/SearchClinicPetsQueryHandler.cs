using MediatR;
using PetOmiPlatform.Application.Features.Clinic.Authorization;
using PetOmiPlatform.Application.Features.Clinic.Command;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Clinic.Handler;

public class SearchClinicPetsQueryHandler
    : IRequestHandler<SearchClinicPetsQuery, IReadOnlyList<ClinicPetSearchItemResponse>>
{
    private readonly IPetRepository _petRepository;
    private readonly IVetClinicRepository _vetClinicRepository;

    public SearchClinicPetsQueryHandler(
        IPetRepository petRepository,
        IVetClinicRepository vetClinicRepository)
    {
        _petRepository = petRepository;
        _vetClinicRepository = vetClinicRepository;
    }

    public async Task<IReadOnlyList<ClinicPetSearchItemResponse>> Handle(
        SearchClinicPetsQuery request,
        CancellationToken cancellationToken)
    {
        var staff = await _vetClinicRepository.GetByUserIdAndClinicIdAsync(
            request.RequestUserId,
            request.ClinicId);
        ClinicRoleGuard.RequireActiveStaff(staff);

        var pets = await _petRepository.SearchByClinicAsync(
            request.ClinicId,
            request.Search,
            request.Limit);

        return pets.Select(pet => new ClinicPetSearchItemResponse
        {
            PetId = pet.PetId,
            OwnerUserId = pet.OwnerUserId,
            PublicPetCode = pet.PublicPetCode,
            PetName = pet.PetName,
            Species = pet.Species,
            Breed = pet.Breed,
            Gender = pet.Gender,
            AvatarUrl = pet.AvatarUrl,
            OwnerEmail = pet.OwnerEmail,
            OwnerFullName = pet.OwnerFullName,
            OwnerPhone = pet.OwnerPhone,
            LastAppointmentDate = pet.LastAppointmentDate,
            LastAppointmentStatus = pet.LastAppointmentStatus
        }).ToList();
    }
}
