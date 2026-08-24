# 📚 BUG SQUAD – RESTful API Specification

This document provides complete API reference for all endpoints across BUG SQUAD backend micro-services.

---

## 🔐 1. Authentication & User Management (`/api/auth`, `/api/users`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new user account |
| `POST` | `/api/auth/login` | Public | Authenticate user and return JWT token |
| `GET` | `/api/auth/me` | Private | Get current authenticated user profile |
| `PUT` | `/api/auth/profile` | Private | Update current user profile details |
| `GET` | `/api/users` | Private | Get all registered users list |
| `POST` | `/api/users` | Admin | Create user account manually |
| `PUT` | `/api/users/:id` | Admin | Update user role (`Admin`, `QA Manager`, `Tester`, `Developer`) or status |
| `DELETE` | `/api/users/:id` | Admin | Soft-delete user account |

---

## 📁 2. Projects & Modules (`/api/projects`, `/api/modules`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/projects` | Private | List all active/archived projects |
| `POST` | `/api/projects` | Admin, QA Mgr | Create new project with custom project code (`PRJ-XXXX`) |
| `GET` | `/api/projects/:id` | Private | Get project details, modules, and defect stats |
| `PUT` | `/api/projects/:id` | Admin, QA Mgr | Update project details or archive status |
| `DELETE` | `/api/projects/:id` | Admin | Delete project record |
| `GET` | `/api/modules` | Private | List modules for project |
| `POST` | `/api/modules` | Private | Create project module |

---

## 🐞 3. Bug Management & Defect Lifecycle (`/api/bugs`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/bugs` | Private | List bugs with filtering (project, status, severity, assignee) |
| `POST` | `/api/bugs` | Private | Report new defect ticket (auto-increment `BUG-0001`) |
| `GET` | `/api/bugs/:id` | Private | Get defect details, comments, and audit history |
| `PUT` | `/api/bugs/:id` | Private | Update bug details |
| `PUT` | `/api/bugs/:id/status` | Private | Update defect status (`New` → `Assigned` → `In Progress` → `Fixed` → `Closed` / `Reopened`) |
| `PUT` | `/api/bugs/:id/assign` | Private | Reassign bug to developer |
| `POST` | `/api/bugs/:id/comments` | Private | Post comment with optional `@mentions` |

---

## 🧪 4. Test Cases, Execution & Test Management (`/api/test-cases`, `/api/test-runs`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/test-cases` | Private | List test cases repository |
| `POST` | `/api/test-cases` | Private | Create test case (`TC-0001`) |
| `GET` | `/api/test-plans` | Private | List test plans (`TP-0001`) |
| `POST` | `/api/test-plans` | Private | Create test strategy plan |
| `GET` | `/api/test-suites` | Private | List test suites (`SUITE-0001`) |
| `POST` | `/api/test-suites` | Private | Create test suite |
| `GET` | `/api/test-runs` | Private | List test execution runs (`TR-0001`) |
| `POST` | `/api/test-runs` | Private | Create test run |
| `POST` | `/api/test-runs/:id/execute` | Private | Log test execution step verdict (`Passed`, `Failed`, `Blocked`, `Skipped`) |

---

## 🔗 5. Requirements & Traceability Matrix (`/api/requirements`, `/api/traceability`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/requirements` | Private | List requirements (`REQ-0001`) |
| `POST` | `/api/requirements` | Private | Create requirement with acceptance criteria |
| `GET` | `/api/traceability` | Private | Aggregates Requirement Traceability Matrix (`Requirement → Test Cases → Test Runs → Bugs → Coverage %`) |

---

## 🏷️ 6. Release Governance & Quality Gates (`/api/releases`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/releases` | Private | List software releases (`REL-0001`) |
| `POST` | `/api/releases` | Admin, QA Mgr | Create release with Quality Gate threshold rules |
| `POST` | `/api/releases/:id/sign-off` | QA Manager | Formal QA Sign-Off approval (`Approved` / `Rejected`) |

---

## 🤖 7. AI QA Assistant & Analytics (`/api/ai`, `/api/analytics`, `/api/sla`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/ai/chat` | Private | Interactive AI QA Assistant chat |
| `POST` | `/api/ai/analyze-bug` | Private | Analyzes defect title/description for suggested severity & root cause |
| `POST` | `/api/ai/similar-bugs` | Private | Real-time duplicate defect check |
| `POST` | `/api/ai/generate-test-cases` | Private | Generates test cases from requirement input |
| `POST` | `/api/ai/bug-triage` | Admin, QA Mgr | Batch triage open defects |
| `GET` | `/api/analytics/overview` | Private | Overall QA KPIs and execution metrics |
| `GET` | `/api/analytics/bugs` | Private | Bug backlog trend, aging buckets, and reopen rate % |
| `GET` | `/api/sla/dashboard` | Private | Real-time SLA compliance rate %, countdowns, and breach logs |
