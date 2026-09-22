using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QuickPark.API.Migrations
{
    /// <inheritdoc />
    public partial class AddParkingProviderVerification : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ParkingProviders",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    BusinessName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    Address = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    NicDocumentUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    NicDocumentPublicId = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    NicDocumentContentType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    NicDocumentSize = table.Column<long>(type: "bigint", nullable: false),
                    NicSubmittedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    VerificationStatus = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    VerificationRemarks = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    VerifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    VerifiedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ParkingProviders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ParkingProviders_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ParkingProviders_UserId",
                table: "ParkingProviders",
                column: "UserId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ParkingProviders");
        }
    }
}
