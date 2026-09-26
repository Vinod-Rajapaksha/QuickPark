using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QuickPark.API.Migrations
{
    /// <inheritdoc />
    public partial class RecreateReservationsTable : Migration
    {
        // The shared dev database lost this table outside EF: every migration that
        // touches it is already recorded as applied, so `database update` never
        // re-runs its CREATE. Guarded so an already-present table is left alone.
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
CREATE TABLE IF NOT EXISTS ""Reservations"" (
    ""Id"" uuid NOT NULL,
    ""DriverUserId"" uuid NOT NULL,
    ""FacilityId"" uuid NOT NULL,
    ""ProviderId"" uuid NOT NULL,
    ""SlotId"" uuid NOT NULL,
    ""SlotNumber"" character varying(20) NOT NULL,
    ""VehicleTypeId"" uuid NOT NULL,
    ""StartTime"" timestamp with time zone NOT NULL,
    ""EndTime"" timestamp with time zone NOT NULL,
    ""Hours"" integer NOT NULL,
    ""HourlyRate"" numeric(10,2) NOT NULL,
    ""TotalAmount"" numeric(10,2) NOT NULL,
    ""Status"" text NOT NULL,
    ""CancelReason"" character varying(300),
    ""CreatedAt"" timestamp with time zone NOT NULL,
    ""UpdatedAt"" timestamp with time zone NOT NULL,
    ""CommissionAmount"" numeric NOT NULL DEFAULT 0.0,
    ""CommissionRate"" numeric NOT NULL DEFAULT 0.0,
    ""ProviderAmount"" numeric NOT NULL DEFAULT 0.0,
    ""CancelledAt"" timestamp with time zone,
    ""CancelledBy"" character varying(100),
    ""ProviderBusinessName"" character varying(150),
    ""ProviderEmail"" character varying(256) NOT NULL DEFAULT '',
    ""ProviderName"" character varying(150) NOT NULL DEFAULT '',
    CONSTRAINT ""PK_Reservations"" PRIMARY KEY (""Id""),
    CONSTRAINT ""FK_Reservations_ParkingFacilities_FacilityId"" FOREIGN KEY (""FacilityId"") REFERENCES ""ParkingFacilities"" (""Id"") ON DELETE RESTRICT,
    CONSTRAINT ""FK_Reservations_ParkingProviders_ProviderId"" FOREIGN KEY (""ProviderId"") REFERENCES ""ParkingProviders"" (""Id"") ON DELETE RESTRICT,
    CONSTRAINT ""FK_Reservations_ParkingSlot_SlotId"" FOREIGN KEY (""SlotId"") REFERENCES ""ParkingSlot"" (""Id"") ON DELETE RESTRICT,
    CONSTRAINT ""FK_Reservations_Users_DriverUserId"" FOREIGN KEY (""DriverUserId"") REFERENCES ""Users"" (""Id"") ON DELETE RESTRICT,
    CONSTRAINT ""FK_Reservations_VehicleTypes_VehicleTypeId"" FOREIGN KEY (""VehicleTypeId"") REFERENCES ""VehicleTypes"" (""Id"") ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS ""IX_Reservations_DriverUserId_StartTime"" ON ""Reservations"" (""DriverUserId"", ""StartTime"");
CREATE INDEX IF NOT EXISTS ""IX_Reservations_FacilityId_Status_StartTime"" ON ""Reservations"" (""FacilityId"", ""Status"", ""StartTime"");
CREATE INDEX IF NOT EXISTS ""IX_Reservations_ProviderEmail"" ON ""Reservations"" (""ProviderEmail"");
CREATE INDEX IF NOT EXISTS ""IX_Reservations_ProviderId"" ON ""Reservations"" (""ProviderId"");
CREATE INDEX IF NOT EXISTS ""IX_Reservations_ProviderName"" ON ""Reservations"" (""ProviderName"");
CREATE INDEX IF NOT EXISTS ""IX_Reservations_SlotId_StartTime_EndTime"" ON ""Reservations"" (""SlotId"", ""StartTime"", ""EndTime"");
CREATE INDEX IF NOT EXISTS ""IX_Reservations_VehicleTypeId"" ON ""Reservations"" (""VehicleTypeId"");
");
        }

        // Deliberately not dropping: a rollback must never delete booking history.
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
