namespace QuickPark.API.DTOs.Users

{
    public class UpdateUserRequest
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string NIC { get; set; } = string.Empty;
    }
}
