using Microsoft.EntityFrameworkCore;
using QuickPark.API.Data;
using QuickPark.API.DTOs.Feedback;
using QuickPark.API.Enums;
using QuickPark.API.Models;
using QuickPark.API.Services.Implementations;

namespace QuickPark.Tests.Unit.Services;

public class FeedbackServiceTests
{
    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public async Task CreateAsync_ParkingFeedbackWithoutParkingId_ThrowsException()
    {
        await using var context = CreateContext();

        var service = new FeedbackService(context);

        var request = new CreateFeedbackRequest
        {
            Type = FeedbackType.PARKING,
            ParkingId = null,
            ReservationId = Guid.NewGuid(),
            Rating = 5,
            Comment = "Good parking facility"
        };

        var action = async () =>
            await service.CreateAsync(Guid.NewGuid(), request);

        await action.Should()
            .ThrowAsync<Exception>()
            .WithMessage("Parking id is required for parking feedback.");
    }

    [Fact]
    public async Task CreateAsync_ParkingFeedbackWithoutReservationId_ThrowsException()
    {
        await using var context = CreateContext();

        var service = new FeedbackService(context);

        var request = new CreateFeedbackRequest
        {
            Type = FeedbackType.PARKING,
            ParkingId = Guid.NewGuid(),
            ReservationId = null,
            Rating = 4,
            Comment = "Good experience"
        };

        var action = async () =>
            await service.CreateAsync(Guid.NewGuid(), request);

        await action.Should()
            .ThrowAsync<Exception>()
            .WithMessage("Reservation id is required for parking feedback.");
    }

    [Fact]
    public async Task CreateAsync_WhenReservationDoesNotExist_ThrowsException()
    {
        await using var context = CreateContext();

        var service = new FeedbackService(context);

        var request = new CreateFeedbackRequest
        {
            Type = FeedbackType.PARKING,
            ParkingId = Guid.NewGuid(),
            ReservationId = Guid.NewGuid(),
            Rating = 5,
            Comment = "Excellent parking"
        };

        var action = async () =>
            await service.CreateAsync(Guid.NewGuid(), request);

        await action.Should()
            .ThrowAsync<Exception>()
            .WithMessage("Reservation not found.");
    }

    [Fact]
    public async Task CreateAsync_SystemFeedbackWithKeywords_ThrowsException()
    {
        await using var context = CreateContext();

        var service = new FeedbackService(context);

        var request = new CreateFeedbackRequest
        {
            Type = FeedbackType.SYSTEM,
            Rating = 4,
            Comment = "The system is easy to use",
            Keywords = new List<FeedbackKeywordType>
                {
                    FeedbackKeywordType.CLEAN,
                    FeedbackKeywordType.SAFE
                }
        };

        var action = async () =>
            await service.CreateAsync(Guid.NewGuid(), request);

        await action.Should()
            .ThrowAsync<Exception>()
            .WithMessage("System feedback cannot contain keywords.");
    }
    [Fact]
    public async Task GetByIdAsync_WhenFeedbackDoesNotExist_ThrowsException()
    {
        await using var context = CreateContext();

        var service = new FeedbackService(context);

        var action = async () =>
            await service.GetByIdAsync(Guid.NewGuid());

        await action.Should()
            .ThrowAsync<Exception>()
            .WithMessage("Feedback not found.");
    }

    [Fact]
    public async Task UpdateAsync_WhenFeedbackDoesNotExist_ThrowsException()
    {
        await using var context = CreateContext();

        var service = new FeedbackService(context);

        var request = new UpdateFeedbackRequest
        {
            Rating = 4,
            Comment = "Updated feedback"
        };

        var action = async () =>
            await service.UpdateAsync(
                Guid.NewGuid(),
                Guid.NewGuid(),
                request);

        await action.Should()
            .ThrowAsync<Exception>()
            .WithMessage("Feedback not found.");
    }

    [Fact]
    public async Task DeleteAsync_WhenFeedbackDoesNotExist_ThrowsException()
    {
        await using var context = CreateContext();

        var service = new FeedbackService(context);

        var action = async () =>
            await service.DeleteAsync(
                Guid.NewGuid(),
                Guid.NewGuid());

        await action.Should()
            .ThrowAsync<Exception>()
            .WithMessage("Feedback not found.");
    }

    [Fact]
    public async Task HideAsync_WhenFeedbackExists_ChangesStatusToHidden()
    {
        await using var context = CreateContext();

        var feedback = new Feedback
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            Type = FeedbackType.PARKING,
            Rating = 5,
            Comment = "Excellent",
            Status = FeedbackStatus.ACTIVE
        };

        context.Feedbacks.Add(feedback);
        await context.SaveChangesAsync();

        var service = new FeedbackService(context);

        await service.HideAsync(feedback.Id);

        var updatedFeedback =
            await context.Feedbacks.FindAsync(feedback.Id);

        updatedFeedback.Should().NotBeNull();
        updatedFeedback!.Status.Should()
            .Be(FeedbackStatus.HIDDEN);
    }

    [Fact]
    public async Task HideAsync_WhenFeedbackDoesNotExist_ThrowsException()
    {
        await using var context = CreateContext();

        var service = new FeedbackService(context);

        var action = async () =>
            await service.HideAsync(Guid.NewGuid());

        await action.Should()
            .ThrowAsync<Exception>()
            .WithMessage("Feedback not found.");
    }

    [Fact]
    public async Task ApproveAsync_SystemFeedback_ChangesStatusToActive()
    {
        await using var context = CreateContext();

        var feedback = new Feedback
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            Type = FeedbackType.SYSTEM,
            Rating = 4,
            Comment = "Useful application",
            Status = FeedbackStatus.PENDING_APPROVAL
        };

        context.Feedbacks.Add(feedback);
        await context.SaveChangesAsync();

        var service = new FeedbackService(context);

        await service.ApproveAsync(feedback.Id);

        var updatedFeedback =
            await context.Feedbacks.FindAsync(feedback.Id);

        updatedFeedback.Should().NotBeNull();
        updatedFeedback!.Status.Should()
            .Be(FeedbackStatus.ACTIVE);

        updatedFeedback.ModeratedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task ApproveAsync_ParkingFeedback_ThrowsException()
    {
        await using var context = CreateContext();

        var feedback = new Feedback
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            Type = FeedbackType.PARKING,
            Rating = 5,
            Comment = "Good parking",
            Status = FeedbackStatus.ACTIVE
        };

        context.Feedbacks.Add(feedback);
        await context.SaveChangesAsync();

        var service = new FeedbackService(context);

        var action = async () =>
            await service.ApproveAsync(feedback.Id);

        await action.Should()
            .ThrowAsync<Exception>()
            .WithMessage("Only system feedback requires approval.");
    }

    [Fact]
    public async Task ApproveAsync_WhenFeedbackDoesNotExist_ThrowsException()
    {
        await using var context = CreateContext();

        var service = new FeedbackService(context);

        var action = async () =>
            await service.ApproveAsync(Guid.NewGuid());

        await action.Should()
            .ThrowAsync<Exception>()
            .WithMessage("Feedback not found.");
    }

    [Fact]
    public async Task AdminDeleteAsync_WhenFeedbackExists_ChangesStatusToRemoved()
    {
        await using var context = CreateContext();

        var feedback = new Feedback
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            Type = FeedbackType.SYSTEM,
            Rating = 3,
            Comment = "Example feedback",
            Status = FeedbackStatus.ACTIVE
        };

        context.Feedbacks.Add(feedback);
        await context.SaveChangesAsync();

        var service = new FeedbackService(context);

        await service.AdminDeleteAsync(feedback.Id);

        var updatedFeedback =
            await context.Feedbacks.FindAsync(feedback.Id);

        updatedFeedback.Should().NotBeNull();
        updatedFeedback!.Status.Should()
            .Be(FeedbackStatus.REMOVED);
    }

    [Fact]
    public async Task AdminDeleteAsync_WhenFeedbackDoesNotExist_ThrowsException()
    {
        await using var context = CreateContext();

        var service = new FeedbackService(context);

        var action = async () =>
            await service.AdminDeleteAsync(Guid.NewGuid());

        await action.Should()
            .ThrowAsync<Exception>()
            .WithMessage("Feedback not found.");
    }

    [Fact]
    public async Task RestoreAsync_ParkingFeedback_ChangesStatusToActive()
    {
        await using var context = CreateContext();

        var feedback = new Feedback
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            Type = FeedbackType.PARKING,
            Rating = 4,
            Comment = "Parking feedback",
            Status = FeedbackStatus.REMOVED
        };

        context.Feedbacks.Add(feedback);
        await context.SaveChangesAsync();

        var service = new FeedbackService(context);

        await service.RestoreAsync(feedback.Id);

        var updatedFeedback =
            await context.Feedbacks.FindAsync(feedback.Id);

        updatedFeedback.Should().NotBeNull();
        updatedFeedback!.Status.Should()
            .Be(FeedbackStatus.ACTIVE);
    }

    [Fact]
    public async Task RestoreAsync_SystemFeedback_ChangesStatusToActive()
    {
        await using var context = CreateContext();

        var feedback = new Feedback
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            Type = FeedbackType.SYSTEM,
            Rating = 4,
            Comment = "System feedback",
            Status = FeedbackStatus.REMOVED
        };

        context.Feedbacks.Add(feedback);
        await context.SaveChangesAsync();

        var service = new FeedbackService(context);

        await service.RestoreAsync(feedback.Id);

        var updatedFeedback =
            await context.Feedbacks.FindAsync(feedback.Id);

        updatedFeedback.Should().NotBeNull();
        updatedFeedback!.Status.Should()
            .Be(FeedbackStatus.ACTIVE);
    }

    [Fact]
    public async Task RestoreAsync_WhenFeedbackDoesNotExist_ThrowsException()
    {
        await using var context = CreateContext();

        var service = new FeedbackService(context);

        var action = async () =>
            await service.RestoreAsync(Guid.NewGuid());

        await action.Should()
            .ThrowAsync<Exception>()
            .WithMessage("Feedback not found.");
    }
}