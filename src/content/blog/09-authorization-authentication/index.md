---
title: "Authentication & Authorization Best Practices in ASP.NET Core"
summary: "Authentication confirms **who** a user is; authorization determines **what** they can do. Proper implementation prevents unauthorized access and data leaks. Below are best practices and patterns for secure ASP.NET Core applications:"
date: "Aug 01 2025"
draft: false
tags:
- .NET
- API
- C#
- JWT
---

## 1. JWT-Based Authentication

Use JSON Web Tokens (JWTs) to enable **stateless**, scalable authentication.

### ✅ Setup

**`appsettings.json`:**

```json
{
  "AuthConfiguration": {
    "Key": "your_secret_key_here_change_it_please",
    "Issuer": "DevTips",
    "Audience": "DevTips"
  }
}
```

**`Program.cs`:**

```csharp
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["AuthConfiguration:Issuer"],
        ValidAudience = builder.Configuration["AuthConfiguration:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["AuthConfiguration:Key"]!))
    };
});

builder.Services.AddAuthorization();
```

Register middleware:

```csharp
app.UseAuthentication();
app.UseAuthorization();
```

### 🔒 Token Security Best Practices

* **Short expiration** and use refresh tokens.
* **Strong secret key** (e.g. HMAC-SHA256 or SHA512).
* **Strict validation** of issuer, audience, lifetime, signing key. ([Anton Dev Tips][1])

---

## 2. Authenticate Users via ASP.NET Core Identity

Never store plain-text passwords. Use ASP.NET Identity with secure hashing.

### Login endpoint example:

```csharp
app.MapPost("/api/users/login", async (LoginUserRequest req, IOptions<AuthConfiguration> authOpt,
    UserManager<User> userMgr, SignInManager<User> signInMgr) =>
{
    var user = await userMgr.FindByEmailAsync(req.Email);
    if (user is null) return Results.NotFound("User not found");

    var result = await signInMgr.CheckPasswordSignInAsync(user, req.Password, false);
    if (!result.Succeeded) return Results.Unauthorized();

    var token = GenerateJwtToken(user, authOpt.Value);
    return Results.Ok(new { Token = token });
});
```

`GenerateJwtToken` should build and sign the JWT securely. ([Anton Dev Tips][1])

---

## 3. Role-Based Authorization (RBAC)

Define and manage user roles (e.g. **Admin**, **Author**) for straightforward access control.

```csharp
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("Admin", policy => policy.RequireRole("Admin"));
});
```

Use `[Authorize(Roles = "Admin")]` on controllers or endpoints to restrict access. ([Anton Dev Tips][1])

---

## 4. Claims-Based Authorization

Ideal when you need fine-grained access control beyond roles.

```csharp
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("users:create", policy => policy.RequireClaim("users:create", "true"));
    options.AddPolicy("users:update", policy => policy.RequireClaim("users:update"));
    options.AddPolicy("users:delete", policy => policy.RequireClaim("users:delete"));
});
```

Apply with `[Authorize(Policy = "users:update")]`. ([Anton Dev Tips][1])

---

## 5. Attribute-Based (ABAC) Authorization

Allows authorization based on dynamic aspects of the user and resource—e.g., authors can edit only their own posts.

### a) Define requirement & handler

```csharp
public class BookAuthorRequirement : IAuthorizationRequirement { }

public class BookAuthorHandler
    : AuthorizationHandler<BookAuthorRequirement, Author>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext ctx,
        BookAuthorRequirement req,
        Author resource)
    {
        var userId = ctx.User.FindFirst("userid")?.Value;
        if (userId != null && userId == resource.UserId)
            ctx.Succeed(req);
        return Task.CompletedTask;
    }
}
```

Register it:

```csharp
builder.Services.AddScoped<IAuthorizationHandler, BookAuthorHandler>();
```

### b) Use in Minimal API endpoint

```csharp
app.MapPut("/api/books/{id}", async (Guid id, UpdateBookRequest req,
    IBookRepository repo, IAuthorizationService auth, ClaimsPrincipal user) =>
{
    var book = await repo.GetByIdAsync(id);
    if (book is null) return Results.NotFound();

    var result = await auth.AuthorizeAsync(user, book.Author, new BookAuthorRequirement());
    if (!result.Succeeded) return Results.Forbid();

    // ... update logic
    return Results.NoContent();
}).RequireAuthorization("books:update");
```

This ensures only resource owners can modify them. ([Anton Dev Tips][1])

---

## ✅ Summary Table

| Strategy                   | Use Case                                     | Notes                                            |
| -------------------------- | -------------------------------------------- | ------------------------------------------------ |
| JWT Authentication         | Stateless token-based security               | Requires short-lived tokens + strong signing key |
| Role-Based Authorization   | Simple group-based access control            | Easy to maintain, less flexible                  |
| Claims-Based Authorization | Permission-specific access control           | More precise than roles                          |
| Attribute-Based Security   | Context-based decisions (resource ownership) | Ideal for dynamic, per-resource access logic     |

---

## 💡 Final Thoughts

* **Authenticate** with secure, validated JWTs and hashed credentials.
* **Authorize** using roles for simplicity, claims for fine permissions, or custom attribute rules when logic depends on resource or environment.
* Combine multiple strategies when necessary to meet security and domain-specific needs.

Would you like a personalized introduction, conclusion, or variants for MVC, Minimal APIs, or Blazor scenarios? Happy to adapt it further!

[1]: https://antondevtips.com/blog/authentication-and-authorization-best-practices-in-aspnetcore?utm_source=chatgpt.com "Authentication and Authorization Best Practices in ASP.NET Core"
