const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

async function request(url, options = {}, retries = 3) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { ...options, headers });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${JSON.stringify(data)}`);
      }
      return data;
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
    }
  }
}

async function runTests() {
  console.log('--- STARTING QA API VERIFICATION ---');
  let tokenAdmin, tokenQA, tokenTester, tokenDev;
  let adminId, qaId, testerId, devId;

  // 1. Health check
  try {
    const data = await request(`${BASE_URL}/health`);
    console.log('✅ STEP 1: Backend Health Check PASS - Status:', data.status);
  } catch (err) {
    console.error('❌ STEP 1: Backend Health Check Failed:', err.message);
    process.exit(1);
  }

  // 2. Authentication Test
  console.log('\n--- STEP 2: AUTHENTICATION TEST ---');
  try {
    const adminRes = await request(`${BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@bugsquad.demo', password: 'demo1234' })
    });
    tokenAdmin = adminRes.token;
    adminId = adminRes._id;
    console.log('✅ Admin Login PASS - Role:', adminRes.role);

    const qaRes = await request(`${BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'qa@bugsquad.demo', password: 'demo1234' })
    });
    tokenQA = qaRes.token;
    qaId = qaRes._id;
    console.log('✅ QA Manager Login PASS - Role:', qaRes.role);

    const testerRes = await request(`${BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'tester@bugsquad.demo', password: 'demo1234' })
    });
    tokenTester = testerRes.token;
    testerId = testerRes._id;
    console.log('✅ Tester Login PASS - Role:', testerRes.role);

    const devRes = await request(`${BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'developer@bugsquad.demo', password: 'demo1234' })
    });
    tokenDev = devRes.token;
    devId = devRes._id;
    console.log('✅ Developer Login PASS - Role:', devRes.role);
  } catch (err) {
    console.error('❌ STEP 2 Authentication Failed:', err.message);
  }

  const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

  // STEP 3 – BUG VERIFICATIONS
  console.log('\n--- STEP 3: TESTING ALL 13 DEFECTS ---');

  // BUG-001: Dashboard Search
  try {
    const searchData = await request(`${BASE_URL}/search?q=Suite`, { headers: authHeader(tokenAdmin) });
    console.log('✅ BUG-001 Dashboard Search PASS - Results retrieved:', Array.isArray(searchData.projects) || Array.isArray(searchData.results) || !!searchData);
  } catch (err) {
    console.error('❌ BUG-001 Search Failed:', err.message);
  }

  // BUG-002: Analytics Filters
  try {
    const analyticsData = await request(`${BASE_URL}/analytics/overview?projectId=all&timeRange=30`, { headers: authHeader(tokenAdmin) });
    console.log('✅ BUG-002 Analytics Filters PASS - Metrics loaded:', !!analyticsData);
  } catch (err) {
    console.error('❌ BUG-002 Analytics Failed:', err.message);
  }

  // BUG-003: SLA
  try {
    const slaData = await request(`${BASE_URL}/sla?projectId=all`, { headers: authHeader(tokenAdmin) });
    console.log('✅ BUG-003 SLA PASS - SLA records loaded:', !!slaData);
  } catch (err) {
    console.error('❌ BUG-003 SLA Failed:', err.message);
  }

  // BUG-004: Projects CRUD
  let newProjectId;
  const uniqueCode = `PRJ-${Date.now().toString().slice(-4)}`;
  try {
    const createProj = await request(`${BASE_URL}/projects`, {
      method: 'POST',
      headers: authHeader(tokenAdmin),
      body: JSON.stringify({
        name: `QA Verification Project ${uniqueCode}`,
        projectCode: uniqueCode,
        description: 'Temporary verification project',
        client: 'QA Enterprise Inc',
        status: 'Active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 864000000)
      })
    });
    newProjectId = createProj._id;
    console.log('✅ BUG-004 Projects CREATE PASS - ID:', newProjectId);

    const getProj = await request(`${BASE_URL}/projects/${newProjectId}`, { headers: authHeader(tokenAdmin) });
    console.log('✅ BUG-004 Projects READ PASS - Name:', getProj.name);

    const updateProj = await request(`${BASE_URL}/projects/${newProjectId}`, {
      method: 'PUT',
      headers: authHeader(tokenAdmin),
      body: JSON.stringify({ name: `QA Verification Project ${uniqueCode} Updated`, status: 'Active' })
    });
    console.log('✅ BUG-004 Projects UPDATE PASS - Updated Name:', updateProj.name);

    // Create module for project
    const modRes = await request(`${BASE_URL}/modules`, {
      method: 'POST',
      headers: authHeader(tokenAdmin),
      body: JSON.stringify({ name: 'Core Auth Module', project: newProjectId, description: 'Core authentication' })
    });
    const moduleId = modRes._id;
    console.log('✅ Module Created PASS - ID:', moduleId);

    // BUG-005 & BUG-006: Report Bug & Wizard
    const createBug = await request(`${BASE_URL}/bugs`, {
      method: 'POST',
      headers: authHeader(tokenTester),
      body: JSON.stringify({
        title: 'QA Wizard Test Defect Ticket',
        description: 'Detailed defect report generated during automated verification wizard test',
        project: newProjectId,
        module: moduleId,
        environment: 'Staging',
        severity: 'Major',
        priority: 'P2 - High',
        status: 'New',
        stepsToReproduce: '1. Step 1\n2. Step 2',
        expectedResult: 'Expected outcome',
        actualResult: 'Actual outcome'
      })
    });
    const bugId = createBug._id;
    console.log('✅ BUG-005 & BUG-006 Report Bug CREATE & Wizard PASS - Bug ID:', createBug.bugId || bugId);

    const getBugs = await request(`${BASE_URL}/bugs`, { headers: authHeader(tokenAdmin) });
    console.log('✅ BUG-005 Bugs List READ PASS - Total Bugs Count:', Array.isArray(getBugs) ? getBugs.length : getBugs.bugs?.length || 'OK');

    // BUG-007: Requirements CRUD
    const createReq = await request(`${BASE_URL}/requirements`, {
      method: 'POST',
      headers: authHeader(tokenAdmin),
      body: JSON.stringify({
        title: 'REQ-QA-001 User Authentication Standard',
        project: newProjectId,
        description: 'System must support multi-role auth',
        type: 'Functional',
        priority: 'P2 - High',
        status: 'Approved'
      })
    });
    const reqId = createReq._id;
    console.log('✅ BUG-007 Requirements CREATE PASS - ID:', reqId);

    const updateReq = await request(`${BASE_URL}/requirements/${reqId}`, {
      method: 'PUT',
      headers: authHeader(tokenAdmin),
      body: JSON.stringify({ title: 'REQ-QA-001 Auth Standard Updated', priority: 'P1 - Highest' })
    });
    console.log('✅ BUG-007 Requirements UPDATE PASS - Title:', updateReq.title);

    // BUG-008: Test Plan CRUD
    const createPlan = await request(`${BASE_URL}/test-plans`, {
      method: 'POST',
      headers: authHeader(tokenQA),
      body: JSON.stringify({
        name: 'QA Master Strategy Test Plan',
        project: newProjectId,
        description: 'Master plan for QA verification',
        status: 'Draft'
      })
    });
    const planId = createPlan._id;
    console.log('✅ BUG-008 Test Plan CREATE PASS - ID:', planId);

    const updatePlan = await request(`${BASE_URL}/test-plans/${planId}`, {
      method: 'PUT',
      headers: authHeader(tokenQA),
      body: JSON.stringify({ name: 'QA Master Strategy Test Plan Active', status: 'Active' })
    });
    console.log('✅ BUG-008 Test Plan UPDATE PASS - Status:', updatePlan.status);

    // BUG-010: Test Cases CRUD
    const createTc = await request(`${BASE_URL}/test-cases`, {
      method: 'POST',
      headers: authHeader(tokenTester),
      body: JSON.stringify({
        title: 'TC-QA-001 User Session Verification',
        project: newProjectId,
        module: moduleId,
        preconditions: 'User is on login page',
        testSteps: [{ stepNumber: 1, action: 'Enter credentials', expectedResult: 'Logged in' }],
        expectedResult: 'Successful login',
        severity: 'Major',
        priority: 'P2 - High',
        tester: testerId
      })
    });
    const tcId = createTc._id;
    console.log('✅ BUG-010 Test Case CREATE PASS - ID:', tcId);

    // BUG-009: Test Suites CRUD
    const createSuite = await request(`${BASE_URL}/test-suites`, {
      method: 'POST',
      headers: authHeader(tokenQA),
      body: JSON.stringify({
        name: 'Regression Suite Core',
        project: newProjectId,
        testPlan: planId,
        description: 'Suite for regression testing',
        testCases: [tcId]
      })
    });
    const suiteId = createSuite._id;
    console.log('✅ BUG-009 Test Suite CREATE PASS - ID:', suiteId);

    // BUG-011: Test Runs Execution
    const createRun = await request(`${BASE_URL}/test-runs`, {
      method: 'POST',
      headers: authHeader(tokenQA),
      body: JSON.stringify({
        name: 'Sprint 1 Automated Run',
        project: newProjectId,
        testPlan: planId,
        testSuite: suiteId,
        environment: 'Staging',
        assignedTesters: [testerId]
      })
    });
    const runId = createRun._id;
    console.log('✅ BUG-011 Test Run CREATE PASS - ID:', runId);

    const execRes = await request(`${BASE_URL}/test-runs/${runId}/execute`, {
      method: 'POST',
      headers: authHeader(tokenTester),
      body: JSON.stringify({
        testCaseId: tcId,
        result: 'Passed',
        actualResult: 'Executed cleanly in bench',
        executionNotes: 'All checks passed'
      })
    });
    console.log('✅ BUG-011 Test Run EXECUTE PASS - Result Status:', execRes.message || 'Passed');

    // BUG-012: Releases CRUD
    const createRel = await request(`${BASE_URL}/releases`, {
      method: 'POST',
      headers: authHeader(tokenAdmin),
      body: JSON.stringify({
        name: 'v1.0.0-QA Build',
        version: '1.0.0-QA',
        project: newProjectId,
        description: 'Initial release build',
        releaseDate: new Date(),
        status: 'Planned'
      })
    });
    const relId = createRel._id;
    console.log('✅ BUG-012 Release CREATE PASS - ID:', relId);

    // Clean up created test entities (DELETE Verification)
    await request(`${BASE_URL}/releases/${relId}`, { method: 'DELETE', headers: authHeader(tokenAdmin) });
    console.log('✅ BUG-012 Release DELETE PASS');

    await request(`${BASE_URL}/test-runs/${runId}`, { method: 'DELETE', headers: authHeader(tokenAdmin) });
    console.log('✅ BUG-011 Test Run DELETE PASS');

    await request(`${BASE_URL}/test-suites/${suiteId}`, { method: 'DELETE', headers: authHeader(tokenAdmin) });
    console.log('✅ BUG-009 Test Suite DELETE PASS');

    await request(`${BASE_URL}/test-cases/${tcId}`, { method: 'DELETE', headers: authHeader(tokenAdmin) });
    console.log('✅ BUG-010 Test Case DELETE PASS');

    await request(`${BASE_URL}/test-plans/${planId}`, { method: 'DELETE', headers: authHeader(tokenAdmin) });
    console.log('✅ BUG-008 Test Plan DELETE PASS');

    await request(`${BASE_URL}/requirements/${reqId}`, { method: 'DELETE', headers: authHeader(tokenAdmin) });
    console.log('✅ BUG-007 Requirements DELETE PASS');

    await request(`${BASE_URL}/bugs/${bugId}`, { method: 'DELETE', headers: authHeader(tokenAdmin) });
    console.log('✅ BUG-005 & BUG-006 Bug Ticket DELETE PASS');

    await request(`${BASE_URL}/projects/${newProjectId}`, { method: 'DELETE', headers: authHeader(tokenAdmin) });
    console.log('✅ BUG-004 Projects DELETE PASS');

  } catch (err) {
    console.error('❌ Defect Testing Exception:', err.message);
  }

  // BUG-013: Profile & Password Test
  console.log('\n--- BUG-013 PROFILE & PASSWORD TEST ---');
  try {
    // 1. Profile edit: phone update
    const updateProfileRes = await request(`${BASE_URL}/users/${adminId}`, {
      method: 'PUT',
      headers: authHeader(tokenAdmin),
      body: JSON.stringify({ name: 'Alex Rivera', phone: '+1 (555) 999-8888', department: 'DevOps & Quality' })
    });
    console.log('✅ BUG-013 Profile Phone Update PASS - Phone:', updateProfileRes.phone);

    // Revert phone back
    await request(`${BASE_URL}/users/${adminId}`, {
      method: 'PUT',
      headers: authHeader(tokenAdmin),
      body: JSON.stringify({ name: 'Alex Rivera', phone: '+1 (555) 019-2831', department: 'DevOps & Quality' })
    });

    // 2. Password Update test
    const updatePasswordRes = await request(`${BASE_URL}/auth/update-password`, {
      method: 'PUT',
      headers: authHeader(tokenAdmin),
      body: JSON.stringify({ currentPassword: 'demo1234', newPassword: 'newdemo1234' })
    });
    console.log('✅ BUG-013 Password Update PASS:', updatePasswordRes.message || 'Updated');

    // 3. Login with NEW password
    const loginNewRes = await request(`${BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@bugsquad.demo', password: 'newdemo1234' })
    });
    console.log('✅ BUG-013 Login with NEW password PASS!');

    // 4. Revert password back to demo1234
    const newTokenAdmin = loginNewRes.token;
    await request(`${BASE_URL}/auth/update-password`, {
      method: 'PUT',
      headers: authHeader(newTokenAdmin),
      body: JSON.stringify({ currentPassword: 'newdemo1234', newPassword: 'demo1234' })
    });
    console.log('✅ BUG-013 Reverted password back to demo1234 PASS!');
  } catch (err) {
    console.error('❌ BUG-013 Profile/Password Failed:', err.message);
  }

  console.log('\n--- QA API VERIFICATION COMPLETE ---');
}

runTests();
