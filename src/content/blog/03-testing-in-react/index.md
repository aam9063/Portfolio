---
title: "Testing in React: From Unit Testing with Jest to Integration Tests"
summary: "When building modern React applications, ensuring correctness and reliability is crucial—especially as complexity increases. In this post, I’ll walk you through setting up **unit testing in React using Jest**, share best practices for **component testing**, and explain how to implement **integration tests** to simulate real-world usage scenarios."
date: "Jun 24 2025"
draft: false
tags:
- React
- Testing
- Jest
- Vitest
---

## ⚙️ Setting Up Unit Testing in React with Jest

[Jest](https://jestjs.io/) is a powerful JavaScript testing framework maintained by Meta, and it’s the default test runner in many React setups like Create React App. If you're using a custom setup with **Vite**, **Next.js**, or a manual bundler, you’ll need to install it yourself.

### 🛠️ Installation

Run the following command:

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event
````

These are the most common tools used together:

* `jest`: test runner
* `@testing-library/react`: for testing components through the DOM
* `@testing-library/jest-dom`: adds custom matchers like `.toBeInTheDocument()`
* `@testing-library/user-event`: simulates realistic user interactions

If you're using Vite, you can integrate Jest with Babel, or alternatively consider [`vitest`](https://vitest.dev/), which is Jest-compatible and faster in Vite setups.

### ⚙️ Basic Jest Configuration (`jest.config.js`)

If you're not using CRA, create a basic config:

```js
export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['@testing-library/jest-dom/extend-expect'],
  moduleNameMapper: {
    '\\.(css|scss|sass)$': 'identity-obj-proxy',
  },
};
```

You can also add a `setupTests.js` file:

```js
import '@testing-library/jest-dom';
```

---

## 🧩 Component Testing in React: Strategies and Best Practices

### 🎯 What Should We Test?

Component tests should focus on behavior rather than implementation. Good targets for testing include:

* ✅ Correct rendering of UI elements
* 🧠 Conditional logic (e.g. visibility, state)
* 🎯 User interaction (clicks, typing, etc.)
* 🔁 Props, state changes, and effects

Let’s look at an example.

### 🧪 Testing a Basic Button Component

```jsx
// Button.jsx
export function Button({ label, onClick }) {
  return <button onClick={onClick}>{label}</button>;
}
```

```js
// Button.test.jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

test('renders button with correct label', () => {
  render(<Button label="Click me" onClick={() => {}} />);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});

test('calls onClick when clicked', async () => {
  const handleClick = jest.fn();
  render(<Button label="Click me" onClick={handleClick} />);
  await userEvent.click(screen.getByText('Click me'));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### 🧠 Best Practices

* Use `userEvent` instead of `fireEvent` for more realistic interactions
* Avoid testing internal implementation (e.g. hooks or internal state)
* Focus on accessibility: use `getByRole`, `getByLabelText`, etc.
* Write tests from the **user’s perspective**

---

## 🔗 Integration Testing in React

While unit tests cover isolated components, **integration tests** verify how components and logic work together. They’re essential when:

* Components depend on API calls
* You need to test routing/navigation
* State flows through multiple components (e.g. context or redux)

Let’s look at a realistic case.

---

### 🧪 Integration Test: API Fetch with `useEffect`

```jsx
// UserProfile.jsx
import { useEffect, useState } from 'react';

export function UserProfile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('/api/user')
      .then(res => res.json())
      .then(data => setUser(data));
  }, []);

  if (!user) return <p>Loading...</p>;

  return <h2>Welcome, {user.name}!</h2>;
}
```

### 🔍 Test with Mocked API Call

```js
// UserProfile.test.jsx
import { render, screen, waitFor } from '@testing-library/react';
import { UserProfile } from './UserProfile';

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({ name: 'Albert' }),
    })
  );
});

test('displays user name after loading', async () => {
  render(<UserProfile />);
  expect(screen.getByText(/loading/i)).toBeInTheDocument();

  await waitFor(() =>
    expect(screen.getByText(/Welcome, Albert!/i)).toBeInTheDocument()
  );
});
```

### ✅ Why Integration Tests Matter

* They simulate **real scenarios** users might face
* They expose issues across component boundaries
* They're critical for **end-to-end flows** (forms, auth, navigation...)

---

## 📚 Bonus: Types of Tests You Can Use in React

| Type              | Purpose                                   | Example Tools       |
| ----------------- | ----------------------------------------- | ------------------- |
| Unit Tests        | Test isolated logic or small components   | Jest                |
| Component Tests   | Test full rendering and user interactions | Testing Library     |
| Integration Tests | Test multiple parts working together      | Jest, MSW           |
| End-to-End (E2E)  | Test entire app as the user sees it       | Cypress, Playwright |

---

## 🚀 Final Thoughts

Testing in React can feel overwhelming at first, but with a good strategy and tooling, it becomes a huge productivity booster. You’ll catch bugs earlier, refactor with confidence, and build better products overall.

Here’s a quick recap:

* Use **Jest** and **Testing Library** for reliable and expressive tests
* Focus on **behavior over implementation**
* Write both **unit** and **integration** tests to cover different layers
* Keep tests maintainable, fast, and meaningful

---

