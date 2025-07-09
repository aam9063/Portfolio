---
title: "Implementing Stripe Payments in a .NET Core E-commerce Application"
summary: "In this post, we'll explore how to integrate Stripe payments into a .NET Core e-commerce application. We'll look at a real-world implementation that handles payment processing, webhooks, and session management."
date: "Jul 09 2025"
draft: false
tags:
- .NET
- C#
- Stripe
---

## Setting Up Stripe Integration

First, we need to set up the Stripe configuration and service. The project uses the `Stripe.net` NuGet package (version 48.0.2) for integration.

```csharp:DogWalk_Infrastructure/Services/Stripe/StripeOptions.cs
public class StripeOptions
{
    public string SecretKey { get; set; } = string.Empty;
    public string PublishableKey { get; set; } = string.Empty;
    public string WebhookSecret { get; set; } = string.Empty;
    public string Currency { get; set; } = "eur";
}
```

The configuration is registered in the dependency injection container:

```csharp
services.Configure<StripeOptions>(configuration.GetSection("Stripe"));
services.AddScoped<StripeService>();
```

## Core Stripe Service Implementation

The `StripeService` class handles all Stripe-related operations:

```csharp
public class StripeService
{
    private readonly string _apiKey;
    private readonly string _webhookSecret;
    private readonly ILogger<StripeService> _logger;

    public StripeService(IConfiguration configuration, ILogger<StripeService> logger)
    {
        _apiKey = configuration["Stripe:SecretKey"] ?? throw new ArgumentNullException("Stripe:SecretKey");
        _webhookSecret = configuration["Stripe:WebhookSecret"] ?? throw new ArgumentNullException("Stripe:WebhookSecret");
        _logger = logger;
        StripeConfiguration.ApiKey = _apiKey;
    }

    public async Task<string> CreateCheckoutSession(Factura factura, string successUrl, string cancelUrl)
    {
        var options = new SessionCreateOptions
        {
            PaymentMethodTypes = new List<string> { "card" },
            LineItems = new List<SessionLineItemOptions>(),
            Mode = "payment",
            SuccessUrl = successUrl,
            CancelUrl = cancelUrl,
            Metadata = new Dictionary<string, string>
            {
                { "FacturaId", factura.Id.ToString() }
            }
        };

        // Add line items from invoice
        foreach (var detalle in factura.Detalles)
        {
            var lineItem = new SessionLineItemOptions
            {
                PriceData = new SessionLineItemPriceDataOptions
                {
                    Currency = "eur",
                    UnitAmount = (long)(detalle.PrecioUnitario.Cantidad * 100),
                    ProductData = new SessionLineItemPriceDataProductDataOptions
                    {
                        Name = detalle.Articulo?.Nombre ?? "Producto",
                        Description = detalle.Articulo?.Descripcion ?? "Sin descripción"
                    }
                },
                Quantity = detalle.Cantidad
            };
            options.LineItems.Add(lineItem);
        }

        var service = new SessionService();
        var session = await service.CreateAsync(options);
        return session.Url;
    }
}
```

## Processing Payments

The checkout process is handled by the `CheckoutController`:

```csharp
[ApiController]
[Route("api/[controller]")]
public class CheckoutController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly StripeService _stripeService;
    private readonly ILogger<CheckoutController> _logger;

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<CheckoutResponseDto>> ProcesarCheckout()
    {
        try
        {
            // Get user and cart
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            var usuario = await _unitOfWork.Usuarios.GetByIdWithCarritoAsync(userId);
            
            // Create invoice
            var factura = new Factura(Guid.NewGuid(), usuario.Id, MetodoPago.Stripe);
            
            // Process cart items
            foreach (var item in usuario.Carrito)
            {
                var detalle = new DetalleFactura(
                    Guid.NewGuid(),
                    factura.Id,
                    item.ArticuloId,
                    item.Cantidad,
                    item.PrecioUnitario
                );
                factura.AgregarDetalle(detalle);
            }

            // Create Stripe session
            var successUrl = "http://localhost:5173/checkout/success?session_id={CHECKOUT_SESSION_ID}";
            var cancelUrl = "http://localhost:5173/checkout/cancel";
            
            var stripeSessionUrl = await _stripeService.CreateCheckoutSession(
                factura,
                successUrl,
                cancelUrl
            );

            // Save invoice and clear cart
            await _unitOfWork.Facturas.AddAsync(factura);
            usuario.VaciarCarrito();
            await _unitOfWork.SaveChangesAsync();

            return Ok(new CheckoutResponseDto
            {
                Success = true,
                RedirectUrl = stripeSessionUrl,
                FacturaId = factura.Id
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing checkout");
            return BadRequest(new CheckoutResponseDto
            {
                Success = false,
                ErrorMessage = ex.Message
            });
        }
    }
}
```

## Handling Stripe Webhooks

The application implements webhook handling to process payment events:

```csharp
[Route("api/stripe-webhook")]
[ApiController]
public class StripeFinalController : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> HandleStripeEvent()
    {
        var stripeService = GetStripeService(HttpContext);
        var unitOfWork = GetUnitOfWork(HttpContext);
        
        // Read and verify webhook payload
        Request.EnableBuffering();
        using var reader = new StreamReader(Request.Body, leaveOpen: true);
        var json = await reader.ReadToEndAsync();
        var signatureHeader = Request.Headers["Stripe-Signature"];
        
        var stripeEvent = stripeService.ProcessWebhookEvent(json, signatureHeader);
        
        // Handle successful checkout
        if (stripeEvent.Type == "checkout.session.completed")
        {
            var session = stripeEvent.Data.Object as Stripe.Checkout.Session;
            if (session?.Metadata?.TryGetValue("FacturaId", out string facturaIdStr) == true)
            {
                var facturaId = Guid.Parse(facturaIdStr);
                var factura = await unitOfWork.Facturas.GetByIdAsync(facturaId);
                
                if (factura != null)
                {
                    // Update invoice status
                    await unitOfWork.SaveChangesAsync();
                }
            }
        }
        
        return Ok(new { received = true });
    }
}
```

## Key Features of the Implementation

1. **Secure Configuration**: Stripe keys and secrets are managed through configuration settings
2. **Session Management**: Creates and manages Stripe checkout sessions
3. **Cart Processing**: Converts cart items to Stripe line items
4. **Webhook Handling**: Processes Stripe events securely with signature verification
5. **Error Handling**: Comprehensive error handling and logging
6. **Authentication**: Secured endpoints with JWT authentication
7. **Database Integration**: Maintains order/invoice records in the application database

## Best Practices Implemented

1. **Security**:
   - Webhook signature verification
   - Secure key management
   - Authentication for checkout endpoints

2. **Error Handling**:
   - Comprehensive try-catch blocks
   - Detailed error logging
   - User-friendly error responses

3. **Database Operations**:
   - Transactional processing
   - Proper cart clearing after checkout
   - Invoice status tracking

4. **Code Organization**:
   - Separation of concerns
   - Dependency injection
   - Service-based architecture

## Conclusion

This implementation provides a robust foundation for processing payments with Stripe in a .NET Core application. It handles the complete payment flow from checkout to webhook processing, while maintaining proper security measures and following best practices.

Remember to:

- Configure your Stripe keys in the application settings
- Set up webhook endpoints in your Stripe dashboard
- Test the implementation thoroughly in Stripe's test mode before going live
- Monitor webhook events for failed payments or other issues

The complete implementation can be extended with additional features like refunds, subscription handling, or multiple payment methods as needed.