using FluentValidation;
using QuickPark.API.DTOs.Feedback;

namespace QuickPark.API.Validators;

public class FeedbackReplyValidator 
    : AbstractValidator<CreateFeedbackReplyRequest>
{
    public FeedbackReplyValidator()
    {

        RuleFor(x=>x.FeedbackId)
            .NotEmpty()
            .WithMessage(
                "Feedback id is required.");

        RuleFor(x=>x.Message)
            .NotEmpty()
            .WithMessage(
                "Reply message is required.");

        RuleFor(x=>x.Message)
            .MaximumLength(1000)
            .WithMessage(
                "Reply message cannot exceed 1000 characters.");

    }

}