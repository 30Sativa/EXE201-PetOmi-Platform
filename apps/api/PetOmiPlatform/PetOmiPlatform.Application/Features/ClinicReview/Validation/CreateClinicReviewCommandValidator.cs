using FluentValidation;
using PetOmiPlatform.Application.Features.ClinicReview.Command;

namespace PetOmiPlatform.Application.Features.ClinicReview.Validation
{
    public class CreateClinicReviewCommandValidator : AbstractValidator<CreateClinicReviewCommand>
    {
        public CreateClinicReviewCommandValidator()
        {
            RuleFor(x => x.Request.ClinicId)
                .NotEmpty().WithMessage("Thiếu thông tin phòng khám.");

            RuleFor(x => x.Request.Rating)
                .InclusiveBetween(1, 5).WithMessage("Số sao đánh giá phải từ 1 đến 5.");

            RuleFor(x => x.Request.ReviewContent)
                .NotEmpty().WithMessage("Vui lòng nhập nội dung đánh giá.")
                .MaximumLength(1000).WithMessage("Nội dung đánh giá không được vượt quá 1000 ký tự.");
        }
    }
}
