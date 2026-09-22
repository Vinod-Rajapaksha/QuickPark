using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace QuickPark.API.Integrations.Storage;

// Result of a successful Cloudinary image upload.
public sealed class CloudinaryImageResult
{
    public string SecureUrl { get; init; } = string.Empty;
    public string PublicId { get; init; } = string.Empty;
    public string Format { get; init; } = string.Empty;
    public string ResourceType { get; init; } = string.Empty;
    public long Bytes { get; init; }
    public int Width { get; init; }
    public int Height { get; init; }
}

// Minimal Cloudinary image client using the signed REST API (no SDK dependency).
// Credentials are supplied by the caller (ProviderService) from configuration / environment.
public sealed class CloudinaryStorageClient
{
    private const string UploadPath = "image/upload";
    private const string DestroyPath = "image/destroy";

    private static readonly HttpClient Http = new() { Timeout = TimeSpan.FromSeconds(60) };
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    private readonly string _cloudName;
    private readonly string _apiKey;
    private readonly string _apiSecret;
    private readonly string _folder;

    public CloudinaryStorageClient(string cloudName, string apiKey, string apiSecret, string? folder = null)
    {
        _cloudName = cloudName ?? string.Empty;
        _apiKey = apiKey ?? string.Empty;
        _apiSecret = apiSecret ?? string.Empty;
        _folder = string.IsNullOrWhiteSpace(folder) ? "quickpark/nic" : folder!;
    }

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(_cloudName) &&
        !string.IsNullOrWhiteSpace(_apiKey) &&
        !string.IsNullOrWhiteSpace(_apiSecret);

    public async Task<CloudinaryImageResult> UploadImageAsync(
        byte[] content, string fileName, string contentType, CancellationToken ct = default)
    {
        EnsureConfigured();

        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
        var signature = Sign(new SortedList<string, string>
        {
            ["folder"] = _folder,
            ["timestamp"] = timestamp
        });

        using var form = new MultipartFormDataContent
        {
            { new StringContent(_apiKey), "api_key" },
            { new StringContent(timestamp), "timestamp" },
            { new StringContent(signature), "signature" },
            { new StringContent(_folder), "folder" }
        };

        var fileContent = new ByteArrayContent(content);
        fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(contentType);
        form.Add(fileContent, "file", fileName);

        var json = await PostAsync(UploadPath, form, ct);
        return ParseUpload(json);
    }

    // Deletes a previously uploaded asset. Best-effort: callers may ignore failures.
    public async Task DestroyAsync(string publicId, CancellationToken ct = default)
    {
        EnsureConfigured();
        if (string.IsNullOrWhiteSpace(publicId)) return;

        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
        var signature = Sign(new SortedList<string, string>
        {
            ["public_id"] = publicId,
            ["timestamp"] = timestamp
        });

        using var form = new MultipartFormDataContent
        {
            { new StringContent(_apiKey), "api_key" },
            { new StringContent(timestamp), "timestamp" },
            { new StringContent(signature), "signature" },
            { new StringContent(publicId), "public_id" }
        };

        await PostAsync(DestroyPath, form, ct);
    }

    private async Task<JsonElement> PostAsync(string path, MultipartFormDataContent form, CancellationToken ct)
    {
        var url = $"https://api.cloudinary.com/v1_1/{_cloudName}/{path}";
        using var response = await Http.PostAsync(url, form, ct);
        var body = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
        {
            var message = TryReadError(body) ?? $"Cloudinary request failed ({(int)response.StatusCode}).";
            throw new InvalidOperationException(message);
        }

        return JsonDocument.Parse(body).RootElement.Clone();
    }

    private static CloudinaryImageResult ParseUpload(JsonElement json)
    {
        var secureUrl = json.TryGetProperty("secure_url", out var su) ? su.GetString() : null;
        if (string.IsNullOrWhiteSpace(secureUrl))
        {
            throw new InvalidOperationException("Cloudinary response did not include a secure URL.");
        }

        return new CloudinaryImageResult
        {
            SecureUrl = secureUrl,
            PublicId = json.TryGetProperty("public_id", out var pid) ? pid.GetString() ?? string.Empty : string.Empty,
            Format = json.TryGetProperty("format", out var fmt) ? fmt.GetString() ?? string.Empty : string.Empty,
            ResourceType = json.TryGetProperty("resource_type", out var rt) ? rt.GetString() ?? string.Empty : string.Empty,
            Bytes = json.TryGetProperty("bytes", out var b) && b.TryGetInt64(out var bl) ? bl : 0,
            Width = json.TryGetProperty("width", out var w) && w.TryGetInt32(out var wi) ? wi : 0,
            Height = json.TryGetProperty("height", out var h) && h.TryGetInt32(out var hi) ? hi : 0
        };
    }

    private static string? TryReadError(string body)
    {
        try
        {
            using var doc = JsonDocument.Parse(body);
            if (doc.RootElement.TryGetProperty("error", out var err) &&
                err.TryGetProperty("message", out var msg))
            {
                return msg.GetString();
            }
        }
        catch (JsonException)
        {
            // Body was not JSON; fall through to the generic message.
        }
        return null;
    }

    // Cloudinary signature: sorted "key=value" pairs joined by '&', api_secret appended, SHA-1 hex.
    private string Sign(SortedList<string, string> parameters)
    {
        var builder = new StringBuilder();
        foreach (var pair in parameters)
        {
            if (builder.Length > 0) builder.Append('&');
            builder.Append(pair.Key).Append('=').Append(pair.Value);
        }
        builder.Append(_apiSecret);

        var hash = SHA1.HashData(Encoding.UTF8.GetBytes(builder.ToString()));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    private void EnsureConfigured()
    {
        if (!IsConfigured)
        {
            throw new InvalidOperationException(
                "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.");
        }
    }
}
