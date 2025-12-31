# 📚 Learning Resources

Quick references and learning guides for frameworks used in Bluebonnet.

---

## Quick Links

### Svelte (Phase 1 Focus)
- **[Svelte Basics](./SVELTE_BASICS.md)** - Quick reference for Svelte syntax
- **[SvelteKit Basics](./SVELTEKIT_BASICS.md)** - SvelteKit patterns and setup

### Backend
- **[TypeScript Guidelines](./TYPESCRIPT_GUIDELINES.md)** - TypeScript best practices
- **[Database Basics](./DATABASE_BASICS.md)** - Sequelize/database concepts

### External Resources
- **[External Resources](./EXTERNAL_RESOURCES.md)** - Links to official docs

---

## For New Developers

### First Week Learning Path

**Day 1: Understand the App**
- Read [Getting Started](../GETTING_STARTED.md)
- Read [Architecture Overview](../ARCHITECTURE/README.md)
- Run app locally (`docker-compose up`)

**Day 2: Learn Svelte (if frontend)**
- Read [Svelte Basics](./SVELTE_BASICS.md) - 30 min
- Read [SvelteKit Basics](./SVELTEKIT_BASICS.md) - 30 min
- Build first component - 1 hour

**Day 3: Learn Express (if backend)**
- Read [Backend Architecture](../ARCHITECTURE/BACKEND/README.md) - 30 min
- Read [Database Basics](./DATABASE_BASICS.md) - 30 min
- Study one controller - 1 hour

**Day 4: Learn Patterns**
- Read [CRUD Pattern](../PATTERNS/CRUD_PATTERN.md) - 30 min
- Read [Form Pattern](../PATTERNS/FORM_PATTERN.md) - 30 min
- Follow a feature through codebase - 1 hour

**Day 5: Write Code**
- Build your first feature following patterns
- Get code reviewed
- Ask questions!

---

## By Role

### Frontend Developer (Svelte)
**Must Learn:**
1. [Svelte Basics](./SVELTE_BASICS.md)
2. [SvelteKit Basics](./SVELTEKIT_BASICS.md)
3. [Component Pattern](../PATTERNS/COMPONENT_PATTERN.md)
4. [Form Pattern](../PATTERNS/FORM_PATTERN.md)

**Nice to Know:**
- TypeScript (optional but recommended)
- Testing for components
- Performance optimization

**Time:** 1-2 weeks to be productive

### Backend Developer (Express)
**Must Learn:**
1. [Backend Architecture](../ARCHITECTURE/BACKEND/README.md)
2. [Database Basics](./DATABASE_BASICS.md)
3. [CRUD Pattern](../PATTERNS/CRUD_PATTERN.md)
4. [API Patterns](../PATTERNS/API_PATTERNS.md)

**Nice to Know:**
- TypeScript (for Phase 2)
- Sequelize advanced patterns
- Testing services

**Time:** Already familiar (existing codebase)

### DevOps/Operations
**Must Learn:**
1. [Docker Setup](../DEPLOYMENT/DOCKER_SETUP.md)
2. [Environment Config](../DEPLOYMENT/ENVIRONMENT_CONFIG.md)
3. [Deployment](../DEPLOYMENT/README.md)

**Nice to Know:**
- Docker advanced topics
- PostgreSQL administration
- Monitoring setup

**Time:** 1-2 weeks

---

## Quick Reference Guides

### I Need to Know...

**...how Svelte works**
→ [Svelte Basics](./SVELTE_BASICS.md)

**...how to build a component**
→ [Component Pattern](../PATTERNS/COMPONENT_PATTERN.md)

**...how forms work**
→ [Form Pattern](../PATTERNS/FORM_PATTERN.md)

**...how to fetch data from API**
→ [Phase 1 API Client](../MODERNIZATION/PHASE_1_API_CLIENT.md)

**...how stores work**
→ [Phase 1 Stores](../MODERNIZATION/PHASE_1_STORES.md)

**...how Express controllers work**
→ [Backend Architecture](../ARCHITECTURE/BACKEND/README.md)

**...how to write tests**
→ [Testing Pattern](../PATTERNS/TESTING_PATTERN.md)

**...TypeScript syntax**
→ [TypeScript Guidelines](./TYPESCRIPT_GUIDELINES.md)

---

## Learning By Example

### Example: Adding a New Field to Flight Form

**1. Understand Feature**
- Read [Flight Management](../FEATURES/FLIGHT_MANAGEMENT.md)

**2. Follow Pattern**
- Read [Form Pattern](../PATTERNS/FORM_PATTERN.md)

**3. Look at Existing Code**
- Find `FlightForm.svelte`
- Review how existing fields work

**4. Make Change**
- Add new field following pattern
- Update component
- Update API
- Test

**5. Learn**
- Ask questions
- Get code reviewed
- Document what you learned

---

## External Learning Resources

### Official Docs (Highly Recommended)
- **Svelte:** https://svelte.dev
- **SvelteKit:** https://kit.svelte.dev
- **Express:** https://expressjs.com
- **Sequelize:** https://sequelize.org
- **PostgreSQL:** https://www.postgresql.org/docs/

### YouTube Channels
- Svelte Society (official)
- Net Ninja (Svelte tutorials)
- Traversy Media (web dev)

### Interactive Learning
- Svelte tutorial on svelte.dev (interactive)
- SvelteKit docs with examples
- Express.js official guides

See: [External Resources](./EXTERNAL_RESOURCES.md)

---

## Learning Styles

### If You Learn by Reading
→ Read the official docs
→ Check [External Resources](./EXTERNAL_RESOURCES.md)

### If You Learn by Doing
→ Follow [Svelte Basics](./SVELTE_BASICS.md) examples
→ Build a small component
→ Add a feature to Bluebonnet

### If You Learn by Watching
→ Find YouTube tutorials
→ Watch official walkthrough videos
→ Pair program with team member

### If You Learn by Teaching
→ Explain concept to team member
→ Write documentation
→ Code review others' work

---

## Time Estimates

### To Be Productive

| Role | Time | Focus |
|------|------|-------|
| **Frontend (Svelte)** | 1-2 weeks | Components, state, forms |
| **Backend (Express)** | Already familiar | Patterns, TypeScript |
| **DevOps** | 1 week | Docker, deployment |
| **Full-stack** | 2-3 weeks | Both frontend + backend |

### To Be Proficient

| Role | Time | Includes |
|------|------|----------|
| **Frontend** | 4-6 weeks | Advanced patterns, performance |
| **Backend** | 2-3 weeks | Services layer, TypeScript |
| **Full-stack** | 6-8 weeks | All skills at comfortable level |

---

## Learning Milestones

### Week 1: Foundation
- [ ] Understand architecture
- [ ] Run app locally
- [ ] Read framework basics
- [ ] Ask lots of questions

### Week 2: First Feature
- [ ] Build first component/endpoint
- [ ] Get code reviewed
- [ ] Make changes from review
- [ ] Celebrate!

### Week 3: Comfortable
- [ ] Build features without heavy review
- [ ] Debug issues independently
- [ ] Help other developers
- [ ] Suggest improvements

### Week 4+: Productive
- [ ] Contribute to complex features
- [ ] Mentor new developers
- [ ] Improve documentation
- [ ] Lead discussions

---

## Recommended Reading Order

1. **Start:** [Getting Started](../GETTING_STARTED.md)
2. **Then:** [Development](../DEVELOPMENT.md)
3. **Then:** [Architecture Overview](../ARCHITECTURE/README.md)
4. **Then:** Role-specific (Frontend/Backend)
5. **Then:** [Patterns](../PATTERNS/)
6. **Then:** [Features](../FEATURES/)
7. **Ongoing:** Reference guides as needed

---

## Asking for Help

### How to Ask Good Questions
- **Be specific:** "X doesn't work" → Show error message
- **Provide context:** What were you trying to do?
- **Show what you tried:** What solutions didn't work?
- **Ask for help, not answers:** Help me understand, not just fix it

### Where to Ask
- Team Slack/Discord
- Code review comments
- In-person pair programming
- Documentation issues

### How to Help Others
- Explain, don't just tell the answer
- Point to relevant docs
- Pair program if complex
- Update docs if you learned something

---

## Resources

- **[Svelte Basics](./SVELTE_BASICS.md)** - Svelte quick reference
- **[SvelteKit Basics](./SVELTEKIT_BASICS.md)** - SvelteKit quick reference
- **[TypeScript Guidelines](./TYPESCRIPT_GUIDELINES.md)** - TypeScript best practices
- **[Database Basics](./DATABASE_BASICS.md)** - Database concepts
- **[External Resources](./EXTERNAL_RESOURCES.md)** - Links to official docs
- **[Patterns](../PATTERNS/README.md)** - Design patterns
- **[Features](../FEATURES/README.md)** - Feature guides

---

**Last Updated:** 2025-12-17
**Most Popular:** Svelte Basics
**Recommended First Read:** Getting Started → Development → Architecture
