using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QuickPark.API.Migrations
{
    /// <inheritdoc />
    public partial class AddVehiclePricingConfigurationAndReservationCommission : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CommissionRanges");

            migrationBuilder.DropTable(
                name: "PriceRanges");

            migrationBuilder.AddColumn<decimal>(
                name: "CommissionAmount",
                table: "Reservations",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "CommissionRate",
                table: "Reservations",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "ProviderAmount",
                table: "Reservations",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateTable(
                name: "VehiclePricingConfigurations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    VehicleTypeId = table.Column<Guid>(type: "uuid", nullable: false),
                    MinimumPrice = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    MaximumPrice = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    CommissionRate = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VehiclePricingConfigurations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VehiclePricingConfigurations_VehicleTypes_VehicleTypeId",
                        column: x => x.VehicleTypeId,
                        principalTable: "VehicleTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_VehiclePricingConfigurations_IsActive",
                table: "VehiclePricingConfigurations",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_VehiclePricingConfigurations_VehicleTypeId",
                table: "VehiclePricingConfigurations",
                column: "VehicleTypeId",
                unique: true);

            // Starter rows so the owner form is usable the moment this is applied; they are plain
            // Database data, so the admin editing them through the API is all that is ever needed.
            // Matched on SlotCode rather than the seeded GUIDs. Motorcycle / Car / Van carry the
            // Numbers the spec names; SUV and Three-Wheeler are comparable placeholders.
            migrationBuilder.Sql("""
                INSERT INTO "VehiclePricingConfigurations"
                    ("Id", "VehicleTypeId", "MinimumPrice", "MaximumPrice", "CommissionRate",
                     "IsActive", "CreatedAt", "UpdatedAt")
                SELECT gen_random_uuid(), vt."Id", v."min", v."max", v."commission", true, now(), now()
                FROM "VehicleTypes" vt
                JOIN (VALUES
                        ('BIKE',   100::numeric,   500::numeric, 10::numeric),
                        ('CAR',    300::numeric,  1500::numeric, 12::numeric),
                        ('VAN',    500::numeric,  3000::numeric, 15::numeric),
                        ('SUV',    400::numeric,  2000::numeric, 12::numeric),
                        ('THREEW', 150::numeric,   800::numeric, 10::numeric))
                    AS v("code", "min", "max", "commission") ON v."code" = vt."SlotCode"
                WHERE NOT EXISTS (
                    SELECT 1 FROM "VehiclePricingConfigurations" p WHERE p."VehicleTypeId" = vt."Id");
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "VehiclePricingConfigurations");

            migrationBuilder.DropColumn(
                name: "CommissionAmount",
                table: "Reservations");

            migrationBuilder.DropColumn(
                name: "CommissionRate",
                table: "Reservations");

            migrationBuilder.DropColumn(
                name: "ProviderAmount",
                table: "Reservations");

            migrationBuilder.CreateTable(
                name: "CommissionRanges",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    VehicleTypeId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    MaxPercent = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    MinPercent = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommissionRanges", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CommissionRanges_VehicleTypes_VehicleTypeId",
                        column: x => x.VehicleTypeId,
                        principalTable: "VehicleTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PriceRanges",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    VehicleTypeId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    MaxAmount = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    MinAmount = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PriceRanges", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PriceRanges_VehicleTypes_VehicleTypeId",
                        column: x => x.VehicleTypeId,
                        principalTable: "VehicleTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CommissionRanges_IsActive",
                table: "CommissionRanges",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_CommissionRanges_VehicleTypeId",
                table: "CommissionRanges",
                column: "VehicleTypeId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PriceRanges_IsActive",
                table: "PriceRanges",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_PriceRanges_VehicleTypeId",
                table: "PriceRanges",
                column: "VehicleTypeId",
                unique: true);
        }
    }
}
