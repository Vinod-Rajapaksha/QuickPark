using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QuickPark.API.Migrations
{
    /// <inheritdoc />
    public partial class AddReservationFeedbackFlow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Commissions_Reservations_ReservationId",
                table: "Commissions");

            migrationBuilder.DropTable(
                name: "Notifications");

            migrationBuilder.DropIndex(
                name: "IX_Reservations_DriverId_StartTime",
                table: "Reservations");

            migrationBuilder.DropIndex(
                name: "IX_Reservations_FacilityId_Status_StartTime",
                table: "Reservations");

            migrationBuilder.DropIndex(
                name: "IX_Reservations_ProviderEmail",
                table: "Reservations");

            migrationBuilder.DropIndex(
                name: "IX_Reservations_ProviderName",
                table: "Reservations");

            migrationBuilder.DropIndex(
                name: "IX_Reservations_SlotId_StartTime_EndTime",
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

            migrationBuilder.AlterColumn<decimal>(
                name: "ProviderAmount",
                table: "Reservations",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<decimal>(
                name: "CommissionRate",
                table: "Reservations",
                type: "numeric(5,2)",
                precision: 5,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<decimal>(
                name: "CommissionAmount",
                table: "Reservations",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AddColumn<Guid>(
                name: "ReservationId",
                table: "Feedbacks",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Reservations_DriverId",
                table: "Reservations",
                column: "DriverId");

            migrationBuilder.CreateIndex(
                name: "IX_Reservations_FacilityId",
                table: "Reservations",
                column: "FacilityId");

            migrationBuilder.CreateIndex(
                name: "IX_Reservations_SlotId",
                table: "Reservations",
                column: "SlotId");

            migrationBuilder.CreateIndex(
                name: "IX_Reservations_StartTime",
                table: "Reservations",
                column: "StartTime");

            migrationBuilder.CreateIndex(
                name: "IX_Reservations_Status_StartTime",
                table: "Reservations",
                columns: new[] { "Status", "StartTime" });

            migrationBuilder.CreateIndex(
                name: "IX_Feedbacks_ReservationId",
                table: "Feedbacks",
                column: "ReservationId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Reservations_DriverId",
                table: "Reservations");

            migrationBuilder.DropIndex(
                name: "IX_Reservations_FacilityId",
                table: "Reservations");

            migrationBuilder.DropIndex(
                name: "IX_Reservations_SlotId",
                table: "Reservations");

            migrationBuilder.DropIndex(
                name: "IX_Reservations_StartTime",
                table: "Reservations");

            migrationBuilder.DropIndex(
                name: "IX_Reservations_Status_StartTime",
                table: "Reservations");

            migrationBuilder.DropIndex(
                name: "IX_Feedbacks_ReservationId",
                table: "Feedbacks");

            migrationBuilder.DropColumn(
                name: "ReservationId",
                table: "Feedbacks");

            migrationBuilder.AlterColumn<decimal>(
                name: "ProviderAmount",
                table: "Reservations",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(10,2)",
                oldPrecision: 10,
                oldScale: 2);

            migrationBuilder.AlterColumn<decimal>(
                name: "CommissionRate",
                table: "Reservations",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(5,2)",
                oldPrecision: 5,
                oldScale: 2);

            migrationBuilder.AlterColumn<decimal>(
                name: "CommissionAmount",
                table: "Reservations",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(10,2)",
                oldPrecision: 10,
                oldScale: 2);

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

            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Body = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    FacilityId = table.Column<Guid>(type: "uuid", nullable: true),
                    IsRead = table.Column<bool>(type: "boolean", nullable: false),
                    Title = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Notifications_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Reservations_DriverId_StartTime",
                table: "Reservations",
                columns: new[] { "DriverId", "StartTime" });

            migrationBuilder.CreateIndex(
                name: "IX_Reservations_FacilityId_Status_StartTime",
                table: "Reservations",
                columns: new[] { "FacilityId", "Status", "StartTime" });

            migrationBuilder.CreateIndex(
                name: "IX_Reservations_ProviderEmail",
                table: "Reservations",
                column: "ProviderEmail");

            migrationBuilder.CreateIndex(
                name: "IX_Reservations_ProviderName",
                table: "Reservations",
                column: "ProviderName");

            migrationBuilder.CreateIndex(
                name: "IX_Reservations_SlotId_StartTime_EndTime",
                table: "Reservations",
                columns: new[] { "SlotId", "StartTime", "EndTime" });

            migrationBuilder.CreateIndex(
                name: "IX_ParkingFacilities_ProviderEmail",
                table: "ParkingFacilities",
                column: "ProviderEmail");

            migrationBuilder.CreateIndex(
                name: "IX_ParkingFacilities_ProviderName",
                table: "ParkingFacilities",
                column: "ProviderName");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_UserId_IsRead_CreatedAt",
                table: "Notifications",
                columns: new[] { "UserId", "IsRead", "CreatedAt" });

            migrationBuilder.AddForeignKey(
                name: "FK_Commissions_Reservations_ReservationId",
                table: "Commissions",
                column: "ReservationId",
                principalTable: "Reservations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
