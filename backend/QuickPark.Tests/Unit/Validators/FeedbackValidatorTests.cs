using FluentValidation.TestHelper;
using QuickPark.API.DTOs.Feedback;
using QuickPark.API.Enums;
using QuickPark.API.Validators;

namespace QuickPark.Tests.Unit.Validators;

public class FeedbackValidatorTests
{
    private readonly CreateFeedbackValidator _createValidator;
    private readonly UpdateFeedbackValidator _updateValidator;

    public FeedbackValidatorTests()
    {
        _createValidator = new CreateFeedbackValidator();
        _updateValidator = new UpdateFeedbackValidator();
    }

    [Fact]
    public void CreateValidator_ValidFeedback_ShouldNotHaveValidationErrors()
    {
        var request = new CreateFeedbackRequest
        {
            Type = FeedbackType.SYSTEM,
            Rating = 5,
            Comment = "The QuickPark application is very useful."
        };

        var result = _createValidator.TestValidate(request);

        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void CreateValidator_RatingBelowAllowedRange_ShouldHaveValidationError()
    {
        var request = new CreateFeedbackRequest
        {
            Type = FeedbackType.SYSTEM,
            Rating = 0,
            Comment = "Test feedback"
        };

        var result = _createValidator.TestValidate(request);

        result.ShouldHaveValidationErrorFor(x => x.Rating);
    }

    [Fact]
    public void CreateValidator_RatingAboveAllowedRange_ShouldHaveValidationError()
    {
        var request = new CreateFeedbackRequest
        {
            Type = FeedbackType.SYSTEM,
            Rating = 6,
            Comment = "Test feedback"
        };

        var result = _createValidator.TestValidate(request);

        result.ShouldHaveValidationErrorFor(x => x.Rating);
    }

    [Fact]
    public void UpdateValidator_ValidRequest_ShouldNotHaveValidationErrors()
    {
        var request = new UpdateFeedbackRequest
        {
            Rating = 4,
            Comment = "Updated feedback comment"
        };

        var result = _updateValidator.TestValidate(request);

        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void UpdateValidator_RatingBelowAllowedRange_ShouldHaveValidationError()
    {
        var request = new UpdateFeedbackRequest
        {
            Rating = 0,
            Comment = "Updated comment"
        };

        var result = _updateValidator.TestValidate(request);

        result.ShouldHaveValidationErrorFor(x => x.Rating);
    }

    [Fact]
    public void UpdateValidator_RatingAboveAllowedRange_ShouldHaveValidationError()
    {
        var request = new UpdateFeedbackRequest
        {
            Rating = 6,
            Comment = "Updated comment"
        };

        var result = _updateValidator.TestValidate(request);

        result.ShouldHaveValidationErrorFor(x => x.Rating);
    }
}