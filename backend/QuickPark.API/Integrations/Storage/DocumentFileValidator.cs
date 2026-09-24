using Microsoft.AspNetCore.Http;

namespace QuickPark.API.Integrations.Storage;

// Represents an image that has passed all validation checks.
public sealed record ValidatedImage(byte[] Bytes, string ContentType, string FileName);

// Validates uploaded images for size, type, extension, and file signature.
public static class DocumentFileValidator
{
    // Maximum allowed image upload size: 5 MB.
    public const long MaxFileSizeBytes = 5 * 1024 * 1024; // 5 MB

    private static readonly string[] AllowedContentTypes = { "image/jpeg", "image/png" };
    private static readonly string[] AllowedExtensions = { ".jpg", ".jpeg", ".png" };

    // Validate and read an uploaded image before storing it.
    public static async Task<ValidatedImage> ValidateAndReadAsync(
        IFormFile? file, string label, CancellationToken ct = default)
    {
        if (file == null || file.Length == 0)
        {
            throw new InvalidOperationException($"{label} file is required.");
        }

        if (file.Length > MaxFileSizeBytes)
        {
            throw new InvalidOperationException(
                $"{label} must be {MaxFileSizeBytes / (1024 * 1024)} MB or smaller.");
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        var contentType = file.ContentType.ToLowerInvariant();

        if (!AllowedExtensions.Contains(extension) ||
            string.IsNullOrEmpty(contentType) ||
            !AllowedContentTypes.Contains(contentType))
        {
            throw new InvalidOperationException("Only JPG and PNG images are allowed.");
        }

        using var buffer = new MemoryStream();
        await file.CopyToAsync(buffer, ct);
        var bytes = buffer.ToArray();

        if (!HasValidImageSignature(bytes, contentType))
        {
            throw new InvalidOperationException("File content does not match a valid JPG or PNG image.");
        }

        return new ValidatedImage(bytes, contentType, file.FileName);
    }

    // Return the standard file extension for the given content type.
    public static string ExtensionFor(string contentType) =>
        contentType == "image/png" ? "png" : "jpg";

    // Verify the file's actual bytes match the claimed image type.
    private static bool HasValidImageSignature(byte[] bytes, string contentType)
    {
        if (contentType == "image/jpeg")
        {
            return bytes.Length >= 3 && bytes[0] == 0xFF && bytes[1] == 0xD8 && bytes[2] == 0xFF;
        }

        if (contentType == "image/png")
        {
            return bytes.Length >= 8 &&
                   bytes[0] == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47 &&
                   bytes[4] == 0x0D && bytes[5] == 0x0A && bytes[6] == 0x1A && bytes[7] == 0x0A;
        }

        return false;
    }
}
