using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FamilyFinance.Application.DTOs;
using FamilyFinance.Domain.Entities;

namespace FamilyFinance.Application.Services
{
    public interface IFinanceService
    {
        Task<Family> CreateFamilyAsync(string name);

        Task<Person> CreatePersonAsync(CreatePersonDto dto);
        Task<IEnumerable<Person>> GetPeopleByFamilyAsync(Guid familyId);
        Task DeletePersonAsync(Guid personId, Guid deletedByPersonId);

        Task<Transaction> CreateTransactionAsync(CreateTransactionDto dto);
        Task<Transaction> UpdateTransactionAsync(Guid transactionId, UpdateTransactionDto dto);
        Task DeleteTransactionAsync(Guid transactionId);
        Task<object> GetIndividualReportAsync(Guid personId, int? year = null, int? month = null);
        Task<object> GetFamilyReportAsync(Guid familyId, int? year = null, int? month = null);

        // Lista os meses/anos com alguma movimentação, usado para popular a aba "Histórico".
        Task<IEnumerable<object>> GetAvailableMonthsAsync(Guid familyId);

        Task<FixedExpense> CreateFixedExpenseAsync(CreateFixedExpenseDto dto);
        Task<IEnumerable<FixedExpense>> GetFixedExpensesByFamilyAsync(Guid familyId);
        Task MarkFixedExpenseAsPaidAsync(Guid fixedExpenseId);
        Task DeleteFixedExpenseAsync(Guid fixedExpenseId);

        Task<IEnumerable<AuditLog>> GetAuditLogsByFamilyAsync(Guid familyId);
    }
}
