using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QuickPark.API.Migrations
{
    /// <inheritdoc />
    public partial class RenameDriverUserIdToDriverId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // A rename keeps every row and every foreign key: Postgres follows the column into the
            // constraint definitions, so only the identifiers themselves are rewritten here.
            migrationBuilder.RenameColumn(
                name: "DriverUserId",
                table: "Reservations",
                newName: "DriverId");

            migrationBuilder.RenameColumn(
                name: "DriverUserId",
                table: "Payments",
                newName: "DriverId");

            migrationBuilder.RenameIndex(
                name: "IX_Reservations_DriverUserId_StartTime",
                table: "Reservations",
                newName: "IX_Reservations_DriverId_StartTime");

            migrationBuilder.RenameIndex(
                name: "IX_Payments_DriverUserId_CreatedAt",
                table: "Payments",
                newName: "IX_Payments_DriverId_CreatedAt");

            migrationBuilder.Sql(
                "ALTER TABLE \"Reservations\" RENAME CONSTRAINT \"FK_Reservations_Users_DriverUserId\" TO \"FK_Reservations_Users_DriverId\";");

            migrationBuilder.Sql(
                "ALTER TABLE \"Payments\" RENAME CONSTRAINT \"FK_Payments_Users_DriverUserId\" TO \"FK_Payments_Users_DriverId\";");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "ALTER TABLE \"Reservations\" RENAME CONSTRAINT \"FK_Reservations_Users_DriverId\" TO \"FK_Reservations_Users_DriverUserId\";");

            migrationBuilder.Sql(
                "ALTER TABLE \"Payments\" RENAME CONSTRAINT \"FK_Payments_Users_DriverId\" TO \"FK_Payments_Users_DriverUserId\";");

            migrationBuilder.RenameIndex(
                name: "IX_Reservations_DriverId_StartTime",
                table: "Reservations",
                newName: "IX_Reservations_DriverUserId_StartTime");

            migrationBuilder.RenameIndex(
                name: "IX_Payments_DriverId_CreatedAt",
                table: "Payments",
                newName: "IX_Payments_DriverUserId_CreatedAt");

            migrationBuilder.RenameColumn(
                name: "DriverId",
                table: "Reservations",
                newName: "DriverUserId");

            migrationBuilder.RenameColumn(
                name: "DriverId",
                table: "Payments",
                newName: "DriverUserId");
        }
    }
}
