namespace QuickPark.API.Services.Interfaces;

public interface IParkingUsageValidator
{
    Task<bool> CanUserReviewParking(
        Guid userId,
        Guid parkingId
    );
}