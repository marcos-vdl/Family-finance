using FamilyFinance.Infrastructure.Data;
using FamilyFinance.Application.Interfaces; 
using FamilyFinance.Application.Services;   
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// 1. Configura a conexão com o banco de dados PostgreSQL
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"),
        b => b.MigrationsAssembly("FamilyFinance.Infrastructure")));

// 1.5 Registra as Injeções de Dependência para a API enxergar suas regras de negócio
builder.Services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<ApplicationDbContext>());
builder.Services.AddScoped<IFinanceService, FinanceService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IAdminService, AdminService>();

// 2. Adiciona o suporte para Controllers
builder.Services.AddControllers();

// 2.5 Libera o front-end (React em localhost:5173) para chamar a API
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendDev", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// 3. Configura a documentação das APIs com Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// 4. Ativa o Swagger visual no ambiente de Desenvolvimento
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("FrontendDev");

// 5. Mapeia os Controllers
app.MapControllers();

app.Run();