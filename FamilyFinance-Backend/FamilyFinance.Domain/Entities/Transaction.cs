using System;

namespace FamilyFinance.Domain.Entities
{
    public enum TransactionType
    {
        Income,  // Receita (Entrada)
        Expense  // Despesa (Saída)
    }

    public class Transaction
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid PersonId { get; set; } // ID da pessoa que fez a transação
        public string Description { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public TransactionType Type { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Propriedade de navegação
        public Person? Person { get; set; }
    }
}