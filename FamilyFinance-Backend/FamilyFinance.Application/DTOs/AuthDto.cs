using System;

namespace FamilyFinance.Application.DTOs
{
    // Cadastro de uma nova família (conta de acesso).
    public class RegisterFamilyDto
    {
        public string Name { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public int MemberCount { get; set; }
        public string Username { get; set; } = string.Empty;
    }

    public class LoginDto
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class ChangePasswordDto
    {
        public Guid FamilyId { get; set; }
        public string NewPassword { get; set; } = string.Empty;
    }
}
