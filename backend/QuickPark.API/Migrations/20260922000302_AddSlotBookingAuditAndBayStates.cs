using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QuickPark.API.Migrations
{
    /// <inheritdoc />
    public partial class AddSlotBookingAuditAndBayStates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // The owner-facing name for a retired bay became DISABLED.
            migrationBuilder.Sql(
                "UPDATE \"ParkingSlot\" SET \"Status\" = 'DISABLED' WHERE \"Status\" = 'INACTIVE';");

            // Bay numbers are zero-padded to three digits. A bay that is already booked keeps
            // The same physical row, only its label changes, so the copy the booking carries is
            // Moved with it and the owner and the driver still read the same number.
            const string renumber =
                "SET \"SlotNumber\" = substring(\"SlotNumber\" from '^(.*)-[0-9]+$') || '-' || " +
                "lpad(substring(\"SlotNumber\" from '[0-9]+$'), 3, '0') " +
                "WHERE \"SlotNumber\" ~ '^[^-]+-[0-9]{1,2}$';";

            migrationBuilder.Sql("UPDATE \"ParkingSlot\" " + renumber);
            migrationBuilder.Sql("UPDATE \"Reservations\" " + renumber);

            migrationBuilder.AddColumn<DateTime>(
                name: "CancelledAt",
                table: "Reservations",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CancelledBy",
                table: "Reservations",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "UPDATE \"ParkingSlot\" SET \"Status\" = 'INACTIVE' WHERE \"Status\" = 'DISABLED';");

            migrationBuilder.DropColumn(
                name: "CancelledAt",
                table: "Reservations");

            migrationBuilder.DropColumn(
                name: "CancelledBy",
                table: "Reservations");
        }
    }
}
