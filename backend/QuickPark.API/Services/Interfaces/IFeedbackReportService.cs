using QuickPark.API.DTOs.Feedback;
using QuickPark.API.Models;

namespace QuickPark.API.Services.Interfaces;
public interface IFeedbackReportService
{
      Task CreateAsync(
        Guid userId,
        UserRole role,
        CreateFeedbackReportRequest request);
}