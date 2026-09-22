using Microsoft.EntityFrameworkCore;
using QuickPark.API.Data;
using QuickPark.API.DTOs.Feedback;
using QuickPark.API.Enums;
using QuickPark.API.Models;
using QuickPark.API.Services.Interfaces;

namespace QuickPark.API.Services.Implementations;
public class FeedbackReplyService 
    : IFeedbackReplyService
{
    private readonly AppDbContext _context;

    private readonly IParkingAccessValidator _parkingValidator;

    public FeedbackReplyService(
        AppDbContext context,
        IParkingAccessValidator parkingValidator)
    {

        _context = context;

        _parkingValidator = parkingValidator;

    }

    public async Task<FeedbackReplyResponse> CreateAsync(
        Guid userId,
        UserRole role,
        CreateFeedbackReplyRequest request)
    {

        var feedback =
            await _context.Feedbacks
            .FirstOrDefaultAsync(
                x=>x.Id == request.FeedbackId);

        if(feedback == null)
        {
            throw new Exception(
                "Feedback not found");
        }

        if(feedback.Type == FeedbackType.SYSTEM)
        {

            if(role != UserRole.PLATFORM_ADMIN)
            {
                throw new Exception(
                    "Only admin can reply to system feedback");
            }

        }

        if(feedback.Type == FeedbackType.PARKING)
        {

            if(role != UserRole.PARKING_OWNER &&
               role != UserRole.PARKING_STAFF)
            {
                throw new Exception(
                    "Only provider or staff can reply");
            }

            if(feedback.ParkingId == null)
            {
                throw new Exception(
                    "Parking information missing");
            }

            var allowed =
                await _parkingValidator
                .CanReplyToParkingFeedback(
                    userId,
                    feedback.ParkingId.Value,
                    role);
            if(!allowed)
            {
                throw new Exception(
                    "You cannot reply to this parking feedback");
            }

        }
        var reply = new FeedbackReply
        {

            FeedbackId =
                feedback.Id,

            RepliedByUserId =
                userId,

            ReplierRole =
                role.ToString(),

            Message =
                request.Message

        };

        _context.FeedbackReplies.Add(reply);

        await _context.SaveChangesAsync();

        return new FeedbackReplyResponse
        {

            Id = reply.Id,

            RepliedByUserId =
                reply.RepliedByUserId,

            Role =
                reply.ReplierRole,

            Message =
                reply.Message,

            CreatedAt =
                reply.CreatedAt

        };

    }

}