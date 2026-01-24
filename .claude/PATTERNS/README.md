# 🎯 Design Patterns & Best Practices

Reusable patterns used throughout Bluebonnet. Follow these when building features.

---

## Quick Links

### Core Patterns

- **[CRUD Pattern](./CRUD_PATTERN.md)** - Create, Read, Update, Delete flow (most important)
- **[Form Pattern](./FORM_PATTERN.md)** - Form submission and validation
- **[Async Patterns](./ASYNC_PATTERNS.md)** - AJAX and async operations

### Architecture Patterns

- **[Component Pattern](./COMPONENT_PATTERN.md)** - How to structure components
- **[State Management](./STATE_MANAGEMENT.md)** - Managing state (current + Svelte)
- **[API Patterns](./API_PATTERNS.md)** - Request/response patterns

### Code Quality

- **[Error Handling](./ERROR_HANDLING.md)** - How to handle errors
- **[Validation Pattern](./VALIDATION_PATTERN.md)** - Data validation approach
- **[Testing Pattern](./TESTING_PATTERN.md)** - How to write tests

### Decision Guides

- **[When to Use Patterns](./WHEN_TO_USE_PATTERNS.md)** - Which pattern for your use case
- **[UX Patterns](./UX_PATTERNS.md)** - UX decisions (no alerts, silent failures)
- **[File Organization](./FILE_ORGANIZATION.md)** - Where to put code

---

## Pattern Flowchart

### "I'm adding a new feature"

```
1. Read: CRUD Pattern (what operations?)
   ↓
2. Read: Form Pattern (does it have a form?)
   ↓
3. Read: Component Pattern (how to structure?)
   ↓
4. Read: Testing Pattern (how to test?)
   ↓
5. Start coding!
```

### "I'm fixing a bug"

```
1. Read: Error Handling (error related?)
   ↓
2. Reproduce with test
   ↓
3. Fix code
   ↓
4. Add test to prevent regression
```

### "I'm refactoring code"

```
1. Read: Component Pattern (can we split?)
   ↓
2. Read: State Management (simplify state?)
   ↓
3. Write tests first
   ↓
4. Refactor
```

---

## Pattern Decision Tree

**Which pattern should I use?**

### For CRUD Operations

→ Use **[CRUD Pattern](./CRUD_PATTERN.md)**

- Creating items
- Reading items
- Updating items
- Deleting items

### For Forms

→ Use **[Form Pattern](./FORM_PATTERN.md)**

- User input
- Validation
- Submission
- Error feedback

### For API Communication

→ Use **[API Patterns](./API_PATTERNS.md)**

- Request format
- Response format
- Error responses
- Headers

### For State Management

→ Use **[State Management](./STATE_MANAGEMENT.md)**

- Global state (auth, user, trip)
- Local state (form, UI)
- Store subscriptions

### For Error Handling

→ Use **[Error Handling](./ERROR_HANDLING.md)**

- Try/catch blocks
- Error logging
- User feedback
- Recovery

### For Component Architecture

→ Use **[Component Pattern](./COMPONENT_PATTERN.md)**

- Component responsibilities
- Props vs stores
- Event handling
- Code organization

### For Testing

→ Use **[Testing Pattern](./TESTING_PATTERN.md)**

- Unit tests
- Integration tests
- What to test
- Test examples

---

## Most Important Patterns

### 1. CRUD Pattern (Read First!)

```
1. GET all items
2. GET single item
3. POST create item
4. PUT update item
5. DELETE item

Follow this for every feature!
```

→ See: [CRUD Pattern](./CRUD_PATTERN.md)

### 2. Form Pattern

```
1. User fills form
2. Form validation
3. Submit to backend
4. Handle response (success/error)
5. Update UI

Always use this for forms!
```

→ See: [Form Pattern](./FORM_PATTERN.md)

### 3. Component Pattern

```
1. One component = one responsibility
2. Props for data
3. Stores for global state
4. Events for communication
5. Tests for verification

Structure all components this way!
```

→ See: [Component Pattern](./COMPONENT_PATTERN.md)

---

## Quick Reference

### API Response Format

```javascript
// Success
{ success: true, data: {...} }

// Error
{ success: false, error: "Error message" }
```

### Form Validation Flow

```
1. Validate on client
2. Validate on server
3. Return errors
4. Display to user
```

### Error Handling

```
try {
  // operation
} catch (error) {
  // Log error
  // Handle gracefully
  // Inform user (silently)
}
```

### Component Structure

```javascript
<script>
  // 1. Imports
  // 2. Props
  // 3. State
  // 4. Lifecycle
  // 5. Functions
</script>

<!-- 6. Template -->

<style>
  /* 7. Styles */
</style>
```

---

## Pattern by Use Case

### Adding a New Travel Item Type (Flight, Hotel, etc.)

1. **Step 1:** Follow [CRUD Pattern](./CRUD_PATTERN.md)
2. **Step 2:** Create model and controller
3. **Step 3:** Create routes with validation
4. **Step 4:** Create Svelte form following [Form Pattern](./FORM_PATTERN.md)
5. **Step 5:** Use [Component Pattern](./COMPONENT_PATTERN.md) for form component
6. **Step 6:** Write tests following [Testing Pattern](./TESTING_PATTERN.md)

### Updating Existing Feature

1. **Step 1:** Check current [CRUD Pattern](./CRUD_PATTERN.md) implementation
2. **Step 2:** Update model if needed
3. **Step 3:** Update controller/service
4. **Step 4:** Update routes/API
5. **Step 5:** Update Svelte component(s)
6. **Step 6:** Add tests

### Fixing a Bug

1. **Step 1:** Write test that reproduces bug
2. **Step 2:** Understand which pattern is involved
3. **Step 3:** Fix the bug
4. **Step 4:** Verify test passes
5. **Step 5:** Check for similar bugs elsewhere

---

## Common Mistakes to Avoid

### ❌ Don't

- Create endpoints that don't follow API pattern
- Mix business logic in controllers
- Put global state in components
- Skip validation (client or server)
- Add components without tests

### ✅ Do

- Follow established patterns
- Keep controllers thin, put logic in services
- Use stores for global state, props for local
- Always validate both client and server
- Write tests as you code

---

## Pattern Evolution (Phase 1 vs Phase 2)

### Phase 1 (Svelte Frontend)

- Forms built with Svelte reactivity
- State managed with Svelte stores
- API client calls Express backend
- Components use props + stores

### Phase 2 (Backend Refactoring)

- Services layer extracted from controllers
- TypeScript for type safety
- More sophisticated validation
- Better error handling

**Patterns change but principles stay same!**

---

## Related Documentation

- **[CRUD Pattern](./CRUD_PATTERN.md)** - Most important, read first
- **[Components](../COMPONENTS/README.md)** - Component library specs
- **[Testing](../TESTING/README.md)** - Testing strategy
- **[Architecture](../ARCHITECTURE/README.md)** - System design
- **[Features](../FEATURES/README.md)** - Feature implementation

---

## Getting Started

**First time?**

1. Read [CRUD Pattern](./CRUD_PATTERN.md) - 10 min
2. Read [Form Pattern](./FORM_PATTERN.md) - 10 min
3. Start with a simple feature following patterns

**Have a specific question?**

- Use [When to Use Patterns](./WHEN_TO_USE_PATTERNS.md)
- Or search [INDEX](../INDEX.md)

---

**Last Updated:** 2025-12-17
