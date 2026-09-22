using FluentValidation;
using QuickPark.API.DTOs.Feedback;
using QuickPark.API.Enums;

namespace QuickPark.API.Validators;

public class CreateFeedbackValidator
    : AbstractValidator<CreateFeedbackRequest>
{
    public CreateFeedbackValidator()
    {

        RuleFor(x=>x.Type)
            .IsInEnum();

        RuleFor(x=>x.Rating)
            .InclusiveBetween(1,5);

        RuleFor(x=>x.Comment)
            .NotEmpty()
            .MaximumLength(1000);

        RuleFor(x=>x.ParkingId)
            .NotNull()
            .When(x=>x.Type == FeedbackType.PARKING)
            .WithMessage(
            "Parking id is required for parking feedback");

        RuleFor(x=>x.Keywords)
            .Must(x=>x == null || x.Count <= 5)
            .WithMessage(
            "Maximum 5 keywords allowed");

        RuleForEach(x=>x.Keywords)
            .IsInEnum();

        RuleFor(x=>x)
            .Custom((request, context)=>
            {

                if(request.Type == FeedbackType.SYSTEM)
                {

                    if(request.ParkingId != null)
                    {
                        context.AddFailure(
                        "ParkingId",
                        "System feedback cannot have parking id");
                    }

                    if(request.Keywords != null &&
                       request.Keywords.Any())
                    {
                        context.AddFailure(
                        "Keywords",
                        "System feedback cannot contain keywords");
                    }

                }

            });

    }

}