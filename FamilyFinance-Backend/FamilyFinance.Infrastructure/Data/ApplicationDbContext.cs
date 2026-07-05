using FamilyFinance.Domain.Entities;
using FamilyFinance.Application.Interfaces; 
using Microsoft.EntityFrameworkCore;

namespace FamilyFinance.Infrastructure.Data
{
    public class ApplicationDbContext : DbContext, IApplicationDbContext 
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Family> Families { get; set; }
        public DbSet<Person> People { get; set; }
        public DbSet<Transaction> Transactions { get; set; }
        public DbSet<FixedExpense> FixedExpenses { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configuração do Enum da Transação para salvar como String no banco
            modelBuilder.Entity<Transaction>()
                .Property(t => t.Type)
                .HasConversion<string>();

            // Configuração de precisão do valor monetário (Decimal)
            modelBuilder.Entity<Transaction>()
                .Property(t => t.Amount)
                .HasPrecision(18, 2);

            // Relacionamento 1 para Muitos: Família -> Membros
            modelBuilder.Entity<Person>()
                .HasOne(p => p.Family)
                .WithMany(f => f.Members)
                .HasForeignKey(p => p.FamilyId)
                .OnDelete(DeleteBehavior.Cascade);

            // Relacionamento 1 para Muitos: Pessoa -> Transações
            // Cascade: ao deletar uma pessoa, todas as suas transações são apagadas junto (regra do enunciado).
            modelBuilder.Entity<Transaction>()
                .HasOne(t => t.Person)
                .WithMany(p => p.Transactions)
                .HasForeignKey(t => t.PersonId)
                .OnDelete(DeleteBehavior.Cascade);

            // Precisão do valor monetário da despesa fixa
            modelBuilder.Entity<FixedExpense>()
                .Property(f => f.Amount)
                .HasPrecision(18, 2);

            // Relacionamento 1 para Muitos: Família -> Despesas fixas
            modelBuilder.Entity<FixedExpense>()
                .HasOne(f => f.Family)
                .WithMany(fam => fam.FixedExpenses)
                .HasForeignKey(f => f.FamilyId)
                .OnDelete(DeleteBehavior.Cascade);

            // Enum do log salvo como string, mais legível direto no banco
            modelBuilder.Entity<AuditLog>()
                .Property(a => a.Action)
                .HasConversion<string>();

            // Garante no banco que não existam duas famílias com o mesmo login.
            modelBuilder.Entity<Family>()
                .HasIndex(f => f.Username)
                .IsUnique();
        }
    }
}