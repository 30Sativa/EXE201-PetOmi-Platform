using FluentValidation;
using PetOmiPlatform.Application.Features.Pet.DTOs.Request;

namespace PetOmiPlatform.Application.Features.Pet.Validation
{
    public class GrantPetAccessCommandValidator : AbstractValidator<GrantPetAccessRequest>
    {
        private static readonly string[] ValidRoles = { "Owner", "Editor", "Viewer" };

        public GrantPetAccessCommandValidator()
        {
            RuleFor(x => x.UserId)
                .NotEmpty().WithMessage("UserId không được để trống.");

            RuleFor(x => x.AccessRole)
                .NotEmpty().WithMessage("Vai trò truy cập không được để trống.")
                .Must(x => ValidRoles.Contains(x, StringComparer.OrdinalIgnoreCase))
                .WithMessage($"AccessRole chỉ chấp nhận: {string.Join(", ", ValidRoles)}.");

            RuleFor(x => x.ExpiresAt)
                .GreaterThan(DateTime.UtcNow).When(x => x.ExpiresAt.HasValue)
                .WithMessage("Ngày hết hạn không thể trong quá khứ.");
        }
    }
}
