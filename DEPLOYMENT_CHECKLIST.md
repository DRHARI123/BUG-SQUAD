# 📋 BUG SQUAD Production Deployment Checklist

Use this checklist prior to promoting **BUG SQUAD** to production environments.

---

## 🗄️ Database Readiness (MongoDB Atlas)
- [ ] MongoDB Atlas cluster provisioned.
- [ ] Network Access IP whitelist configured (`0.0.0.0/0` or dedicated hosting server IPs).
- [ ] Database user credentials generated.
- [ ] `MONGODB_URI` connection string verified with SSL/TLS options.
- [ ] Database indexes created (`User.email`, `Bug.bugId`, `TestCase.testCaseId`, `Notification.recipient`).

---

## ⚙️ Backend API Readiness (Render / Railway)
- [ ] Environment variables configured:
  - `NODE_ENV=production`
  - `PORT=5000` (or dynamically assigned by host)
  - `MONGODB_URI`
  - `JWT_SECRET`
  - `CLIENT_URL=https://your-frontend-domain.vercel.app`
- [ ] `node --check server.js` returns 0 syntax errors.
- [ ] CORS middleware configured to restrict origins to `CLIENT_URL`.
- [ ] `GET /api/health` returns `{ success: true, status: "healthy" }`.
- [ ] Error handler middleware suppresses raw stack traces in production.

---

## 💻 Frontend Web App Readiness (Vercel)
- [ ] Environment variable configured:
  - `VITE_API_URL=https://your-backend-api-domain.com/api`
- [ ] `npm run build` completes cleanly with 0 errors.
- [ ] `vercel.json` SPA rewrite configured (`/(.*) -> /index.html`).
- [ ] Error Boundary wrapper active on React root component.
- [ ] Custom 404 page handles invalid route fallbacks cleanly.

---

## 🧪 Production Smoke Test Verification
- [ ] **Auth**: Login as Admin, QA Manager, Tester, Developer.
- [ ] **Projects & Modules**: Create project, add functional module, assign team members.
- [ ] **Test Cases**: Create test scenario, step specifications, execute test run.
- [ ] **Defects**: Auto-create bug from failed test execution, transition lifecycle states (`New` -> `Fixed` -> `Closed`).
- [ ] **Exports**: Export Bug PDF report and Excel spreadsheets.
- [ ] **Admin & Security**: Access `/admin` as Admin (granted), access as Tester (403 Forbidden).
- [ ] **Audit Logs**: Verify system activity logs recorded.
- [ ] **Mobile**: Test UI on mobile viewports (390px width).
