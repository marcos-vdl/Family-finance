using System;

namespace FamilyFinance.Domain.Entities
{
    // Representa uma despesa fixa da família (aluguel, internet, plano de saúde, etc.)
    // Diferente de Transaction (que é ligada a uma Pessoa), a despesa fixa é ligada à Família como um todo.
    public class FixedExpense
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid FamilyId { get; set; }
        public string Description { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Marca se a despesa já foi quitada. Só pode ser deletada quando IsPaid = true.
        public bool IsPaid { get; set; } = false;
        public DateTime? PaidAt { get; set; }

        // Propriedade de navegação
        public Family? Family { get; set; }
    }
}
