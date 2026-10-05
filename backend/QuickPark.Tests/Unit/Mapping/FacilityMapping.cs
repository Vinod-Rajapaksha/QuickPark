using System.Reflection;
using QuickPark.API.DTOs.Parking;
using QuickPark.API.Enums;
using QuickPark.API.Models;
using QuickPark.API.Services.Implementations;

namespace QuickPark.Tests.Unit.Mapping;

// The property mapping lives in private static methods on ParkingService, so it is reached by
// reflection and the service's own exceptions are surfaced unwrapped. This helper stands on its own
// so no test file's contents can decide whether it exists.
internal static class FacilityMapping
{
    internal static ParkingResponse ToResponse(ParkingFacility facility) =>
        (ParkingResponse)Call("MapToResponse", facility)!;

    internal static ParkingResponse ToPublic(ParkingFacility facility) =>
        (ParkingResponse)Call("MapToPublicResponse", facility)!;

    internal static IReadOnlyList<string> Missing(ParkingFacility facility) =>
        (List<string>)Call("MissingRequirementsFor", facility)!;

    internal static IReadOnlyList<string> Missing(ParkingFacility facility, FacilitySection section) =>
        (List<string>)Call("MissingRequirementsFor", facility, section)!;

    private static object? Call(string name, params object?[] arguments)
    {
        var method = typeof(ParkingService)
            .GetMethods(BindingFlags.NonPublic | BindingFlags.Static)
            .Single(m => m.Name == name && m.GetParameters().Length == arguments.Length);

        try
        {
            return method.Invoke(null, arguments);
        }
        catch (TargetInvocationException ex) when (ex.InnerException is not null)
        {
            throw ex.InnerException;
        }
    }
}
