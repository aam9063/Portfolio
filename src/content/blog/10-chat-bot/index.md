---
title: "Building a Multimodel AI Chatbot in .NET Using ChatGPT and Neon Postgres Branching"
summary: "Building AI chatbots in .NET often raises the question: which OpenAI model should you use? In this post, inspired by Anton Martyniuk’s guide, we explore how to run multiple models like gpt-3.5-turbo and gpt-4 in parallel, store their responses separately using Neon Postgres branching, and compare results efficiently. It’s a scalable and clean way to experiment with AI without mixing data or overcomplicating your backend."
date: "Aug 05 2025"
draft: false
tags:
- .NET
- OpenAI
- PostgreSQL
---

## 🧠 Why Use Multiple Models?

When building AI chatbots, you might want to experiment with different models such as `gpt-3.5-turbo`, `gpt-4`, or `gpt-4o` to:

* Compare performance and accuracy
* Validate prompt effectiveness
* Benchmark against user feedback

Instead of hardcoding one model, Anton shows how to design your system to **dynamically support multiple models** and **track their outputs independently**.

---

## 🛠️ Technologies Used

* **.NET (ASP.NET Core)**: backend API to interact with OpenAI and store results
* **OpenAI API**: to access ChatGPT models
* **Neon Postgres**: for fast, isolated database branching
* **Docker**: for local development
* **Dapper**: for database interaction

---

## ⚙️ Project Architecture

### 1. Model Configuration

Define different OpenAI models and their settings in a config file:

```json
"OpenAI": {
  "DefaultModel": "gpt-4",
  "Models": {
    "gpt-3.5-turbo": {
      "MaxTokens": 500,
      "Temperature": 0.7
    },
    "gpt-4": {
      "MaxTokens": 800,
      "Temperature": 0.5
    }
  }
}
```

---

### 2. Sending Prompts to Multiple Models

The backend prepares multiple requests and sends them **in parallel**:

```csharp
public async Task<List<ModelResult>> GetResponsesFromAllModelsAsync(string prompt)
{
    var tasks = _models.Select(model => CallOpenAIAsync(prompt, model)).ToList();
    return await Task.WhenAll(tasks);
}
```

Each task sends a prompt to a specific model (e.g., gpt-3.5 or gpt-4) and returns the result.

---

### 3. Saving Results to Neon Branches

Each model writes its result into a **separate Neon Postgres branch**, which is dynamically switched using connection strings:

```csharp
public void SwitchToBranch(string model)
{
    var connectionString = _configuration[$"ConnectionStrings:{model}Branch"];
    _dbConnection = new NpgsqlConnection(connectionString);
}
```

This allows you to completely **isolate results** per model, making it easy to compare, debug, or reset.

---

### 4. Result Display and Feedback Loop

Anton implemented a web interface to:

* Display multiple model responses side-by-side
* Allow the user to choose the best answer
* Save the ranking back to the corresponding database branch

---

## ✅ Benefits of This Approach

* 🔁 **Experimentation Made Easy**
  Test multiple models without changing core logic

* 🌿 **Branch Isolation**
  Using Neon’s zero-copy branching to store per-model results

* 📊 **Better Evaluation**
  Track which model consistently gives better answers based on user feedback

* 💡 **Prompt Engineering Sandbox**
  Easily tweak and test prompts on different models in parallel

---

## 🔐 Sample API Call to OpenAI

```csharp
private async Task<string> CallOpenAIAsync(string prompt, string model)
{
    var request = new
    {
        model = model,
        messages = new[]
        {
            new { role = "user", content = prompt }
        }
    };

    var response = await _httpClient.PostAsJsonAsync("https://api.openai.com/v1/chat/completions", request);
    var result = await response.Content.ReadAsStringAsync();
    return result;
}
```

---

## 🧪 Branching in Neon Postgres

Create new branches via the Neon CLI or UI:

```bash
neon branch create gpt-3.5
neon branch create gpt-4
```

Each branch inherits from the base schema and can evolve independently. You can merge results later if needed.

---

## 📁 Project Structure

```
/ChatBot
│
├── Controllers/
│   └── ChatController.cs
├── Services/
│   └── OpenAIService.cs
├── Models/
├── Repositories/
├── appsettings.json
```

---

## 📌 Final Thoughts

This architecture is ideal if you're:

* Building a chatbot or assistant that uses different models
* Need to A/B test OpenAI responses
* Want to store results in a structured, isolated manner
* Aim to refine prompt engineering over time

> 🔗 Check the original article for code samples and diagrams:
> [antondevtips.com/blog/building-multimodel-ai-chat-bot-in-dotnet-with-chat-gpt-and-database-branching-in-neon-postgres](https://antondevtips.com/blog/building-multimodel-ai-chat-bot-in-dotnet-with-chat-gpt-and-database-branching-in-neon-postgres)


