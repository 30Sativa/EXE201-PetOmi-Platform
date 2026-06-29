using FluentValidation;
using PetOmiPlatform.Application.Features.WebsiteFeedback.Command;

namespace PetOmiPlatform.Application.Features.WebsiteFeedback.Validation
{
    public class CreateWebsiteFeedbackCommandValidator : AbstractValidator<CreateWebsiteFeedbackCommand>
    {
        public CreateWebsiteFeedbackCommandValidator()
        {
            RuleFor(x => x.Request.Category)
                .NotEmpty().WithMessage("Vui long chon loai feedback.")
                .MaximumLength(50).WithMessage("Loai feedback toi da 50 ky tu.");

            RuleFor(x => x.Request.Rating)
                .InclusiveBetween(1, 5)
                .When(x => x.Request.Rating.HasValue)
                .WithMessage("Diem danh gia phai tu 1 den 5.");

            RuleFor(x => x.Request.Subject)
                .NotEmpty().WithMessage("Vui long nhap tieu de feedback.")
                .MaximumLength(150).WithMessage("Tieu de feedback toi da 150 ky tu.");

            RuleFor(x => x.Request.Message)
                .NotEmpty().WithMessage("Vui long nhap noi dung feedback.")
                .MaximumLength(2000).WithMessage("Noi dung feedback toi da 2000 ky tu.");

            RuleFor(x => x.Request.PageUrl)
                .MaximumLength(500).WithMessage("Duong dan trang toi da 500 ky tu.")
                .When(x => !string.IsNullOrWhiteSpace(x.Request.PageUrl));

            RuleFor(x => x.Request.BrowserInfo)
                .MaximumLength(300).WithMessage("Thong tin trinh duyet toi da 300 ky tu.")
                .When(x => !string.IsNullOrWhiteSpace(x.Request.BrowserInfo));
        }
    }
}
