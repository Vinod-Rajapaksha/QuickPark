using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QuickPark.API.Migrations
{
    /// <inheritdoc />
    public partial class AddStandardSlotSizePerVehicleType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Every registered property was laid out with the provider choosing a bay size, and
            // The platform no longer allows that choice. The agreed reset is to delete them all
            // So each property from now on is built to its vehicle type's standard bay.
            migrationBuilder.Sql(@"
DELETE FROM ""Reservations"";
DELETE FROM ""ParkingSlot"";
DELETE FROM ""ParkingFacilityDocuments"";
DELETE FROM ""ParkingFacilityVehicleTypes"";
DELETE FROM ""ParkingFacilities"";
");

            migrationBuilder.AddColumn<Guid>(
                name: "StandardSlotSizeId",
                table: "VehicleTypes",
                type: "uuid",
                nullable: true);

            // Carry the old compatibility rule over as the new standard: the smallest allowed
            // Active size for that vehicle type. Car had Medium + Large, so it gets Medium.
            migrationBuilder.Sql(@"
UPDATE ""VehicleTypes"" v
SET ""StandardSlotSizeId"" = s.""Id""
FROM (
    SELECT DISTINCT ON (c.""VehicleTypeId"") c.""VehicleTypeId"", sz.""Id""
    FROM ""SlotSizeVehicleTypes"" c
    JOIN ""SlotSizes"" sz ON sz.""Id"" = c.""SlotSizeId""
    WHERE sz.""IsActive""
    ORDER BY c.""VehicleTypeId"", sz.""LengthMeters"" ASC NULLS LAST, sz.""Name"" ASC
) s
WHERE s.""VehicleTypeId"" = v.""Id"";
");

            // A type with no compatibility rows — one added after the seed, for instance —
            // Still needs a standard before any provider can allocate it.
            migrationBuilder.Sql(@"
UPDATE ""VehicleTypes""
SET ""StandardSlotSizeId"" = (
    SELECT ""Id"" FROM ""SlotSizes""
    WHERE ""IsActive""
    ORDER BY ""LengthMeters"" ASC NULLS LAST, ""Name"" ASC
    LIMIT 1)
WHERE ""StandardSlotSizeId"" IS NULL
   OR ""StandardSlotSizeId"" = '00000000-0000-0000-0000-000000000000'::uuid;
");

            migrationBuilder.AlterColumn<Guid>(
                name: "StandardSlotSizeId",
                table: "VehicleTypes",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_VehicleTypes_StandardSlotSizeId",
                table: "VehicleTypes",
                column: "StandardSlotSizeId");

            migrationBuilder.AddForeignKey(
                name: "FK_VehicleTypes_SlotSizes_StandardSlotSizeId",
                table: "VehicleTypes",
                column: "StandardSlotSizeId",
                principalTable: "SlotSizes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.DropTable(
                name: "SlotSizeVehicleTypes");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // The deleted properties are data, not schema — this cannot bring them back.

            migrationBuilder.DropForeignKey(
                name: "FK_VehicleTypes_SlotSizes_StandardSlotSizeId",
                table: "VehicleTypes");

            migrationBuilder.DropIndex(
                name: "IX_VehicleTypes_StandardSlotSizeId",
                table: "VehicleTypes");

            migrationBuilder.CreateTable(
                name: "SlotSizeVehicleTypes",
                columns: table => new
                {
                    SlotSizeId = table.Column<Guid>(type: "uuid", nullable: false),
                    VehicleTypeId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SlotSizeVehicleTypes", x => new { x.SlotSizeId, x.VehicleTypeId });
                    table.ForeignKey(
                        name: "FK_SlotSizeVehicleTypes_SlotSizes_SlotSizeId",
                        column: x => x.SlotSizeId,
                        principalTable: "SlotSizes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SlotSizeVehicleTypes_VehicleTypes_VehicleTypeId",
                        column: x => x.VehicleTypeId,
                        principalTable: "VehicleTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SlotSizeVehicleTypes_VehicleTypeId",
                table: "SlotSizeVehicleTypes",
                column: "VehicleTypeId");

            // One row per type from its standard bay. The extra sizes a type used to allow
            // Were dropped going up, so they cannot be recovered here.
            migrationBuilder.Sql(@"
INSERT INTO ""SlotSizeVehicleTypes"" (""SlotSizeId"", ""VehicleTypeId"")
SELECT ""StandardSlotSizeId"", ""Id"" FROM ""VehicleTypes"";
");

            migrationBuilder.DropColumn(
                name: "StandardSlotSizeId",
                table: "VehicleTypes");
        }
    }
}
