using System;
using System.Threading.Tasks;
using FamilyFinance.Application.DTOs;
using FamilyFinance.Domain.Entities;

namespace FamilyFinance.Application.Services
{
    public interface IAuthService
    {
        // Retorna a família criada e a senha padrão em texto puro (só para exibir uma vez no modal do front-end).
        Task<(Family Family, string DefaultPassword)> RegisterAsync(RegisterFamilyDto dto);
        Task<Family> LoginAsync(LoginDto dto);
        Task ChangePasswordAsync(ChangePasswordDto dto);
    }
}
