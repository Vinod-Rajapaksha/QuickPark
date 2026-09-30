namespace QuickPark.API.DTOs.Staff;

public class StaffDashboardResponse
{
    public string StaffName { get; set; } = string.Empty;

    public string ProviderName { get; set; } = string.Empty;

    public string FacilityName { get; set; } = string.Empty;


    public string StaffType { get; set; } = string.Empty;


    public bool CanManageReservations { get; set; }

    public bool CanCheckInVehicle { get; set; }

    public bool CanCheckOutVehicle { get; set; }


    public int TodayReservationCount { get; set; }


    public int TotalSlots { get; set; }

    public int AvailableSlots { get; set; }

    public int OccupiedSlots { get; set; }
}