using QuickPark.API.DTOs.Auth;
using QuickPark.Tests.Helpers;

namespace QuickPark.Tests.Unit.Mapping;

public class MappingTests
{
    [Fact]
    public void User_CanMapTo_UserResponse()
    {
        // Arrange
        var user = TestDataBuilder.CreateUser();

        // Act
        var response = new UserResponse
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role,
            Phone = user.Phone,
            NIC = user.NIC
        };

        // Assert
        response.Id.Should().Be(user.Id);
        response.FullName.Should().Be(user.FullName);
        response.Email.Should().Be(user.Email);
    }
}
