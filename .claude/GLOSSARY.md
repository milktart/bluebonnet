# 📖 Glossary - Bluebonnet Terminology

Quick reference for terms used in Bluebonnet documentation and codebase.

---

## Travel Domain

**Companion** - A person invited to a trip. Can have edit permissions. May be linked to a user account.

**Event** - An activity or attraction during a trip (concert, museum visit, meeting).

**Flight** - Commercial airline flight with departure, arrival, airline, and seat information.

**Hotel** - Accommodation with check-in and check-out dates.

**Item** - Generic term for any travel component (flight, hotel, event, car rental, transportation).

**Layover** - A stop between two flights where passenger disembarks.

**PNR (Passenger Name Record)** - Unique booking reference number for a flight (e.g., "ABC123").

**Trip** - A collection of travel items (flights, hotels, events) with start and end dates.

**Transportation** - Ground transportation (taxi, shuttle, train, bus) between locations.

**Car Rental** - Vehicle rental information with pickup/return details.

**Travel Companion** - System for managing people invited to trips with permissions.

**Voucher** - Travel credit, upgrade coupon, or gift card attached to specific items.

---

## Technical Terms

**AJAX** - Asynchronous JavaScript and XML. Technique for updating page without full reload.

**API** - Application Programming Interface. Endpoints for frontend to communicate with backend.

**Async** - Asynchronous. Operations that don't block execution (like API calls).

**Backend** - Server-side code (Express, controllers, database logic).

**Breakpoint** - Pause point in debugger where code execution stops.

**Bundle** - Packaged JavaScript sent to browser (created by esbuild).

**Cache** - Temporary storage (Redis for server, browser for client).

**CLI** - Command Line Interface. Terminal commands like `npm install`.

**Component** - Reusable UI piece (Svelte component in Phase 1).

**Controller** - Express.js handler for route processing.

**CRUD** - Create, Read, Update, Delete. Basic data operations.

**CSS** - Cascading Style Sheets. Styling language.

**Database** - Persistent data storage (PostgreSQL).

**Dependency** - External package your code relies on (installed via npm).

**Deployment** - Moving code to production server.

**DOM** - Document Object Model. JavaScript representation of HTML.

**EJS** - Embedded JavaScript Templates. Current template engine (being replaced).

**Endpoint** - Single API route (e.g., `/api/flights/123`).

**Environment** - Development, staging, or production context.

**Error Handling** - Code that catches and manages errors gracefully.

**Express** - Node.js web framework for building APIs and servers.

**Frontend** - Client-side code (browser, JavaScript, HTML, CSS).

**Geocoding** - Converting address/name to latitude/longitude coordinates.

**Git** - Version control system for tracking code changes.

**Header** - HTTP header. Metadata sent with requests/responses.

**HTTP** - HyperText Transfer Protocol. Communication protocol for web.

**Middleware** - Code that processes requests/responses before route handlers.

**Migration** - Database schema change tracked in version control.

**Model** - Database entity definition (User, Trip, Flight, etc.).

**Node.js** - JavaScript runtime for server-side code.

**NPM** - Node Package Manager. Tool for installing dependencies.

**ORM** - Object-Relational Mapping. Sequelize maps database to JavaScript objects.

**Payload** - Data sent in request body (usually JSON).

**PostgreSQL** - Relational database management system.

**Promise** - JavaScript async pattern for handling delayed operations.

**Query** - Database request (e.g., SELECT \* FROM flights).

**Redis** - In-memory cache and data store.

**Request** - Browser asking server for something (GET, POST, PUT, DELETE).

**Response** - Server answer to a request.

**Route** - URL endpoint pattern (e.g., `/flights/:id`).

**Sequelize** - ORM for Node.js. Maps JavaScript to PostgreSQL.

**Session** - User's logged-in state stored on server.

**Sidebar** - Three-column layout: primary (always visible), secondary, tertiary (on-demand).

**Socket** - Real-time bidirectional communication (WebSocket).

**State** - Data held in memory (Svelte stores, form fields, etc.).

**Store** - Svelte reactive data container (authStore, tripStore, etc.).

**Svelte** - JavaScript framework for building reactive components (Phase 1).

**SvelteKit** - Full-stack Svelte framework with routing and server code (Phase 2 target).

**Template** - HTML structure with placeholders (EJS templates, Svelte components).

**Timezone** - Geographic region with consistent local time.

**TypeScript** - JavaScript with type checking (coming in Phase 2).

**UUID** - Universally Unique Identifier. Used for primary keys.

**Validation** - Checking data is correct format before processing.

**Middleware** - Functions that run before route handlers.

**Virtual Machine** - Container running isolated application environment (Docker).

**WebSocket** - Real-time two-way communication protocol.

---

## Architecture Terms

**MVC** - Model-View-Controller. Separation of concerns pattern (our architecture).

**REST** - Representational State Transfer. API design principles.

**API Contract** - Agreement about request/response format.

**Service Layer** - Business logic separate from controllers.

**Repository Pattern** - Data access abstraction layer.

**DRY** - Don't Repeat Yourself. Avoid code duplication.

**SOLID** - Software design principles (Single responsibility, Open/closed, etc.).

**Component-Based** - Building with reusable components instead of monolithic code.

**Stateless** - Server doesn't store client state (each request independent).

---

## Development Terms

**Branch** - Separate code version for working on features.

**Commit** - Saving code changes to version control with message.

**Merge** - Combining code from one branch to another.

**Pull Request** - Proposal to merge code, triggers code review.

**Rebase** - Reorganizing commits on top of another branch.

**Stash** - Temporarily saving changes without committing.

**Linting** - Checking code for style/error violations.

**Formatting** - Standardizing code appearance.

**Test Coverage** - Percentage of code tested by automated tests.

**Debugging** - Finding and fixing bugs in code.

**Breakpoint** - Point where debugger pauses execution.

**Stack Trace** - Error showing the function call chain.

**Regression** - New bug introduced by recent changes.

---

## Business Terms

**MVP** - Minimum Viable Product. Core features sufficient to launch.

**Scalability** - Ability to handle growth (more users, data).

**Performance** - Speed and efficiency of system.

**Maintainability** - Ease of understanding and modifying code.

**Technical Debt** - Accumulated shortcuts that make future work harder.

**Refactoring** - Improving code without changing behavior.

**Optimization** - Making code faster or more efficient.

---

## Abbreviations

| Abbreviation | Meaning                           |
| ------------ | --------------------------------- |
| API          | Application Programming Interface |
| AJAX         | Asynchronous JavaScript and XML   |
| DB           | Database                          |
| CRUD         | Create, Read, Update, Delete      |
| CSS          | Cascading Style Sheets            |
| DOM          | Document Object Model             |
| DRY          | Don't Repeat Yourself             |
| EJS          | Embedded JavaScript               |
| HTTP         | HyperText Transfer Protocol       |
| JSON         | JavaScript Object Notation        |
| MVC          | Model-View-Controller             |
| NPM          | Node Package Manager              |
| ORM          | Object-Relational Mapping         |
| PNR          | Passenger Name Record             |
| SQL          | Structured Query Language         |
| UUID         | Universally Unique Identifier     |

---

## Common Phrases

**"The request/response cycle"** - How data flows: browser → server → database → server → browser

**"State management"** - How application tracks and updates data

**"Business logic"** - Code representing real-world operations (rules, calculations)

**"Breaking the build"** - Committing code that prevents application from running

**"Technical debt"** - Shortcuts taken to ship quickly that create future burden

**"Edge case"** - Unusual input or scenario not typically considered

**"Atomic commit"** - One logical change in one commit

**"Code smell"** - Suspicious code that might indicate a problem

---

## When You See...

**"X is not defined"** → Variable/function doesn't exist or not imported

**"Cannot read property X of undefined"** → Trying to access property on null/undefined

**"Port already in use"** → Something else running on that port, use different port

**"EACCES: permission denied"** → Don't have permission to access file/directory

**"Module not found"** → Dependency not installed, run `npm install`

**"Migration already run"** → Database already applied this migration

**"Validation failed"** → Data doesn't match required format/constraints

**"CORS error"** → Browser blocking request from different domain

---

## Questions to Ask

**"What's the user flow?"** - How does user interact to accomplish goal?

**"What's the API contract?"** - What data goes in/out of endpoint?

**"What's the business logic?"** - What rules apply to this feature?

**"What are edge cases?"** - What unusual scenarios could happen?

**"What needs testing?"** - What parts are critical to verify?

---

**Last Updated:** 2025-12-17
**Keep Growing:** Add new terms as you learn them
