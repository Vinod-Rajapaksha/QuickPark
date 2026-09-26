using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QuickPark.API.Migrations
{
    /// <inheritdoc />
    public partial class AddProviderIdentityCopies : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ProviderBusinessName",
                table: "Reservations",
                type: "character varying(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProviderEmail",
                table: "Reservations",
                type: "character varying(256)",
                maxLength: 256,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ProviderName",
                table: "Reservations",
                type: "character varying(150)",
                maxLength: 150,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ProviderBusinessName",
                table: "ParkingSlot",
                type: "character varying(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProviderEmail",
                table: "ParkingSlot",
                type: "character varying(256)",
                maxLength: 256,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ProviderName",
                table: "ParkingSlot",
                type: "character varying(150)",
                maxLength: 150,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ProviderBusinessName",
                table: "ParkingFacilityVehicleTypes",
                type: "character varying(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProviderEmail",
                table: "ParkingFacilityVehicleTypes",
                type: "character varying(256)",
                maxLength: 256,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ProviderName",
                table: "ParkingFacilityVehicleTypes",
                type: "character varying(150)",
                maxLength: 150,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ProviderBusinessName",
                table: "ParkingFacilityDocuments",
                type: "character varying(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProviderEmail",
                table: "ParkingFacilityDocuments",
                type: "character varying(256)",
                maxLength: 256,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ProviderName",
                table: "ParkingFacilityDocuments",
                type: "character varying(150)",
                maxLength: 150,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ProviderBusinessName",
                table: "ParkingFacilities",
                type: "character varying(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProviderEmail",
                table: "ParkingFacilities",
                type: "character varying(256)",
                maxLength: 256,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ProviderName",
                table: "ParkingFacilities",
                type: "character varying(150)",
                maxLength: 150,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Reservations_ProviderEmail",
                table: "Reservations",
                column: "ProviderEmail");

            migrationBuilder.CreateIndex(
                name: "IX_Reservations_ProviderName",
                table: "Reservations",
                column: "ProviderName");

            migrationBuilder.CreateIndex(
                name: "IX_ParkingFacilities_ProviderEmail",
                table: "ParkingFacilities",
                column: "ProviderEmail");

            migrationBuilder.CreateIndex(
                name: "IX_ParkingFacilities_ProviderName",
                table: "ParkingFacilities",
                column: "ProviderName");

            // Rows written before these columns existed get the same copies, so the owner
            // Filters work over the whole table rather than only over new data. LEFT() trims to
            // The bounded copy columns; the runtime stamp clamps the same way.
            migrationBuilder.Sql(@"
UPDATE ""ParkingFacilities"" f
SET ""ProviderName"" = COALESCE(LEFT(u.""FullName"", 150), ''),
    ""ProviderEmail"" = COALESCE(LEFT(u.""Email"", 256), ''),
    ""ProviderBusinessName"" = LEFT(p.""BusinessName"", 150)
FROM ""ParkingProviders"" p
JOIN ""Users"" u ON u.""Id"" = p.""UserId""
WHERE p.""Id"" = f.""ProviderId"";");

            migrationBuilder.Sql(@"
UPDATE ""ParkingSlot"" s
SET ""ProviderName"" = f.""ProviderName"",
    ""ProviderEmail"" = f.""ProviderEmail"",
    ""ProviderBusinessName"" = f.""ProviderBusinessName""
FROM ""ParkingFacilities"" f
WHERE f.""Id"" = s.""FacilityId"";");

            migrationBuilder.Sql(@"
UPDATE ""ParkingFacilityVehicleTypes"" a
SET ""ProviderName"" = f.""ProviderName"",
    ""ProviderEmail"" = f.""ProviderEmail"",
    ""ProviderBusinessName"" = f.""ProviderBusinessName""
FROM ""ParkingFacilities"" f
WHERE f.""Id"" = a.""FacilityId"";");

            migrationBuilder.Sql(@"
UPDATE ""ParkingFacilityDocuments"" d
SET ""ProviderName"" = f.""ProviderName"",
    ""ProviderEmail"" = f.""ProviderEmail"",
    ""ProviderBusinessName"" = f.""ProviderBusinessName""
FROM ""ParkingFacilities"" f
WHERE f.""Id"" = d.""FacilityId"";");

            migrationBuilder.Sql(@"
UPDATE ""Reservations"" r
SET ""ProviderName"" = f.""ProviderName"",
    ""ProviderEmail"" = f.""ProviderEmail"",
    ""ProviderBusinessName"" = f.""ProviderBusinessName""
FROM ""ParkingFacilities"" f
WHERE f.""Id"" = r.""FacilityId"";");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Reservations_ProviderEmail",
                table: "Reservations");

            migrationBuilder.DropIndex(
                name: "IX_Reservations_ProviderName",
                table: "Reservations");

            migrationBuilder.DropIndex(
                name: "IX_ParkingFacilities_ProviderEmail",
                table: "ParkingFacilities");

            migrationBuilder.DropIndex(
                name: "IX_ParkingFacilities_ProviderName",
                table: "ParkingFacilities");

            migrationBuilder.DropColumn(
                name: "ProviderBusinessName",
                table: "Reservations");

            migrationBuilder.DropColumn(
                name: "ProviderEmail",
                table: "Reservations");

            migrationBuilder.DropColumn(
                name: "ProviderName",
                table: "Reservations");

            migrationBuilder.DropColumn(
                name: "ProviderBusinessName",
                table: "ParkingSlot");

            migrationBuilder.DropColumn(
                name: "ProviderEmail",
                table: "ParkingSlot");

            migrationBuilder.DropColumn(
                name: "ProviderName",
                table: "ParkingSlot");

            migrationBuilder.DropColumn(
                name: "ProviderBusinessName",
                table: "ParkingFacilityVehicleTypes");

            migrationBuilder.DropColumn(
                name: "ProviderEmail",
                table: "ParkingFacilityVehicleTypes");

            migrationBuilder.DropColumn(
                name: "ProviderName",
                table: "ParkingFacilityVehicleTypes");

            migrationBuilder.DropColumn(
                name: "ProviderBusinessName",
                table: "ParkingFacilityDocuments");

            migrationBuilder.DropColumn(
                name: "ProviderEmail",
                table: "ParkingFacilityDocuments");

            migrationBuilder.DropColumn(
                name: "ProviderName",
                table: "ParkingFacilityDocuments");

            migrationBuilder.DropColumn(
                name: "ProviderBusinessName",
                table: "ParkingFacilities");

            migrationBuilder.DropColumn(
                name: "ProviderEmail",
                table: "ParkingFacilities");

            migrationBuilder.DropColumn(
                name: "ProviderName",
                table: "ParkingFacilities");
        }
    }
}
