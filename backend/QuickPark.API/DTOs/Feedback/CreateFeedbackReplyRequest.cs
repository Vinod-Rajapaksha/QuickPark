namespace QuickPark.API.DTOs.Feedback;

public class CreateFeedbackReplyRequest
{
    public Guid FeedbackId { get; set; }
    public string Message { get; set; }
    = string.Empty;
}