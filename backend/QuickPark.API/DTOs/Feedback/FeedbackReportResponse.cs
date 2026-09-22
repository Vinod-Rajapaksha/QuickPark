namespace QuickPark.API.DTOs.Feedback;

public class FeedbackReportResponse
{
    public Guid Id { get; set; }

    public Guid FeedbackId { get; set; }

    public Guid ReporterUserId { get; set; }

    public string ReporterName { get; set; }
        = string.Empty;

    public string FeedbackComment { get; set; }
        = string.Empty;

    public string Reason { get; set; }
        = string.Empty;

    public DateTime CreatedAt { get; set; }

}