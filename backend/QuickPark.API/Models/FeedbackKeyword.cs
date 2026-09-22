using QuickPark.API.Enums;

namespace QuickPark.API.Models;

public class FeedbackKeyword
{
    public Guid Id { get; set; }
    = Guid.NewGuid();

    public Guid FeedbackId { get; set; }

    public FeedbackKeywordType Keyword { get; set; }

    public Feedback Feedback { get; set; } = null!;

}