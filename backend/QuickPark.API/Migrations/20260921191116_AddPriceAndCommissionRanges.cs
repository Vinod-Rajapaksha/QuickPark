using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QuickPark.API.Migrations
{
    /// <inheritdoc />
    public partial class AddPriceAndCommissionRanges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CommissionRanges",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    VehicleTypeId = table.Column<Guid>(type: "uuid", nullable: false),
                    MinPercent = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    MaxPercent = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
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
                    MinAmount = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    MaxAmount = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CommissionRanges");

            migrationBuilder.DropTable(
                name: "PriceRanges");
        }
    }
}
