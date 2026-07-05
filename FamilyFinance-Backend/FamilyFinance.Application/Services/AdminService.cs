using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FamilyFinance.Application.Interfaces;
using FamilyFinance.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace FamilyFinance.Application.Services
{
    public class AdminService : IAdminService
    {
        // Senha usada quando o admin reseta a senha de uma família.
        private const string DefaultPassword = "123456";

        private readonly IApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public AdminService(IApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        // Credenciais do admin ficam no appsettings.json (seção "AdminSettings"), não no banco.
        // Troque o valor padrão antes de colocar o sistema em produção.
        public bool ValidateCredentials(string username, string password)
        {
            var adminUser = _configuration["AdminSettings:Username"] ?? "admin";
            var adminPass = _configuration["AdminSettings:Password"] ?? "admin123";

            return username == adminUser && password == adminPass;
        }

        public async Task<List<Family>> GetAllFamiliesAsync()
        {
            return await _context.Families
                .Include(f => f.Members)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();
        }

        public async Task ResetFamilyPasswordAsync(Guid familyId)
        {
            var family = await _context.Families.FirstOrDefaultAsync(f => f.Id == familyId);
            if (family == null)
                throw new InvalidOperationException("Família não encontrada.");

            var (hash, salt) = PasswordHasher.Hash(DefaultPassword);
            family.PasswordHash = hash;
            family.PasswordSalt = salt;
            family.MustChangePassword = true; // força trocar de novo no próximo login

            await _context.SaveChangesAsync();
        }

        public async Task DeleteFamilyAsync(Guid familyId)
        {
            var family = await _context.Families.FirstOrDefaultAsync(f => f.Id == familyId);
            if (family == null)
                throw new InvalidOperationException("Família não encontrada.");

            _context.Families.Remove(family);
            await _context.SaveChangesAsync();
        }
    }
}
