using System;
using FamilyFinance.Domain.Entities;

namespace FamilyFinance.Application.DTOs
{
    public class CreateTransactionDto
    {
        public Guid PersonId { get; set; }
        public string Description { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public TransactionType Type { get; set; } // 0 para Income (Receita), 1 para Expense (Despesa)
    }

    public class UpdateTransactionDto
    {
        public string Description { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public TransactionType Type { get; set; }
    }
}