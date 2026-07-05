using System;
using System.Linq;
using System.Threading.Tasks;
using FamilyFinance.Application.DTOs;
using FamilyFinance.Application.Interfaces;
using FamilyFinance.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FamilyFinance.Application.Services
{
    public class AuthService : IAuthService
    {
        // Senha padrão que toda família recebe ao se cadastrar.
        private const string DefaultPassword = "123456";

        private readonly IApplicationDbContext _context;

        public AuthService(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<(Family Family, string DefaultPassword)> RegisterAsync(RegisterFamilyDto dto)
        {
            var name = dto.Name?.Trim() ?? string.Empty;
            var city = dto.City?.Trim() ?? string.Empty;
            var username = dto.Username?.Trim() ?? string.Empty;

            if (string.IsNullOrWhiteSpace(name))
                throw new InvalidOperationException("Informe o nome da família.");

            if (string.IsNullOrWhiteSpace(city))
                throw new InvalidOperationException("Informe a cidade.");

            if (string.IsNullOrWhiteSpace(username))
                throw new InvalidOperationException("Informe um usuário para o login.");

            if (dto.MemberCount <= 0)
                throw new InvalidOperationException("Informe a quantidade de familiares.");

            // Verifica no banco se já existe uma família com esse usuário (sem diferenciar maiúsculas/minúsculas).
            var usernameNormalized = username.ToLowerInvariant();
            var alreadyExists = await _context.Families
                .AnyAsync(f => f.Username.ToLower() == usernameNormalized);

            if (alreadyExists)
                throw new InvalidOperationException("Já existe uma família cadastrada com esse usuário. Escolha outro.");

            var (hash, salt) = PasswordHasher.Hash(DefaultPassword);

            var family = new Family
            {
                Name = name,
                City = city,
                MemberCount = dto.MemberCount,
                Username = username,
                PasswordHash = hash,
                PasswordSalt = salt,
                MustChangePassword = true
            };

            _context.Families.Add(family);
            await _context.SaveChangesAsync();

            return (family, DefaultPassword);
        }

        public async Task<Family> LoginAsync(LoginDto dto)
        {
            var username = dto.Username?.Trim().ToLowerInvariant() ?? string.Empty;

            var family = await _context.Families
                .FirstOrDefaultAsync(f => f.Username.ToLower() == username);

            // Mensagem genérica de propósito: não revela se o usuário existe ou não.
            if (family == null || !PasswordHasher.Verify(dto.Password ?? string.Empty, family.PasswordHash, family.PasswordSalt))
                throw new InvalidOperationException("Usuário ou senha inválidos.");

            return family;
        }

        public async Task ChangePasswordAsync(ChangePasswordDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.NewPassword) || dto.NewPassword.Length < 6)
                throw new InvalidOperationException("A nova senha deve ter pelo menos 6 caracteres.");

            var family = await _context.Families.FirstOrDefaultAsync(f => f.Id == dto.FamilyId);
            if (family == null)
                throw new InvalidOperationException("Família não encontrada.");

            var (hash, salt) = PasswordHasher.Hash(dto.NewPassword);
            family.PasswordHash = hash;
            family.PasswordSalt = salt;
            family.MustChangePassword = false;

            await _context.SaveChangesAsync();
        }
    }
}
