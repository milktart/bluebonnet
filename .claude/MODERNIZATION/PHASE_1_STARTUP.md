# 🚀 Phase 1 Startup Guide - Getting Started

**Before you start Phase 1 Svelte frontend migration, complete these steps in order.**

---

## 📋 PRE-PHASE 1 CHECKLIST

Complete these items **BEFORE** starting Week 1 development:

### ✅ Day 1: Team Preparation
- [ ] **Read** [Phase 1 Overview](./PHASE_1_OVERVIEW.md) (30 min)
- [ ] **Understand** the 12-week timeline and feature migration order
- [ ] **Review** success criteria and what "done" means
- [ ] **Assign** a Phase 1 lead developer

### ✅ Day 2-3: Svelte Training
- [ ] **Learn Svelte basics** using [Svelte Basics Quick Reference](../../LEARNING_RESOURCES/SVELTE_BASICS.md) (4-6 hours)
- [ ] **Try examples** in Svelte REPL: https://svelte.dev/repl
- [ ] **Understand** reactivity, components, stores, lifecycle
- [ ] **Practice** before writing production code

### ✅ Day 4: Environment Setup
- [ ] **Have Node.js 18+** installed (`node -v`)
- [ ] **Have npm or pnpm** installed (`npm -v`)
- [ ] **Have Docker** installed (optional but recommended)
- [ ] **Have Git** configured for the project
- [ ] **Have VS Code** or preferred editor ready

### ✅ Day 5: Architecture Review
- [ ] **Review** [PHASE_1_OVERVIEW.md](./PHASE_1_OVERVIEW.md) architecture diagram
- [ ] **Understand** Svelte + Express separation
- [ ] **Know** API contracts (Express backend unchanged)
- [ ] **Review** component structure examples

### ✅ Before Week 1: Setup Complete
- [ ] Team trained on Svelte ✅
- [ ] Environment ready ✅
- [ ] Architecture understood ✅
- [ ] Ready to scaffold SvelteKit project ✅

---

## 🏁 WEEK 1 TASKS: Foundation

### Week 1, Day 1: Project Scaffold

**Goal:** Get SvelteKit running with TypeScript

```bash
# Create new SvelteKit project
npm create vite@latest bluebonnet-svelte -- --template svelte

# Navigate to project
cd bluebonnet-svelte

# Install dependencies
npm install

# Install TypeScript support
npm install -D typescript

# Start dev server
npm run dev
```

**Expected:** App running at `http://localhost:3001`

### Week 1, Day 2: Project Structure

Create this structure:

```
src/
├── routes/
│   ├── +page.svelte           # Home/dashboard
│   ├── +layout.svelte         # Root layout
│   ├── trips/
│   │   ├── +page.svelte       # Trip list
│   │   └── [id]/
│   │       └── +page.svelte   # Trip detail
│   └── ...
├── lib/
│   ├── components/
│   │   ├── FormContainer.svelte
│   │   ├── TextInput.svelte
│   │   ├── DateTimePicker.svelte
│   │   └── ...
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── tripStore.ts
│   │   └── uiStore.ts
│   └── services/
│       ├── api.ts             # API client
│       └── ...
├── app.css
└── app.html
```

### Week 1, Day 3: API Client Setup

**Create:** `src/lib/services/api.ts`

```typescript
// Simple fetch wrapper connecting to Express backend
const API_BASE = 'http://localhost:3000/api';

export async function apiCall(
  endpoint: string,
  options?: RequestInit
) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

// Examples
export const trips = {
  getAll: () => apiCall('/trips'),
  getOne: (id: string) => apiCall(`/trips/${id}`),
  create: (data: any) => apiCall('/trips', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

export const flights = {
  create: (tripId: string, data: any) =>
    apiCall(`/trips/${tripId}/flights`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
```

### Week 1, Day 4-5: Stores Setup

**Create:** `src/lib/stores/tripStore.ts`

```typescript
import { writable } from 'svelte/store';

export const tripStore = writable({
  currentTrip: null,
  trips: [],
  flights: [],
  hotels: [],
  events: [],
  carRentals: [],
  transportation: [],
  companions: [],
  vouchers: [],
  loading: false,
  error: null,
});
```

**Create:** `src/lib/stores/authStore.ts`

```typescript
import { writable } from 'svelte/store';

export const authStore = writable({
  user: null,
  isAuthenticated: false,
  token: null,
  loading: false,
});
```

**Create:** `src/lib/stores/uiStore.ts`

```typescript
import { writable } from 'svelte/store';

export const uiStore = writable({
  sidebarOpen: false,
  secondarySidebarOpen: false,
  tertiarySidebarOpen: false,
  activeTab: 'overview',
  loading: false,
  selectedItem: null,
});
```

### Week 1 Goal: ✅ Foundation Complete

By end of Week 1:
- ✅ SvelteKit project running
- ✅ API client connecting to Express
- ✅ Stores initialized and accessible
- ✅ First test API call working

---

## 📅 WEEK 2: First Component

### Week 2 Task: Build TextInput Component

**File:** `src/lib/components/TextInput.svelte`

```svelte
<script lang="ts">
  export let label: string;
  export let value: string = '';
  export let error: string | null = null;

  function handleChange(e: Event) {
    value = (e.target as HTMLInputElement).value;
  }
</script>

<div class="input-group">
  <label>{label}</label>
  <input
    type="text"
    {value}
    on:change={handleChange}
    on:input={handleChange}
  />
  {#if error}
    <span class="error">{error}</span>
  {/if}
</div>

<style>
  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  input {
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  .error {
    color: #dc3545;
    font-size: 0.875rem;
  }
</style>
```

### Week 2 Task: Use in a Page

**File:** `src/routes/+page.svelte`

```svelte
<script lang="ts">
  import TextInput from '$lib/components/TextInput.svelte';
  import { tripStore } from '$lib/stores/tripStore';

  let tripName = '';

  async function handleSubmit() {
    // Simple example
    console.log('Create trip:', tripName);
  }
</script>

<main>
  <h1>Create New Trip</h1>

  <form on:submit|preventDefault={handleSubmit}>
    <TextInput
      label="Trip Name"
      bind:value={tripName}
    />
    <button type="submit">Create Trip</button>
  </form>
</main>
```

### Week 2 Goal: ✅ First Component Working

By end of Week 2:
- ✅ Form component created and tested
- ✅ Component used in a page
- ✅ Ready for next components

---

## 📚 REFERENCE DOCUMENTS

### For Setup & Configuration
- **[Svelte Basics](../../LEARNING_RESOURCES/SVELTE_BASICS.md)** - Syntax reference (read this!)
- **[Phase 1 Overview](./PHASE_1_OVERVIEW.md)** - High-level strategy
- **[Component Specs](../../COMPONENTS/FORM_COMPONENTS.md)** - Component architecture

### For Implementation
- **[CRUD Pattern](../../PATTERNS/CRUD_OPERATIONS.md)** - How to build forms
- **[State Management](../../PATTERNS/STATE_MANAGEMENT.md)** - How stores work
- **[Validation](../../PATTERNS/VALIDATION.md)** - Input validation

### For Troubleshooting
- **[Troubleshooting](../../TROUBLESHOOTING/SETUP_ISSUES.md)** - Common problems
- **[Glossary](../../GLOSSARY.md)** - Terminology

---

## ⚙️ ENVIRONMENT SETUP DETAIL

### System Requirements

```bash
# Check Node.js version (need 18+)
node -v
# Should output: v18.0.0 or higher

# Check npm version
npm -v
# Should output: v8.0.0 or higher
```

### Install SvelteKit Template

```bash
# Create project
npm create vite@latest bluebonnet-svelte -- --template svelte

# Move into directory
cd bluebonnet-svelte

# Install packages
npm install

# Start development
npm run dev
```

### Configure TypeScript (Optional but Recommended)

```bash
# Install TypeScript
npm install -D typescript

# Create tsconfig.json
npx tsc --init
```

### Add Tailwind CSS (Optional)

```bash
# Install Tailwind
npm install -D tailwindcss postcss autoprefixer

# Initialize
npx tailwindcss init -p
```

---

## 🎯 WEEK 1-2 SUCCESS CRITERIA

✅ SvelteKit running
✅ TypeScript configured (optional)
✅ API client connecting to Express backend
✅ Stores initialized
✅ First component built
✅ Component displayed in page

---

## 🔄 WEEKLY RHYTHM (Weeks 3-12)

### Each Week:

**Monday:** Sprint planning
- Review todo list for week
- Assign tasks
- Check dependencies

**Tuesday-Thursday:** Build
- Create components
- Test with API
- Update stores

**Friday:** Review & Polish
- Code review
- Test end-to-end
- Prepare for next week

---

## 📞 WHEN YOU GET STUCK

### Common Issues

**"Module not found"**
→ Check import paths use `$lib/` prefix
→ Check files are in correct location

**"Store is undefined"**
→ Import store at top of component
→ Use `$storeName` to subscribe

**"API not responding"**
→ Verify Express backend running on :3000
→ Check API endpoint is correct
→ Check CORS if needed

**"Component not rendering"**
→ Check HTML in component
→ Check data binding syntax
→ Check no JavaScript errors

### Getting Help

1. **Check** [Troubleshooting](../../TROUBLESHOOTING/SETUP_ISSUES.md)
2. **Read** [Svelte Docs](https://svelte.dev)
3. **Try** Svelte REPL for isolated testing
4. **Ask** team for pair programming

---

## 📊 PROGRESS TRACKING

### Weeks 1-2: Foundation ✅
- [ ] SvelteKit setup
- [ ] API client
- [ ] Stores
- [ ] First components

### Weeks 3-4: Core Features ⬜
- [ ] Dashboard page
- [ ] Trip management
- [ ] Trip list

### Weeks 5-8: Travel Items ⬜
- [ ] Flights
- [ ] Hotels
- [ ] Events
- [ ] Car rentals
- [ ] Transportation

### Weeks 9-10: Advanced ⬜
- [ ] Calendar
- [ ] Maps
- [ ] Companions

### Weeks 11-12: Polish ⬜
- [ ] Vouchers
- [ ] Error handling
- [ ] Performance
- [ ] Testing
- [ ] Deployment

---

## 🚀 YOU'RE READY!

Once you complete the pre-Phase 1 checklist above, you're ready to start Week 1 development.

**Start Date:** 2025-12-21
**Target Completion:** 2026-03-21

Good luck! 🎉

---

**Questions?** See [Troubleshooting](../../TROUBLESHOOTING/) or [Phase 1 Overview](./PHASE_1_OVERVIEW.md).

