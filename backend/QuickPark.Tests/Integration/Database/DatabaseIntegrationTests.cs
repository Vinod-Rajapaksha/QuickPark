using Microsoft.EntityFrameworkCore;
using QuickPark.API.Data;
using QuickPark.API.Enums;
using QuickPark.API.Models;

namespace QuickPark.Tests.Integration.Database;

// The shape of the owner's registration data: which table each piece of the wizard lands in, how tight
// the columns are, and what happens to a property's bays and proof when the property is withdrawn.
// The model is read from EF's own metadata, which needs no connection, so this never touches a database.
public class DatabaseIntegrationTests
{
    [Fact]
    public void TheModelBuildsWithoutAnyDatabaseAtAll()
    {
        // If this ever needs a live server, the suite has stopped being runnable offline and the whole
        // contract below stops being checkable in CI.
        using var context = Context();

        Assert.True(context.Model.GetEntityTypes().Count() > 10);
        Assert.NotNull(context.Model.FindEntityType(typeof(ParkingFacility)));
        Assert.Equal(1, context.Model.GetEntityTypes().Count(e => e.ClrType == typeof(ParkingFacility)));
    }

    [Fact]
    public void TheOwnersRegistrationSpansFiveTablesUnderOneProperty()
    {
        using var context = Context();

        Assert.Equal("ParkingFacilities", Table<ParkingFacility>(context));
        Assert.Equal("ParkingSlots", Table<ParkingSlot>(context));
        Assert.Equal("ParkingFacilityDocuments", Table<ParkingFacilityDocument>(context));
        Assert.Equal("ParkingFacilityVehicleTypes", Table<ParkingFacilityVehicleType>(context));
        Assert.Equal("ParkingFacilitySectionReviews", Table<ParkingFacilitySectionReview>(context));
    }

    [Fact]
    public void EveryOneOfThemIsKeyedOnASingleGuidId()
    {
        using var context = Context();

        foreach (var type in new[]
                 {
                     typeof(ParkingFacility), typeof(ParkingSlot), typeof(ParkingFacilityDocument),
                     typeof(ParkingFacilityVehicleType), typeof(ParkingFacilitySectionReview)
                 })
        {
            var key = context.Model.FindEntityType(type)!.FindPrimaryKey()!;

            Assert.Single(key.Properties);
            Assert.Equal("Id", key.Properties[0].Name);
            Assert.Equal(typeof(Guid), key.Properties[0].ClrType);
        }
    }

    [Theory]
    [InlineData(nameof(ParkingFacility.Name), 150)]
    [InlineData(nameof(ParkingFacility.Address), 300)]
    [InlineData(nameof(ParkingFacility.City), 100)]
    [InlineData(nameof(ParkingFacility.Province), 40)]
    [InlineData(nameof(ParkingFacility.District), 40)]
    [InlineData(nameof(ParkingFacility.RejectionReason), 500)]
    public void TheDescriptiveColumnsAreBoundedSoAnOwnerCannotPostAnEssay(string column, int max)
    {
        using var context = Context();

        Assert.Equal(max, Property<ParkingFacility>(context, column).GetMaxLength());
    }

    [Theory]
    [InlineData(nameof(ParkingFacility.Name))]
    [InlineData(nameof(ParkingFacility.Address))]
    [InlineData(nameof(ParkingFacility.City))]
    [InlineData(nameof(ParkingFacility.Province))]
    [InlineData(nameof(ParkingFacility.District))]
    [InlineData(nameof(ParkingFacility.Status))]
    public void TheAddressFieldsAreMandatoryWhileTheVerdictNoteIsOptional(string column)
    {
        using var context = Context();

        Assert.False(Property<ParkingFacility>(context, column).IsNullable);
        Assert.True(Property<ParkingFacility>(context, nameof(ParkingFacility.RejectionReason)).IsNullable);
    }

    [Fact]
    public void LandAreaKeepsTwoDecimalsAndThePinKeepsSix()
    {
        using var context = Context();

        Assert.Equal((10, 2), (
            Property<ParkingFacility>(context, nameof(ParkingFacility.LandAreaPerches)).GetPrecision(),
            Property<ParkingFacility>(context, nameof(ParkingFacility.LandAreaPerches)).GetScale()));

        foreach (var column in new[] { nameof(ParkingFacility.Latitude), nameof(ParkingFacility.Longitude) })
        {
            // (9,6) is about 11 cm at the equator: fine for the entrance of a bay, and the reason the
            // wizard can ask for a pin without a survey.
            var property = Property<ParkingFacility>(context, column);

            Assert.Equal((9, 6), (property.GetPrecision(), property.GetScale()));
            Assert.True(property.IsNullable);
        }
    }

    [Fact]
    public void TheLifecycleStateIsStoredAsItsNameNotItsNumber()
    {
        using var context = Context();

        foreach (var (type, column) in new[]
                 {
                     (typeof(ParkingFacility), nameof(ParkingFacility.Status)),
                     (typeof(ParkingSlot), nameof(ParkingSlot.Status)),
                     (typeof(ParkingFacilityDocument), nameof(ParkingFacilityDocument.Type)),
                     (typeof(ParkingFacilitySectionReview), nameof(ParkingFacilitySectionReview.Status))
                 })
        {
            var property = context.Model.FindEntityType(type)!.FindProperty(column)!;

            // The column the database actually holds is text, so a queue can be read and a row fixed
            // by hand without decoding a number.
            Assert.Equal(typeof(string), property.GetProviderClrType());
            Assert.False(property.IsNullable);
        }
    }

    [Fact]
    public void APropertyIsFindableByTheThreeThingsADriverSearchesOn()
    {
        using var context = Context();

        var indexes = context.Model.FindEntityType(typeof(ParkingFacility))!.GetIndexes()
            .Select(index => string.Join("+", index.Properties.Select(p => p.GetColumnName())))
            .ToHashSet();

        Assert.Contains(Property<ParkingFacility>(context, nameof(ParkingFacility.City)).GetColumnName(), indexes);
        Assert.Contains(Property<ParkingFacility>(context, nameof(ParkingFacility.Province)).GetColumnName(), indexes);
        Assert.Contains(Property<ParkingFacility>(context, nameof(ParkingFacility.District)).GetColumnName(), indexes);
        Assert.Contains(Property<ParkingFacility>(context, nameof(ParkingFacility.Status)).GetColumnName(), indexes);
        Assert.Contains(
            Property<ParkingFacility>(context, nameof(ParkingFacility.Province)).GetColumnName() + "+" +
            Property<ParkingFacility>(context, nameof(ParkingFacility.District)).GetColumnName(), indexes);
    }

    [Fact]
    public void WithdrawingAnOwnerNeverSilentlyTakesTheirProperties()
    {
        using var context = Context();

        var providerKey = context.Model.FindEntityType(typeof(ParkingFacility))!.GetForeignKeys()
            .Single(fk => fk.PrincipalEntityType.ClrType == typeof(ParkingProvider));

        Assert.Equal(DeleteBehavior.Restrict, providerKey.DeleteBehavior);
    }

    [Fact]
    public void TheOwnersBaysProofPricingAndSectionVerdictsGoWithTheProperty()
    {
        using var context = Context();

        foreach (var dependent in new[]
                 {
                     typeof(ParkingSlot), typeof(ParkingFacilityDocument),
                     typeof(ParkingFacilityVehicleType), typeof(ParkingFacilitySectionReview)
                 })
        {
            // Exactly one link to the property, and it cascades: withdrawing a property takes its bays,
            // its proof, its prices and its verdicts with it, because none of them means anything alone.
            var keys = context.Model.FindEntityType(dependent)!.GetForeignKeys()
                .Where(fk => fk.PrincipalEntityType.ClrType == typeof(ParkingFacility))
                .ToArray();

            var key = Assert.Single(keys);

            Assert.Equal(DeleteBehavior.Cascade, key.DeleteBehavior);
            Assert.Equal("FacilityId", key.Properties[0].Name);
        }
    }

    [Fact]
    public void ABayKeepsItsOwnIdentityAndTheTypeItWasSizedFor()
    {
        using var context = Context();

        var slot = context.Model.FindEntityType(typeof(ParkingSlot))!;

        Assert.Equal(new[] { "BayLengthMeters", "BayWidthMeters", "CreatedAt", "FacilityId", "Id", "SlotNumber", "Status", "UpdatedAt", "VehicleTypeId" },
            slot.GetProperties().Select(p => p.Name).OrderBy(n => n, StringComparer.Ordinal).ToArray());

        Assert.True(slot.FindProperty(nameof(ParkingSlot.SlotNumber))!.IsNullable == false);

        // A bay is tied to its property by a real key, but the "C" in "C-01" is only a copied prefix —
        // so renaming a vehicle type's code never rewrites history, and the number stays unique per bay.
        Assert.Single(slot.GetForeignKeys().Where(fk => fk.PrincipalEntityType.ClrType == typeof(ParkingFacility)));
        Assert.Single(slot.GetForeignKeys().Where(fk => fk.PrincipalEntityType.ClrType == typeof(VehicleType)));
    }

    [Fact]
    public void TwoBaysOfOnePropertyCannotShareANumber()
    {
        using var context = Context();

        var slot = context.Model.FindEntityType(typeof(ParkingSlot))!;
        var slotNumber = Property<ParkingSlot>(context, nameof(ParkingSlot.SlotNumber));

        // Unique per property, not globally: "C-01" in Colombo and "C-01" in Kandy are different bays.
        Assert.Contains(slot.GetIndexes(), index => index.IsUnique &&
            index.Properties.SequenceEqual(new[] { Property<ParkingSlot>(context, "FacilityId"), slotNumber }));

        Assert.Equal(20, slotNumber.GetMaxLength());

        // The board filter the owner drives — property, type, state — is indexed for the read.
        Assert.Contains(slot.GetIndexes(), index => !index.IsUnique && index.Properties.Count == 3);
    }

    [Fact]
    public void PricedPerchesAndHourlyRatesAreMoneySoTheyAreDecimal()
    {
        using var context = Context();

        var allocation = context.Model.FindEntityType(typeof(ParkingFacilityVehicleType))!;

        foreach (var column in new[] { nameof(ParkingFacilityVehicleType.HourlyRate), nameof(ParkingFacilityVehicleType.CommissionRate) })
        {
            var property = allocation.FindProperty(column)!;

            Assert.Equal(typeof(decimal), property.ClrType);
            Assert.False(property.IsNullable);
        }

        Assert.Equal(typeof(int), allocation.FindProperty(nameof(ParkingFacilityVehicleType.NumberOfSlots))!.ClrType);

        Assert.Equal((10, 2), (
            allocation.FindProperty(nameof(ParkingFacilityVehicleType.HourlyRate))!.GetPrecision(),
            allocation.FindProperty(nameof(ParkingFacilityVehicleType.HourlyRate))!.GetScale()));

        Assert.Equal((5, 2), (
            allocation.FindProperty(nameof(ParkingFacilityVehicleType.CommissionRate))!.GetPrecision(),
            allocation.FindProperty(nameof(ParkingFacilityVehicleType.CommissionRate))!.GetScale()));

        foreach (var column in new[] { "BayLengthMeters", "BayWidthMeters" })
        {
            Assert.True(allocation.FindProperty(column)!.IsNullable);
            Assert.Equal((5, 2), (allocation.FindProperty(column)!.GetPrecision(), allocation.FindProperty(column)!.GetScale()));
        }

        // One price line per vehicle type per property: the owner re-saves the same row rather than
        // stacking a second rate for the same category.
        Assert.Contains(allocation.GetIndexes(), index => index.IsUnique &&
            index.Properties.Select(p => p.Name).SequenceEqual(new[] { "FacilityId", "VehicleTypeId" }));
    }

    [Fact]
    public void ProofIsStoredAsAnAddressAndAMimeHintNotAsTheBytes()
    {
        using var context = Context();

        var document = context.Model.FindEntityType(typeof(ParkingFacilityDocument))!;

        Assert.False(document.FindProperty(nameof(ParkingFacilityDocument.Url))!.IsNullable);
        Assert.Equal(500, document.FindProperty(nameof(ParkingFacilityDocument.Url))!.GetMaxLength());
        Assert.Equal(200, document.FindProperty(nameof(ParkingFacilityDocument.PublicId))!.GetMaxLength());
        Assert.Equal(200, document.FindProperty(nameof(ParkingFacilityDocument.FileName))!.GetMaxLength());
        Assert.Equal(60, document.FindProperty(nameof(ParkingFacilityDocument.ContentType))!.GetMaxLength());

        // The upload guard's six megabytes is a request-size rule, not a column: only a reference is kept.
        Assert.Equal(typeof(long), document.FindProperty(nameof(ParkingFacilityDocument.SizeBytes))!.ClrType);
        Assert.Contains(document.GetIndexes(), index =>
            index.Properties.Select(p => p.Name).SequenceEqual(new[] { "FacilityId", "Type" }));
    }

    [Fact]
    public void OneAdminVerdictPerSectionPerPropertyIsAllTheModelAllows()
    {
        using var context = Context();

        var review = context.Model.FindEntityType(typeof(ParkingFacilitySectionReview))!;

        Assert.Equal(typeof(SectionReviewStatus), review.FindProperty(nameof(ParkingFacilitySectionReview.Status))!.ClrType);
        Assert.True(review.FindProperty(nameof(ParkingFacilitySectionReview.Remarks))!.IsNullable);
        Assert.True(review.FindProperty(nameof(ParkingFacilitySectionReview.ReviewedBy))!.IsNullable);
        Assert.Equal(500, review.FindProperty(nameof(ParkingFacilitySectionReview.Remarks))!.GetMaxLength());

        // A re-decision overwrites instead of growing a history: the unique (property, section) key is
        // what stops a second row, so the owner always sees one current verdict per tab.
        Assert.Contains(review.GetIndexes(), index => index.IsUnique &&
            index.Properties.SequenceEqual(new[]
            {
                Property<ParkingFacilitySectionReview>(context, "FacilityId"),
                review.FindProperty(nameof(ParkingFacilitySectionReview.Section))!
            }));
    }

    [Fact]
    public void EveryRowCarriesWhenItWasMadeAndWhenItLastChanged()
    {
        using var context = Context();

        foreach (var type in new[]
                 {
                     typeof(ParkingFacility), typeof(ParkingSlot),
                     typeof(ParkingFacilityVehicleType), typeof(ParkingFacilitySectionReview)
                 })
        {
            var entity = context.Model.FindEntityType(type)!;

            Assert.NotNull(entity.FindProperty("CreatedAt"));
            Assert.NotNull(entity.FindProperty("UpdatedAt"));
        }

        // Proof is the exception: an upload is never edited, only replaced, so it carries the moment it
        // arrived and nothing else. That single stamp is what orders the owner's checklist.
        var document = context.Model.FindEntityType(typeof(ParkingFacilityDocument))!;

        Assert.NotNull(document.FindProperty(nameof(ParkingFacilityDocument.UploadedAt)));
        Assert.Null(document.FindProperty("CreatedAt"));
    }

    [Fact]
    public void AnOwnerWhoIsUnderReviewIsDistinguishableFromOneWhoHasNeverSentAnything()
    {
        using var context = Context();

        var facility = context.Model.FindEntityType(typeof(ParkingFacility))!;

        foreach (var column in new[] { nameof(ParkingFacility.SubmittedAt), nameof(ParkingFacility.ReviewedAt), nameof(ParkingFacility.ReviewedBy) })
        {
            Assert.True(facility.FindProperty(column)!.IsNullable);
        }
    }

    [Fact]
    public void TheWholeOwnerSurfaceIsReachableThroughOneContext()
    {
        using var context = Context();

        foreach (var type in new[]
                 {
                     typeof(ParkingFacility), typeof(ParkingSlot), typeof(ParkingFacilityDocument),
                     typeof(ParkingFacilityVehicleType), typeof(ParkingFacilitySectionReview),
                     typeof(ParkingProvider), typeof(VehicleType), typeof(Reservation)
                 })
        {
            Assert.NotNull(context.Model.FindEntityType(type));
        }
    }

    private static string Table<TEntity>(AppDbContext context) =>
        context.Model.FindEntityType(typeof(TEntity))!.GetTableName()!;

    private static Microsoft.EntityFrameworkCore.Metadata.IProperty Property<TEntity>(AppDbContext context, string name) =>
        context.Model.FindEntityType(typeof(TEntity))!.FindProperty(name)
        ?? throw new InvalidOperationException($"{typeof(TEntity).Name} has no column '{name}'.");

    // A host string that can never resolve is enough: EF builds the model without opening a socket.
    private static AppDbContext Context() => new(new DbContextOptionsBuilder<AppDbContext>()
        .UseNpgsql("Host=127.0.0.1;Port=1;Database=quickpark_never_connected;Username=none;Password=none")
        .Options);
}
