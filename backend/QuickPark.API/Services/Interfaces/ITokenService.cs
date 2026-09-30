namespace QuickPark.API.Services.Interfaces;

public interface ITokenService
{
    string GenerateReservationToken(Guid reservationId);
    Guid? ValidateReservationToken(string token);
}
