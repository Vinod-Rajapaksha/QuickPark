using System.Net.Http.Headers;

namespace QuickPark.Tests.Helpers;

public static class AuthenticationHelper
{
    public static void AuthenticateClient(HttpClient client, string token)
    {
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
    }
}
