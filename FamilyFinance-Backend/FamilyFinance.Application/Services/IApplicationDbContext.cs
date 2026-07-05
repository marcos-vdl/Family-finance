using System;
using System.Threading.Tasks;
using FamilyFinance.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FamilyFinance.Application.Interfaces
{
    public interface IApplicationDbContext
    {
        DbSet<Family> Families { get; set; }
        DbSet<Person> People { get; set; }
        DbSet<Transaction> Transactions { get; set; }
        DbSet<FixedExpense> FixedExpenses { get; set; }
        DbSet<AuditLog> AuditLogs { get; set; }
        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    }
}