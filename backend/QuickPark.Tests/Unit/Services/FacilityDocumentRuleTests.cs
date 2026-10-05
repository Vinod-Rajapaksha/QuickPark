using Microsoft.AspNetCore.Http;
using QuickPark.API.Enums;
using QuickPark.API.Integrations.Storage;
using QuickPark.API.Resources;

namespace QuickPark.Tests.Unit.Services;

/// <summary>
/// One table — FacilityDocumentRules — decides both the owner's checklist and the upload guard, so
/// its numbers are the whole per-type proof policy. These tests pin that table and the file rules it
/// hands to DocumentFileValidator, without a database or a storage call.
/// </summary>
public class FacilityDocumentRuleTests
{
    private const int Ceiling = 5 * 1024 * 1024;

    // ---- The rule table ----

    [Fact]
    public void EveryProofTypeHasExactlyOneRuleSoTheChecklistAndTheGuardCannotDisagree()
    {
        var types = Enum.GetValues<FacilityDocumentType>();

        Assert.Equal(types.Length, FacilityDocumentRules.Ordered.Count);

        foreach (var type in types)
        {
            Assert.Same(FacilityDocumentRules.For(type), FacilityDocumentRules.Ordered.Single(r => r.Type == type));
        }

        Assert.Equal(types.Length, FacilityDocumentRules.Ordered.Select(r => r.Type).Distinct().Count());
    }

    [Fact]
    public void TheTabsAreOfferedInApprovalOrderNotInEnumOrder()
    {
        // LAND_DOCUMENT is enum value 0 but sits last in the wizard, so the listing is a deliberate
        // order rather than whatever the numbers happen to say.
        Assert.Equal(
            new[]
            {
                FacilityDocumentType.VERIFIED_DEED,
                FacilityDocumentType.LAND_OWNER_NIC,
                FacilityDocumentType.PROPERTY_PHOTO,
                FacilityDocumentType.SLOT_SKETCH,
                FacilityDocumentType.LAND_DOCUMENT
            },
            FacilityDocumentRules.Ordered.Select(r => r.Type).ToArray());

        Assert.NotEqual(Enum.GetValues<FacilityDocumentType>(), FacilityDocumentRules.Ordered.Select(r => r.Type).ToArray());
    }

    [Theory]
    [InlineData(FacilityDocumentType.VERIFIED_DEED, "Verified deed", 1, 1, true)]
    [InlineData(FacilityDocumentType.LAND_OWNER_NIC, "Land owner NIC", 1, 1, true)]
    [InlineData(FacilityDocumentType.PROPERTY_PHOTO, "Property photos", 4, 4, false)]
    [InlineData(FacilityDocumentType.SLOT_SKETCH, "Parking slot sketch", 1, 1, true)]
    [InlineData(FacilityDocumentType.LAND_DOCUMENT, "Land documents", 0, -1, false)]
    public void EachTabCarriesItsOwnRequiredAndAllowedCount(FacilityDocumentType type, string label,
        int minRequired, int maxAllowed, bool replacesExisting)
    {
        var rule = FacilityDocumentRules.For(type);

        Assert.Equal(label, rule.Label);
        Assert.Equal(minRequired, rule.MinRequired);
        Assert.Equal(maxAllowed < 0 ? null : maxAllowed, rule.MaxAllowed);
        Assert.Equal(replacesExisting, rule.ReplacesExisting);
    }

    [Fact]
    public void ThePhotoCountIsOneNumberSharedByTheChecklistAndTheGuard()
    {
        Assert.Equal(FacilityDocumentRules.RequiredPropertyPhotos, FacilityDocumentRules.For(FacilityDocumentType.PROPERTY_PHOTO).MinRequired);
        Assert.Equal(FacilityDocumentRules.RequiredPropertyPhotos, FacilityDocumentRules.For(FacilityDocumentType.PROPERTY_PHOTO).MaxAllowed);
    }

    [Fact]
    public void NoTabEverAsksForMoreProofThanItIsAllowedToHold()
    {
        // If a rule asked for 5 photos but capped the tab at 3, the owner could never finish.
        foreach (var rule in FacilityDocumentRules.Ordered)
        {
            if (rule.MaxAllowed is int max)
            {
                Assert.True(rule.MinRequired <= max, $"{rule.Label} asks for {rule.MinRequired} but caps at {max}.");
            }
        }
    }

    [Fact]
    public void OnlyThePhotoTabCanRefuseAnUploadForBeingFull()
    {
        // The guard refuses with "Delete one first" only when a tab neither replaces nor is uncapped,
        // so exactly one tab can produce that message and every other upload either lands or replaces.
        var capped = FacilityDocumentRules.Ordered
            .Where(rule => !rule.ReplacesExisting && rule.MaxAllowed is not null)
            .Select(rule => rule.Type)
            .ToArray();

        Assert.Equal(new[] { FacilityDocumentType.PROPERTY_PHOTO }, capped);
    }

    [Fact]
    public void ASecondCopyOfAnIdentityProofReplacesTheFirstInsteadOfStacking()
    {
        foreach (var type in new[]
                 {
                     FacilityDocumentType.VERIFIED_DEED,
                     FacilityDocumentType.LAND_OWNER_NIC,
                     FacilityDocumentType.SLOT_SKETCH
                 })
        {
            var rule = FacilityDocumentRules.For(type);

            Assert.True(rule.ReplacesExisting, $"{rule.Label} should replace rather than accumulate.");
            Assert.Equal(1, rule.MaxAllowed);
        }
    }

    [Fact]
    public void ExtraLandDocumentsAreWelcomeBecauseThatTabOwesNothingAndCapsNothing()
    {
        var rule = FacilityDocumentRules.For(FacilityDocumentType.LAND_DOCUMENT);

        Assert.Equal(0, rule.MinRequired);
        Assert.Null(rule.MaxAllowed);
        Assert.False(rule.ReplacesExisting);
    }

    [Fact]
    public void ProofTypesThatCanBeMissingAreNamedForAHumanNotForAMachine()
    {
        foreach (var rule in FacilityDocumentRules.Ordered)
        {
            Assert.False(string.IsNullOrWhiteSpace(rule.Label));
            Assert.DoesNotContain("_", rule.Label);
            Assert.DoesNotContain(rule.Label, rule.Type.ToString());
        }

        Assert.Equal(FacilityDocumentRules.Ordered.Count,
            FacilityDocumentRules.Ordered.Select(r => r.Label).Distinct().Count());
    }

    [Fact]
    public void AskingForAProofTypeThatDoesNotExistFailsRatherThanQuietlyPassing()
    {
        Assert.Throws<InvalidOperationException>(() => FacilityDocumentRules.For((FacilityDocumentType)99));
    }

    // ---- The file rules the table hands to the validator ----

    [Fact]
    public async Task AMissingProofIsRefusedInTheNameOfItsOwnTab()
    {
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            DocumentFileValidator.ValidateAndReadAsync(null, FacilityDocumentRules.For(FacilityDocumentType.VERIFIED_DEED).Label));

        Assert.Equal("Verified deed file is required.", ex.Message);
    }

    [Fact]
    public async Task AZeroByteUploadCountsAsNoProofAtAll()
    {
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            DocumentFileValidator.ValidateAndReadAsync(new FakeFile("deed.jpg", "image/jpeg", Array.Empty<byte>()), "Land owner NIC"));

        Assert.Equal("Land owner NIC file is required.", ex.Message);
    }

    [Fact]
    public async Task AProofOneByteOverTheCeilingIsRefusedBeforeItIsRead()
    {
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            DocumentFileValidator.ValidateAndReadAsync(
                new FakeFile("sketch.png", "image/png", new byte[Ceiling + 1]), "Parking slot sketch"));

        Assert.Equal("Parking slot sketch must be 5 MB or smaller.", ex.Message);
    }

    [Fact]
    public async Task AProofExactlyAtTheCeilingIsStillProof()
    {
        var bytes = Png(Ceiling);

        var validated = await DocumentFileValidator.ValidateAndReadAsync(new FakeFile("photo.png", "image/png", bytes), "Property photos");

        Assert.Equal(Ceiling, validated.Bytes.Length);
        Assert.Equal("image/png", validated.ContentType);
    }

    [Theory]
    [InlineData("deed.pdf", "application/pdf")]
    [InlineData("deed.bmp", "image/bmp")]
    [InlineData("deed.png", "image/gif")]
    [InlineData("deed", "image/jpeg")]
    [InlineData("deed.jpg", "text/plain")]
    public async Task OnlyJpgAndPngAreAcceptedWhateverTheOwnerCalledThem(string fileName, string contentType)
    {
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            DocumentFileValidator.ValidateAndReadAsync(new FakeFile(fileName, contentType, Png(64)), "Verified deed"));

        Assert.Equal("Only JPG and PNG images are allowed.", ex.Message);
    }

    [Fact]
    public async Task AnEmptyContentTypeIsRefusedRatherThanTreatedAsUnknownButSafe()
    {
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            DocumentFileValidator.ValidateAndReadAsync(new FakeFile("deed.jpg", "", Png(64)), "Verified deed"));

        Assert.Equal("Only JPG and PNG images are allowed.", ex.Message);
    }

    [Theory]
    [InlineData("image/jpeg")]
    [InlineData("image/png")]
    public async Task AFileThatIsNotReallyAnImageIsRefusedByWhatItsBytesSay(string contentType)
    {
        var extension = contentType == "image/png" ? "png" : "jpg";
        var fakeBytes = new byte[64];
        new Random(7).NextBytes(fakeBytes);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            DocumentFileValidator.ValidateAndReadAsync(new FakeFile($"deed.{extension}", contentType, fakeBytes), "Verified deed"));

        Assert.Equal("File content does not match a valid JPG or PNG image.", ex.Message);
    }

    [Fact]
    public async Task APngClaimingToBeAJpegIsCaughtByTheSignatureRatherTheExtension()
    {
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            DocumentFileValidator.ValidateAndReadAsync(new FakeFile("deed.jpg", "image/jpeg", Png(64)), "Verified deed"));

        Assert.Equal("File content does not match a valid JPG or PNG image.", ex.Message);
    }

    [Theory]
    [InlineData("image/png", "png")]
    [InlineData("image/jpeg", "jpg")]
    [InlineData("image/gif", "jpg")]
    public void TheStoredNameFollowsTheContentTypeNotWhicheverSpellingArrived(string contentType, string expected)
    {
        Assert.Equal(expected, DocumentFileValidator.ExtensionFor(contentType));
    }

    [Fact]
    public async Task ATruthfulJpegAndPngBothSurviveAsBytesInTheValidatorSaysTheyAre()
    {
        var jpeg = new byte[64];
        jpeg[0] = 0xFF; jpeg[1] = 0xD8; jpeg[2] = 0xFF;

        var asJpeg = await DocumentFileValidator.ValidateAndReadAsync(new FakeFile("deed.JPG", "IMAGE/JPEG", jpeg), "Verified deed");
        Assert.Equal("image/jpeg", asJpeg.ContentType);
        Assert.Equal(64, asJpeg.Bytes.Length);
        Assert.Equal("deed.JPG", asJpeg.FileName);

        var asPng = await DocumentFileValidator.ValidateAndReadAsync(new FakeFile("deed.PNG", "IMAGE/PNG", Png(64)), "Verified deed");
        Assert.Equal("image/png", asPng.ContentType);
        Assert.Equal("png", DocumentFileValidator.ExtensionFor(asPng.ContentType));
    }

    [Fact]
    public void TheValidatorCeilingIsBelowTheRouteCapSoTheGuardSpeaksFirst()
    {
        // The upload route permits a little more than the validator does, which is what turns an
        // oversized proof into a readable "5 MB or smaller" answer instead of a bare server rejection.
        Assert.Equal(5L * 1024 * 1024, DocumentFileValidator.MaxFileSizeBytes);
        Assert.True(DocumentFileValidator.MaxFileSizeBytes < 6L * 1024 * 1024);
    }

    private static byte[] Png(long size)
    {
        var bytes = new byte[size];
        byte[] signature = { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A };
        Array.Copy(signature, bytes, signature.Length);
        return bytes;
    }

    private sealed class FakeFile : IFormFile
    {
        private readonly byte[] _bytes;

        public FakeFile(string fileName, string contentType, byte[] bytes)
        {
            FileName = fileName;
            ContentType = contentType;
            _bytes = bytes;
            Length = bytes.Length;
        }

        public string ContentType { get; }
        public string FileName { get; }
        public long Length { get; }
        public string Name => "file";
        public string ContentDisposition => "form-data; name=\"file\"; filename=\"" + FileName + "\"";
        public IHeaderDictionary Headers => new HeaderDictionary();

        public void CopyTo(Stream target) => target.Write(_bytes, 0, _bytes.Length);

        public Task CopyToAsync(Stream target, CancellationToken ct = default) =>
            target.WriteAsync(_bytes, ct).AsTask();

        public Stream OpenReadStream() => new MemoryStream(_bytes);
    }
}
