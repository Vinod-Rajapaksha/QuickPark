using QuickPark.API.Enums;

namespace QuickPark.API.Models;

public class Feedback
{
    public Guid Id { get; set; }
        = Guid.NewGuid();
    public Guid UserId { get; set; }
    public FeedbackType Type { get; set; }

    public Guid? ParkingId { get; set; }

    public int Rating { get; set; }

    public string? Comment { get; set; }

    public FeedbackStatus Status { get; set; }

    public Guid? ModeratedBy { get; set; }

    public DateTime? ModeratedAt { get; set; }

    public DateTime CreatedAt { get; set; }
        = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; }
        = DateTime.UtcNow;

    public User User { get; set; } = null!;

    public ICollection<FeedbackKeyword> Keywords { get; set; }
        = new List<FeedbackKeyword>();

    public ICollection<FeedbackReply> Replies { get; set; }
        = new List<FeedbackReply>();

    public ICollection<FeedbackReport> Reports { get; set; }
        = new List<FeedbackReport>();

}