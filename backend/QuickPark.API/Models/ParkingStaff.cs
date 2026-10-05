using QuickPark.API.Enums;

namespace QuickPark.API.Models;

public class ParkingStaff
{
    public Guid Id { get; set; }
        = Guid.NewGuid();

    public Guid UserId { get; set; }

    public User User { get; set; } = null!;

    public Guid ProviderId { get; set; }

    public ParkingProvider Provider { get; set; } = null!;

    public Guid FacilityId { get; set; }

    public ParkingFacility Facility { get; set; } = null!;

    public StaffType Type { get; set; }

    public string Position { get; set; }
        = string.Empty;

    public bool CanManageReservations { get; set; }

    public bool CanCheckInVehicle { get; set; }

    public bool CanCheckOutVehicle { get; set; }

    public bool CanViewReports { get; set; }

    public bool CanManageStaff { get; set; }

    public bool IsActive { get; set; }
        = true;

    public DateTime CreatedAt { get; set; }
        = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; }
        = DateTime.UtcNow;
}