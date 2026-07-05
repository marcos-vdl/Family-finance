using System;
using System.Collections.Generic;

namespace FamilyFinance.Domain.Entities
{
    public class Family
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Name { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;

        // Quantidade de familiares informada no momento do cadastro (apenas informativo).
        public int MemberCount { get; set; }

        // Login único da família (ex: "familia.dutra"). Não pode se repetir no banco.
        public string Username { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string PasswordSalt { get; set; } = string.Empty;

        // Toda família nasce com a senha padrão 123456 e precisa trocá-la no primeiro acesso.
        public bool MustChangePassword { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Propriedade de navegação para o Entity Framework (Uma família tem muitas pessoas)
        public ICollection<Person> Members { get; set; } = new List<Person>();

        // Despesas fixas cadastradas para a família (aluguel, internet, etc.)
        public ICollection<FixedExpense> FixedExpenses { get; set; } = new List<FixedExpense>();
    }
}