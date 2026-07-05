using System;

namespace FamilyFinance.Application.DTOs
{
    public class CreateFixedExpenseDto
    {
        public Guid FamilyId { get; set; }
        public string Description { get; set; } = string.Empty;
        public decimal Amount { get; set; }
    }
}
