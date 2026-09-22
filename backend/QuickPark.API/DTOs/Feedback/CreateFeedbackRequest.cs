using QuickPark.API.Enums;

namespace QuickPark.API.DTOs.Feedback;

public class CreateFeedbackRequest
{
    public FeedbackType Type { get; set; }

    public Guid? ParkingId { get; set; }

    public int Rating { get; set; }

    public string? Comment { get; set; }

    public List<FeedbackKeywordType>? Keywords { get; set; }

}