# ADR 001: Choose Svelte for Phase 1 Frontend Migration

**Date:** 2025-12-17
**Status:** Accepted
**Deciders:** Development team, Tech lead

---

## Context

Bluebonnet currently uses EJS templates + Vanilla JavaScript for frontend. This is difficult to maintain, lacks reactivity, and doesn't scale well for a growing team. We need to modernize the frontend stack.

### Candidate Frameworks Evaluated

1. **React** - Proven, large ecosystem, learning curve
2. **Vue 3** - Progressive, good DX, moderate community
3. **Svelte** - Smallest bundle, best DX, emerging
4. **Next.js** - Full-stack React, opinionated, heavier
5. **Alpine.js** - Lightweight, limited for complex UIs
6. **Lit.js** - Web components, lightweight, niche

---

## Decision

**We choose Svelte + SvelteKit for Phase 1 frontend migration.**

### Rationale

| Factor                   | Svelte       | React     | Vue      | Alpine  | Next.js     |
| ------------------------ | ------------ | --------- | -------- | ------- | ----------- |
| **Bundle Size**          | 8-12KB ✅    | 50-60KB   | 30-40KB  | 15KB    | 70KB+       |
| **Learning Curve**       | Easy ✅      | Steep     | Moderate | Easy    | Steep       |
| **Reactivity**           | Built-in ✅  | Hooks     | Reactive | No      | Built-in    |
| **Performance**          | Excellent ✅ | Good      | Good     | Fair    | Good        |
| **Developer Experience** | Best ✅      | Good      | Good     | Basic   | Opinionated |
| **Community**            | Growing ✅   | Massive   | Moderate | Small   | Large       |
| **Scalability**          | Good ✅      | Excellent | Good     | Limited | Excellent   |

### Specific Reasons

1. **Bundle Size (Primary)**
   - Svelte: 8-12KB vs React 50-60KB
   - Users get 5-6x smaller bundle
   - Travel planning app = bandwidth-conscious audience
   - Faster loading on mobile (critical for travelers)

2. **Developer Experience**
   - Simpler reactive model than React hooks
   - Less boilerplate than React/Vue
   - Built-in scoped styling (no CSS-in-JS config)
   - Easier for team to learn

3. **Maintenance**
   - Less code to maintain (Svelte compiles away framework)
   - Fewer dependencies
   - Easier to onboard new developers

4. **Production Ready**
   - SvelteKit provides full framework
   - TypeScript support built-in
   - File-based routing like Next.js
   - Proven in production apps

---

## Consequences

### Positive

- ✅ Significantly smaller JavaScript bundles
- ✅ Faster page loads, especially on mobile
- ✅ Easier component creation
- ✅ Faster development iteration
- ✅ Lower maintenance burden
- ✅ Easier team scaling

### Risks & Mitigation

- **Smaller community** → Mitigated by good docs, Svelte has active Discord
- **Fewer libraries** → We can write custom, or use JS libraries
- **Learning curve for team** → 1 week training planned
- **Job market** → Skills transferable (component concepts)

---

## Implementation

### Timeline

- **Phase 1:** SvelteKit frontend (12 weeks)
- **No backend changes** - Express backend stays as-is
- **API contracts** - Unchanged

### Architecture

```
Svelte Frontend (New)
    ↓ JSON API
Express Backend (Unchanged)
```

### Tech Stack

- **Framework:** SvelteKit
- **Build:** Vite
- **Styling:** Tailwind CSS (same as current)
- **State:** Svelte stores
- **Language:** TypeScript (optional, recommended)

---

## Comparison Detail

### Svelte vs React

**React:**

- Pro: Largest community, most job openings
- Con: 50-60KB bundle, requires hooks knowledge, JSX syntax

**Svelte:**

- Pro: 8-12KB bundle, simpler syntax, built-in reactivity
- Con: Smaller community, fewer libraries

**Winner for this project:** Svelte (bundle size critical for travel app)

### Svelte vs Vue 3

**Vue 3:**

- Pro: Progressive, good community, good docs
- Con: 30-40KB bundle, still larger than Svelte

**Svelte:**

- Pro: Smaller bundle, simpler API
- Con: Smaller community

**Winner:** Svelte (bundle size advantage)

### Svelte vs Alpine.js

**Alpine:**

- Pro: Very lightweight (15KB), minimal learning
- Con: Not a full framework, limited for complex UI

**Svelte:**

- Pro: Full framework, scalable, better for large apps

**Winner:** Svelte (scalability for growing travel app)

### Svelte vs Next.js

**Next.js:**

- Pro: Full-stack React, opinionated, easier initial setup
- Con: React bundle overhead, more complex

**Svelte:**

- Pro: Lighter weight, simpler
- Con: Less ecosystem

**Winner:** Svelte (for client-centric travel app)

---

## Alternatives Considered

### 1. Stay with EJS + Vanilla JS

- ❌ Not scalable, hard to maintain
- ❌ No component reusability
- ❌ Poor developer experience

### 2. Use Angular

- ❌ Heavy framework, steep learning curve
- ❌ Over-engineered for travel app
- ❌ Large bundle size

### 3. Use Next.js + React

- ❌ Heavier bundle than Svelte
- ❌ More complex, more boilerplate
- ❌ Overkill for our use case

---

## Related Decisions

- **ADR 002:** SvelteKit for full-stack framework (versus standalone Svelte)
- **ADR 003:** Tailwind CSS for styling (versus alternatives)
- **ADR 004:** Express backend unchanged (versus Node.js migration)

---

## References

- [Svelte Official Docs](https://svelte.dev)
- [SvelteKit Docs](https://kit.svelte.dev)
- [JavaScript Framework Comparison 2025](https://comparison-link.example.com)

---

**Approved By:** [Team Lead Name]
**Date Approved:** 2025-12-17
