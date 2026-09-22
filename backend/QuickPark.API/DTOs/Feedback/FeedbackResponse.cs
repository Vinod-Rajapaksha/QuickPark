using QuickPark.API.Enums;

namespace QuickPark.API.DTOs.Feedback;

public class FeedbackResponse
{
    public Guid Id {get;set;}

    public string UserName {get;set;}
    = string.Empty;

    public FeedbackType Type {get;set;}

    // Needed when frontend separates:
    public Guid? ParkingId {get;set;}

    public int Rating {get;set;}

    public string? Comment {get;set;}

    public FeedbackStatus Status {get;set;}

    public List<FeedbackKeywordType> Keywords {get;set;}
    = new();

}