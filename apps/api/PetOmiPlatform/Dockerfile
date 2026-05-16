# ============================================================
# Stage 1: Base runtime (chỉ chứa ASP.NET runtime, không có SDK)
# ============================================================
FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview AS base
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

# Chạy với non-root user để tăng bảo mật
# Official .NET images already define a non-root user via APP_UID.
USER $APP_UID

# ============================================================
# Stage 2: Restore dependencies (layer cache riêng biệt)
# ============================================================
FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS restore
WORKDIR /src

# Copy ONLY .csproj files trước → Docker cache layer này
# nếu source code thay đổi nhưng .csproj không đổi
COPY ["PetOmiPlatform.API/PetOmiPlatform.API.csproj",                 "PetOmiPlatform.API/"]
COPY ["PetOmiPlatform.Application/PetOmiPlatform.Application.csproj", "PetOmiPlatform.Application/"]
COPY ["PetOmiPlatform.Domain/PetOmiPlatform.Domain.csproj",           "PetOmiPlatform.Domain/"]
COPY ["PetOmiPlatform.Infrastructure/PetOmiPlatform.Infrastructure.csproj", "PetOmiPlatform.Infrastructure/"]

# Chi dinh runtime cu the, bo qua cac RID khac
RUN dotnet restore "PetOmiPlatform.API/PetOmiPlatform.API.csproj" \
    --runtime linux-x64

# ============================================================
# Stage 3: Build
# ============================================================
FROM restore AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

COPY . .

WORKDIR "/src/PetOmiPlatform.API"

# Da restore o stage tren, khong can restore lai
RUN dotnet build "PetOmiPlatform.API.csproj" \
    -c $BUILD_CONFIGURATION \
    --no-restore

# ============================================================
# Stage 4: Publish
# ============================================================
FROM build AS publish
ARG BUILD_CONFIGURATION=Release

# Da build o stage tren
# Giu false de startup nhanh hon single-file
RUN dotnet publish "PetOmiPlatform.API.csproj" \
    -c $BUILD_CONFIGURATION \
    --no-restore \
    --no-build \
    -o /app/publish \
    /p:UseAppHost=false \
    /p:PublishSingleFile=false

# ============================================================
# Stage 5: Final image (chỉ chứa runtime + published output)
# ============================================================
FROM base AS final
WORKDIR /app

COPY --from=publish --chown=$APP_UID:$APP_UID /app/publish .

ENTRYPOINT ["dotnet", "PetOmiPlatform.API.dll"]
