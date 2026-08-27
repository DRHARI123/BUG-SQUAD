const BASE_URL = 'http://localhost:5000/api';

async function request(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

async function runEndToEndWorkflow() {
  console.log('--- STARTING PHASE 14 FINAL E2E USER WORKFLOW AUDIT ---');

  let adminToken, testerToken, devToken;
  let adminId, testerId, devId;
  let projectId, moduleId, reqId, planId, suiteId, tcId, runId, bugId, releaseId;

  try {
    // Step 1: Login
    console.log('Step 1: Authenticators Login...');
    const adminAuth = await request(`${BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@bugsquad.demo', password: 'demo1234' })
    });
    adminToken = adminAuth.token;
    adminId = adminAuth._id;

    const testerAuth = await request(`${BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'tester@bugsquad.demo', password: 'demo1234' })
    });
    testerToken = testerAuth.token;
    testerId = testerAuth._id;

    const devAuth = await request(`${BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'developer@bugsquad.demo', password: 'demo1234' })
    });
    devToken = devAuth.token;
    devId = devAuth._id;

    const authH = (t) => ({ Authorization: `Bearer ${t}` });

    // Step 2: Dashboard Stats
    console.log('Step 2: Fetch Dashboard stats...');
    const dash = await request(`${BASE_URL}/dashboard/stats`, { headers: authH(adminToken) });
    console.log('  Dashboard KPIs Loaded:', !!dash);

    // Step 3: Create Project
    console.log('Step 3: Create Project...');
    const pCode = `PROJ-${Date.now().toString().slice(-4)}`;
    const proj = await request(`${BASE_URL}/projects`, {
      method: 'POST',
      headers: authH(adminToken),
      body: JSON.stringify({
        name: `Production Audit Suite ${pCode}`,
        projectCode: pCode,
        description: 'End to end production readiness audit project',
        client: 'Enterprise Client Inc',
        status: 'Active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 8640000000)
      })
    });
    projectId = proj._id;

    const mod = await request(`${BASE_URL}/modules`, {
      method: 'POST',
      headers: authH(adminToken),
      body: JSON.stringify({ name: 'Security & Auth', project: projectId, description: 'Authentication module' })
    });
    moduleId = mod._id;

    // Step 4: Create Requirement
    console.log('Step 4: Create Requirement...');
    const req = await request(`${BASE_URL}/requirements`, {
      method: 'POST',
      headers: authH(adminToken),
      body: JSON.stringify({
        title: 'REQ-AUDIT-001 OAuth Token Refresh Security',
        project: projectId,
        module: moduleId,
        description: 'System must securely refresh JWT tokens upon expiry',
        type: 'Functional',
        priority: 'P1 - Highest',
        status: 'Approved'
      })
    });
    reqId = req._id;

    // Step 5: Create Test Plan
    console.log('Step 5: Create Test Plan...');
    const plan = await request(`${BASE_URL}/test-plans`, {
      method: 'POST',
      headers: authH(adminToken),
      body: JSON.stringify({
        name: 'Master Production Audit Strategy',
        project: projectId,
        description: 'Test plan for phase 14 production readiness',
        status: 'Active'
      })
    });
    planId = plan._id;

    // Step 6: Create Test Suite
    console.log('Step 6: Create Test Suite...');
    const suite = await request(`${BASE_URL}/test-suites`, {
      method: 'POST',
      headers: authH(adminToken),
      body: JSON.stringify({
        name: 'Security Verification Suite',
        project: projectId,
        testPlan: planId,
        description: 'Suite for token expiry and validation'
      })
    });
    suiteId = suite._id;

    // Step 7: Create Test Case
    console.log('Step 7: Create Test Case...');
    const tc = await request(`${BASE_URL}/test-cases`, {
      method: 'POST',
      headers: authH(testerToken),
      body: JSON.stringify({
        title: 'TC-AUDIT-001 JWT Session Handshake Test',
        project: projectId,
        module: moduleId,
        preconditions: 'User authenticated',
        testSteps: [{ stepNumber: 1, action: 'Perform request after token expiry', expectedResult: 'HTTP 401 returns' }],
        expectedResult: 'Unauthorized 401 handled cleanly',
        severity: 'Critical',
        priority: 'P1 - Highest',
        tester: testerId
      })
    });
    tcId = tc._id;

    // Attach case to suite
    await request(`${BASE_URL}/test-suites/${suiteId}`, {
      method: 'PUT',
      headers: authH(adminToken),
      body: JSON.stringify({ testCases: [tcId] })
    });

    // Step 8: Create Test Run
    console.log('Step 8: Create Test Run...');
    const run = await request(`${BASE_URL}/test-runs`, {
      method: 'POST',
      headers: authH(adminToken),
      body: JSON.stringify({
        name: 'Production Gate Verification Run',
        project: projectId,
        testPlan: planId,
        testSuite: suiteId,
        environment: 'Production',
        assignedTesters: [testerId],
        testCases: [tcId]
      })
    });
    runId = run._id;

    // Step 9: Execute Test (Simulate Fail to trigger defect lifecycle)
    console.log('Step 9: Execute Test (Verdict: Failed)...');
    await request(`${BASE_URL}/test-runs/${runId}/execute`, {
      method: 'POST',
      headers: authH(testerToken),
      body: JSON.stringify({
        testCaseId: tcId,
        result: 'Failed',
        actualResult: 'Token expiry missing auto-logout payload',
        executionNotes: 'Logged during E2E readiness audit'
      })
    });

    // Step 10: Report Bug
    console.log('Step 10: Report Bug...');
    const bug = await request(`${BASE_URL}/bugs`, {
      method: 'POST',
      headers: authH(testerToken),
      body: JSON.stringify({
        title: 'Token expiry payload missing auto-logout metadata',
        description: 'When JWT expires, header fails to transmit redirect URI parameter',
        project: projectId,
        module: moduleId,
        testCase: tcId,
        environment: 'Production',
        severity: 'Critical',
        priority: 'P1 - Highest',
        status: 'New',
        stepsToReproduce: '1. Expire token\n2. Trigger API endpoint',
        expectedResult: 'HTTP 401 with redirect header',
        actualResult: 'HTTP 401 plain text',
        assignedTo: devId
      })
    });
    bugId = bug._id;

    // Step 11: Assign & Update Bug (In Progress -> Fixed)
    console.log('Step 11: Assign & Update Bug (Developer fixes ticket)...');
    await request(`${BASE_URL}/bugs/${bugId}`, {
      method: 'PUT',
      headers: authH(devToken),
      body: JSON.stringify({
        status: 'In Progress',
        assignedTo: devId
      })
    });

    await request(`${BASE_URL}/bugs/${bugId}`, {
      method: 'PUT',
      headers: authH(devToken),
      body: JSON.stringify({
        status: 'Fixed',
        resolution: 'Added standard authorization error payload'
      })
    });

    // Step 12: Retest & Close Bug (Tester retests & closes)
    console.log('Step 12: Retest & Close Bug...');
    await request(`${BASE_URL}/bugs/${bugId}`, {
      method: 'PUT',
      headers: authH(testerToken),
      body: JSON.stringify({
        status: 'Closed',
        resolution: 'Verified on staging build'
      })
    });

    // Step 13: Create Release
    console.log('Step 13: Create Release...');
    const rel = await request(`${BASE_URL}/releases`, {
      method: 'POST',
      headers: authH(adminToken),
      body: JSON.stringify({
        name: 'Release v1.4.0 Production Build',
        version: 'v1.4.0',
        project: projectId,
        description: 'Production candidate release',
        releaseDate: new Date(),
        status: 'Released'
      })
    });
    releaseId = rel._id;

    // Step 14: View Analytics & Quality Reports
    console.log('Step 14: View Analytics & QA Reports...');
    const analytics = await request(`${BASE_URL}/analytics/overview?projectId=${projectId}`, { headers: authH(adminToken) });
    const rtm = await request(`${BASE_URL}/traceability?projectId=${projectId}`, { headers: authH(adminToken) });
    console.log('  Analytics Metrics & RTM Coverage Matrix Loaded:', !!analytics && !!rtm);

    // Clean up test audit data
    console.log('Cleaning up audit records...');
    await request(`${BASE_URL}/releases/${releaseId}`, { method: 'DELETE', headers: authH(adminToken) });
    await request(`${BASE_URL}/bugs/${bugId}`, { method: 'DELETE', headers: authH(adminToken) });
    await request(`${BASE_URL}/test-runs/${runId}`, { method: 'DELETE', headers: authH(adminToken) });
    await request(`${BASE_URL}/test-suites/${suiteId}`, { method: 'DELETE', headers: authH(adminToken) });
    await request(`${BASE_URL}/test-cases/${tcId}`, { method: 'DELETE', headers: authH(adminToken) });
    await request(`${BASE_URL}/test-plans/${planId}`, { method: 'DELETE', headers: authH(adminToken) });
    await request(`${BASE_URL}/requirements/${reqId}`, { method: 'DELETE', headers: authH(adminToken) });
    await request(`${BASE_URL}/projects/${projectId}`, { method: 'DELETE', headers: authH(adminToken) });

    console.log('\n🎉 PHASE 14 FINAL E2E USER WORKFLOW AUDIT PASSED 100%!');
  } catch (err) {
    console.error('❌ PHASE 14 AUDIT WORKFLOW FAILED:', err.message);
    process.exit(1);
  }
}

runEndToEndWorkflow();
