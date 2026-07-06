# --- Etapa 1: build ---
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copia só os .csproj primeiro (cache de restore mais rápido em builds futuros)
COPY FamilyFinance.API/*.csproj FamilyFinance.API/
COPY FamilyFinance.Application/*.csproj FamilyFinance.Application/
COPY FamilyFinance.Domain/*.csproj FamilyFinance.Domain/
COPY FamilyFinance.Infrastructure/*.csproj FamilyFinance.Infrastructure/

RUN dotnet restore FamilyFinance.API/FamilyFinance.API.csproj

# Copia o resto do código e publica
COPY . .
RUN dotnet publish FamilyFinance.API/FamilyFinance.API.csproj -c Release -o /app --no-restore

# --- Etapa 2: runtime (imagem final, bem menor) ---
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app .

# O Render define a variável PORT em tempo de execução; o Program.cs já lê ela.
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080

ENTRYPOINT ["dotnet", "FamilyFinance.API.dll"]
