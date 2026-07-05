using System;
using System.Collections.Generic;

namespace FamilyFinance.Domain.Entities
{
    public class Person
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid FamilyId { get; set; }
        public string Name { get; set; } = string.Empty;
        public DateTime BirthDate { get; set; }

        // Indica se esta pessoa é o "principal"/moderador da família.
        // Só deve existir uma pessoa com IsPrincipal = true por família (regra garantida no FinanceService).
        public bool IsPrincipal { get; set; } = false;

        // Propriedades de navegação
        public Family? Family { get; set; }
        public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();

        // Método auxiliar para validar a regra de maioridade
        public bool IsUnderAge()
        {
            var today = DateTime.Today;
            var age = today.Year - BirthDate.Year;
            
            // Ajusta se a pessoa ainda não fez aniversário no ano corrente
            if (BirthDate.Date > today.AddYears(-age)) 
                age--;

            return age < 18;
        }
    }
}