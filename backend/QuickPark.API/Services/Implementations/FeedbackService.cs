using Microsoft.EntityFrameworkCore;
using QuickPark.API.Data;
using QuickPark.API.DTOs.Feedback;
using QuickPark.API.Enums;
using QuickPark.API.Models;
using QuickPark.API.Services.Interfaces;

namespace QuickPark.API.Services.Implementations;

public class FeedbackService : IFeedbackService

{
    private readonly AppDbContext _context;

    private readonly IParkingUsageValidator _parkingValidator;
    public FeedbackService(
       AppDbContext context,
       IParkingUsageValidator parkingValidator)
    {
        _context = context;

        _parkingValidator = parkingValidator;
    }

    public async Task<FeedbackResponse> CreateAsync(
        Guid userId,
        CreateFeedbackRequest request)
    {

        if (request.Type == FeedbackType.PARKING)
        {
            if (request.ParkingId == null)
            {
                throw new Exception(
                    "Parking id is required for parking feedback");
            }

            var canReview =
                await _parkingValidator
                .CanUserReviewParking(
                    userId,
                    request.ParkingId.Value);

            if (!canReview)
            {
                throw new Exception(
                    "You cannot review this parking");
            }

        }
        if (request.Type == FeedbackType.SYSTEM)
        {
            request.ParkingId = null;

            if (request.Keywords != null &&
               request.Keywords.Any())
            {
                throw new Exception(
                    "System feedback cannot contain keywords");
            }

        }

        var feedback = new Feedback
        {
            UserId = userId,
            Type = request.Type,
            ParkingId = request.ParkingId,
            Rating = request.Rating,
            Comment = request.Comment,
            Status =
                request.Type == FeedbackType.SYSTEM
                ?
                FeedbackStatus.PENDING_APPROVAL
                :
                FeedbackStatus.ACTIVE

        };

        if (request.Type == FeedbackType.PARKING &&
           request.Keywords != null)
        {
            foreach (var keyword in request.Keywords)
            {
                feedback.Keywords.Add(
                    new FeedbackKeyword
                    {
                        Keyword = keyword
                    });

            }

        }
        _context.Feedbacks.Add(feedback);

        await _context.SaveChangesAsync();

        return await GetByIdAsync(feedback.Id);

    }

    public async Task<List<FeedbackResponse>> GetAllAsync()
    {
        return await _context.Feedbacks
            .Where(x =>
                x.Status == FeedbackStatus.ACTIVE)

            .Include(x => x.User)

            .Include(x => x.Keywords)

            .Select(x => new FeedbackResponse
            {
                Id = x.Id,
                UserName = x.User.FullName,
                Type = x.Type,
                ParkingId = x.ParkingId,
                Rating = x.Rating,
                Comment = x.Comment,
                Status = x.Status,
                Keywords =
                    x.Keywords
                    .Select(k => k.Keyword)
                    .ToList()
            })
            .ToListAsync();

    }

    public async Task<FeedbackResponse> GetByIdAsync(
        Guid id)
    {
        var feedback =
            await _context.Feedbacks

            .Include(x => x.User)

            .Include(x => x.Keywords)

            .FirstOrDefaultAsync(
                x => x.Id == id);

        if (feedback == null)
        {
            throw new Exception(
                "Feedback not found");
        }

        return new FeedbackResponse
        {
            Id = feedback.Id,
            UserName = feedback.User.FullName,
            Type = feedback.Type,
            ParkingId = feedback.ParkingId,
            Rating = feedback.Rating,
            Comment = feedback.Comment,
            Status = feedback.Status,
            Keywords =
                feedback.Keywords
                .Select(x => x.Keyword)
                .ToList()

        };

    }

    public async Task<FeedbackResponse> UpdateAsync(
        Guid userId,
        Guid id,
        UpdateFeedbackRequest request)
    {
        var feedback =
            await _context.Feedbacks

            .Include(x => x.Keywords)

            .FirstOrDefaultAsync(
                x => x.Id == id);

        if (feedback == null)
        {
            throw new Exception(
                "Feedback not found");
        }

        if (feedback.UserId != userId)
        {
            throw new Exception(
                "You cannot update this feedback");
        }
        feedback.Rating = request.Rating;
        feedback.Comment = request.Comment;

        feedback.Keywords.Clear();

        if (feedback.Type == FeedbackType.PARKING &&
           request.Keywords != null)
        {
            foreach (var keyword in request.Keywords)
            {
                feedback.Keywords.Add(
                    new FeedbackKeyword
                    {
                        Keyword = keyword
                    });

            }

        }
        if (feedback.Type == FeedbackType.SYSTEM)
        {
            feedback.Status =
                FeedbackStatus.PENDING_APPROVAL;

            feedback.ModeratedBy = null;
            feedback.ModeratedAt = null;

        }
        feedback.UpdatedAt =
            DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return await GetByIdAsync(id);

    }

    public async Task DeleteAsync(
        Guid userId,
        Guid id)
    {
        var feedback =
            await _context.Feedbacks
            .FirstOrDefaultAsync(
                x => x.Id == id);

        if (feedback == null)
        {
            throw new Exception(
                "Feedback not found");
        }
        if (feedback.UserId != userId)
        {
            throw new Exception(
                "You cannot delete this feedback");
        }
        feedback.Status =
            FeedbackStatus.REMOVED;

        feedback.UpdatedAt =
            DateTime.UtcNow;

        await _context.SaveChangesAsync();

    }

    public async Task HideAsync(Guid id)
    {
        var feedback =
            await _context.Feedbacks
            .FirstOrDefaultAsync(
                x => x.Id == id);

        if (feedback == null)
        {
            throw new Exception(
                "Feedback not found");
        }

        feedback.Status =
            FeedbackStatus.HIDDEN;

        feedback.UpdatedAt =
            DateTime.UtcNow;

        await _context.SaveChangesAsync();

    }

    public async Task ApproveAsync(Guid id)
    {

        var feedback =
            await _context.Feedbacks
            .FirstOrDefaultAsync(
                x => x.Id == id);

        if (feedback == null)
        {
            throw new Exception(
                "Feedback not found");
        }

        if (feedback.Type != FeedbackType.SYSTEM)
        {
            throw new Exception(
                "Only system feedback requires approval");
        }

        feedback.Status =
            FeedbackStatus.ACTIVE;

        feedback.ModeratedAt =
            DateTime.UtcNow;

        await _context.SaveChangesAsync();

    }

    public async Task AdminDeleteAsync(Guid id)
    {
        var feedback =
            await _context.Feedbacks
            .FirstOrDefaultAsync(
                x => x.Id == id);

        if (feedback == null)
        {
            throw new Exception(
                "Feedback not found");
        }

        feedback.Status =
            FeedbackStatus.REMOVED;

        feedback.UpdatedAt =
            DateTime.UtcNow;

        await _context.SaveChangesAsync();

    }

    public async Task<List<FeedbackResponse>> GetPendingAsync()
    {
        return await _context.Feedbacks

            .Where(x =>
                x.Type == FeedbackType.SYSTEM
                &&
                x.Status == FeedbackStatus.PENDING_APPROVAL)

            .Include(x => x.User)

            .Include(x => x.Keywords)

            .Select(x => new FeedbackResponse
            {

                Id = x.Id,
                UserName = x.User.FullName,
                Type = x.Type,
                ParkingId = x.ParkingId,
                Rating = x.Rating,
                Comment = x.Comment,
                Status = x.Status,
                Keywords =
                    x.Keywords
                    .Select(k => k.Keyword)
                    .ToList()
            })

            .ToListAsync();

    }
    public async Task<List<FeedbackReportResponse>> GetReportsAsync()
    {
        return await _context.FeedbackReports

            .Include(x => x.Feedback)

            .ThenInclude(x => x.User)

            .Select(x => new FeedbackReportResponse
            {

                Id = x.Id,
                FeedbackId = x.FeedbackId,
                ReporterUserId = x.ReporterUserId,
                ReporterName =
                    x.Feedback.User.FullName,
                FeedbackComment =
                    x.Feedback.Comment ?? string.Empty,
                Reason =
                    x.Reason,
                CreatedAt =
                    x.CreatedAt

            })

            .ToListAsync();

    }
    public async Task RestoreAsync(Guid id)
    {
        var feedback =
            await _context.Feedbacks
            .FirstOrDefaultAsync(
                x => x.Id == id);

        if (feedback == null)
        {
            throw new Exception(
                "Feedback not found");
        }

        feedback.Status =
            feedback.Type == FeedbackType.SYSTEM
            ?
            FeedbackStatus.PENDING_APPROVAL
            :
            FeedbackStatus.ACTIVE;

        feedback.ModeratedBy = null;

        feedback.ModeratedAt = null;

        feedback.UpdatedAt =
            DateTime.UtcNow;

        await _context.SaveChangesAsync();

    }
}