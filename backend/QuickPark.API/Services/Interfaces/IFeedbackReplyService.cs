using QuickPark.API.DTOs.Feedback;
using QuickPark.API.Models;

namespace QuickPark.API.Services.Interfaces;
public interface IFeedbackReplyService
{
Task<FeedbackReplyResponse> CreateAsync(
    Guid userId,
    UserRole role,
    CreateFeedbackReplyRequest request
);

}