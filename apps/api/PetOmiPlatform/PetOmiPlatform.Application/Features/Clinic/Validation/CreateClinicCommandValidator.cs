using FluentValidation;
using PetOmiPlatform.Application.Features.Clinic.Command;

namespace PetOmiPlatform.Application.Features.Clinic.Validation
{
    public class CreateClinicCommandValidator : AbstractValidator<CreateClinicCommand>
    {
        public CreateClinicCommandValidator()
        {
            RuleFor(x => x.UserId)
                .NotEmpty().WithMessage("UserId không được để trống");

            RuleFor(x => x.Request.ClinicName)
                .NotEmpty().WithMessage("Tên phòng khám không được để trống")
                .MaximumLength(200).WithMessage("Tên phòng khám không được vượt quá 200 ký tự");

            RuleFor(x => x.Request.Address)
                .MaximumLength(500).WithMessage("Địa chỉ không được vượt quá 500 ký tự")
                .When(x => x.Request.Address != null);

            RuleFor(x => x.Request.Phone)
                .MaximumLength(20).WithMessage("Số điện thoại không được vượt quá 20 ký tự")
                .When(x => x.Request.Phone != null);

            RuleFor(x => x.Request.Email)
                .EmailAddress().WithMessage("Email phòng khám không hợp lệ")
                .MaximumLength(255).WithMessage("Email phòng khám không được vượt quá 255 ký tự")
                .When(x => !string.IsNullOrWhiteSpace(x.Request.Email));

            RuleFor(x => x.Request.LicenseNumber)
                .MaximumLength(100).WithMessage("Số giấy phép không được vượt quá 100 ký tự")
                .When(x => x.Request.LicenseNumber != null);
        }
    }
}
