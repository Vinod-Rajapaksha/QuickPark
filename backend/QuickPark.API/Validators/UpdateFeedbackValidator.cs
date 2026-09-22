using FluentValidation;
using QuickPark.API.DTOs.Feedback;

namespace QuickPark.API.Validators;
public class UpdateFeedbackValidator 
    : AbstractValidator<UpdateFeedbackRequest>
{
    public UpdateFeedbackValidator()
    {

        RuleFor(x=>x.Rating)
            .InclusiveBetween(1,5);

        RuleFor(x=>x.Comment)
            .NotEmpty()
            .MaximumLength(1000);

        RuleFor(x=>x.Keywords)
            .Must(x=>x==null || x.Count<=5)
            .WithMessage(
            "Maximum 5 keywords allowed.");

        RuleForEach(x=>x.Keywords)
            .IsInEnum();

    }

}