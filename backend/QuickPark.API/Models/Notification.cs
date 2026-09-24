namespace QuickPark.API.Models;

// A message the platform leaves for one account. Used today for the parking owner whose saved
// layout the admin's rule change rewrote, so the change is never silent.
public class Notification
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }
    public User? User { get; set; }

    // The property the message is about, when there is one. Kept after the property goes away.
    public Guid? FacilityId { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
