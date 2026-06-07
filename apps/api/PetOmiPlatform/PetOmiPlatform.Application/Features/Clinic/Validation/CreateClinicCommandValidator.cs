using FluentValidation;
using PetOmiPlatform.Application.Features.Clinic.Command;

namespace PetOmiPlatform.Application.Features.Clinic.Validation
{
    public class CreateClinicCommandValidator : AbstractValidator<CreateClinicCommand>
    {
        public CreateClinicCommandValidator()
        {
            RuleFor(x => x.UserId)
                .NotEmpty().WithMessage("UserId khong duoc de trong.");

            RuleFor(x => x.Request.ClinicName)
                .NotEmpty().WithMessage("Ten phong kham khong duoc de trong.")
                .MaximumLength(200).WithMessage("Ten phong kham toi da 200 ky tu.");

            RuleFor(x => x.Request.Address)
                .MaximumLength(500).WithMessage("Dia chi toi da 500 ky tu.")
                .When(x => x.Request.Address != null);

            RuleFor(x => x.Request.Phone)
                .MaximumLength(20).WithMessage("So dien thoai toi da 20 ky tu.")
                .When(x => x.Request.Phone != null);

            RuleFor(x => x.Request.Email)
                .EmailAddress().WithMessage("Email phong kham khong hop le.")
                .MaximumLength(255).WithMessage("Email phong kham toi da 255 ky tu.")
                .When(x => !string.IsNullOrWhiteSpace(x.Request.Email));

            RuleFor(x => x.Request.LicenseNumber)
                .MaximumLength(100).WithMessage("So giay phep toi da 100 ky tu.")
                .When(x => x.Request.LicenseNumber != null);

            RuleFor(x => x.Request.LicenseImageUrl)
                .NotEmpty().WithMessage("Anh giay phep phong kham la bat buoc.")
                .MaximumLength(500).WithMessage("License image URL toi da 500 ky tu.")
                .Must(uri => Uri.TryCreate(uri, UriKind.Absolute, out _))
                .WithMessage("License image URL khong hop le.");

            RuleFor(x => x.Request.LicenseCloudinaryPublicId)
                .MaximumLength(500).WithMessage("License image publicId toi da 500 ky tu.")
                .When(x => x.Request.LicenseCloudinaryPublicId != null);

            RuleFor(x => x.Request.LogoUrl)
                .MaximumLength(500).WithMessage("Logo URL toi da 500 ky tu.")
                .When(x => x.Request.LogoUrl != null);

            RuleFor(x => x.Request.LogoCloudinaryPublicId)
                .MaximumLength(500).WithMessage("Logo publicId toi da 500 ky tu.")
                .When(x => x.Request.LogoCloudinaryPublicId != null);
        }
    }
}
