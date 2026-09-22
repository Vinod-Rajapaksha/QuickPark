using QuickPark.API.Models;
using QuickPark.API.Services.Interfaces;

namespace QuickPark.API.Services.Implementations;

public class ParkingAccessValidator 
    : IParkingAccessValidator
{
    public Task<bool> CanReplyToParkingFeedback(
        Guid userId,
        Guid parkingId,
        UserRole role)
    {
        return Task.FromResult(true);

    }
}