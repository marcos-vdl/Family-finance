using System;

namespace FamilyFinance.Domain.Entities
{
    public enum AuditAction
    {
        FixedExpensePaidAndDeleted,
        FixedExpenseDeleted,
        FixedExpenseCreated,
        PersonDeleted
    }

    // Registro de auditoria. Toda ação sensível (ex: apagar uma despesa fixa quitada)
    // gera um log atribuído ao "principal" (moderador) da família no momento da ação.
    public class AuditLog
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid FamilyId { get; set; }

        // Pessoa que é o "principal" da família e que fica registrada como responsável pela ação.
        public Guid PrincipalPersonId { get; set; }
        public string PrincipalName { get; set; } = string.Empty;

        public AuditAction Action { get; set; }
        public string Description { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
