using FluentValidation;
using QuickPark.API.DTOs.Staff;

namespace QuickPark.API.Validators;

public class CreateStaffValidator
    : AbstractValidator<CreateStaffRequest>
{

    public CreateStaffValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress();

        RuleFor(x => x.Password)
            .MinimumLength(8);

        RuleFor(x => x.Position)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(x => x.FacilityId)
            .NotEmpty();

    }

}