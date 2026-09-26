using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QuickPark.API.Migrations
{
    /// <inheritdoc />
    public partial class AddBaySizeOnVehicleType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // The bay a property was built to is worth keeping, so every dimension is copied
            // Out of "SlotSizes" before the catalog and its keys disappear.
            migrationBuilder.AddColumn<decimal>(
                name: "BayLengthMeters",
                table: "VehicleTypes",
                type: "numeric(5,2)",
                precision: 5,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "BayWidthMeters",
                table: "VehicleTypes",
                type: "numeric(5,2)",
                precision: 5,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "BayLengthMeters",
                table: "ParkingSlot",
                type: "numeric(5,2)",
                precision: 5,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "BayWidthMeters",
                table: "ParkingSlot",
                type: "numeric(5,2)",
                precision: 5,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "BayLengthMeters",
                table: "ParkingFacilityVehicleTypes",
                type: "numeric(5,2)",
                precision: 5,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "BayWidthMeters",
                table: "ParkingFacilityVehicleTypes",
                type: "numeric(5,2)",
                precision: 5,
                scale: 2,
                nullable: true);

            // One bay per vehicle type: each type keeps the measurements of the size it
            // Standardised on, so an owner's layout reads the same before and after.
            migrationBuilder.Sql("""
                UPDATE "VehicleTypes" v
                   SET "BayLengthMeters" = s."LengthMeters",
                       "BayWidthMeters"  = s."WidthMeters"
                  FROM "SlotSizes" s
                 WHERE v."StandardSlotSizeId" = s."Id";
                """);

            migrationBuilder.Sql("""
                UPDATE "ParkingSlot" p
                   SET "BayLengthMeters" = s."LengthMeters",
                       "BayWidthMeters"  = s."WidthMeters"
                  FROM "SlotSizes" s
                 WHERE p."SlotSizeId" = s."Id";
                """);

            migrationBuilder.Sql("""
                UPDATE "ParkingFacilityVehicleTypes" a
                   SET "BayLengthMeters" = s."LengthMeters",
                       "BayWidthMeters"  = s."WidthMeters"
                  FROM "SlotSizes" s
                 WHERE a."SlotSizeId" = s."Id";
                """);

            migrationBuilder.DropForeignKey(
                name: "FK_ParkingFacilityVehicleTypes_SlotSizes_SlotSizeId",
                table: "ParkingFacilityVehicleTypes");

            migrationBuilder.DropForeignKey(
                name: "FK_ParkingSlot_SlotSizes_SlotSizeId",
                table: "ParkingSlot");

            migrationBuilder.DropForeignKey(
                name: "FK_VehicleTypes_SlotSizes_StandardSlotSizeId",
                table: "VehicleTypes");

            migrationBuilder.DropTable(
                name: "SlotSizes");

            migrationBuilder.DropIndex(
                name: "IX_VehicleTypes_StandardSlotSizeId",
                table: "VehicleTypes");

            migrationBuilder.DropIndex(
                name: "IX_ParkingSlot_SlotSizeId",
                table: "ParkingSlot");

            migrationBuilder.DropIndex(
                name: "IX_ParkingFacilityVehicleTypes_SlotSizeId",
                table: "ParkingFacilityVehicleTypes");

            migrationBuilder.DropColumn(
                name: "StandardSlotSizeId",
                table: "VehicleTypes");

            migrationBuilder.DropColumn(
                name: "SlotSizeId",
                table: "ParkingSlot");

            migrationBuilder.DropColumn(
                name: "SlotSizeId",
                table: "ParkingFacilityVehicleTypes");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // The catalog is rebuilt from the typed dimensions, one size per distinct pair,
            // Addressed by a stable hash of that pair. A size an admin had renamed or
            // Deactivated comes back under its measurements, not its old name.
            migrationBuilder.AddColumn<Guid>(
                name: "StandardSlotSizeId",
                table: "VehicleTypes",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "SlotSizeId",
                table: "ParkingSlot",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "SlotSizeId",
                table: "ParkingFacilityVehicleTypes",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateTable(
                name: "SlotSizes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    LengthMeters = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: true),
                    Name = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    WidthMeters = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SlotSizes", x => x.Id);
                });

            migrationBuilder.Sql("""
                INSERT INTO "SlotSizes"
                    ("Id", "Name", "Code", "LengthMeters", "WidthMeters", "IsActive", "CreatedAt", "UpdatedAt")
                SELECT DISTINCT
                       md5('qpk-bay-' || COALESCE(t."LengthMeters"::text, 'none')
                           || 'x' || COALESCE(t."WidthMeters"::text, 'none'))::uuid,
                       CASE WHEN t."LengthMeters" IS NULL OR t."WidthMeters" IS NULL
                            THEN 'Not set'
                            ELSE 'Bay ' || t."LengthMeters" || ' x ' || t."WidthMeters" END,
                       'B' || COALESCE(REPLACE(t."LengthMeters"::text, '.', ''), '0')
                         || 'W' || COALESCE(REPLACE(t."WidthMeters"::text, '.', ''), '0'),
                       t."LengthMeters", t."WidthMeters", true, now(), now()
                  FROM (
                       SELECT "BayLengthMeters" AS "LengthMeters", "BayWidthMeters" AS "WidthMeters" FROM "VehicleTypes"
                       UNION
                       SELECT "BayLengthMeters", "BayWidthMeters" FROM "ParkingSlot"
                       UNION
                       SELECT "BayLengthMeters", "BayWidthMeters" FROM "ParkingFacilityVehicleTypes"
                  ) t;
                """);

            // The same hash expression the insert used, so each row points at its own size.
            migrationBuilder.Sql("""
                UPDATE "VehicleTypes" v
                   SET "StandardSlotSizeId" = s."Id"
                  FROM "SlotSizes" s
                 WHERE s."Id" = md5('qpk-bay-' || COALESCE(v."BayLengthMeters"::text, 'none')
                                 || 'x' || COALESCE(v."BayWidthMeters"::text, 'none'))::uuid;
                """);

            migrationBuilder.Sql("""
                UPDATE "ParkingSlot" p
                   SET "SlotSizeId" = s."Id"
                  FROM "SlotSizes" s
                 WHERE s."Id" = md5('qpk-bay-' || COALESCE(p."BayLengthMeters"::text, 'none')
                                 || 'x' || COALESCE(p."BayWidthMeters"::text, 'none'))::uuid;
                """);

            migrationBuilder.Sql("""
                UPDATE "ParkingFacilityVehicleTypes" a
                   SET "SlotSizeId" = s."Id"
                  FROM "SlotSizes" s
                 WHERE s."Id" = md5('qpk-bay-' || COALESCE(a."BayLengthMeters"::text, 'none')
                                 || 'x' || COALESCE(a."BayWidthMeters"::text, 'none'))::uuid;
                """);

            migrationBuilder.DropColumn(
                name: "BayLengthMeters",
                table: "VehicleTypes");

            migrationBuilder.DropColumn(
                name: "BayWidthMeters",
                table: "VehicleTypes");

            migrationBuilder.DropColumn(
                name: "BayLengthMeters",
                table: "ParkingSlot");

            migrationBuilder.DropColumn(
                name: "BayWidthMeters",
                table: "ParkingSlot");

            migrationBuilder.DropColumn(
                name: "BayLengthMeters",
                table: "ParkingFacilityVehicleTypes");

            migrationBuilder.DropColumn(
                name: "BayWidthMeters",
                table: "ParkingFacilityVehicleTypes");

            migrationBuilder.CreateIndex(
                name: "IX_VehicleTypes_StandardSlotSizeId",
                table: "VehicleTypes",
                column: "StandardSlotSizeId");

            migrationBuilder.CreateIndex(
                name: "IX_ParkingSlot_SlotSizeId",
                table: "ParkingSlot",
                column: "SlotSizeId");

            migrationBuilder.CreateIndex(
                name: "IX_ParkingFacilityVehicleTypes_SlotSizeId",
                table: "ParkingFacilityVehicleTypes",
                column: "SlotSizeId");

            migrationBuilder.CreateIndex(
                name: "IX_SlotSizes_Code",
                table: "SlotSizes",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SlotSizes_IsActive",
                table: "SlotSizes",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_SlotSizes_Name",
                table: "SlotSizes",
                column: "Name",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_ParkingFacilityVehicleTypes_SlotSizes_SlotSizeId",
                table: "ParkingFacilityVehicleTypes",
                column: "SlotSizeId",
                principalTable: "SlotSizes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ParkingSlot_SlotSizes_SlotSizeId",
                table: "ParkingSlot",
                column: "SlotSizeId",
                principalTable: "SlotSizes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_VehicleTypes_SlotSizes_StandardSlotSizeId",
                table: "VehicleTypes",
                column: "StandardSlotSizeId",
                principalTable: "SlotSizes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
