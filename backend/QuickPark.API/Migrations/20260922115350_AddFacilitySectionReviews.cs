using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QuickPark.API.Migrations
{
    /// <inheritdoc />
    public partial class AddFacilitySectionReviews : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ParkingFacilitySectionReviews",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FacilityId = table.Column<Guid>(type: "uuid", nullable: false),
                    Section = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Remarks = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ReviewedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    ReviewedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ParkingFacilitySectionReviews", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ParkingFacilitySectionReviews_ParkingFacilities_FacilityId",
                        column: x => x.FacilityId,
                        principalTable: "ParkingFacilities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ParkingFacilitySectionReviews_FacilityId_Section",
                table: "ParkingFacilitySectionReviews",
                columns: new[] { "FacilityId", "Section" },
                unique: true);

            // A property the admin has already decided keeps that decision: the one answer they
            // Gave is copied over the four sections, so nobody has to re-approve live properties.
            // A draft has never been reviewed, so it gets no rows — the submission opens them.
            migrationBuilder.Sql("""
                INSERT INTO "ParkingFacilitySectionReviews"
                    ("Id", "FacilityId", "Section", "Status", "Remarks",
                     "ReviewedBy", "ReviewedAt", "CreatedAt", "UpdatedAt")
                SELECT gen_random_uuid(),
                       f."Id",
                       s."Section",
                       CASE WHEN f."Status" IN ('APPROVED', 'SUSPENDED') THEN 'APPROVED'
                            WHEN f."Status" = 'REJECTED' THEN 'REJECTED'
                            ELSE 'PENDING'
                       END,
                       CASE WHEN f."Status" = 'REJECTED' THEN f."RejectionReason" END,
                       f."ReviewedBy",
                       CASE WHEN f."Status" IN ('APPROVED', 'SUSPENDED', 'REJECTED')
                                THEN COALESCE(f."ReviewedAt", f."UpdatedAt")
                       END,
                       now(),
                       now()
                  FROM "ParkingFacilities" f
                 CROSS JOIN (VALUES ('BASIC_INFORMATION'), ('PROPERTY_LOCATION'),
                                    ('DOCUMENTS'), ('PRICING')) AS s("Section")
                 WHERE f."Status" <> 'DRAFT'
                   AND NOT EXISTS (
                       SELECT 1 FROM "ParkingFacilitySectionReviews" r
                        WHERE r."FacilityId" = f."Id");
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ParkingFacilitySectionReviews");
        }
    }
}
