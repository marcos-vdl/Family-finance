using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FamilyFinance.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFamilyAuth : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "City",
                table: "Families",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "MemberCount",
                table: "Families",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Username",
                table: "Families",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PasswordHash",
                table: "Families",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PasswordSalt",
                table: "Families",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "MustChangePassword",
                table: "Families",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Families",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "now()");

            migrationBuilder.CreateIndex(
                name: "IX_Families_Username",
                table: "Families",
                column: "Username",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Families_Username",
                table: "Families");

            migrationBuilder.DropColumn(
                name: "City",
                table: "Families");

            migrationBuilder.DropColumn(
                name: "MemberCount",
                table: "Families");

            migrationBuilder.DropColumn(
                name: "Username",
                table: "Families");

            migrationBuilder.DropColumn(
                name: "PasswordHash",
                table: "Families");

            migrationBuilder.DropColumn(
                name: "PasswordSalt",
                table: "Families");

            migrationBuilder.DropColumn(
                name: "MustChangePassword",
                table: "Families");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Families");
        }
    }
}
