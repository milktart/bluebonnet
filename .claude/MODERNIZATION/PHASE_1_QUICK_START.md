# ⚡ Phase 1 Quick Start Card

**TL;DR - Get running in 30 minutes**

---

## 🎯 Your First 5 Days

### Day 1: Learn (1 hour)
```
Read: PHASE_1_OVERVIEW.md
Read: LEARNING_RESOURCES/SVELTE_BASICS.md
```

### Day 2-3: Practice (4 hours)
```
Try Svelte examples: https://svelte.dev/repl
Play with components in REPL
Get comfortable with reactive syntax
```

### Day 4: Setup Environment (30 min)
```bash
# Make sure you have these
node -v          # Need 18+
npm -v           # Need 8+
docker --version # Optional but recommended
```

### Day 5: Create SvelteKit Project (30 min)
```bash
npm create vite@latest bluebonnet-svelte -- --template svelte
cd bluebonnet-svelte
npm install
npm run dev
```

**✅ By end of Day 5: SvelteKit running on http://localhost:5173**

---

## 📁 Project Structure (What to Create)

```
bluebonnet-svelte/
├── src/
│   ├── routes/
│   │   ├── +page.svelte       ← Dashboard
│   │   ├── +layout.svelte     ← Root layout
│   │   └── trips/
│   │       ├── +page.svelte
│   │       └── [id]/+page.svelte
│   ├── lib/
│   │   ├── components/        ← Your Svelte components
│   │   ├── stores/            ← authStore, tripStore, uiStore
│   │   ├── services/          ← api.ts (Express client)
│   │   └── types/             ← TypeScript types
│   └── app.css
└── package.json
```

---

## 🔧 Week 1 Checklist

### Day 1-2: API Client
```typescript
// src/lib/services/api.ts
const API_BASE = 'http://localhost:3000/api';

export async function apiCall(endpoint, options) {
  const response = await fetch(API_BASE + endpoint, {
    ...options,
    headers: { 'Content-Type': 'application/json' }
  });
  return response.json();
}
```

### Day 3: Stores
```typescript
// src/lib/stores/tripStore.ts
import { writable } from 'svelte/store';
export const tripStore = writable({
  trips: [],
  flights: [],
  // ... etc
});
```

### Day 4-5: First Component
```svelte
<!-- src/lib/components/TextInput.svelte -->
<script lang="ts">
  export let label: string;
  export let value: string = '';
</script>

<div>
  <label>{label}</label>
  <input bind:value />
</div>
```

**✅ By end of Week 1: API client + stores + first component working**

---

## 📋 Express Backend (Already Running)

**It stays as-is!** No changes needed.

```
Running on: http://localhost:3000

All API endpoints available:
✅ POST   /api/trips
✅ GET    /api/trips
✅ GET    /api/trips/:id
✅ POST   /api/trips/:tripId/flights
... etc (no changes)
```

---

## 🎓 Essential Resources

| What | Where | Time |
|------|-------|------|
| Svelte syntax | LEARNING_RESOURCES/SVELTE_BASICS.md | 4-6 hrs |
| Phase 1 plan | MODERNIZATION/PHASE_1_OVERVIEW.md | 30 min |
| Components | COMPONENTS/FORM_COMPONENTS.md | 1 hour |
| Troubleshooting | TROUBLESHOOTING/SETUP_ISSUES.md | As needed |

---

## 🚀 Commands You'll Use

```bash
# Development
npm run dev              # Start Svelte dev server

# Building
npm run build            # Production build
npm run preview          # Preview build

# Testing (setup needed)
npm test
npm run test:watch
npm run test:coverage

# Deployment
npm run build
docker build -t bluebonnet-svelte .
```

---

## 💡 Key Concepts

### Reactive Variables
```svelte
<script>
  let count = 0;
  $: doubled = count * 2;  // Automatically updates
</script>

<button on:click={() => count++}>
  {count} → {doubled}
</button>
```

### Stores
```svelte
<script>
  import { tripStore } from '$lib/stores/tripStore';
</script>

<!-- Use $ prefix to auto-subscribe -->
{#each $tripStore.trips as trip}
  <p>{trip.name}</p>
{/each}
```

### Props
```svelte
<!-- Parent -->
<TextInput label="Name" bind:value={formData.name} />

<!-- TextInput.svelte -->
<script>
  export let label;
  export let value = '';
</script>
```

---

## ❌ Don't Do This

```svelte
<!-- ❌ NO: Direct DOM manipulation -->
document.querySelector('.name').value = 'Bob';

<!-- ✅ YES: Use reactive binding -->
<input bind:value={name} />
```

```svelte
<!-- ❌ NO: Confirm dialogs -->
if (confirm('Delete?')) { ... }

<!-- ✅ YES: Optimistic updates -->
deleteItem();
$tripStore.trips = $tripStore.trips.filter(t => t.id !== id);
```

---

## 🎯 Success Looks Like

### Week 1 End
- ✅ SvelteKit running
- ✅ Can call Express API
- ✅ Stores working
- ✅ First component displaying

### Week 2 End
- ✅ Multiple components built
- ✅ Form submission working
- ✅ Data persisting to Express
- ✅ Store updates working

### Week 3-4 End
- ✅ Dashboard page complete
- ✅ Trip management forms
- ✅ Real data flowing through

---

## 📞 Stuck?

Check this order:
1. **Error message** → Search in Terminal output
2. **Svelte Docs** → https://svelte.dev
3. **Troubleshooting** → `.claude/TROUBLESHOOTING/`
4. **Ask team** → Pair programming

---

## 📅 Timeline

```
TODAY:    Pre-Phase 1 setup
Dec 21:   Week 1 starts
Jan 18:   Quarter way (Weeks 3-4)
Feb 8:    Halfway (Weeks 5-6)
Mar 21:   Week 12 complete ✅
```

---

**Ready?** Go to [PHASE_1_STARTUP.md](./PHASE_1_STARTUP.md) for detailed steps.

Good luck! 🚀

