using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FamilyFinance.Domain.Entities;

namespace FamilyFinance.Application.Services
{
    public interface IAdminService
    {
        bool ValidateCredentials(string username, string password);
        Task<List<Family>> GetAllFamiliesAsync();
        Task ResetFamilyPasswordAsync(Guid familyId);
        Task DeleteFamilyAsync(Guid familyId);
    }
}
