using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QuickPark.API.Migrations
{
    /// <inheritdoc />
    public partial class AddFacilityLocationAndDocuments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // These tables pre-existed in the shared dev DB with no row in __EFMigrationsHistory
            // (created outside EF by another branch), so CREATE TABLE collided with 42P07.
            // Dropping them was explicitly authorised on 2026-09-21 to install this schema.
            migrationBuilder.Sql("DROP TABLE IF EXISTS \"ParkingFacilityDocuments\" CASCADE;");
            migrationBuilder.Sql("DROP TABLE IF EXISTS \"ParkingSlots\" CASCADE;");
            migrationBuilder.Sql("DROP TABLE IF EXISTS \"ParkingSlot\" CASCADE;");
            migrationBuilder.Sql("DROP TABLE IF EXISTS \"ParkingFacilities\" CASCADE;");

            migrationBuilder.CreateTable(
                name: "ParkingFacilities",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProviderId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Address = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    City = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Province = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    District = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    LandAreaPerches = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    OpeningTime = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    ClosingTime = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    HasEvCharging = table.Column<bool>(type: "boolean", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ParkingFacilities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ParkingFacilities_ParkingProviders_ProviderId",
                        column: x => x.ProviderId,
                        principalTable: "ParkingProviders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ParkingFacilityDocuments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FacilityId = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<string>(type: "text", nullable: false),
                    Url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    PublicId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    FileName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    ContentType = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    SizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    UploadedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ParkingFacilityDocuments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ParkingFacilityDocuments_ParkingFacilities_FacilityId",
                        column: x => x.FacilityId,
                        principalTable: "ParkingFacilities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ParkingSlot",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FacilityId = table.Column<Guid>(type: "uuid", nullable: false),
                    SlotNumber = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ParkingSlot", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ParkingSlot_ParkingFacilities_FacilityId",
                        column: x => x.FacilityId,
                        principalTable: "ParkingFacilities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ParkingFacilities_City",
                table: "ParkingFacilities",
                column: "City");

            migrationBuilder.CreateIndex(
                name: "IX_ParkingFacilities_District",
                table: "ParkingFacilities",
                column: "District");

            migrationBuilder.CreateIndex(
                name: "IX_ParkingFacilities_ProviderId",
                table: "ParkingFacilities",
                column: "ProviderId");

            migrationBuilder.CreateIndex(
                name: "IX_ParkingFacilities_Province",
                table: "ParkingFacilities",
                column: "Province");

            migrationBuilder.CreateIndex(
                name: "IX_ParkingFacilities_Province_District",
                table: "ParkingFacilities",
                columns: new[] { "Province", "District" });

            migrationBuilder.CreateIndex(
                name: "IX_ParkingFacilities_Status",
                table: "ParkingFacilities",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_ParkingFacilityDocuments_FacilityId_Type",
                table: "ParkingFacilityDocuments",
                columns: new[] { "FacilityId", "Type" });

            migrationBuilder.CreateIndex(
                name: "IX_ParkingSlot_FacilityId_SlotNumber",
                table: "ParkingSlot",
                columns: new[] { "FacilityId", "SlotNumber" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ParkingFacilityDocuments");

            migrationBuilder.DropTable(
                name: "ParkingSlot");

            migrationBuilder.DropTable(
                name: "ParkingFacilities");
        }
    }
}
