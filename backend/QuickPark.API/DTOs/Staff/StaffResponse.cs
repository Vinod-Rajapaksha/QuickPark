using QuickPark.API.Enums;


namespace QuickPark.API.DTOs.Staff;


public class StaffResponse
{

    public Guid Id { get; set; }


    public Guid UserId { get; set; }


    public string FullName { get; set; }
        = string.Empty;


    public string Email { get; set; }
        = string.Empty;


    public string Phone { get; set; }
        = string.Empty;



    public Guid FacilityId { get; set; }


    public string FacilityName { get; set; }
        = string.Empty;



    public StaffType Type { get; set; }



    public string Position { get; set; }
        = string.Empty;



    public bool CanManageReservations { get; set; }

    public bool CanCheckInVehicle { get; set; }

    public bool CanCheckOutVehicle { get; set; }

    public bool CanViewReports { get; set; }

    public bool CanManageStaff { get; set; }



    public bool IsActive { get; set; }


    public DateTime CreatedAt { get; set; }

}