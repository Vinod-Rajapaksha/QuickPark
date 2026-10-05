FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["QuickPark.API/QuickPark.API.csproj", "QuickPark.API/"]
RUN dotnet restore "QuickPark.API/QuickPark.API.csproj"

COPY . .
WORKDIR "/src/QuickPark.API"
RUN dotnet publish "QuickPark.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "QuickPark.API.dll"]
