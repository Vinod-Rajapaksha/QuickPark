using QuickPark.API.DTOs.Feedback;

namespace QuickPark.API.Services.Interfaces;
public interface IFeedbackService
{
        Task<FeedbackResponse> CreateAsync(
        Guid userId,
        CreateFeedbackRequest request);

    Task<List<FeedbackResponse>> GetAllAsync();

    Task<FeedbackResponse> GetByIdAsync(
        Guid id);

    Task<FeedbackResponse> UpdateAsync(
        Guid userId,
        Guid id,
        UpdateFeedbackRequest request);

    Task DeleteAsync(
        Guid userId,
        Guid id);

    Task HideAsync(
        Guid id);

    Task ApproveAsync(
        Guid id);

    Task AdminDeleteAsync(
        Guid id);

    Task<List<FeedbackResponse>> GetPendingAsync();

    Task<List<FeedbackReportResponse>> GetReportsAsync();

    Task RestoreAsync(
        Guid id);

}