using FluentValidation;
using PetOmiPlatform.Application.Features.Clinic.Command;

namespace PetOmiPlatform.Application.Features.Clinic.Validation
{
    public class CreateClinicCommandValidator : AbstractValidator<CreateClinicCommand>
    {
        public CreateClinicCommandValidator()
        {
            RuleFor(x => x.UserId)
                .NotEmpty().WithMessage("UserId không được để trống.");

            RuleFor(x => x.Request.ClinicName)
                .NotEmpty().WithMessage("Tên phòng khám không được để trống.")
                .MaximumLength(200).WithMessage("Tên phòng khám tối đa 200 ký tự.");

            RuleFor(x => x.Request.Address)
                .MaximumLength(500).WithMessage("Địa chỉ tối đa 500 ký tự.")
                .When(x => x.Request.Address != null);

            RuleFor(x => x.Request.Phone)
                .MaximumLength(20).WithMessage("Số điện thoại tối đa 20 ký tự.")
                .When(x => x.Request.Phone != null);

            RuleFor(x => x.Request.Email)
                .EmailAddress().WithMessage("Email phòng khám không hợp lệ.")
                .MaximumLength(255).WithMessage("Email phòng khám tối đa 255 ký tự.")
                .When(x => !string.IsNullOrWhiteSpace(x.Request.Email));

            RuleFor(x => x.Request.LicenseNumber)
                .MaximumLength(100).WithMessage("Số giấy phép tối đa 100 ký tự.")
                .When(x => x.Request.LicenseNumber != null);

            RuleFor(x => x.Request.LicenseImageUrl)
                .NotEmpty().WithMessage("Ảnh giấy phép phòng khám là bắt buộc.")
                .MaximumLength(500).WithMessage("License image URL tối đa 500 ký tự.")
                .Must(uri => Uri.TryCreate(uri, UriKind.Absolute, out _))
                .WithMessage("License image URL không hợp lệ.");

            RuleFor(x => x.Request.LicenseCloudinaryPublicId)
                .MaximumLength(500).WithMessage("License image publicId tối đa 500 ký tự.")
                .When(x => x.Request.LicenseCloudinaryPublicId != null);

            RuleFor(x => x.Request.LogoUrl)
                .MaximumLength(500).WithMessage("Logo URL tối đa 500 ký tự.")
                .When(x => x.Request.LogoUrl != null);

            RuleFor(x => x.Request.LogoCloudinaryPublicId)
                .MaximumLength(500).WithMessage("Logo publicId tối đa 500 ký tự.")
                .When(x => x.Request.LogoCloudinaryPublicId != null);
        }
    }
}
