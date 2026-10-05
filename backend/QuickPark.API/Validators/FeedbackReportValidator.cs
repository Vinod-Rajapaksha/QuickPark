using FluentValidation;
using QuickPark.API.DTOs.Feedback;

namespace QuickPark.API.Validators;

public class FeedbackReportValidator
    : AbstractValidator<CreateFeedbackReportRequest>
{

    public FeedbackReportValidator()
    {

        RuleFor(x=>x.FeedbackId)
            .NotEmpty()
            .WithMessage(
                "Feedback id is required.");

        RuleFor(x=>x.Reason)
            .NotEmpty()
            .WithMessage(
                "Report reason is required.");

        RuleFor(x=>x.Reason)
            .MaximumLength(500)
            .WithMessage(
                "Report reason cannot exceed 500 characters.");

    }

}