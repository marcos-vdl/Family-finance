using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FamilyFinance.Application.DTOs;
using FamilyFinance.Application.Interfaces;
using FamilyFinance.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FamilyFinance.Application.Services
{
    public class FinanceService : IFinanceService
    {
       private readonly IApplicationDbContext _context;

public FinanceService(IApplicationDbContext context)
{
    _context = context;
}
        public async Task<Family> CreateFamilyAsync(string name)
        {
            // Endpoint legado (sem login). Gera um username único internamente
            // só para não colidir com o índice único de Username no banco.
            var family = new Family
            {
                Name = name,
                Username = $"legacy-{Guid.NewGuid()}"
            };
            _context.Families.Add(family);
            await _context.SaveChangesAsync();
            return family;
        }

        public async Task<Person> CreatePersonAsync(CreatePersonDto dto)
        {
            // Se esta nova pessoa for marcada como principal, remove o status de quem já era
            // (só pode existir um principal/moderador por família).
            if (dto.IsPrincipal)
            {
                var currentPrincipals = await _context.People
                    .Where(p => p.FamilyId == dto.FamilyId && p.IsPrincipal)
                    .ToListAsync();

                foreach (var p in currentPrincipals)
                    p.IsPrincipal = false;
            }

            var person = new Person
            {
                FamilyId = dto.FamilyId,
                Name = dto.Name,
                BirthDate = dto.BirthDate.ToUniversalTime(), // PostgreSQL exige formato UTC para DateTime
                IsPrincipal = dto.IsPrincipal
            };

            _context.People.Add(person);
            await _context.SaveChangesAsync();
            return person;
        }

        public async Task<IEnumerable<Person>> GetPeopleByFamilyAsync(Guid familyId)
        {
            return await _context.People
                .Where(p => p.FamilyId == familyId)
                .OrderByDescending(p => p.IsPrincipal)
                .ThenBy(p => p.Name)
                .ToListAsync();
        }

        public async Task DeletePersonAsync(Guid personId, Guid deletedByPersonId)
        {
            var person = await _context.People.FirstOrDefaultAsync(p => p.Id == personId);
            if (person == null)
                throw new Exception("Pessoa não encontrada.");

            // Quem está executando a exclusão precisa ser um membro da mesma família.
            var actor = await _context.People
                .FirstOrDefaultAsync(p => p.Id == deletedByPersonId && p.FamilyId == person.FamilyId);

            if (actor == null)
                throw new InvalidOperationException("Selecione quem está realizando a exclusão.");

            var log = new AuditLog
            {
                FamilyId = person.FamilyId,
                PrincipalPersonId = actor.Id,
                PrincipalName = actor.Name,
                Action = AuditAction.PersonDeleted,
                Description = $"{actor.Name} removeu \"{person.Name}\" da família (todas as transações dela também foram apagadas)."
            };
            _context.AuditLogs.Add(log);

            // As transações desta pessoa são apagadas em cascata pelo banco (OnDelete.Cascade
            // configurado no ApplicationDbContext), então não precisamos apagá-las manualmente aqui.
            _context.People.Remove(person);
            await _context.SaveChangesAsync();
        }

        public async Task<Transaction> CreateTransactionAsync(CreateTransactionDto dto)
        {
            // 1. Busca a pessoa no banco para validar a idade
           var person = await _context.People.FirstOrDefaultAsync(p => p.Id == dto.PersonId);
            if (person == null)
                throw new Exception("Pessoa não encontrada.");

            // 2. Aplica a Regra de Negócio solicitada: Menor de 18 não lança Receita (Income)
            if (person.IsUnderAge() && dto.Type == TransactionType.Income)
            {
                throw new InvalidOperationException("Menores de 18 anos não podem registrar receitas por não trabalharem.");
            }

            var transaction = new Transaction
            {
                PersonId = dto.PersonId,
                Description = dto.Description,
                Amount = dto.Amount,
                Type = dto.Type,
                CreatedAt = DateTime.UtcNow
            };

            _context.Transactions.Add(transaction);
            await _context.SaveChangesAsync();
            return transaction;
        }

        public async Task<Transaction> UpdateTransactionAsync(Guid transactionId, UpdateTransactionDto dto)
        {
            var transaction = await _context.Transactions
                .Include(t => t.Person)
                .FirstOrDefaultAsync(t => t.Id == transactionId);

            if (transaction == null)
                throw new Exception("Transação não encontrada.");

            // Reaplica a mesma regra de negócio dos 18 anos ao editar
            if (transaction.Person != null && transaction.Person.IsUnderAge() && dto.Type == TransactionType.Income)
            {
                throw new InvalidOperationException("Menores de 18 anos não podem registrar receitas por não trabalharem.");
            }

            transaction.Description = dto.Description;
            transaction.Amount = dto.Amount;
            transaction.Type = dto.Type;

            await _context.SaveChangesAsync();
            return transaction;
        }

        public async Task DeleteTransactionAsync(Guid transactionId)
        {
            var transaction = await _context.Transactions.FirstOrDefaultAsync(t => t.Id == transactionId);
            if (transaction == null)
                throw new Exception("Transação não encontrada.");

            _context.Transactions.Remove(transaction);
            await _context.SaveChangesAsync();
        }

        public async Task<object> GetIndividualReportAsync(Guid personId, int? year = null, int? month = null)
        {
            var query = _context.Transactions.Where(t => t.PersonId == personId);

            if (year.HasValue && month.HasValue)
                query = query.Where(t => t.CreatedAt.Year == year.Value && t.CreatedAt.Month == month.Value);

            var transactions = await query.OrderByDescending(t => t.CreatedAt).ToListAsync();

            var totalIncome = transactions.Where(t => t.Type == TransactionType.Income).Sum(t => t.Amount);
            var totalExpense = transactions.Where(t => t.Type == TransactionType.Expense).Sum(t => t.Amount);

            return new
            {
                PersonId = personId,
                TotalIncome = totalIncome,
                TotalExpense = totalExpense,
                Balance = totalIncome - totalExpense,
                Transactions = transactions.Select(t => new { t.Id, t.Description, t.Amount, t.Type, t.CreatedAt })
            };
        }

        public async Task<object> GetFamilyReportAsync(Guid familyId, int? year = null, int? month = null)
        {
            // Busca todos os membros da família junto com suas transações
            var members = await _context.People
                .Where(p => p.FamilyId == familyId)
                .Include(p => p.Transactions)
                .ToListAsync();

            bool hasFilter = year.HasValue && month.HasValue;

            var membersReport = members.Select(p =>
            {
                var relevant = hasFilter
                    ? p.Transactions.Where(t => t.CreatedAt.Year == year!.Value && t.CreatedAt.Month == month!.Value)
                    : p.Transactions;

                return new
                {
                    PersonId = p.Id,
                    Name = p.Name,
                    TotalIncome = relevant.Where(t => t.Type == TransactionType.Income).Sum(t => t.Amount),
                    TotalExpense = relevant.Where(t => t.Type == TransactionType.Expense).Sum(t => t.Amount)
                };
            }).ToList();

            // As despesas fixas cadastradas pela família também entram no total de despesas,
            // para que assim que uma despesa fixa é cadastrada, ela já reflita nos Totais.
            var fixedExpensesQuery = _context.FixedExpenses.Where(f => f.FamilyId == familyId);
            if (hasFilter)
                fixedExpensesQuery = fixedExpensesQuery.Where(f => f.CreatedAt.Year == year!.Value && f.CreatedAt.Month == month!.Value);

            var totalFixedExpenses = await fixedExpensesQuery.SumAsync(f => f.Amount);

            var familyTotalIncome = membersReport.Sum(m => m.TotalIncome);
            var familyTotalExpense = membersReport.Sum(m => m.TotalExpense) + totalFixedExpenses;

            return new
            {
                FamilyId = familyId,
                Year = year,
                Month = month,
                TotalFamilyIncome = familyTotalIncome,
                TotalFixedExpenses = totalFixedExpenses,
                TotalFamilyExpense = familyTotalExpense,
                FamilyBalance = familyTotalIncome - familyTotalExpense,
                Members = membersReport
            };
        }

        // Lista os meses/anos em que existiu alguma movimentação (transação ou despesa fixa),
        // usada para popular o seletor da aba "Histórico".
        public async Task<IEnumerable<object>> GetAvailableMonthsAsync(Guid familyId)
        {
            var transactionDates = await _context.Transactions
                .Where(t => t.Person != null && t.Person.FamilyId == familyId)
                .Select(t => t.CreatedAt)
                .ToListAsync();

            var fixedExpenseDates = await _context.FixedExpenses
                .Where(f => f.FamilyId == familyId)
                .Select(f => f.CreatedAt)
                .ToListAsync();

            var months = transactionDates.Concat(fixedExpenseDates)
                .Select(d => new { d.Year, d.Month })
                .Distinct()
                .OrderByDescending(m => m.Year)
                .ThenByDescending(m => m.Month)
                .Select(m => (object)new { Year = m.Year, Month = m.Month })
                .ToList();

            return months;
        }

        public async Task<FixedExpense> CreateFixedExpenseAsync(CreateFixedExpenseDto dto)
        {
            var familyExists = await _context.Families.AnyAsync(f => f.Id == dto.FamilyId);
            if (!familyExists)
                throw new Exception("Família não encontrada.");

            var fixedExpense = new FixedExpense
            {
                FamilyId = dto.FamilyId,
                Description = dto.Description,
                Amount = dto.Amount
            };

            _context.FixedExpenses.Add(fixedExpense);
            await _context.SaveChangesAsync();
            return fixedExpense;
        }

        public async Task<IEnumerable<FixedExpense>> GetFixedExpensesByFamilyAsync(Guid familyId)
        {
            return await _context.FixedExpenses
                .Where(f => f.FamilyId == familyId)
                .OrderBy(f => f.IsPaid)
                .ThenByDescending(f => f.CreatedAt)
                .ToListAsync();
        }

        public async Task MarkFixedExpenseAsPaidAsync(Guid fixedExpenseId)
        {
            var expense = await _context.FixedExpenses.FirstOrDefaultAsync(f => f.Id == fixedExpenseId);
            if (expense == null)
                throw new Exception("Despesa fixa não encontrada.");

            expense.IsPaid = true;
            expense.PaidAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        // Só permite apagar uma despesa fixa depois de quitada, e sempre grava um log
        // atribuído ao "principal" (moderador) da família no momento da exclusão.
        public async Task DeleteFixedExpenseAsync(Guid fixedExpenseId)
        {
            var expense = await _context.FixedExpenses.FirstOrDefaultAsync(f => f.Id == fixedExpenseId);
            if (expense == null)
                throw new Exception("Despesa fixa não encontrada.");

            if (!expense.IsPaid)
                throw new InvalidOperationException("Só é possível apagar uma despesa fixa depois que ela for quitada.");

            var principal = await _context.People
                .FirstOrDefaultAsync(p => p.FamilyId == expense.FamilyId && p.IsPrincipal);

            if (principal == null)
                throw new InvalidOperationException(
                    "Esta família ainda não possui um principal/moderador definido. Defina uma pessoa como principal antes de apagar despesas fixas.");

            var log = new AuditLog
            {
                FamilyId = expense.FamilyId,
                PrincipalPersonId = principal.Id,
                PrincipalName = principal.Name,
                Action = AuditAction.FixedExpensePaidAndDeleted,
                Description = $"Despesa fixa \"{expense.Description}\" (R$ {expense.Amount:0.00}) foi quitada e removida."
            };

            _context.AuditLogs.Add(log);
            _context.FixedExpenses.Remove(expense);
            await _context.SaveChangesAsync();
        }

        public async Task<IEnumerable<AuditLog>> GetAuditLogsByFamilyAsync(Guid familyId)
        {
            return await _context.AuditLogs
                .Where(a => a.FamilyId == familyId)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();
        }
    }
}