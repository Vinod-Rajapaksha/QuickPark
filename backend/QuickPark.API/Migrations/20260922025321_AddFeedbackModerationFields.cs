using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QuickPark.API.Migrations
{
    /// <inheritdoc />
    public partial class AddFeedbackModerationFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Role",
                table: "FeedbackReplies");

            migrationBuilder.AddColumn<DateTime>(
                name: "ModeratedAt",
                table: "Feedbacks",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ModeratedBy",
                table: "Feedbacks",
                type: "uuid",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Message",
                table: "FeedbackReplies",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.CreateIndex(
                name: "IX_Feedbacks_ParkingId",
                table: "Feedbacks",
                column: "ParkingId");

            migrationBuilder.CreateIndex(
                name: "IX_Feedbacks_Status",
                table: "Feedbacks",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Feedbacks_Type",
                table: "Feedbacks",
                column: "Type");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Feedbacks_ParkingId",
                table: "Feedbacks");

            migrationBuilder.DropIndex(
                name: "IX_Feedbacks_Status",
                table: "Feedbacks");

            migrationBuilder.DropIndex(
                name: "IX_Feedbacks_Type",
                table: "Feedbacks");

            migrationBuilder.DropColumn(
                name: "ModeratedAt",
                table: "Feedbacks");

            migrationBuilder.DropColumn(
                name: "ModeratedBy",
                table: "Feedbacks");

            migrationBuilder.AlterColumn<string>(
                name: "Message",
                table: "FeedbackReplies",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(1000)",
                oldMaxLength: 1000);

            migrationBuilder.AddColumn<string>(
                name: "Role",
                table: "FeedbackReplies",
                type: "text",
                nullable: false,
                defaultValue: "");
        }
    }
}
