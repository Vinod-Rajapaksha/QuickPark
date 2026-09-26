using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QuickPark.API.Migrations
{
    /// <inheritdoc />
    public partial class AddFacilitySlotsReservationsAndConfiguration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // The dev database carried an untracked "Reservations" table (ReferenceCode/UserId/
            // OccupiedUntil) that is not in __EFMigrationsHistory and held 0 rows; this migration
            // Owns that name from here on.
            migrationBuilder.Sql(@"DROP TABLE IF EXISTS ""Reservations"";");

            migrationBuilder.AddColumn<Guid>(
                name: "SlotSizeId",
                table: "ParkingSlot",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "VehicleTypeId",
                table: "ParkingSlot",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "RejectionReason",
                table: "ParkingFacilities",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReviewedAt",
                table: "ParkingFacilities",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ReviewedBy",
                table: "ParkingFacilities",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SubmittedAt",
                table: "ParkingFacilities",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "SlotSizes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    LengthMeters = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: true),
                    WidthMeters = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SlotSizes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "VehicleTypes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    SlotCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VehicleTypes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ParkingFacilityVehicleTypes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FacilityId = table.Column<Guid>(type: "uuid", nullable: false),
                    VehicleTypeId = table.Column<Guid>(type: "uuid", nullable: false),
                    SlotSizeId = table.Column<Guid>(type: "uuid", nullable: false),
                    NumberOfSlots = table.Column<int>(type: "integer", nullable: false),
                    HourlyRate = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    CommissionRate = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ParkingFacilityVehicleTypes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ParkingFacilityVehicleTypes_ParkingFacilities_FacilityId",
                        column: x => x.FacilityId,
                        principalTable: "ParkingFacilities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ParkingFacilityVehicleTypes_SlotSizes_SlotSizeId",
                        column: x => x.SlotSizeId,
                        principalTable: "SlotSizes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ParkingFacilityVehicleTypes_VehicleTypes_VehicleTypeId",
                        column: x => x.VehicleTypeId,
                        principalTable: "VehicleTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Reservations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DriverUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    FacilityId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProviderId = table.Column<Guid>(type: "uuid", nullable: false),
                    SlotId = table.Column<Guid>(type: "uuid", nullable: false),
                    SlotNumber = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    VehicleTypeId = table.Column<Guid>(type: "uuid", nullable: false),
                    StartTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Hours = table.Column<int>(type: "integer", nullable: false),
                    HourlyRate = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    TotalAmount = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CancelReason = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reservations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Reservations_ParkingFacilities_FacilityId",
                        column: x => x.FacilityId,
                        principalTable: "ParkingFacilities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Reservations_ParkingProviders_ProviderId",
                        column: x => x.ProviderId,
                        principalTable: "ParkingProviders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Reservations_ParkingSlot_SlotId",
                        column: x => x.SlotId,
                        principalTable: "ParkingSlot",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Reservations_Users_DriverUserId",
                        column: x => x.DriverUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Reservations_VehicleTypes_VehicleTypeId",
                        column: x => x.VehicleTypeId,
                        principalTable: "VehicleTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

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


            migrationBuilder.Sql(@"
INSERT INTO ""VehicleTypes"" (""Id"", ""Name"", ""SlotCode"", ""SortOrder"", ""IsActive"", ""CreatedAt"", ""UpdatedAt"")
VALUES
    ('11111111-1111-1111-1111-111111111101', 'Car',            'CAR',    1, true, now(), now()),
    ('11111111-1111-1111-1111-111111111102', 'Van',            'VAN',    2, true, now(), now()),
    ('11111111-1111-1111-1111-111111111103', 'SUV',            'SUV',    3, true, now(), now()),
    ('11111111-1111-1111-1111-111111111104', 'Motorcycle',     'BIKE',   4, true, now(), now()),
    ('11111111-1111-1111-1111-111111111105', 'Three-Wheeler',  'THREEW', 5, true, now(), now())
ON CONFLICT (""Id"") DO NOTHING;");

            migrationBuilder.Sql(@"
INSERT INTO ""SlotSizes"" (""Id"", ""Name"", ""Code"", ""LengthMeters"", ""WidthMeters"", ""IsActive"", ""CreatedAt"", ""UpdatedAt"")
VALUES
    ('22222222-2222-2222-2222-222222222201', 'Small',  'SMALL',  2.50, 1.20, true, now(), now()),
    ('22222222-2222-2222-2222-222222222202', 'Medium', 'MEDIUM', 5.00, 2.50, true, now(), now()),
    ('22222222-2222-2222-2222-222222222203', 'Large',  'LARGE',  6.00, 3.00, true, now(), now())
ON CONFLICT (""Id"") DO NOTHING;");

            // Car fits medium and large; van and SUV only large; bikes and three-wheelers all sizes.
            migrationBuilder.Sql(@"
INSERT INTO ""SlotSizeVehicleTypes"" (""SlotSizeId"", ""VehicleTypeId"")
VALUES
    ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111104'),
    ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111105'),
    ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111101'),
    ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111104'),
    ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111105'),
    ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111101'),
    ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111102'),
    ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111103')
ON CONFLICT DO NOTHING;");

            // Slots registered before this migration had no vehicle type or size; put them on a
            // Car/medium bay so the foreign keys below can be created.
            migrationBuilder.Sql(@"
UPDATE ""ParkingSlot""
SET ""VehicleTypeId"" = '11111111-1111-1111-1111-111111111101',
    ""SlotSizeId""    = '22222222-2222-2222-2222-222222222202'
WHERE ""VehicleTypeId"" = '00000000-0000-0000-0000-000000000000'
   OR ""SlotSizeId""    = '00000000-0000-0000-0000-000000000000';");

            migrationBuilder.CreateIndex(
                name: "IX_ParkingSlot_FacilityId_VehicleTypeId_Status",
                table: "ParkingSlot",
                columns: new[] { "FacilityId", "VehicleTypeId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_ParkingSlot_SlotSizeId",
                table: "ParkingSlot",
                column: "SlotSizeId");

            migrationBuilder.CreateIndex(
                name: "IX_ParkingSlot_VehicleTypeId",
                table: "ParkingSlot",
                column: "VehicleTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_ParkingFacilityVehicleTypes_FacilityId_VehicleTypeId",
                table: "ParkingFacilityVehicleTypes",
                columns: new[] { "FacilityId", "VehicleTypeId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ParkingFacilityVehicleTypes_SlotSizeId",
                table: "ParkingFacilityVehicleTypes",
                column: "SlotSizeId");

            migrationBuilder.CreateIndex(
                name: "IX_ParkingFacilityVehicleTypes_VehicleTypeId",
                table: "ParkingFacilityVehicleTypes",
                column: "VehicleTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_Reservations_DriverUserId_StartTime",
                table: "Reservations",
                columns: new[] { "DriverUserId", "StartTime" });

            migrationBuilder.CreateIndex(
                name: "IX_Reservations_FacilityId_Status_StartTime",
                table: "Reservations",
                columns: new[] { "FacilityId", "Status", "StartTime" });

            migrationBuilder.CreateIndex(
                name: "IX_Reservations_ProviderId",
                table: "Reservations",
                column: "ProviderId");

            migrationBuilder.CreateIndex(
                name: "IX_Reservations_SlotId_StartTime_EndTime",
                table: "Reservations",
                columns: new[] { "SlotId", "StartTime", "EndTime" });

            migrationBuilder.CreateIndex(
                name: "IX_Reservations_VehicleTypeId",
                table: "Reservations",
                column: "VehicleTypeId");

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

            migrationBuilder.CreateIndex(
                name: "IX_SlotSizeVehicleTypes_VehicleTypeId",
                table: "SlotSizeVehicleTypes",
                column: "VehicleTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_VehicleTypes_IsActive",
                table: "VehicleTypes",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_VehicleTypes_Name",
                table: "VehicleTypes",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VehicleTypes_SlotCode",
                table: "VehicleTypes",
                column: "SlotCode",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_ParkingSlot_SlotSizes_SlotSizeId",
                table: "ParkingSlot",
                column: "SlotSizeId",
                principalTable: "SlotSizes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ParkingSlot_VehicleTypes_VehicleTypeId",
                table: "ParkingSlot",
                column: "VehicleTypeId",
                principalTable: "VehicleTypes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ParkingSlot_SlotSizes_SlotSizeId",
                table: "ParkingSlot");

            migrationBuilder.DropForeignKey(
                name: "FK_ParkingSlot_VehicleTypes_VehicleTypeId",
                table: "ParkingSlot");

            migrationBuilder.DropTable(
                name: "ParkingFacilityVehicleTypes");

            migrationBuilder.DropTable(
                name: "Reservations");

            migrationBuilder.DropTable(
                name: "SlotSizeVehicleTypes");

            migrationBuilder.DropTable(
                name: "SlotSizes");

            migrationBuilder.DropTable(
                name: "VehicleTypes");

            migrationBuilder.DropIndex(
                name: "IX_ParkingSlot_FacilityId_VehicleTypeId_Status",
                table: "ParkingSlot");

            migrationBuilder.DropIndex(
                name: "IX_ParkingSlot_SlotSizeId",
                table: "ParkingSlot");

            migrationBuilder.DropIndex(
                name: "IX_ParkingSlot_VehicleTypeId",
                table: "ParkingSlot");

            migrationBuilder.DropColumn(
                name: "SlotSizeId",
                table: "ParkingSlot");

            migrationBuilder.DropColumn(
                name: "VehicleTypeId",
                table: "ParkingSlot");

            migrationBuilder.DropColumn(
                name: "RejectionReason",
                table: "ParkingFacilities");

            migrationBuilder.DropColumn(
                name: "ReviewedAt",
                table: "ParkingFacilities");

            migrationBuilder.DropColumn(
                name: "ReviewedBy",
                table: "ParkingFacilities");

            migrationBuilder.DropColumn(
                name: "SubmittedAt",
                table: "ParkingFacilities");
        }
    }
}
