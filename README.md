# 🐞 BUG SQUAD – Enterprise QA Defect Tracking & Test Management System

**BUG SQUAD** is a state-of-the-art, full-stack enterprise QA defect management, test execution, requirements traceability, SLA compliance, and AI-assisted software testing platform built with Node.js, Express, MongoDB, React, Vite, and Vanilla CSS/Tailwind.

---

## 🚀 Key Features Across All 12 Phases

### 1. Authentication & Role-Based Access Control (RBAC)
- **4 Granular Roles**: `Admin`, `QA Manager`, `Tester`, `Developer`.
- JWT-based authentication with secure HTTP authorization headers and password hashing (`bcryptjs`).
- Protected frontend routes and backend middleware authorization.

### 2. Project & Module Management
- Multi-project repository with custom project codes (`PRJ-XXXX`).
- Module hierarchy, lead assignments, and project health tracking.

### 3. Comprehensive Bug Tracking & Lifecycle
- Defect tickets with auto-generated IDs (`BUG-0001`).
- Custom attributes: Severity (`Blocker`, `Critical`, `Major`, `Minor`, `Trivial`), Priority (`P1` to `P4`), Environment, Browser, OS, Steps to Reproduce, Expected vs Actual.
- Interactive status transition workflow (`New` → `Assigned` → `In Progress` → `Fixed` → `Retest` → `Closed` / `Reopened`).
- Threaded comments with `@mentions` and attachment file uploads.

### 4. Test Case & Scenario Management
- Test Case repository (`TC-0001`) with preconditions, steps, test data, and expected results.
- Positive, Negative, Boundary, Security, and Permission test scenario grouping.
- Interactive Test Execution Bench with step-by-step verdict logging (`Passed`, `Failed`, `Blocked`, `Skipped`).
- **Defect Auto-Creation**: One-click defect ticket creation from failed test execution steps.

### 5. Requirements Engineering & Traceability (RTM)
- Functional and Non-Functional Requirement management (`REQ-0001`) with Given/When/Then acceptance criteria.
- **Requirement Traceability Matrix (RTM)**: Dynamic MongoDB aggregation mapping `Requirement → Test Cases → Test Runs → Execution Verdicts → Linked Bugs → Coverage Rate %`.
- RTM export in PDF and Excel formats.

### 6. Release Governance & Quality Gates
- Version release management (`REL-0001`) with configurable Quality Gate threshold rules (`maxCriticalBugs`, `minPassRate%`, `minRequirementCoverage%`).
- Dynamic **PASS / FAIL** Quality Gate banner evaluation.
- Formal QA Manager Sign-Off approval flow (`Approved` / `Rejected`).

### 7. AI-Powered QA Assistant (`/ai-assistant`)
- **AI Defect Analyzer**: Recommends severity, priority, reproducibility, and root cause (requires explicit user confirmation before applying).
- **AI Bug Summary Generator**: Produces problem, impact, expected vs actual, and status summaries.
- **Real-Time Duplicate Bug Check**: Duplicate defect detection warning banner before ticket submission.
- **AI Test Case Generator**: Generates test cases from requirement descriptions.
- **AI Bug Triage (`/ai/bug-triage`)**: Batch defect triage for QA Managers.
- **AI Release Quality Analysis**: Summarizes release readiness without overriding Quality Gates.
- **Server-Side Security**: API secret keys stay 100% on the backend (`process.env.AI_API_KEY`). Daily & monthly user quota protection (`AIUsage.js`).

### 8. SLA Compliance Engine (`/sla`)
- Configurable response and resolution target hours per severity level in Admin settings (`/admin/sla`).
- Dynamic SLA status calculator: `SLA On Track`, `SLA At Risk`, `SLA Breached`, and remaining/overdue hours.
- Real-time SLA Countdown badge on Bug Details pages.

### 9. Advanced Analytics & Executive Dashboard (`/analytics`, `/management-dashboard`)
- Global Filter Toolbar (Project, Date Range).
- Bug Backlog Trend (`Closing = Opening + Created - Resolved`), Aging Buckets (`0-1d` to `30d+`), Reopen Rate %, Pass Rate %.
- **Executive Management Dashboard (`/management-dashboard`)**: 2-minute high-level view for QA Managers and System Admins evaluating overall portfolio health (`Healthy`, `At Risk`, `Critical`).

### 10. QA Reports, PDF & Excel Exports
- Corporate PDF reports: Bug PDF, QA Summary Report, Traceability Matrix PDF, Analytics Executive Report.
- Multi-sheet Excel exports: Bugs, Test Cases, Executions, Requirements, RTM, Analytics.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite 5, React Router DOM v6, Framer Motion, Lucide React Icons, React Hot Toast, TailwindCSS / Vanilla CSS, jsPDF, XLSX.
- **Backend**: Node.js, Express.js, Mongoose, JSON Web Tokens (`jsonwebtoken`), Bcrypt.js, CORS.
- **Database**: MongoDB (Local or MongoDB Atlas).

---

## 🔑 Demo User Accounts

The database seeder (`npm run seed` in `backend`) populates four realistic demo accounts with password `demo1234`:

| Role | Email | Password | Allowed Access |
|---|---|---|---|
| **Admin** | `admin@bugsquad.demo` | `demo1234` | Full system access, User management, AI settings, SLA config |
| **QA Manager** | `qa@bugsquad.demo` | `demo1234` | Analytics, SLA, Releases, Quality Gates, Sign-Off, Bug Triage |
| **Tester** | `tester@bugsquad.demo` | `demo1234` | Test creation, Test execution, Defect reporting, AI Test Generator |
| **Developer** | `developer@bugsquad.demo` | `demo1234` | Assigned defects, Defect status update, Root cause analysis |

---

## ⚙️ Quick Start & Installation Guide

### Prerequisites
- Node.js (v18 or higher)
- MongoDB server running locally on `mongodb://127.0.0.1:27017/bugsquad` or MongoDB Atlas URI

### 1. Clone & Setup Backend
```bash
cd backend
npm install
cp .env.example .env
npm run seed     # Populate database with demo accounts & sample QA data
npm start        # Starts server on http://localhost:5000
```

### 2. Setup & Launch Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev      # Starts Vite dev server on http://localhost:5173
```

---

## 🛡️ Security & Environmental Variables

Secrets and API keys must NEVER be committed to version control.

### Backend `.env`
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/bugsquad
JWT_SECRET=super_secret_jwt_key_bugsquad_2026
CLIENT_URL=http://localhost:5173
AI_API_KEY=your_gemini_or_openai_api_key_here
AI_MODEL=gemini-1.5-pro
```

### Frontend `.env`
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 📊 End-to-End QA Workflow Summary

```
Project -> Module -> Requirement -> Test Scenario -> Test Case -> Test Plan -> Test Suite 
  -> Test Run -> Execution Bench -> Defect Bug -> Assignment -> Fix & Retest -> Close 
  -> Release Quality Gate -> QA Manager Sign-Off -> Executive Portfolio Health
```

---

## 📜 License & Portfolio Notice

This project was built as an enterprise portfolio demonstration for advanced QA software engineering. All demo data is synthetically generated.
