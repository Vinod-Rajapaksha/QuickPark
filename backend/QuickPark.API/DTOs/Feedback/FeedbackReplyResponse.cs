namespace QuickPark.API.DTOs.Feedback;


public class FeedbackReplyResponse
{
    public Guid Id {get;set;}

    public Guid RepliedByUserId {get;set;}

    public string Role {get;set;}
    = string.Empty;

    public string Message {get;set;}
    = string.Empty;

    public DateTime CreatedAt {get;set;}

}