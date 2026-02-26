# System Architecture Diagram

## Real-Time Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                    │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐         │
│  │ Web App  │    │ Mobile   │    │ Desktop  │    │   API    │         │
│  │ (React)  │    │  (iOS)   │    │  (Elect) │    │  Client  │         │
│  └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘         │
└───────┼───────────────┼───────────────┼───────────────┼────────────────┘
        │               │               │               │
        └───────────────┴───────────────┴───────────────┘
                                │
                    ┌───────────▼───────────┐
                    │   LOAD BALANCER       │
                    │   (Nginx/ALB)         │
                    └───────────┬───────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────▼────────┐    ┌────────▼────────┐    ┌────────▼────────┐
│  FastAPI       │    │  FastAPI        │    │  FastAPI        │
│  Instance 1    │    │  Instance 2     │    │  Instance N     │
│  (Port 8000)   │    │  (Port 8001)    │    │  (Port 800N)    │
└───────┬────────┘    └────────┬────────┘    └────────┬────────┘
        │                      │                       │
        └──────────────────────┼───────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
┌───────▼────────┐    ┌────────▼────────┐    ┌──────▼──────┐
│  PostgreSQL    │    │  Redis Cache    │    │  Redis      │
│  + pgvector    │    │  (Session/Data) │    │  (Queue)    │
│  (Port 5432)   │    │  (Port 6379)    │    │  (Port 6379)│
└───────┬────────┘    └─────────────────┘    └──────┬──────┘
        │                                            │
        │                                            │
        │                    ┌───────────────────────┘
        │                    │
        │            ┌───────▼────────┐
        │            │  Celery Worker │
        │            │  (Background)  │
        │            └───────┬────────┘
        │                    │
        │            ┌───────▼────────┐
        │            │  Celery Beat   │
        │            │  (Scheduler)   │
        │            └───────┬────────┘
        │                    │
        └────────────────────┼────────────────────┐
                             │                    │
                    ┌────────▼────────┐    ┌──────▼──────┐
                    │   OpenAI API    │    │   AWS S3    │
                    │   (GPT-4)       │    │  (Storage)  │
                    └─────────────────┘    └─────────────┘
```

## Component Interaction Timeline

### Document Upload (Real-Time)

```
Time    Client          FastAPI         Celery          OpenAI          Database
─────────────────────────────────────────────────────────────────────────────
0s      Upload PDF ──→
1s                      Validate ──→
2s                      Save Meta ──────────────────────────────────────→ ✓
3s                      Queue Task ──→
4s                                      Extract Text
8s                                      Classify ──────→
11s                                                     GPT-4 ←──────────
14s                                     Summary ───────→
17s                                                     GPT-4 ←──────────
20s                                     Extract Info ──→
23s                                                     GPT-4 ←──────────
26s                                     Embeddings ────→
28s                                                     API ←────────────
30s                                     Save All ───────────────────────→ ✓
31s     ←── Webhook ────
```

### AI Query (Real-Time)

```
Time    Client          FastAPI         pgvector        OpenAI          Response
──────────────────────────────────────────────────────────────────────────────
0s      Ask Query ──→
0.5s                    Embed Query ────────────────→
1.5s                                                    API ←───────────
2s                      Vector Search ──→
2.5s                                    Results ←──
3s                      Build Context
3.5s                    GPT-4 Query ────────────────→
6s                                                      Answer ←────────
6.5s    ←── Response ───
```

## Deployment Architecture

### Development
```
┌─────────────────────────────────────┐
│  Docker Compose (localhost)         │
│  ┌─────────┐  ┌─────────┐          │
│  │ FastAPI │  │ Celery  │          │
│  └────┬────┘  └────┬────┘          │
│       │            │                │
│  ┌────▼────┐  ┌───▼─────┐          │
│  │ Postgres│  │  Redis  │          │
│  └─────────┘  └─────────┘          │
└─────────────────────────────────────┘
```

### Production (AWS)
```
┌──────────────────────────────────────────────────────────┐
│                    AWS Cloud                              │
│  ┌────────────────────────────────────────────────────┐  │
│  │  VPC (10.0.0.0/16)                                 │  │
│  │                                                     │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │  Public Subnet (10.0.1.0/24)                │  │  │
│  │  │  ┌──────────┐         ┌──────────┐          │  │  │
│  │  │  │   ALB    │────────→│  CloudFr │          │  │  │
│  │  │  └────┬─────┘         └──────────┘          │  │  │
│  │  └───────┼──────────────────────────────────────┘  │  │
│  │          │                                          │  │
│  │  ┌───────▼──────────────────────────────────────┐  │  │
│  │  │  Private Subnet (10.0.2.0/24)                │  │  │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐   │  │  │
│  │  │  │ ECS Task │  │ ECS Task │  │ ECS Task │   │  │  │
│  │  │  │ FastAPI  │  │ FastAPI  │  │  Celery  │   │  │  │
│  │  │  └────┬─────┘  └────┬─────┘  └────┬─────┘   │  │  │
│  │  └───────┼─────────────┼─────────────┼─────────┘  │  │
│  │          │             │             │             │  │
│  │  ┌───────▼─────────────▼─────────────▼─────────┐  │  │
│  │  │  Data Subnet (10.0.3.0/24)                  │  │  │
│  │  │  ┌──────────┐         ┌──────────┐          │  │  │
│  │  │  │   RDS    │         │ElastiCache│         │  │  │
│  │  │  │Postgres  │         │  Redis   │          │  │  │
│  │  │  └──────────┘         └──────────┘          │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────┘  │
│                                                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │     S3      │  │  CloudWatch │  │   Secrets   │  │
│  │  (Storage)  │  │ (Monitoring)│  │   Manager   │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
└──────────────────────────────────────────────────────┘
```

## Data Flow Patterns

### 1. Synchronous (Real-Time)
```
Client → API → Database → Response
Time: < 1 second
Use: Login, List, Get, Update
```

### 2. Asynchronous (Background)
```
Client → API → Queue → Worker → Database
Time: 15-30 seconds
Use: Document Processing, AI Analysis
```

### 3. Scheduled (Periodic)
```
Celery Beat → Worker → Database → Notifications
Time: Every hour/day
Use: Compliance Checks, Alerts
```

### 4. Event-Driven (WebSocket)
```
Database Change → Event → WebSocket → Client
Time: < 100ms
Use: Real-time Updates, Notifications
```

## Performance Optimization

### Caching Strategy
```
Request → Check Redis → Cache Hit? → Return
                      ↓ Cache Miss
                   Database → Store in Redis → Return
```

### Database Optimization
```
Write: Master DB (Single)
Read: Replica DB (Multiple)
Search: pgvector Index (Fast)
```

### Load Balancing
```
Round Robin: Request 1 → Server 1
             Request 2 → Server 2
             Request 3 → Server 3
             Request 4 → Server 1 (cycle)
```
