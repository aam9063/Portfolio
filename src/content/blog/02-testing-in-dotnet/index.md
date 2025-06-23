---
title: "Building a Comprehensive Testing Strategy for .NET Backend Applications"
summary: "A deep dive into implementing a multi-layered testing approach with Docker containers, Clean Architecture validation, and CQRS pattern testing"
date: "Jun 24 2025"
draft: false
tags:
- .NET
- Testing
- Docker
---
## Introduction

When developing my DogWalk backend application - a platform for dog walking services - I invested significant time in creating a robust testing strategy. This decision proved to be one of the most valuable technical choices of the project. In this post, I'll share the comprehensive testing approach I implemented and the lessons learned along the way.

## The Testing Pyramid in Practice

I structured my testing strategy following the testing pyramid principle, implementing five distinct layers of tests, each serving a specific purpose in ensuring code quality and system reliability.

### 1. Domain Unit Tests

The foundation of my testing strategy focuses on validating pure business logic without any external dependencies.

```csharp
public class UserTests
{
    [Fact]
    public void CambiarPassword_ConPasswordCorrecta_DebeCambiarPassword()
    {
        // Arrange
        var usuario = new Usuario(Guid.NewGuid(), null, "John", "Doe", null, 
            Email.Create("john@test.com"), Password.Create("Test1234"), null);
        var nuevaPassword = "NewPassword123";

        // Act
        usuario.CambiarPassword("Test1234", nuevaPassword);

        // Assert
        Assert.True(usuario.Password.Verify(nuevaPassword));
    }

    [Fact]
    public void AgregarPerro_DebeAgregarPerroALaLista()
    {
        // Arrange
        var usuario = new Usuario(Guid.NewGuid(), null, "John", "Doe", null,
            Email.Create("john@test.com"), Password.Create("Test1234"), null);
        var perro = new Perro(Guid.NewGuid(), usuario.Id, "Buddy", "Labrador", 3);

        // Act
        usuario.AgregarPerro(perro);

        // Assert
        Assert.Single(usuario.Perros);
        Assert.Contains(perro, usuario.Perros);
    }
}
```

These tests execute in milliseconds and provide immediate feedback about core business rules. They validate that domain entities maintain their invariants and business logic remains consistent.

### 2. Application Unit Tests

The second layer tests the CQRS command and query handlers using MediatR, focusing on application logic coordination.

```csharp
public class CreateArticuloTests
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IArticuloRepository _articuloRepository;
    private readonly CreateArticuloCommandHandler _handler;

    public CreateArticuloTests()
    {
        _articuloRepository = Substitute.For<IArticuloRepository>();
        _unitOfWork = Substitute.For<IUnitOfWork>();
        _unitOfWork.Articulos.Returns(_articuloRepository);
        _handler = new CreateArticuloCommandHandler(_unitOfWork);
    }

    [Fact]
    public async Task Handle_ArticuloConImagenes_DebeCrearArticuloConImagenesCorrectamente()
    {
        // Arrange
        var command = new CreateArticuloCommand
        {
            ArticuloDto = new CreateArticuloDto
            {
                Nombre = "Dog Collar",
                Descripcion = "Adjustable collar",
                Precio = 19.99m,
                Stock = 10,
                Categoria = (int)CategoriaArticulo.Accesorio,
                Imagenes = new List<string> { "image1.jpg", "image2.jpg" }
            }
        };

        Articulo capturedArticulo = null;
        _articuloRepository
            .When(x => x.AddAsync(Arg.Any<Articulo>()))
            .Do(x => capturedArticulo = x.Arg<Articulo>());

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotEqual(Guid.Empty, result);
        await _articuloRepository.Received(1).AddAsync(Arg.Any<Articulo>());
        await _unitOfWork.Received(1).SaveChangesAsync();
        
        Assert.NotNull(capturedArticulo);
        Assert.Equal(2, capturedArticulo.Imagenes.Count);
        Assert.True(capturedArticulo.Imagenes.First().EsPrincipal); // First image is primary
        Assert.False(capturedArticulo.Imagenes.Last().EsPrincipal);
    }
}
```

Using NSubstitute for mocking, these tests validate that application services coordinate correctly without touching external dependencies like databases or file systems.

### 3. Integration Tests

This layer tests the integration between application and infrastructure layers using real database connections through Docker containers.

```csharp
public class BuscarPaseadores : BaseIntegrationTest
{
    public BuscarPaseadores(IntegrationTestWebAppFactory factory) : base(factory)
    {
    }

    [Fact]
    public async Task BuscarPaseadores_ShouldReturnPaseadores()
    {
        // Arrange
        var paseador = new Paseador(
            Guid.NewGuid(),
            Dni.Create("12345678A"),
            "Test",
            "Walker",
            Direccion.Create("Test Street", "Test City", "12345"),
            Email.Create("test@test.com"),
            Password.Create("Test1234!"),
            Coordenadas.Create(40.416775, -3.703790)
        );

        await dbContext.Paseadores.AddAsync(paseador);
        await dbContext.SaveChangesAsync();

        var query = new BuscarPaseadoresQuery();

        // Act
        var result = await Sender.Send(query);

        // Assert
        Assert.NotNull(result);
        Assert.NotEmpty(result.Items);
    }
}
```

The infrastructure setup for integration tests uses Testcontainers:

```csharp
public class IntegrationTestWebAppFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly MsSqlContainer _dbContainer = new MsSqlBuilder()
        .WithImage("mcr.microsoft.com/mssql/server:2022-latest")
        .WithName("DogWalk")
        .WithPassword(Environment.GetEnvironmentVariable("TEST_SQL_PASSWORD"))
        .WithPortBinding(1433)
        .Build();

    public async Task InitializeAsync()
    {
        await _dbContainer.StartAsync();
    }

    public new async Task DisposeAsync()
    {
        await _dbContainer.StopAsync();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureTestServices(services => {
            services.RemoveAll(typeof(DbContextOptions<DogWalkDbContext>));
            
            var connectionString = $"{_dbContainer.GetConnectionString()};Database=DogWalk_Tests";
            
            services.AddDbContext<DogWalkDbContext>(options => {
                options.UseSqlServer(connectionString);
                options.ConfigureWarnings(warnings => 
                    warnings.Ignore(RelationalEventId.PendingModelChangesWarning));
            });

            var sp = services.BuildServiceProvider();
            using (var scope = sp.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<DogWalkDbContext>();
                db.Database.Migrate();
            }
        });
    }
}
```

### 4. Functional API Tests

These tests validate complete HTTP endpoints, including authentication, serialization, and end-to-end flows.

```csharp
public class GetUserSessionTest : BaseFunctionalTest
{
    public GetUserSessionTest(FunctionalTestWebAppFactory factory) : base(factory)
    {
    }

    [Fact]
    public async Task GetUserSession_ReturnsUserSession()
    {
        // Arrange - Register user
        await HttpClient.PostAsJsonAsync("/api/Usuario/register", UserData.RegisterUserRquestTest);

        // Act - Login and get token
        var loginResponse = await HttpClient.PostAsJsonAsync("/api/Auth/login", new
        {
            Email = UserData.RegisterUserRquestTest.Email,
            Password = UserData.RegisterUserRquestTest.Password
        });
        var loginResult = await loginResponse.Content.ReadFromJsonAsync<AuthResponseDto>();

        // Configure authorization header
        HttpClient.DefaultRequestHeaders.Authorization = 
            new AuthenticationHeaderValue("Bearer", loginResult?.Token);

        // Act - Get user profile
        var response = await HttpClient.GetAsync("/api/Usuario/profile");

        // Assert
        Assert.True(response.IsSuccessStatusCode);
        var userSession = await response.Content.ReadFromJsonAsync<UserSessionDto>();
        Assert.NotNull(userSession);
        Assert.Equal(UserData.RegisterUserRquestTest.Email, userSession.Email);
    }
}
```

### 5. Architecture Tests

The final layer ensures architectural integrity using NetArchTest to validate Clean Architecture principles.

```csharp
public class LayerTests : BaseTest
{
    [Fact]
    public void Domain_ShouldHaveNotDependency_ApplicationLayer()
    {
        var result = Types.InAssembly(DomainAssembly)
            .Should()
            .NotHaveDependencyOn(ApplicationAssembly.GetName().Name)
            .GetResult();
        
        result.IsSuccessful.Should().BeTrue();
    }

    [Fact]
    public void ApplicationLayer_ShouldHaveNotDependency_InfrastructureLayer()
    {
        var result = Types.InAssembly(ApplicationAssembly)
            .Should()
            .NotHaveDependencyOn(InfrastructureAssembly.GetName().Name)
            .GetResult();
        
        result.IsSuccessful.Should().BeTrue();
    }
}

public class DomainTest : BaseTest
{
    [Fact]
    public void Entities_ShouldHave_PrivateConstructorsNoParameters()
    {
        IEnumerable<Type> entityTypes = Types.InAssembly(DomainAssembly)
            .That()
            .Inherit(typeof(EntityBase))
            .GetTypes();

        var errorEntities = new List<Type>();

        foreach(var entityType in entityTypes)
        {
            ConstructorInfo[] constructors = entityType.GetConstructors(
                BindingFlags.NonPublic | BindingFlags.Instance
            );

            if(!constructors.Any(c => c.IsPrivate && c.GetParameters().Length == 0))
            {
                errorEntities.Add(entityType);
            } 
        }

        errorEntities.Should().BeEmpty();
    }
}
```

## The Testcontainers Revolution

One of the most impactful decisions was implementing Testcontainers for integration and functional tests. Instead of using in-memory databases or shared test databases, each test runs against a real SQL Server instance in a Docker container.

### Why Testcontainers?

1. **Complete Isolation**: Each test gets a fresh database instance
2. **Consistency**: Same database engine across local, CI/CD, and production
3. **Realistic Testing**: Tests run against actual SQL Server, not SQLite or in-memory providers
4. **Automatic Cleanup**: Containers are created and destroyed automatically
5. **No Shared State**: Eliminates flaky tests due to data contamination

### Docker Compose Setup

For development and production environments, I use Docker Compose:

```yaml
services:
  web-api:
    image: ${DOCKER_REGISTRY-}webapi
    container_name: web-api
    build:
      context: .
      dockerfile: DogWalk_API/Dockerfile
    ports:
      - 5208:8080
      - 5209:8081
    depends_on:
      - sqlserver
    environment:
      - ConnectionStrings__DefaultConnection=Server=sqlserver;Database=DogWalk;User Id=sa;Password=${SQL_PASSWORD};TrustServerCertificate=True

  sqlserver:
    image: mcr.microsoft.com/mssql/server:2022-latest
    container_name: sqlserver
    environment:
      - ACCEPT_EULA=Y
      - SA_PASSWORD=${SQL_PASSWORD}
      - MSSQL_PID=Express
    volumes:
      - ./.containers/sqlserver:/var/opt/mssql/data
    ports:
      - 1433:1433
    healthcheck:
      test: ["CMD", "sqlcmd", "-S", "localhost", "-U", "sa", "-P", "${SQL_PASSWORD}", "-Q", "SELECT 1"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
```

## Technology Stack

The testing infrastructure relies on several key packages:

```xml
<PackageReference Include="xunit" Version="2.9.0" />
<PackageReference Include="xunit.runner.visualstudio" Version="2.8.2" />
<PackageReference Include="FluentAssertions" Version="8.0.0" />
<PackageReference Include="NSubstitute" Version="5.3.0" />
<PackageReference Include="Testcontainers.MsSql" Version="4.0.0" />
<PackageReference Include="Microsoft.AspNetCore.Mvc.Testing" Version="8.0.14" />
<PackageReference Include="coverlet.collector" Version="6.0.4" />
```

## Results and Benefits

### Measurable Outcomes

- **95% code coverage** on critical business components
- **Sub-second feedback** from unit tests
- **Immediate detection** of integration issues
- **Zero database-related bugs** in production
- **Confident refactoring** capabilities

### Strategic Distribution

Following the testing pyramid, I maintained:
- **70% Unit Tests**: Fast feedback, low cost
- **20% Integration Tests**: Component confidence
- **10% Functional Tests**: End-to-end validation

This distribution ensures rapid test execution while maintaining comprehensive coverage.

### CI/CD Integration

The entire test suite integrates seamlessly with GitHub Actions, providing automated validation on every commit and pull request. The Docker-based approach ensures consistent behavior across all environments.

## Lessons Learned

### What Worked Well

1. **Testcontainers eliminated environment issues** - No more "works on my machine" problems
2. **Architecture tests prevented technical debt** - Automatic validation of design principles
3. **CQRS pattern facilitated granular testing** - Clear separation of concerns made testing easier
4. **Real database testing caught integration issues** - Problems that mocks would never reveal

### What I'd Do Differently

1. **Start with architecture tests earlier** - They're easier to implement from the beginning
2. **Invest more in test data builders** - Simplify test setup and maintenance
3. **Implement performance testing sooner** - Catch performance regressions early

## Conclusion

Building a comprehensive testing strategy requires upfront investment, but the returns are immediate and compound over time. The combination of multiple testing layers, Docker containers for realistic testing environments, and architectural validation creates a robust foundation for confident development and deployment.

The key is understanding that different types of tests serve different purposes. Unit tests provide rapid feedback, integration tests build confidence in component interaction, functional tests validate user scenarios, and architecture tests maintain design integrity.

This approach has enabled me to develop features rapidly while maintaining high quality standards, knowing that any breaking changes will be caught automatically at the appropriate testing level.

---

*The complete source code and testing examples are available in my [DogWalk Backend repository](https://github.com/aam9063/DogWalk/tree/master/DogWalk-Backend).*