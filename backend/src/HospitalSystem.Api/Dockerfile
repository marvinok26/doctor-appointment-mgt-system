FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY backend/src/HospitalSystem.Domain/HospitalSystem.Domain.csproj src/HospitalSystem.Domain/
COPY backend/src/HospitalSystem.Application/HospitalSystem.Application.csproj src/HospitalSystem.Application/
COPY backend/src/HospitalSystem.Infrastructure/HospitalSystem.Infrastructure.csproj src/HospitalSystem.Infrastructure/
COPY backend/src/HospitalSystem.Api/HospitalSystem.Api.csproj src/HospitalSystem.Api/
COPY backend/tests/HospitalSystem.Tests/HospitalSystem.Tests.csproj tests/HospitalSystem.Tests/
RUN dotnet restore src/HospitalSystem.Api/HospitalSystem.Api.csproj

COPY backend/src src
RUN dotnet publish src/HospitalSystem.Api/HospitalSystem.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app .

# Microsoft's .NET runtime images ship a non-root user pre-created at $APP_UID (no need to
# useradd our own — that collided with it, since recent images already claim UID 1000).
RUN chown -R $APP_UID /app
USER $APP_UID

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "HospitalSystem.Api.dll"]
