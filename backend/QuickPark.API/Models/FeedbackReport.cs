namespace QuickPark.API.Models;

public class FeedbackReport
{

    public Guid Id {get;set;}
    =Guid.NewGuid();

    public Guid FeedbackId {get;set;}

    public Guid ReporterUserId {get;set;}

    public string Reason {get;set;}
    =string.Empty;

    public DateTime CreatedAt {get;set;}
    =DateTime.UtcNow;

    public Feedback Feedback {get;set;}=null!;

}