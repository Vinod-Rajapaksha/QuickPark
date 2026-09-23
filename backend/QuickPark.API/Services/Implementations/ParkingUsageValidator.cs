using QuickPark.API.Services.Interfaces;

namespace QuickPark.API.Services.Implementations;

public class ParkingUsageValidator : IParkingUsageValidator
{

    public Task<bool> CanUserReviewParking(
        Guid userId,
        Guid parkingId)
    {
        // TEMPORARY IMPLEMENTATION
        return Task.FromResult(true);
    }

}