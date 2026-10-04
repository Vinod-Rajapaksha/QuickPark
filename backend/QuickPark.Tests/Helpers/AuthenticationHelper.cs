using System.Net.Http.Headers;
using QuickPark.API.Models;

namespace QuickPark.Tests.Helpers;

public static class AuthenticationHelper
{
    public static void AuthenticateClient(HttpClient client, string token)
    {
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
    }
}
