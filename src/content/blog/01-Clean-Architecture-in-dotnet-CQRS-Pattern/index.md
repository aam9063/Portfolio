---
title: "Clean Architecture in dotnet CQRS Pattern"
summary: "CQRS (Command Query Responsibility Segregation) is a design pattern that separates read and write operations, making your system easier to scale, test, and maintain"
date: "Jun 23 2025"
draft: false
tags:
- .NET
- Clean Architecture
- CQRS
---

# 🐾 Implementing CQRS with MediatR in My Final Project "Dog Walk" (.NET)

Today I want to talk about the pattern I implemented in my Final Web Development Project, **"Dog Walk"** — the **CQRS pattern (Command Query Responsibility Segregation)** using **MediatR** in .NET.

## But... why follow this pattern?

- 📊 Clear separation between **read** and **write** operations  
- 🔄 Improved **scalability** and **maintainability**  
- 🎯 Better **performance** on specific operations  
- 🧪 Easier **testing and debugging**

## Key implementation highlights:

- Use of **MediatR** to mediate commands and queries  
- Specific **DTOs** for each operation  
- Independent **Handlers** with single responsibility  
- Integration with **Unit of Work** and **Repository Pattern**  
- Validation through **Behaviors**

---

## 🔧 Example: Command & CommandHandler

`CreateArticuloCommand.cs`  
```csharp
public class CreateArticuloCommand : IRequest<Guid>
{
    public CreateArticuloDto ArticuloDto { get; set; }
}
```

`CreateArticuloCommandHandler.cs`
```csharp
public class CreateArticuloCommandHandler : IRequestHandler<CreateArticuloCommand, Guid>
{
    private readonly IUnitOfWork _unitOfWork;

    public CreateArticuloCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Guid> Handle(CreateArticuloCommand request, CancellationToken cancellationToken)
    {
        var dto = request.ArticuloDto;

        var articulo = new Articulo(
            Guid.NewGuid(),
            dto.Nombre,
            dto.Descripcion,
            Dinero.Create(dto.Precio),
            dto.Stock,
            (CategoriaArticulo)dto.Categoria
        );

        if (dto.Imagenes != null && dto.Imagenes.Count > 0)
        {
            foreach (var urlImagen in dto.Imagenes)
            {
                var imagen = new ImagenArticulo(
                    Guid.NewGuid(),
                    articulo.Id,
                    urlImagen,
                    dto.Imagenes.IndexOf(urlImagen) == 0
                );

                articulo.AgregarImagen(imagen);
            }
        }

        await _unitOfWork.Articulos.AddAsync(articulo);
        await _unitOfWork.SaveChangesAsync();

        return articulo.Id;
    }
}
```

## 🔍 Example: Query & QueryHandler

`GetAllArticulosQuery.cs`
```csharp
public class GetAllArticulosQuery : IRequest<ResultadoPaginadoDto<ArticuloDto>>
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string SearchTerm { get; set; }
    public string SortBy { get; set; }
    public bool Ascending { get; set; } = true;
    public CategoriaArticulo? Categoria { get; set; }
}
```

`GetAllArticulosQueryHandler.cs`
```csharp
public class GetAllArticulosQueryHandler : IRequestHandler<GetAllArticulosQuery, ResultadoPaginadoDto<ArticuloDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetAllArticulosQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ResultadoPaginadoDto<ArticuloDto>> Handle(GetAllArticulosQuery request, CancellationToken cancellationToken)
    {
        Expression<Func<Articulo, bool>> predicate = a => true;

        if (!string.IsNullOrEmpty(request.SearchTerm))
        {
            var term = request.SearchTerm.ToLower();
            predicate = a =>
                EF.Functions.Like(a.Nombre.ToLower(), $"%{term}%") ||
                EF.Functions.Like(a.Descripcion.ToLower(), $"%{term}%");
        }

        if (request.Categoria.HasValue)
        {
            predicate = a => a.Categoria == request.Categoria.Value;
        }

        Expression<Func<Articulo, object>> orderBy = request.SortBy?.ToLower() switch
        {
            "precio" => a => a.Precio.Cantidad,
            "stock" => a => a.Stock,
            _ => a => a.Nombre
        };

        var (articulos, totalItems) = await _unitOfWork.Articulos.GetPagedAsync(
            predicate,
            orderBy,
            request.Ascending,
            request.PageNumber,
            request.PageSize
        );

        var articulosDto = articulos.Select(a => new ArticuloDto
        {
            Id = a.Id,
            Nombre = a.Nombre,
            Descripcion = a.Descripcion,
            Precio = a.Precio.Cantidad,
            Stock = a.Stock,
            Categoria = a.Categoria.ToString(),
            ImagenPrincipal = a.Imagenes?.FirstOrDefault()?.UrlImagen ?? string.Empty,
            FechaCreacion = a.CreadoEn
        }).ToList();

        return new ResultadoPaginadoDto<ArticuloDto>
        {
            Items = articulosDto,
            TotalItems = totalItems,
            TotalPaginas = (int)Math.Ceiling(totalItems / (double)request.PageSize),
            PaginaActual = request.PageNumber,
            ElementosPorPagina = request.PageSize
        };
    }
}
```
## ✅ Benefits achieved:
Cleaner, more maintainable code

Easier and more direct testing

Better performance on read operations

Greater scalability and flexibility

If you're building with .NET and want to scale your application with clean responsibilities, CQRS with MediatR is a solid and elegant solution.

🚀 Hope this helps you structure your architecture in a more professional and scalable way!


