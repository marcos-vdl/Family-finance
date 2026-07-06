using FamilyFinance.Infrastructure.Data;
using FamilyFinance.Application.Interfaces; 
using FamilyFinance.Application.Services;   
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;

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
// Serializa enums (ex.: TransactionType) como string ("Income"/"Expense") em vez de número,
// que é o que o front-end espera ao comparar t.type === 'Income'.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

// 2.5 Libera o(s) front-end(s) para chamar a API.
// Em produção, defina a variável de ambiente ALLOWED_ORIGINS (separadas por vírgula,
// ex.: "https://meuapp.vercel.app,https://meudominio.com"). Em dev, cai no localhost:5173.
var allowedOrigins = (builder.Configuration["ALLOWED_ORIGINS"] ?? "http://localhost:5173")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendDev", policy =>
    {
        policy.WithOrigins(allowedOrigins)
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

// Necessário atrás do proxy do Render (ele termina o HTTPS e repassa por HTTP internamente).
app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
});

app.UseHttpsRedirection();

app.UseCors("FrontendDev");

// 5. Mapeia os Controllers
app.MapControllers();

// Render (e a maioria dos PaaS) injeta a porta pela variável de ambiente PORT.
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
app.Urls.Add($"http://0.0.0.0:{port}");

app.Run();