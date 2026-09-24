using QuickPark.API.DTOs.Parking;
using QuickPark.API.Enums;
using QuickPark.API.Models;
using QuickPark.API.Resources;

namespace QuickPark.API.Services.Implementations;

// The checks every facility detail, allocation and vehicle type has to pass before it is saved.
public partial class ParkingService
{
    private const int MaxTotalAllocatedSlots = 500;
    private const int MaxCodeLength = 10;
    private const decimal MinLatitude = 5.9m;
    private const decimal MaxLatitude = 10.2m;
    private const decimal MinLongitude = 79.4m;
    private const decimal MaxLongitude = 82.1m;
    private const decimal MaxSlotDimensionMeters = 20m;

    private static (double Lat, double Lng)? ValidateReferencePoint(
        decimal? latitude, decimal? longitude, int? radiusKm)
    {
        if (latitude is null && longitude is null)
        {
            if (radiusKm is not null)
            {
                throw new InvalidOperationException(
                    "A radius needs a location to measure from. Send latitude and longitude too.");
            }

            return null;
        }

        if (latitude is null || longitude is null)
        {
            throw new InvalidOperationException("A distance search needs both latitude and longitude.");
        }

        if (latitude is < -90 or > 90 || longitude is < -180 or > 180)
        {
            throw new InvalidOperationException("latitude must be between -90 and 90, longitude between -180 and 180.");
        }

        if (radiusKm is int radius && radius <= 0)
        {
            throw new InvalidOperationException("radiusKm must be greater than 0.");
        }

        return ((double)latitude.Value, (double)longitude.Value);
    }

    private static double HaversineKm(double fromLat, double fromLng, double toLat, double toLng)
    {
        const double earthRadiusKm = 6371.0;

        var dLat = ToRadians(toLat - fromLat);
        var dLng = ToRadians(toLng - fromLng);

        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRadians(fromLat)) * Math.Cos(ToRadians(toLat)) *
                Math.Sin(dLng / 2) * Math.Sin(dLng / 2);

        return earthRadiusKm * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    }

    private static double ToRadians(double degrees) => degrees * Math.PI / 180.0;

    private static void ValidateBounds(decimal min, decimal max, decimal ceiling, string label)
    {
        if (min < 0m || min > ceiling)
        {
            throw new InvalidOperationException($"{label} must be between 0 and {ceiling:0.##}.");
        }

        if (max < 0m || max > ceiling)
        {
            throw new InvalidOperationException($"{label} must be between 0 and {ceiling:0.##}.");
        }

        if (min > max)
        {
            throw new InvalidOperationException($"{label} maximum cannot be lower than the minimum.");
        }
    }

    private static void EnsurePriceWithinWindow(
        decimal hourlyRate, VehiclePricingConfiguration configuration, string vehicleTypeName)
    {
        if (hourlyRate < configuration.MinimumPrice || hourlyRate > configuration.MaximumPrice)
        {
            throw new InvalidOperationException(
                $"{vehicleTypeName} price must be between {configuration.MinimumPrice:0.##} LKR and {configuration.MaximumPrice:0.##} LKR.");
        }
    }

    private static void EnsureStandardBay(VehicleType vehicleType)
    {
        if (vehicleType.BayLengthMeters is not > 0 || vehicleType.BayWidthMeters is not > 0)
        {
            throw new InvalidOperationException(
                $"{vehicleType.Name} has no bay size set. Ask the platform admin to type one before allocating it.");
        }
    }

    private static (string Name, string Address, string City, string Province, string District,
        decimal? Latitude, decimal? Longitude, decimal LandAreaPerches)
        ValidateDetails(string? name, string? address, string? city, string? province, string? district,
            decimal? latitude, decimal? longitude, decimal landAreaPerches)
    {
        var trimmedName = Require(name, "Property name is required.");
        var trimmedAddress = Require(address, "Address is required.");
        var trimmedCity = Require(city, "City is required.");

        if (landAreaPerches <= 0)
        {
            throw new InvalidOperationException("Land area must be greater than 0 perches.");
        }

        var trimmedProvince = Require(province, "Province is required.");
        var trimmedDistrict = Require(district, "District is required.");

        if (!SriLankanLocations.IsProvince(trimmedProvince))
        {
            throw new InvalidOperationException($"'{trimmedProvince}' is not a supported province.");
        }

        if (!SriLankanLocations.IsDistrictOfProvince(trimmedProvince, trimmedDistrict))
        {
            throw new InvalidOperationException($"'{trimmedDistrict}' does not belong to {trimmedProvince} Province.");
        }

        var location = ValidateCoordinates(latitude, longitude);

        return (trimmedName, trimmedAddress, trimmedCity, trimmedProvince, trimmedDistrict,
            location.Latitude, location.Longitude, landAreaPerches);
    }

    private static (decimal? Latitude, decimal? Longitude) ValidateCoordinates(
        decimal? latitude, decimal? longitude)
    {
        if (latitude is null && longitude is null) return (null, null);

        if (latitude is null || longitude is null)
        {
            throw new InvalidOperationException(
                "A location needs both coordinates. Enter the latitude and the longitude, or leave both empty.");
        }

        if (latitude < MinLatitude || latitude > MaxLatitude ||
            longitude < MinLongitude || longitude > MaxLongitude)
        {
            throw new InvalidOperationException(
                "Those coordinates are outside Sri Lanka, where QuickPark operates.");
        }

        return (latitude, longitude);
    }

    private static void EnsureOwnerMayEdit(ParkingFacility facility)
    {
        if (facility.Status == ParkingStatus.SUSPENDED)
        {
            throw new InvalidOperationException("This property is suspended. Contact the platform admin.");
        }

        if (facility.Status == ParkingStatus.PENDING_APPROVAL)
        {
            throw new InvalidOperationException(
                "This property is waiting for admin review. Edit it again once they have decided.");
        }
    }

    private static List<VehicleAllocationInput> ValidateAllocations(List<VehicleAllocationInput>? items)
    {
        var allocations = items ?? new List<VehicleAllocationInput>();

        if (allocations.Count == 0)
        {
            throw new InvalidOperationException("Select at least one vehicle type.");
        }

        if (allocations.Select(a => a.VehicleTypeId).Distinct().Count() != allocations.Count)
        {
            throw new InvalidOperationException("Each vehicle type can only be configured once.");
        }

        foreach (var allocation in allocations)
        {
            if (allocation.VehicleTypeId == Guid.Empty)
            {
                throw new InvalidOperationException("Every allocation needs a vehicle type.");
            }

            if (allocation.NumberOfSlots <= 0)
            {
                throw new InvalidOperationException("Slot count must be greater than 0.");
            }

            if (allocation.HourlyRate <= 0)
            {
                throw new InvalidOperationException("Hourly rate must be greater than 0.");
            }
        }

        if (allocations.Sum(a => a.NumberOfSlots) > MaxTotalAllocatedSlots)
        {
            throw new InvalidOperationException($"A property can have at most {MaxTotalAllocatedSlots} slots.");
        }

        return allocations;
    }

    private static string NormalizeCode(string? value, string label)
    {
        var trimmed = Require(value, $"{label} is required.");
        var code = new string(trimmed.Where(char.IsLetterOrDigit).ToArray()).ToUpperInvariant();

        if (code.Length == 0 || code.Length > MaxCodeLength)
        {
            throw new InvalidOperationException($"{label} must be 1-{MaxCodeLength} letters or digits, e.g. CAR.");
        }

        if (!char.IsLetter(code[0]))
        {
            throw new InvalidOperationException($"{label} must start with a letter, e.g. CAR.");
        }

        return code;
    }

    private static void ValidateSortOrder(int sortOrder)
    {
        if (sortOrder < 0)
        {
            throw new InvalidOperationException("Sort order cannot be negative.");
        }
    }

    private static void ValidateBayDimensions(decimal? lengthMeters, decimal? widthMeters)
    {
        ValidateBayDimension(lengthMeters, "Bay length");
        ValidateBayDimension(widthMeters, "Bay width");
    }

    private static void ValidateBayDimension(decimal? value, string label)
    {
        if (value is null) return;

        if (value.Value <= 0m || value.Value > MaxSlotDimensionMeters)
        {
            throw new InvalidOperationException($"{label} must be between 0 and {MaxSlotDimensionMeters} meters.");
        }
    }

    private static string Require(string? value, string message)
    {
        var trimmed = value?.Trim();
        if (string.IsNullOrEmpty(trimmed)) throw new InvalidOperationException(message);
        return trimmed;
    }
}
