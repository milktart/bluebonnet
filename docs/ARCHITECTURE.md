# Travel Planner - System Architecture

This document provides a comprehensive overview of the Travel Planner application architecture, including system design, data flow, and component interactions.

## Table of Contents

- [System Overview](#system-overview)
- [High-Level Architecture](#high-level-architecture)
- [Application Layers](#application-layers)
- [Database Architecture](#database-architecture)
- [Authentication Flow](#authentication-flow)
- [Caching Strategy](#caching-strategy)
- [Request Flow](#request-flow)

---

## System Overview

Travel Planner is a full-stack web application built with Node.js, Express, PostgreSQL, and Redis. It follows a service-oriented architecture with clear separation of concerns across multiple layers.

### Tech Stack

- **Backend**: Node.js 20 LTS, Express.js
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **View Engine**: EJS (Server-side rendering)
- **Frontend**: Vanilla JavaScript (ES Modules), Tailwind CSS
- **Build Tools**: esbuild, Tailwind CLI
- **Testing**: Jest, Supertest
- **Deployment**: Docker, Docker Compose

---

## High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
        Mobile[Mobile Browser]
    end

    subgraph "Load Balancer"
        LB[Nginx/ALB]
    end

    subgraph "Application Layer"
        App1[Node.js App Instance 1]
        App2[Node.js App Instance 2]
        App3[Node.js App Instance N]
    end

    subgraph "Cache Layer"
        Redis[(Redis Cache)]
        SessionStore[Redis Session Store]
    end

    subgraph "Data Layer"
        PG[(PostgreSQL Database)]
        PGReplica[(PostgreSQL Replica)]
    end

    subgraph "External Services"
        Sentry[Error Monitoring]
        CDN[Static Asset CDN]
    end

    Browser --> LB
    Mobile --> LB
    LB --> App1
    LB --> App2
    LB --> App3

    App1 --> Redis
    App2 --> Redis
    App3 --> Redis

    App1 --> SessionStore
    App2 --> SessionStore
    App3 --> SessionStore

    App1 --> PG
    App2 --> PG
    App3 --> PG

    PG --> PGReplica

    App1 --> Sentry
    App2 --> Sentry
    App3 --> Sentry

    Browser --> CDN
    Mobile --> CDN

    style Browser fill:#e1f5ff
    style Mobile fill:#e1f5ff
    style PG fill:#336791
    style Redis fill:#dc382d
    style App1 fill:#68a063
    style App2 fill:#68a063
    style App3 fill:#68a063
```

---

## Application Layers

### Layer Architecture

```mermaid
graph LR
    subgraph "Presentation Layer"
        Views[EJS Templates]
        Static[Static Assets]
        Client[Client-side JS]
    end

    subgraph "API Layer"
        Routes[Express Routes]
        Middleware[Middleware Stack]
        Controllers[Controllers]
    end

    subgraph "Business Logic Layer"
        Services[Service Layer]
        Utils[Utility Functions]
    end

    subgraph "Data Access Layer"
        Models[Sequelize Models]
        Cache[Cache Service]
    end

    subgraph "Infrastructure"
        DB[(PostgreSQL)]
        RedisDB[(Redis)]
    end

    Client --> Routes
    Views --> Routes
    Routes --> Middleware
    Middleware --> Controllers
    Controllers --> Services
    Services --> Models
    Services --> Cache
    Services --> Utils
    Models --> DB
    Cache --> RedisDB

    style Views fill:#f9f9f9
    style Routes fill:#4CAF50
    style Services fill:#2196F3
    style Models fill:#FF9800
    style DB fill:#336791
    style RedisDB fill:#dc382d
```

### Directory Structure

```
bluebonnet/
├── config/              # Configuration files
│   ├── database.js      # Database configuration
│   └── passport.js      # Authentication configuration
├── controllers/         # Request handlers
│   ├── tripController.js
│   ├── flightController.js
│   └── ...
├── models/              # Sequelize models (Data layer)
│   ├── User.js
│   ├── Trip.js
│   └── ...
├── routes/              # Express routes (API layer)
│   ├── index.js
│   ├── trips.js
│   ├── api/             # API v1 routes
│   └── ...
├── services/            # Business logic layer
│   ├── tripService.js
│   ├── airportService.js
│   ├── cacheService.js
│   └── ...
├── middleware/          # Express middleware
│   ├── auth.js
│   ├── errorHandler.js
│   └── ...
├── utils/               # Utility functions
│   ├── logger.js
│   ├── redis.js
│   └── ...
├── views/               # EJS templates
│   ├── trips/
│   ├── partials/
│   └── ...
├── public/              # Static assets
│   ├── js/
│   ├── css/
│   └── dist/            # Built assets
└── tests/               # Test suites
    ├── unit/
    └── integration/
```

---

## Database Architecture

### Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Trip : owns
    User ||--o{ TravelCompanion : creates
    User ||--o{ Voucher : owns
    User ||--o{ Notification : receives

    Trip ||--o{ Flight : contains
    Trip ||--o{ Hotel : contains
    Trip ||--o{ Transportation : contains
    Trip ||--o{ CarRental : contains
    Trip ||--o{ Event : contains
    Trip ||--o{ TripCompanion : has
    Trip ||--o{ TripInvitation : has

    TravelCompanion ||--o{ TripCompanion : participates
    TravelCompanion ||--o{ ItemCompanion : assigned
    TravelCompanion ||--o{ CompanionRelationship : linked

    Flight ||--o{ ItemCompanion : has
    Event ||--o{ ItemCompanion : has

    Voucher ||--o{ VoucherAttachment : attached_to
    Flight ||--o{ VoucherAttachment : uses

    Airport ||--o{ Flight : "departure"
    Airport ||--o{ Flight : "arrival"

    User {
        uuid id PK
        string email UK
        string password
        string firstName
        string lastName
        timestamp createdAt
        timestamp updatedAt
    }

    Trip {
        uuid id PK
        uuid userId FK
        string name
        date departureDate
        date returnDate
        string purpose
        text description
        timestamp createdAt
        timestamp updatedAt
    }

    Flight {
        uuid id PK
        uuid tripId FK
        string flightNumber
        string origin
        string destination
        timestamp departureDateTime
        timestamp arrivalDateTime
        string seatNumber
        string confirmationCode
        text notes
        timestamp createdAt
        timestamp updatedAt
    }

    TravelCompanion {
        uuid id PK
        uuid createdBy FK
        uuid userId FK
        string name
        string email
        date dateOfBirth
        string relationship
        timestamp createdAt
        timestamp updatedAt
    }

    Voucher {
        uuid id PK
        uuid userId FK
        string type
        string issuer
        string voucherNumber
        decimal totalValue
        decimal usedAmount
        string status
        date expirationDate
        timestamp createdAt
        timestamp updatedAt
    }
```

### Database Indexes

Key indexes for performance optimization:

- **Users**: `email` (unique), `id` (primary key)
- **Trips**: `userId`, `departureDate`, `returnDate`
- **Flights**: `tripId`, `departureDateTime`, `origin`, `destination`
- **Airports**: `iata` (primary key), `city`, `name`
- **Vouchers**: `userId`, `status`, `expirationDate`
- **TravelCompanions**: `createdBy`, `userId`, `email`

---

## Authentication Flow

```mermaid
sequenceDiagram
    participant Browser
    participant Express
    participant Passport
    participant Session
    participant Redis
    participant Database

    Browser->>Express: POST /auth/login
    Express->>Passport: authenticate('local')
    Passport->>Database: SELECT * FROM users WHERE email=?
    Database-->>Passport: User record
    Passport->>Passport: bcrypt.compare(password, hash)

    alt Authentication Success
        Passport-->>Express: Authenticated user
        Express->>Session: Create session
        Session->>Redis: Store session data
        Redis-->>Session: Session ID
        Session-->>Browser: Set-Cookie: connect.sid
        Browser->>Express: Subsequent requests with cookie
        Express->>Session: Deserialize session
        Session->>Redis: Get session data
        Redis-->>Session: User session
        Session-->>Express: req.user populated
    else Authentication Failure
        Passport-->>Express: Authentication failed
        Express-->>Browser: 401 Unauthorized
    end
```

---

## Caching Strategy

### Cache Architecture

```mermaid
graph TB
    subgraph "Application Layer"
        Controller[Controller]
        Service[Service Layer]
        CacheService[Cache Service]
    end

    subgraph "Cache Layer"
        Redis[(Redis)]
    end

    subgraph "Database Layer"
        PG[(PostgreSQL)]
    end

    Controller -->|1. Request data| Service
    Service -->|2. Check cache| CacheService
    CacheService -->|3. Get| Redis

    Redis -->|4a. Cache HIT| CacheService
    CacheService -->|5a. Return cached data| Service

    Redis -->|4b. Cache MISS| CacheService
    CacheService -->|5b. Fetch from DB| PG
    PG -->|6. Return data| CacheService
    CacheService -->|7. Cache result| Redis
    CacheService -->|8. Return data| Service

    Service -->|9. Return response| Controller

    style Redis fill:#dc382d
    style PG fill:#336791
    style CacheService fill:#2196F3
```

### Cache Keys & TTLs

| Data Type       | Cache Key Pattern                     | TTL        | Invalidation            |
| --------------- | ------------------------------------- | ---------- | ----------------------- |
| Airports        | `airport:code:{IATA}`                 | 24 hours   | Never (static data)     |
| Airport Search  | `airport:search:{query}:{limit}`      | 24 hours   | Never                   |
| User Trips      | `trips:user:{userId}:{filter}:{page}` | 5 minutes  | On create/update/delete |
| Trip Statistics | `trips:stats:{userId}`                | 10 minutes | On trip changes         |
| User Companions | `companions:user:{userId}`            | 5 minutes  | On create/update/delete |
| User Vouchers   | `vouchers:user:{userId}`              | 5 minutes  | On create/update/delete |
| Sessions        | `sess:{sessionId}`                    | 24 hours   | On logout               |

---

## Request Flow

### Standard HTTP Request Flow

```mermaid
sequenceDiagram
    participant Client
    participant Routes
    participant Auth
    participant RateLimit
    participant Controller
    participant Service
    participant Cache
    participant Model
    participant Database

    Client->>Routes: GET /trips
    Routes->>Auth: ensureAuthenticated()
    Auth->>Auth: Check session

    alt Authenticated
        Auth->>RateLimit: Check rate limit
        RateLimit->>Controller: tripController.listTrips()
        Controller->>Service: tripService.getUserTrips()
        Service->>Cache: getCachedUserTrips()

        alt Cache Hit
            Cache-->>Service: Cached data
            Service-->>Controller: Trip data
        else Cache Miss
            Cache->>Model: Trip.findAll()
            Model->>Database: SELECT * FROM trips...
            Database-->>Model: Result set
            Model-->>Service: Trip records
            Service->>Cache: cacheUserTrips()
            Service-->>Controller: Trip data
        end

        Controller-->>Routes: Render response
        Routes-->>Client: HTML/JSON response
    else Not Authenticated
        Auth-->>Client: 302 Redirect to /auth/login
    end
```

### API Request Flow (JSON)

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Validator
    participant Service
    participant Cache
    participant Database

    Client->>API: POST /api/v1/trips
    API->>Validator: express-validator

    alt Validation Success
        Validator->>Service: createTrip(data)
        Service->>Database: INSERT INTO trips
        Database-->>Service: New trip record
        Service->>Cache: invalidateUserTrips()
        Service-->>API: Created trip
        API-->>Client: 201 Created + JSON
    else Validation Failure
        Validator-->>Client: 400 Bad Request + errors
    end
```

---

## Service Layer Architecture

### Service Pattern

```mermaid
classDiagram
    class BaseService {
        +Model model
        +String modelName
        +findById(id)
        +create(data)
        +update(instance, data)
        +delete(instance)
        +count(where)
        +findByIdAndVerifyOwnership(id, userId)
    }

    class TripService {
        +getUserTrips(userId, options)
        +getTripWithDetails(tripId, userId)
        +createTrip(data, userId)
        +updateTrip(tripId, data, userId)
        +deleteTrip(tripId, userId)
        +getTripStatistics(userId)
        +searchTrips(userId, query, limit)
    }

    class AirportService {
        +getAirportByCode(iataCode)
        +searchAirports(query, limit)
        +getAirlineByCode(iataCode)
        +parseFlightNumber(flightNumber)
    }

    class CacheService {
        +getCachedAirportByCode(code)
        +cacheAirportByCode(code, data)
        +getCachedUserTrips(userId, filter, page)
        +cacheUserTrips(userId, filter, page, data)
        +invalidateUserTrips(userId)
        +invalidateTripStats(userId)
    }

    BaseService <|-- TripService
    TripService --> CacheService : uses
    TripService --> AirportService : uses
```

---

## Deployment Architecture

### Docker Compose (Development)

```mermaid
graph TB
    subgraph "Docker Network"
        App[Node.js App Container]
        PG[PostgreSQL Container]
        Redis[Redis Container]
    end

    App -->|5432| PG
    App -->|6379| Redis

    Host[Host Machine :3501] --> App

    AppVol[App Volume Mount ./:/app]
    NodeVol[Node Modules Volume]
    PGVol[PostgreSQL Data Volume]
    RedisVol[Redis Data Volume]

    App -.->|mount| AppVol
    App -.->|mount| NodeVol
    PG -.->|mount| PGVol
    Redis -.->|mount| RedisVol

    style App fill:#68a063
    style PG fill:#336791
    style Redis fill:#dc382d
```

### Production Deployment (Multi-Stage Docker)

```mermaid
graph LR
    subgraph "Build Stage"
        Builder[Node:18-alpine Builder]
        NPM[npm ci]
        Build[npm run build]
        Prune[npm prune --production]
    end

    subgraph "Production Stage"
        Prod[Node:18-alpine Production]
        NonRoot[Non-root User nodejs]
        HealthCheck[Health Check Endpoint]
    end

    Builder --> NPM
    NPM --> Build
    Build --> Prune
    Prune -->|Copy artifacts| Prod
    Prod --> NonRoot
    Prod --> HealthCheck

    style Builder fill:#f9f9f9
    style Prod fill:#68a063
```

---

## Technology Decisions

### Why These Technologies?

| Technology     | Reason                                                                     |
| -------------- | -------------------------------------------------------------------------- |
| **Node.js**    | Non-blocking I/O, excellent for I/O-heavy operations, large ecosystem      |
| **Express**    | Minimal, flexible, industry standard, excellent middleware ecosystem       |
| **PostgreSQL** | ACID compliance, complex queries, JSON support, strong consistency         |
| **Redis**      | In-memory speed, persistence, pub/sub, session storage                     |
| **EJS**        | Server-side rendering for SEO, simple syntax, works well with Express      |
| **esbuild**    | 100x faster than webpack, simple configuration, native ESM support         |
| **Jest**       | All-in-one testing solution, excellent mocking, great developer experience |
| **Sequelize**  | Mature ORM, good PostgreSQL support, migration system                      |

---

## Security Architecture

### Security Layers

```mermaid
graph TB
    subgraph "Request Security"
        RateLimit[Rate Limiting]
        CORS[CORS Protection]
        Helmet[Helmet Headers]
    end

    subgraph "Authentication"
        Session[Session Management]
        Passport[Passport.js]
        BCrypt[Password Hashing]
    end

    subgraph "Authorization"
        Ownership[Resource Ownership]
        RBAC[Role-Based Access]
    end

    subgraph "Data Security"
        Validation[Input Validation]
        Sanitization[Data Sanitization]
        Prepared[Prepared Statements]
    end

    Request[Incoming Request] --> RateLimit
    RateLimit --> CORS
    CORS --> Helmet
    Helmet --> Session
    Session --> Passport
    Passport --> Ownership
    Ownership --> Validation
    Validation --> Sanitization
    Sanitization --> Prepared

    style RateLimit fill:#FF5722
    style Session fill:#2196F3
    style Ownership fill:#4CAF50
    style Validation fill:#FF9800
```

---

## Performance Optimizations

### Implemented Optimizations

1. **Redis Caching**
   - Airport data: 24-hour TTL (static data)
   - User trips: 5-minute TTL with invalidation
   - Session storage: Redis-backed sessions

2. **Database Indexing**
   - Strategic indexes on frequently queried columns
   - Composite indexes for common query patterns

3. **Code Splitting**
   - esbuild bundles with code splitting
   - Separate bundles per page (dashboard, trip-view, map-view)
   - Shared chunks for common code

4. **Compression**
   - Gzip compression for all HTTP responses
   - Reduces bandwidth by ~70%

5. **Connection Pooling**
   - Sequelize connection pool (max 5 connections)
   - Redis connection reuse

---

## Monitoring & Observability

### Health Check Response

```json
{
  "status": "ok",
  "timestamp": "2025-11-19T14:30:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "version": "1.0.0",
  "database": "connected",
  "redis": "connected"
}
```

### Logging Strategy

- **Winston** for structured logging
- Log levels: error, warn, info, debug
- Separate log files for errors
- Daily log rotation
- JSON format for easy parsing

---

## Future Architecture Considerations

1. **Microservices Migration**
   - Split into airport, trip, auth, notification services
   - API Gateway pattern
   - Service mesh (Istio/Linkerd)

2. **Event-Driven Architecture**
   - Message queue (RabbitMQ/Kafka)
   - Async job processing
   - Event sourcing for audit trail

3. **GraphQL API**
   - Alternative to REST
   - Client-driven queries
   - Reduced over-fetching

4. **Serverless Functions**
   - Lambda/Cloud Functions for batch jobs
   - Scheduled tasks (voucher expiration checks)
   - Email notifications

---

## References

- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [PostgreSQL Performance Tips](https://www.postgresql.org/docs/current/performance-tips.html)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
