using Microsoft.EntityFrameworkCore;
using QuickPark.API.Data;
using QuickPark.API.DTOs.Feedback;
using QuickPark.API.Enums;
using QuickPark.API.Models;
using QuickPark.API.Services.Interfaces;

namespace QuickPark.API.Services.Implementations;

public class FeedbackReportService
    : IFeedbackReportService
{
    private readonly AppDbContext _context;
    public FeedbackReportService(
        AppDbContext context)
    {
        _context = context;
    }

    public async Task CreateAsync(
        Guid userId,
        UserRole role,
        CreateFeedbackReportRequest request)
    {
        if (role != UserRole.DRIVER)
        {
            throw new Exception(
                "Only drivers can report feedback");
        }

        if (string.IsNullOrWhiteSpace(request.Reason))
        {
            throw new Exception(
                "Report reason is required");
        }

        var feedback =
            await _context.Feedbacks
            .FirstOrDefaultAsync(
                x => x.Id == request.FeedbackId);


        if (feedback == null)
        {
            throw new Exception(
                "Feedback not found");
        }

        if (feedback.Type != FeedbackType.PARKING)
        {
            throw new Exception(
                "System feedback cannot be reported");
        }

        if (feedback.Status != FeedbackStatus.ACTIVE)
        {
            throw new Exception(
                "Cannot report unavailable feedback");
        }

        if (feedback.UserId == userId)
        {
            throw new Exception(
                "Cannot report own feedback");
        }

        var alreadyExists =
            await _context.FeedbackReports
            .AnyAsync(
                x =>
                x.FeedbackId == request.FeedbackId
                &&
                x.ReporterUserId == userId);

        if (alreadyExists)
        {
            throw new Exception(
                "Already reported");
        }

        var report = new FeedbackReport
        {
            FeedbackId =
                request.FeedbackId,

            ReporterUserId =
                userId,

            Reason =
                request.Reason

        };
        _context.FeedbackReports.Add(report);

        await _context.SaveChangesAsync();
    }

}