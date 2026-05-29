using FluentValidation;
using PetOmiPlatform.Application.Features.Appointment.Command;
using PetOmiPlatform.Domain.Common.Enums;

namespace PetOmiPlatform.Application.Features.Appointment.Validation
{
    public class CreateGuestWalkInIntakeCommandValidator : AbstractValidator<CreateGuestWalkInIntakeCommand>
    {
        private static readonly string[] ValidPetSpecies = { "Dog", "Cat" };
        private static readonly string[] ValidPetGenders = { "Male", "Female", "Unknown" };
        private static readonly string[] ValidAppointmentTypes = Enum.GetNames(typeof(AppointmentType));

        public CreateGuestWalkInIntakeCommandValidator()
        {
            RuleFor(x => x.StaffUserId)
                .NotEmpty().WithMessage("StaffUserId is required.");

            RuleFor(x => x.Request.ClinicId)
                .NotEmpty().WithMessage("ClinicId is required.");

            RuleFor(x => x.Request.OwnerFullName)
                .NotEmpty().WithMessage("OwnerFullName is required.")
                .MaximumLength(150).WithMessage("OwnerFullName must be at most 150 characters.");

            RuleFor(x => x.Request.OwnerPhone)
                .NotEmpty().WithMessage("OwnerPhone is required.")
                .MaximumLength(30).WithMessage("OwnerPhone must be at most 30 characters.");

            RuleFor(x => x.Request.OwnerAddress)
                .MaximumLength(300).WithMessage("OwnerAddress must be at most 300 characters.")
                .When(x => !string.IsNullOrWhiteSpace(x.Request.OwnerAddress));

            RuleFor(x => x.Request.PetName)
                .NotEmpty().WithMessage("PetName is required.")
                .MaximumLength(100).WithMessage("PetName must be at most 100 characters.");

            RuleFor(x => x.Request.PetSpecies)
                .NotEmpty().WithMessage("PetSpecies is required.")
                .Must(species => ValidPetSpecies.Contains(species))
                .WithMessage("PetSpecies must be Dog or Cat.");

            RuleFor(x => x.Request.PetBreed)
                .MaximumLength(100).WithMessage("PetBreed must be at most 100 characters.")
                .When(x => !string.IsNullOrWhiteSpace(x.Request.PetBreed));

            RuleFor(x => x.Request.PetGender)
                .Must(gender => string.IsNullOrWhiteSpace(gender) || ValidPetGenders.Contains(gender))
                .WithMessage("PetGender must be Male, Female or Unknown.");

            RuleFor(x => x.Request.PetDateOfBirth)
                .LessThanOrEqualTo(DateOnly.FromDateTime(DateTime.UtcNow))
                .WithMessage("PetDateOfBirth cannot be in the future.")
                .When(x => x.Request.PetDateOfBirth.HasValue);

            RuleFor(x => x.Request.AppointmentDate)
                .GreaterThanOrEqualTo(DateOnly.FromDateTime(DateTime.UtcNow))
                .WithMessage("AppointmentDate cannot be in the past.");

            RuleFor(x => x.Request.EndTime)
                .GreaterThan(x => x.Request.StartTime)
                .WithMessage("EndTime must be later than StartTime.");

            RuleFor(x => x.Request.AppointmentType)
                .NotEmpty().WithMessage("AppointmentType is required.")
                .Must(type => ValidAppointmentTypes.Contains(type, StringComparer.OrdinalIgnoreCase))
                .WithMessage($"AppointmentType must be one of: {string.Join(", ", ValidAppointmentTypes)}.");
        }
    }
}
