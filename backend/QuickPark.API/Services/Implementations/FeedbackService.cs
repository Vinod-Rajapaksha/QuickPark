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

    public FeedbackService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<FeedbackResponse> CreateAsync(
        Guid userId,
        CreateFeedbackRequest request)
    {
        Reservation? reservation = null;

        if (request.Type == FeedbackType.PARKING)
        {
            if (request.ParkingId == null)
            {
                throw new Exception(
                    "Parking id is required for parking feedback.");
            }

            if (request.ReservationId == null)
            {
                throw new Exception(
                    "Reservation id is required for parking feedback.");
            }

            reservation = await _context.Reservations
                .FirstOrDefaultAsync(x =>
                    x.Id == request.ReservationId.Value);

            if (reservation == null)
            {
                throw new Exception(
                    "Reservation not found.");
            }

            if (reservation.DriverId != userId)
            {
                throw new Exception(
                    "You cannot review another user's reservation.");
            }
            if (reservation.FacilityId != request.ParkingId.Value)
            {
                throw new Exception(
                    "Parking does not match the reservation.");
            }

            if (reservation.Status != ReservationStatus.CHECKED_OUT && 
                reservation.Status != ReservationStatus.COMPLETED &&
                reservation.Status != ReservationStatus.CONFIRMED)
            {
                throw new Exception(
                    "Parking feedback can only be submitted for completed or checked-out reservations.");
            }

            var alreadyExists =
                await _context.Feedbacks.AnyAsync(x =>
                    x.ReservationId == request.ReservationId.Value &&
                    x.Type == FeedbackType.PARKING);

            if (alreadyExists)
            {
                throw new Exception(
                    "Parking feedback has already been submitted for this reservation.");
            }
        }

        if (request.Type == FeedbackType.SYSTEM)
        {
            request.ParkingId = null;
            request.ReservationId = null;

            if (request.Keywords != null &&
                request.Keywords.Any())
            {
                throw new Exception(
                    "System feedback cannot contain keywords.");
            }
        }

        var feedback = new Feedback
        {
            UserId = userId,
            Type = request.Type,
            ParkingId = request.ParkingId,
            ReservationId = request.ReservationId,
            Rating = request.Rating,
            Comment = request.Comment,

            Status = request.Type == FeedbackType.SYSTEM
                ? FeedbackStatus.PENDING_APPROVAL
                : FeedbackStatus.ACTIVE
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

        await using var transaction =
            await _context.Database.BeginTransactionAsync();

        try
        {
            _context.Feedbacks.Add(feedback);

            // Parking feedback completes the reservation.
            if (reservation != null)
            {
                reservation.Status =
                    ReservationStatus.COMPLETED;

                reservation.UpdatedAt =
                    DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }

        return await GetByIdAsync(feedback.Id);
    }

    public async Task<List<FeedbackResponse>> GetAllAsync()
    {
        return await _context.Feedbacks

            .Where(x =>
                x.Status == FeedbackStatus.ACTIVE)

            .Include(x => x.User)
            .Include(x => x.Keywords)
            .Include(x => x.Replies)

            .OrderByDescending(x => x.CreatedAt)

            .Select(x => new FeedbackResponse
            {
                Id = x.Id,

                UserName =
                    x.User.FullName,

                Type =
                    x.Type,

                ParkingId =
                    x.ParkingId,

                ReservationId =
                    x.ReservationId,

                Rating =
                    x.Rating,

                Comment =
                    x.Comment,

                Status =
                    x.Status,

                Keywords =
                    x.Keywords
                        .Select(k => k.Keyword)
                        .ToList(),

                Replies =
                    x.Replies
                        .Select(r => new FeedbackReplyResponse
                        {
                            Id = r.Id,

                            RepliedByUserId =
                                r.RepliedByUserId,

                            Role =
                                r.ReplierRole,

                            Message =
                                r.Message,

                            CreatedAt =
                                r.CreatedAt
                        })
                        .ToList(),

                CreatedAt =
                    x.CreatedAt,

                UpdatedAt =
                    x.UpdatedAt
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
                .Include(x => x.Replies)

                .FirstOrDefaultAsync(
                    x => x.Id == id);

        if (feedback == null)
        {
            throw new Exception(
                "Feedback not found.");
        }

        return new FeedbackResponse
        {
            Id = feedback.Id,

            UserName =
                feedback.User.FullName,

            Type =
                feedback.Type,

            ParkingId =
                feedback.ParkingId,

            ReservationId =
                feedback.ReservationId,

            Rating =
                feedback.Rating,

            Comment =
                feedback.Comment,

            Status =
                feedback.Status,

            Keywords =
                feedback.Keywords
                    .Select(x => x.Keyword)
                    .ToList(),

            Replies =
                feedback.Replies
                    .Select(r => new FeedbackReplyResponse
                    {
                        Id = r.Id,

                        RepliedByUserId =
                            r.RepliedByUserId,

                        Role =
                            r.ReplierRole,

                        Message =
                            r.Message,

                        CreatedAt =
                            r.CreatedAt
                    })
                    .ToList(),

            CreatedAt =
                feedback.CreatedAt,

            UpdatedAt =
                feedback.UpdatedAt
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
                "Feedback not found.");
        }

        if (feedback.UserId != userId)
        {
            throw new Exception(
                "You cannot update this feedback.");
        }

        if (feedback.Status == FeedbackStatus.REMOVED)
        {
            throw new Exception(
                "Removed feedback cannot be updated.");
        }

        feedback.Rating =
            request.Rating;

        feedback.Comment =
            request.Comment;

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
                "Feedback not found.");
        }

        if (feedback.UserId != userId)
        {
            throw new Exception(
                "You cannot delete this feedback.");
        }

        if (feedback.Status == FeedbackStatus.REMOVED)
        {
            throw new Exception(
                "Feedback is already removed.");
        }

        feedback.Status =
            FeedbackStatus.REMOVED;

        feedback.UpdatedAt =
            DateTime.UtcNow;

        await _context.SaveChangesAsync();
    }

    public async Task<List<FeedbackResponse>>
        GetMyParkingFeedbackAsync(Guid userId)
    {
        return await _context.Feedbacks

            .Where(x =>
                x.UserId == userId &&
                x.Type == FeedbackType.PARKING &&
                x.Status != FeedbackStatus.REMOVED)

            .Include(x => x.User)
            .Include(x => x.Keywords)
            .Include(x => x.Replies)

            .OrderByDescending(x => x.CreatedAt)

            .Select(x => new FeedbackResponse
            {
                Id = x.Id,

                UserName =
                    x.User.FullName,

                Type =
                    x.Type,

                ParkingId =
                    x.ParkingId,

                ReservationId =
                    x.ReservationId,

                Rating =
                    x.Rating,

                Comment =
                    x.Comment,

                Status =
                    x.Status,

                Keywords =
                    x.Keywords
                        .Select(k => k.Keyword)
                        .ToList(),

                Replies =
                    x.Replies
                        .Select(r => new FeedbackReplyResponse
                        {
                            Id = r.Id,

                            RepliedByUserId =
                                r.RepliedByUserId,

                            Role =
                                r.ReplierRole,

                            Message =
                                r.Message,

                            CreatedAt =
                                r.CreatedAt
                        })
                        .ToList(),

                CreatedAt =
                    x.CreatedAt,

                UpdatedAt =
                    x.UpdatedAt
            })

            .ToListAsync();
    }

    public async Task<bool>
        ShouldShowSystemFeedbackPromptAsync(Guid userId)
    {

        var hasCompletedReservation =
            await _context.Reservations.AnyAsync(x =>
                x.DriverId == userId &&
                x.Status == ReservationStatus.COMPLETED);

        if (!hasCompletedReservation)
        {
            return false;
        }

        // If the user has already submitted system feedback,
        // there is no need to show the first-time popup.
        var hasSystemFeedback =
            await _context.Feedbacks.AnyAsync(x =>
                x.UserId == userId &&
                x.Type == FeedbackType.SYSTEM &&
                x.Status != FeedbackStatus.REMOVED);

        return !hasSystemFeedback;
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
                "Feedback not found.");
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
                "Feedback not found.");
        }

        if (feedback.Type != FeedbackType.SYSTEM)
        {
            throw new Exception(
                "Only system feedback requires approval.");
        }

        feedback.Status =
            FeedbackStatus.ACTIVE;

        feedback.ModeratedAt =
            DateTime.UtcNow;

        feedback.UpdatedAt =
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
                "Feedback not found.");
        }

        feedback.Status =
            FeedbackStatus.REMOVED;

        feedback.UpdatedAt =
            DateTime.UtcNow;

        await _context.SaveChangesAsync();
    }

    public async Task<List<FeedbackResponse>>
        GetPendingAsync()
    {
        return await _context.Feedbacks

            .Where(x =>
                x.Type == FeedbackType.SYSTEM &&
                x.Status == FeedbackStatus.PENDING_APPROVAL)

            .Include(x => x.User)
            .Include(x => x.Keywords)

            .OrderByDescending(x => x.CreatedAt)

            .Select(x => new FeedbackResponse
            {
                Id = x.Id,

                UserName =
                    x.User.FullName,

                Type =
                    x.Type,

                ParkingId =
                    x.ParkingId,

                ReservationId =
                    x.ReservationId,

                Rating =
                    x.Rating,

                Comment =
                    x.Comment,

                Status =
                    x.Status,

                Keywords =
                    x.Keywords
                        .Select(k => k.Keyword)
                        .ToList(),

                CreatedAt =
                    x.CreatedAt,

                UpdatedAt =
                    x.UpdatedAt
            })

            .ToListAsync();
    }

    public async Task<List<FeedbackResponse>> GetHiddenAsync()
    {
        return await _context.Feedbacks
            .Where(x =>
                x.Type == FeedbackType.SYSTEM &&
                x.Status == FeedbackStatus.HIDDEN)

            .Include(x => x.User)
            .Include(x => x.Keywords)
            .Include(x => x.Replies)

            .OrderByDescending(x => x.CreatedAt)

            .Select(x => new FeedbackResponse
            {
                Id = x.Id,
                UserName = x.User != null
                    ? x.User.FullName
                    : "Unknown User",
                Type = x.Type,
                ParkingId = x.ParkingId,
                ReservationId = x.ReservationId,
                Rating = x.Rating,
                Comment = x.Comment,
                Status = x.Status,

                Keywords = x.Keywords
                    .Select(k => k.Keyword)
                    .ToList(),

                Replies = x.Replies
                    .Select(r => new FeedbackReplyResponse
                    {
                        Id = r.Id,
                        RepliedByUserId = r.RepliedByUserId,
                        Role = r.ReplierRole,
                        Message = r.Message,
                        CreatedAt = r.CreatedAt
                    })
                    .ToList(),

                CreatedAt = x.CreatedAt,
                UpdatedAt = x.UpdatedAt
            })
            .ToListAsync();
    }

    public async Task<List<FeedbackReportResponse>>
        GetReportsAsync()
    {
        return await _context.FeedbackReports

            .Include(x => x.Feedback)

            .ThenInclude(x => x.User)

            .Select(x => new FeedbackReportResponse
            {
                Id =
                    x.Id,

                FeedbackId =
                    x.FeedbackId,

                ReporterUserId =
                    x.ReporterUserId,

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
                "Feedback not found.");
        }

        feedback.Status = FeedbackStatus.ACTIVE;

        feedback.ModeratedBy = null;

        feedback.ModeratedAt = null;

        feedback.UpdatedAt =
            DateTime.UtcNow;

        await _context.SaveChangesAsync();
    }
}