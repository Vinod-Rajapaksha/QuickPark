using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QuickPark.API.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentStage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Every payment row already in the table paid for a stay, so that is what they are.
            migrationBuilder.AddColumn<string>(
                name: "Stage",
                table: "Payments",
                type: "text",
                nullable: false,
                defaultValue: "PARKING_CHARGE");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Stage",
                table: "Payments");
        }
    }
}
