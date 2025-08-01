---
title: "How To Increase Performance of Web APIs in .NET"
summary: "Delivering high-performance Web APIs is a crucial part of modern backend development. Users expect speed, reliability, and scalability—and so do your stakeholders! In this post, I’ll walk you through proven strategies to increase the performance of your .NET APIs, with code samples and explanations for each tip. Most of these are valid for both ASP.NET Core MVC and Minimal APIs."
date: "Jul 30 2025"
draft: false
tags:
- .NET
- API
- C#
---

# 1. **Make Everything Asynchronous**

**Why?**
Blocking threads on I/O operations (like database, HTTP, or file calls) wastes server resources and limits scalability. Asynchronous programming allows your API to serve more requests simultaneously.

**How?**

* Always use `async`/`await` for I/O-bound operations.
* Make your entire call chain async—from controller to repository.

**Example:**

```csharp
[HttpGet("products")]
public async Task<IActionResult> GetProductsAsync() {
    var products = await _repository.GetAllAsync();
    return Ok(products);
}
```

**Tip:** Avoid mixing synchronous and asynchronous code (e.g., don’t use `.Result` or `.Wait()` in async code paths).

---

# 2. **Optimize Data Access**

Data access is often the main bottleneck in Web APIs. Use these strategies:

## a) **Use AsNoTracking for Read-Only Queries**

**Why?**
Entity Framework Core’s change tracking adds overhead. If you don’t need to update entities, disable tracking.

**Example:**

```csharp
var products = await _context.Products
    .AsNoTracking()
    .Where(p => p.IsActive)
    .ToListAsync();
```

## b) **Project Only What You Need**

**Why?**
Fetching only the required columns reduces network and memory usage.

**Example:**

```csharp
var productDtos = await _context.Products
    .AsNoTracking()
    .Select(p => new ProductDto {
        Id = p.Id,
        Name = p.Name,
        Price = p.Price
    })
    .ToListAsync();
```

## c) **Use Dapper for Simple, High-Performance Queries**

For extremely high-throughput endpoints or reports, Dapper is a great alternative.

**Example:**

```csharp
var sql = "SELECT Id, Name, Price FROM Products WHERE IsActive = 1";
var products = await connection.QueryAsync<ProductDto>(sql);
```

## d) **Add Database Indexes**

Profile your queries and ensure your most common filters and sorts have appropriate indexes.

---

# 3. **Reduce Payload Size (Filter, Paginate, Shape Responses)**

APIs shouldn’t send unnecessary data.

**Why?**
Large payloads slow down both the client and the server (more memory, more network bandwidth).

**How?**

* **Pagination:** Return results in pages.
* **Filtering:** Allow clients to specify criteria.
* **Shaping:** Only return fields the client needs (DTOs).

**Example:**

```csharp
[HttpGet]
public async Task<IActionResult> GetProducts([FromQuery]int page = 1, [FromQuery]int pageSize = 20) {
    var products = await _context.Products
        .AsNoTracking()
        .OrderBy(p => p.Name)
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .Select(p => new ProductListItemDto {
            Id = p.Id,
            Name = p.Name
        })
        .ToListAsync();

    return Ok(products);
}
```

---

# 4. **Minimize Serialization Overhead**

Serialization can become a bottleneck, especially for large responses.

**How?**

* Use `System.Text.Json` instead of `Newtonsoft.Json` for better performance (it’s the default in modern .NET).
* Configure serialization options to skip nulls, use camelCase, and ignore unnecessary properties.

**Example:**

```csharp
builder.Services
    .AddControllers()
    .AddJsonOptions(opts => {
        opts.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        opts.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });
```

**Advanced:**
For very large objects or high-traffic endpoints, consider compressing JSON further or switching to more compact formats like MessagePack.

---

# 5. **Leverage Caching**

Caching is often the single most effective way to speed up Web APIs, especially for data that doesn’t change with every request.

## a) **In-Memory Cache**

```csharp
services.AddMemoryCache();
```

```csharp
var product = await _cache.GetOrCreateAsync($"product_{id}", async entry => {
    entry.SlidingExpiration = TimeSpan.FromMinutes(5);
    return await _context.Products.FindAsync(id);
});
```

## b) **Distributed Cache (Redis, SQL Server)**

Use this for load-balanced or cloud environments.

```csharp
services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = "localhost:6379";
});
```

## c) **Response Caching**

Cache the entire HTTP response for certain endpoints.

```csharp
[ResponseCache(Duration = 60, Location = ResponseCacheLocation.Any)]
[HttpGet("products")]
public IActionResult GetCachedProducts() {
    // Return products
}
```

## d) **OutputCache (ASP.NET Core 7+)**

For flexible caching based on routes, headers, or custom policies.

---

# 6. **Enable Response Compression**

Reducing the size of HTTP responses can dramatically improve client-perceived speed, especially over slow networks.

**How?**

```csharp
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
});
app.UseResponseCompression();
```

This enables Brotli or Gzip compression by default.

---

# 7. **Optimize Your Middleware Pipeline**

The order of middlewares matters!

* Place response compression and static files at the top.
* Place authentication/authorization before routing.
* Custom middlewares (logging, error handling) should be early to catch more issues.

**Example:**

```csharp
app.UseResponseCompression();
app.UseStaticFiles();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.UseEndpoints(endpoints => {
    endpoints.MapControllers();
});
```

---

# 8. **Use HTTP/2 or HTTP/3**

**Why?**
HTTP/2 and HTTP/3 protocols support multiplexing, header compression, and better connection reuse—leading to faster API calls.

**How?**
Kestrel supports both. In `appsettings.json`:

```json
"Kestrel": {
  "Endpoints": {
    "Https": {
      "Protocols": "Http1AndHttp2"
    }
  }
}
```

Or for HTTP/3 (from .NET 7+):

```json
"Kestrel": {
  "Endpoints": {
    "Https": {
      "Protocols": "Http1AndHttp2AndHttp3"
    }
  }
}
```

---

# 9. **Serve Static Assets via CDN**

If your API serves images, JS, or other assets, move them to a CDN.
This reduces the load on your API and ensures fast global delivery.

**Example:**

* Use Azure Blob Storage with CDN, Amazon S3 + CloudFront, or a third-party like Cloudflare.

---

# 10. **Implement Rate Limiting and Throttling**

**Why?**
To protect your API from abuse, ensure fair usage, and prevent spikes from taking your service down.

**How?**
Use libraries like [AspNetCoreRateLimit](https://github.com/stefanprodan/AspNetCoreRateLimit):

```csharp
services.AddInMemoryRateLimiting();
app.UseIpRateLimiting();
```

Configure rules in `appsettings.json`.

---

# 11. **Switch to Minimal APIs (Where Appropriate)**

Minimal APIs offer:

* Lower overhead (no controller/middleware bloat)
* Direct route-to-code mapping
* Measurably higher throughput and lower memory use (especially on .NET 8/9)

**Example:**

```csharp
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapGet("/ping", () => "pong");
app.MapGet("/products/{id}", async (int id, MyDbContext db) =>
    await db.Products.FindAsync(id)
);

app.Run();
```

**When to Use?**

* Microservices
* Lightweight internal APIs
* Endpoints that don’t need the full MVC feature set

---

# 12. **Expose GraphQL Endpoints for Flexible Data Queries**

GraphQL allows clients to request exactly the data they need, reducing over-fetching and under-fetching.

**How?**

* Use libraries like [HotChocolate](https://chillicream.com/docs/hotchocolate).

**Example:**

```csharp
builder.Services
    .AddGraphQLServer()
    .AddQueryType<Query>();

public class Query {
    public IQueryable<Product> GetProducts([Service] MyDbContext db)
        => db.Products;
}
```

---

# 13. **Profile and Benchmark Your API**

Never optimize blindly! Use:

* [BenchmarkDotNet](https://benchmarkdotnet.org/)
* [dotTrace](https://www.jetbrains.com/dottrace/)
* [Application Insights](https://docs.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview)
* [k6](https://k6.io/) for load testing

**Tip:**
Measure *before and after* every change to ensure you’re improving what actually matters.

---

# 14. **Miscellaneous Quick Wins**

* **Avoid “N+1” queries** (use `.Include()` for related data in EF Core)
* **Return 204 NoContent** when appropriate instead of empty lists
* **Reuse HttpClient** instances (don’t create per request)
* **Set connection pooling for databases**
* **Profile with tools** like MiniProfiler or EF Core logging

---

# **Conclusion**

Optimizing .NET Web API performance isn’t about a single trick—it’s about applying best practices at every layer: async I/O, data access, payload shaping, caching, and transport. Measure, tweak, and repeat.
By following these strategies, your APIs will be faster, more scalable, and more enjoyable for your users.

