using QuickPark.API.Models;

namespace QuickPark.API.Services.Interfaces;

public interface IParkingAccessValidator
{
        Task<bool> CanReplyToParkingFeedback(
        Guid userId,
        Guid parkingId,
        UserRole role);

}