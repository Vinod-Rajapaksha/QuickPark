namespace QuickPark.API.Models;
public class FeedbackReply
{
    public Guid Id { get; set; }
        = Guid.NewGuid();

    public Guid FeedbackId { get; set; }

    public Guid RepliedByUserId { get; set; }

    public string ReplierRole { get; set; }
        = string.Empty;

    public string Message { get; set; }
        = string.Empty;

    public DateTime CreatedAt { get; set; }
        = DateTime.UtcNow;

    public Feedback Feedback { get; set; }
        = null!;

}