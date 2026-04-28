# Base runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview AS base
WORKDIR /app
EXPOSE 8080

# Build
FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copy các project (QUAN TRỌNG)
COPY ["PetOmiPlatform.API/PetOmiPlatform.API.csproj", "PetOmiPlatform.API/"]
COPY ["PetOmiPlatform.Application/PetOmiPlatform.Application.csproj", "PetOmiPlatform.Application/"]
COPY ["PetOmiPlatform.Domain/PetOmiPlatform.Domain.csproj", "PetOmiPlatform.Domain/"]
COPY ["PetOmiPlatform.Infrastructure/PetOmiPlatform.Infrastructure.csproj", "PetOmiPlatform.Infrastructure/"]

# Restore
RUN dotnet restore "PetOmiPlatform.API/PetOmiPlatform.API.csproj"

# Copy toàn bộ source
COPY . .

WORKDIR "/src/PetOmiPlatform.API"
RUN dotnet build "PetOmiPlatform.API.csproj" -c $BUILD_CONFIGURATION -o /app/build

# Publish
FROM build AS publish
RUN dotnet publish "PetOmiPlatform.API.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# Final
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "PetOmiPlatform.API.dll"]