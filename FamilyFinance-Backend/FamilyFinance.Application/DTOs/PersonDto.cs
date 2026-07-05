using System;

namespace FamilyFinance.Application.DTOs
{
    public class CreatePersonDto
    {
        public Guid FamilyId { get; set; }
        public string Name { get; set; } = string.Empty;
        public DateTime BirthDate { get; set; }

        // Se true, esta pessoa vira o "principal"/moderador da família
        // (qualquer outro principal existente na família perde o status automaticamente).
        public bool IsPrincipal { get; set; } = false;
    }

    // Enviado ao apagar uma pessoa: quem, dentre os membros da família, está executando a exclusão.
    // Isso fica registrado no log de auditoria junto com a data/hora.
    public class DeletePersonDto
    {
        public Guid DeletedByPersonId { get; set; }
    }
}