namespace QuickPark.API.DTOs.Feedback;

public class CreateFeedbackReportRequest
{
    public Guid FeedbackId {get;set;}

    public string Reason {get;set;}
    = string.Empty;

}