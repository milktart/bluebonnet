# 🎓 Svelte Basics Quick Reference

Essential Svelte concepts for developers starting Phase 1.

---

## Quick Start

### Installation
```bash
npm create vite@latest my-app -- --template svelte
cd my-app
npm install
npm run dev
```

### Your First Component
```svelte
<script>
  let count = 0;

  function increment() {
    count += 1;
  }
</script>

<button on:click={increment}>
  Clicks: {count}
</button>

<style>
  button {
    padding: 0.5rem 1rem;
    background: blue;
    color: white;
    border: none;
    cursor: pointer;
  }
</style>
```

---

## Reactive Variables

### Declare with `let`
```svelte
<script>
  let name = 'World';
  let count = 0;
</script>

<h1>Hello {name}</h1>
<p>Count: {count}</p>
<button on:click={() => count++}>Increment</button>
```

### Reactive Statements
```svelte
<script>
  let count = 0;

  // Runs whenever count changes
  $: doubled = count * 2;
  $: console.log(`count is ${count}`);
</script>

<p>{count}</p>
<p>Doubled: {doubled}</p>
```

### Derived State
```svelte
<script>
  let items = [1, 2, 3];

  // Computed value, updates automatically
  $: total = items.reduce((a, b) => a + b, 0);
</script>

<p>Total: {total}</p>
```

---

## Event Handling

### Click Events
```svelte
<script>
  function handleClick(event) {
    console.log('Clicked', event);
  }
</script>

<button on:click={handleClick}>Click me</button>
<button on:click={() => console.log('clicked')}>Quick</button>
```

### Form Events
```svelte
<script>
  let value = '';

  function handleSubmit(e) {
    e.preventDefault();
    console.log('Form submitted with:', value);
  }
</script>

<form on:submit|preventDefault={handleSubmit}>
  <input bind:value type="text" />
  <button type="submit">Submit</button>
</form>
```

### Event Modifiers
```svelte
<!-- Stop propagation -->
<button on:click|stopPropagation={() => alert('clicked')}>
  Click

<!-- Prevent default -->
<form on:submit|preventDefault={() => console.log('submitted')}>
  <!-- -->
</form>

<!-- Once only -->
<button on:click|once={() => console.log('fires once')}>Click</button>
```

---

## Two-Way Binding

### Binding to Input
```svelte
<script>
  let name = '';
</script>

<input bind:value={name} placeholder="Enter name" />
<p>Hello {name}!</p>
```

### Binding to Checkbox
```svelte
<script>
  let agreed = false;
</script>

<label>
  <input bind:checked={agreed} type="checkbox" />
  I agree
</label>

{#if agreed}
  <p>Thanks!</p>
{/if}
```

### Binding to Select
```svelte
<script>
  let selected = '';
</script>

<select bind:value={selected}>
  <option value="">Choose...</option>
  <option value="dog">Dog</option>
  <option value="cat">Cat</option>
</select>

<p>You selected: {selected}</p>
```

---

## Conditional Rendering

### if/else
```svelte
<script>
  let count = 0;
</script>

{#if count > 10}
  <p>Count is high!</p>
{:else if count > 5}
  <p>Count is medium</p>
{:else}
  <p>Count is low</p>
{/if}
```

### each Loop
```svelte
<script>
  let items = ['Apple', 'Banana', 'Cherry'];
</script>

<ul>
  {#each items as item (item)}
    <li>{item}</li>
  {/each}
</ul>
```

### each with Index
```svelte
{#each items as item, index (item)}
  <p>{index}: {item}</p>
{/each}
```

### await Blocks
```svelte
<script>
  let promise = fetch('/api/data').then(r => r.json());
</script>

{#await promise}
  <p>Loading...</p>
{:then data}
  <p>Data: {data}</p>
{:catch error}
  <p>Error: {error}</p>
{/await}
```

---

## Components

### Creating a Component
```svelte
<!-- Button.svelte -->
<script>
  export let label = 'Click me';
  export let onClick = () => {};
</script>

<button on:click={onClick}>{label}</button>

<style>
  button {
    background: blue;
    color: white;
    padding: 0.5rem 1rem;
  }
</style>
```

### Using a Component
```svelte
<!-- App.svelte -->
<script>
  import Button from './Button.svelte';

  function handleClick() {
    alert('Clicked!');
  }
</script>

<Button label="Say Hello" onClick={handleClick} />
```

### Props
```svelte
<!-- Props are exported variables -->
<script>
  export let title;          // Required
  export let count = 0;      // Optional with default
  export let items = [];     // Optional array
</script>

<h1>{title}</h1>
<p>Count: {count}</p>
<ul>
  {#each items as item}
    <li>{item}</li>
  {/each}
</ul>
```

### Slots
```svelte
<!-- Container.svelte -->
<div class="card">
  <slot />
</div>

<!-- App.svelte -->
<Container>
  <p>This goes inside the slot!</p>
</Container>
```

### Named Slots
```svelte
<!-- Card.svelte -->
<div class="card">
  <header>
    <slot name="header" />
  </header>
  <main>
    <slot />
  </main>
  <footer>
    <slot name="footer" />
  </footer>
</div>

<!-- App.svelte -->
<Card>
  <div slot="header">Title</div>
  <p>Content</p>
  <div slot="footer">Footer</div>
</Card>
```

---

## Stores

### Writable Store
```typescript
// stores/count.ts
import { writable } from 'svelte/store';

export const count = writable(0);

// In component:
import { count } from './stores/count';

<button on:click={() => $count++}>
  Count: {$count}
</button>
```

### Store Subscriptions
```svelte
<script>
  import { count } from './stores/count';

  // $count is auto-subscribed
  $: console.log('Count changed:', $count);

  // Or manual subscribe
  const unsubscribe = count.subscribe(value => {
    console.log('Count:', value);
  });

  onDestroy(unsubscribe);
</script>
```

---

## Lifecycle

### onMount
```svelte
<script>
  import { onMount } from 'svelte';

  onMount(() => {
    console.log('Component mounted');
    // Fetch data, setup
    return () => {
      console.log('Component will unmount');
    };
  });
</script>
```

### onDestroy
```svelte
<script>
  import { onDestroy } from 'svelte';

  onDestroy(() => {
    console.log('Component destroyed');
    // Cleanup
  });
</script>
```

---

## Classes & Styles

### Dynamic Classes
```svelte
<script>
  let isActive = false;
</script>

<div class:active={isActive}>
  Toggle
</div>

<style>
  div.active {
    background: blue;
    color: white;
  }
</style>
```

### Dynamic Styles
```svelte
<script>
  let color = 'red';
  let size = 20;
</script>

<div style="color: {color}; font-size: {size}px;">
  Styled text
</div>
```

---

## Animations & Transitions

### Transitions
```svelte
<script>
  import { fade } from 'svelte/transition';
  let visible = true;
</script>

{#if visible}
  <p transition:fade>I can fade in and out</p>
{/if}

<button on:click={() => visible = !visible}>Toggle</button>
```

### Common Transitions
- `fade` - Fade in/out
- `fly` - Slide in/out
- `scale` - Grow/shrink
- `blur` - Blur in/out
- `slide` - Slide in/out

---

## TypeScript

### Add Types to Component
```svelte
<script lang="ts">
  export let items: Array<{ id: string; name: string }> = [];
  export let onSelect: (item: any) => void;

  function handleClick(item: any): void {
    onSelect(item);
  }
</script>
```

### Typed Store
```typescript
// stores/app.ts
import { writable, type Writable } from 'svelte/store';

interface User {
  id: string;
  name: string;
  email: string;
}

export const user: Writable<User | null> = writable(null);
```

---

## Common Patterns

### Form Handling
```svelte
<script>
  let form = {
    name: '',
    email: ''
  };

  function handleSubmit() {
    console.log('Form data:', form);
  }
</script>

<form on:submit|preventDefault={handleSubmit}>
  <input bind:value={form.name} placeholder="Name" />
  <input bind:value={form.email} type="email" placeholder="Email" />
  <button type="submit">Submit</button>
</form>
```

### Async Data Loading
```svelte
<script>
  let promise;

  async function loadData() {
    return fetch('/api/data').then(r => r.json());
  }

  onMount(() => {
    promise = loadData();
  });
</script>

{#await promise}
  <p>Loading...</p>
{:then data}
  <p>{data.message}</p>
{:catch error}
  <p>Error: {error.message}</p>
{/await}
```

---

## Resources

- **Official Docs:** https://svelte.dev
- **Interactive Tutorial:** https://learn.svelte.dev
- **REPL:** https://svelte.dev/repl
- **Discord Community:** https://discord.gg/yy75DKs

---

**Last Updated:** 2025-12-17
**Time to Learn:** 4-6 hours for basics
