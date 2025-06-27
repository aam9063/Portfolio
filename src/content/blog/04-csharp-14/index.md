---
title: "What's New in C# 14 – Features, Examples and Use Cases"
summary: "C# 14 introduces several long-awaited features that aim to improve productivity, expressiveness, and performance. From extension properties and conditional assignments to more powerful lambdas and user-defined compound operators, this release continues the evolution of the language."
date: "Jun 27 2025"
draft: false
tags:
- .NET
- C#
---

In this post, we’ll walk through each major feature with explanations, code examples, and practical use cases.

> 📌 Note: C# 14 is part of .NET 10 and currently in preview. You'll need the latest .NET SDK and Visual Studio 2022 to try it out.

## Extension Members

C# 14 allows you to define not just extension methods, but also **extension properties**, **indexers**, and even **static extension members** grouped together in a logical block.

```csharp
public static class EnumerableExtensions
{
    extension<T>(IEnumerable<T> source)
    {
        public bool IsEmpty => !source.Any();
        public T this[int index] => source.Skip(index).First();
    }

    extension<T>(IEnumerable<T>)
    {
        public static IEnumerable<T> EmptySequence => Enumerable.Empty<T>();
    }
}
````

🔹 Use case: Add custom logic to existing types with better encapsulation.

## `field` Keyword for Auto-Properties

The new contextual keyword `field` gives you access to the compiler-generated backing field of an auto-property, reducing boilerplate.

```csharp
public string Message
{
    get;
    set => field = value ?? throw new ArgumentNullException(nameof(value));
}
```

🔹 Use case: Add validation without manually creating backing fields.

## Implicit Span Conversions

Now you can implicitly convert from arrays to `Span<T>` and `ReadOnlySpan<T>`, and from `Span<T>` to `ReadOnlySpan<T>`.

```csharp
int[] data = { 1, 2, 3 };
Span<int> span = data;
ReadOnlySpan<int> readOnlySpan = span;
```

🔹 Use case: Write high-performance memory-safe code without unnecessary `.AsSpan()` calls.

## `nameof` with Unbound Generic Types

C# 14 allows using `nameof` on unbound generic types:

```csharp
Console.WriteLine(nameof(List<>));        // "List"
Console.WriteLine(nameof(Dictionary<,>)); // "Dictionary"
```

🔹 Use case: Better logging and exception messages referencing generic types.

## Simplified Lambdas with Modifiers

Now you can use modifiers like `ref`, `out`, and `in` in inferred lambdas:

```csharp
delegate bool TryParse<T>(string text, out T result);
TryParse<int> parse = (text, out result) => int.TryParse(text, out result);
```

🔹 Use case: Write more readable delegate-based code without verbose type declarations.

## Partial Constructors and Events

You can now declare constructors and events as `partial`:

```csharp
// partial class part A
public partial class Sensor
{
    public partial event EventHandler Alert;
    public partial Sensor(string name);
}

// partial class part B
public partial class Sensor
{
    public partial event EventHandler Alert
    {
        add { Console.WriteLine("Subscribed"); }
        remove { Console.WriteLine("Unsubscribed"); }
    }

    public partial Sensor(string name)
    {
        Console.WriteLine($"Sensor {name} initialized");
    }
}
```

🔹 Use case: Better code generation patterns with extensible logic in generated code.

## User-Defined Compound Assignment Operators

Now you can explicitly define operators like `+=`, `-=`, etc. as instance methods:

```csharp
class Counter
{
    public int Value;
    public void operator +=(int n) => Value += n;
}
```

🔹 Use case: Optimize performance for structs or immutable types by avoiding temporary allocations.

## Null-Conditional Assignment

Use `?.` on the left side of an assignment to assign a value only when the object is not null:

```csharp
customer?.Order = GetOrder();
customer?.Points += 10;
```

🔹 Use case: Write cleaner and safer null-aware code.

## Conclusion

C# 14 is packed with enhancements that help you write cleaner, more maintainable, and efficient code. Whether you're working with low-level performance code or high-level business logic, these features will simplify your development process and expand what you can express with the language.

Make sure to update your SDKs and explore the new capabilities. You’ll find that many of them quickly become indispensable in your day-to-day coding!

---

*Written by Albert Alarcón – Software Developer | [LinkedIn](https://www.linkedin.com/in/albertalarcon-software-developer/)*



