using QuickPark.API.Services.Interfaces;

namespace QuickPark.API.Services.Implementations;

public class ParkingUsageValidator : IParkingUsageValidator
{
    public Task<bool> CanUserReviewParking(
        Guid userId,
        Guid parkingId)
    {

        return Task.FromResult(true);
    }

}