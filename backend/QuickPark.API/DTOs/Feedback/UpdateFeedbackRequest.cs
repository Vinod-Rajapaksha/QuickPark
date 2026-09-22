using QuickPark.API.Enums;

namespace QuickPark.API.DTOs.Feedback;

public class UpdateFeedbackRequest
{
    public int Rating {get;set;}

    public string? Comment {get;set;}

    public List<FeedbackKeywordType>? Keywords {get;set;}

}