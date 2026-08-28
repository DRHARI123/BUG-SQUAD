const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Project = require('./models/Project');
const Module = require('./models/Module');
const Bug = require('./models/Bug');
const TestCase = require('./models/TestCase');
const Scenario = require('./models/Scenario');
const TestExecution = require('./models/TestExecution');
const { AuditLog } = require('./models/AuditLog');

dotenv.config();

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://<iamharidrin_db_user>:<qpPeT8TDuJ6Cn62Q>@<cluster>.mongodb.net/bugsquad?retryWrites=true&w=majority';
    console.log(`Connecting to MongoDB for database seeding: ${mongoUri.replace(/:([^:@]+)@/, ':****@')}`);
    await mongoose.connect(mongoUri);

    console.log('Clearing existing database collections & legacy indexes...');
    try { await mongoose.connection.collection('projects').dropIndexes(); } catch (e) { }
    try { await mongoose.connection.collection('users').dropIndexes(); } catch (e) { }
    try { await mongoose.connection.collection('bugs').dropIndexes(); } catch (e) { }
    try { await mongoose.connection.collection('testcases').dropIndexes(); } catch (e) { }

    await Promise.all([
      User.deleteMany({}),
      Project.deleteMany({}),
      Module.deleteMany({}),
      Bug.deleteMany({}),
      TestCase.deleteMany({}),
      Scenario.deleteMany({}),
      TestExecution.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    console.log('Seeding demo user accounts...');
    const adminUser = await User.create({
      name: 'Alex Rivera',
      email: 'admin@bugsquad.demo',
      password: 'demo1234',
      role: 'Admin',
      status: 'Active',
      department: 'DevOps & Quality',
      phone: '+1 (555) 019-2831',
    });

    const qaUser = await User.create({
      name: 'Sarah Connor',
      email: 'qa@bugsquad.demo',
      password: 'demo1234',
      role: 'QA Manager',
      status: 'Active',
      department: 'Quality Assurance',
      phone: '+1 (555) 014-9921',
    });

    const testerUser = await User.create({
      name: 'John Doe',
      email: 'tester@bugsquad.demo',
      password: 'demo1234',
      role: 'Tester',
      status: 'Active',
      department: 'Manual & Automation Testing',
      phone: '+1 (555) 017-3829',
    });

    const devUser = await User.create({
      name: 'David Miller',
      email: 'developer@bugsquad.demo',
      password: 'demo1234',
      role: 'Developer',
      status: 'Active',
      department: 'Backend Engineering',
      phone: '+1 (555) 012-7741',
    });

    console.log('Seeding sample projects...');
    const projectA = await Project.create({
      name: 'E-Commerce QA Suite',
      projectCode: 'PROJ-EC',
      description: 'Full end-to-end quality assurance suite for corporate e-commerce web application.',
      client: 'Retail Global Inc',
      status: 'Active',
      projectManager: adminUser._id,
      startDate: new Date(Date.now() - 1000 * 60 * 1440 * 60),
      endDate: new Date(Date.now() + 1000 * 60 * 1440 * 120),
    });

    const projectB = await Project.create({
      name: 'Mobile Banking App',
      projectCode: 'PROJ-MB',
      description: 'iOS and Android financial banking portal and real-time transaction engine.',
      client: 'Apex Financial Services',
      status: 'Active',
      projectManager: qaUser._id,
      startDate: new Date(Date.now() - 1000 * 60 * 1440 * 30),
      endDate: new Date(Date.now() + 1000 * 60 * 1440 * 90),
    });

    console.log('Seeding project modules...');
    const modAuth = await Module.create({
      name: 'Authentication & Security',
      project: projectA._id,
      description: 'User login, MFA, OAuth2 tokens, and password reset flows.',
    });

    const modCheckout = await Module.create({
      name: 'Payment & Checkout',
      project: projectA._id,
      description: 'Cart processing, Stripe payment gateway, tax calculations, and invoice generation.',
    });

    console.log('Seeding test scenarios & test cases...');
    const scenarioA = await Scenario.create({
      scenarioId: 'SCN-0001',
      name: 'User Authentication Lifecycle Verification',
      project: projectA._id,
      module: modAuth._id,
      description: 'End-to-end validation of user sign-in, token expiration, and session renewal.',
    });

    const testCaseA = await TestCase.create({
      testCaseId: 'TC-0001',
      title: 'Verify JWT Session Expiration and Refresh Redirect',
      project: projectA._id,
      module: modAuth._id,
      scenario: scenarioA._id,
      preconditions: 'User is authenticated with a valid JWT token',
      testSteps: [
        { stepNumber: 1, action: 'Navigate to protected dashboard', expectedResult: 'Dashboard renders cleanly' },
        { stepNumber: 2, action: 'Wait for 60-minute token expiration boundary', expectedResult: 'Token expires' },
        { stepNumber: 3, action: 'Perform API fetch call', expectedResult: 'Redirects to /login with session expired toast' },
      ],
      expectedResult: 'Unauthorized 401 returns clean login redirect without UI crash.',
      severity: 'Major',
      priority: 'P2 - High',
      status: 'Passed',
      tester: testerUser._id,
    });

    const testCaseB = await TestCase.create({
      testCaseId: 'TC-0002',
      title: 'Verify Stripe Gateway Timeout Error Handling on Checkout',
      project: projectA._id,
      module: modCheckout._id,
      scenario: scenarioA._id,
      preconditions: 'Shopping cart populated with items',
      testSteps: [
        { stepNumber: 1, action: 'Proceed to checkout page', expectedResult: 'Payment form visible' },
        { stepNumber: 2, action: 'Simulate Stripe 504 gateway timeout', expectedResult: 'User-friendly error banner displayed' },
      ],
      expectedResult: 'Gateway timeout handled gracefully without double charging card.',
      severity: 'Critical',
      priority: 'P1 - Highest',
      status: 'Failed',
      tester: testerUser._id,
    });

    console.log('Seeding test execution logs...');
    await TestExecution.create({
      executionId: 'EXEC-0001',
      testCase: testCaseA._id,
      tester: testerUser._id,
      testerName: testerUser.name,
      result: 'Passed',
      actualResult: 'Session expired toast displayed as expected.',
      executionNotes: 'Verified on Chrome 125, Windows 11.',
    });

    await TestExecution.create({
      executionId: 'EXEC-0002',
      testCase: testCaseB._id,
      tester: testerUser._id,
      testerName: testerUser.name,
      result: 'Failed',
      actualResult: 'Cart spinner deadlocks when network response drops.',
      executionNotes: 'Defect logged automatically.',
    });

    console.log('Seeding sample bugs...');
    await Bug.create({
      bugId: 'BUG-0001',
      title: 'Stripe Gateway Timeout Deadlocks Checkout Form Spinner',
      description: 'When simulated gateway timeout occurs during card authorization, payment button spinner loops infinitely without error feedback.',
      project: projectA._id,
      module: modCheckout._id,
      testCase: testCaseB._id,
      environment: 'Staging',
      browser: 'Chrome 125',
      operatingSystem: 'Windows 11',
      version: 'v1.4.0',
      severity: 'Critical',
      priority: 'P1 - Highest',
      reproducibility: 'Always',
      status: 'In Progress',
      reporter: testerUser._id,
      assignedTo: devUser._id,
      preconditions: 'Items in cart',
      stepsToReproduce: '1. Open cart\n2. Click Pay Now\n3. Throttle network connection',
      expectedResult: 'Display payment failed notification after 10s',
      actualResult: 'Infinite loading spinner',
    });

    console.log('Seeding initial audit logs...');
    await AuditLog.create({
      user: adminUser._id,
      userName: adminUser.name,
      userRole: adminUser.role,
      action: 'SYSTEM_SEED',
      entityType: 'System',
      entityId: 'SEED_001',
      description: 'Database populated with initial demo dataset and role accounts.',
    });

    console.log('\n==================================================');
    console.log(' 🎉 BUG SQUAD Database Seeding Completed Successfully!');
    console.log(' DEMO ACCOUNTS CREATED:');
    console.log('   Admin:      admin@bugsquad.demo      / demo1234');
    console.log('   QA Manager: qa@bugsquad.demo         / demo1234');
    console.log('   Tester:     tester@bugsquad.demo     / demo1234');
    console.log('   Developer:  developer@bugsquad.demo  / demo1234');
    console.log('==================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Database Seeding Failed:', err);
    process.exit(1);
  }
};

seedDatabase();
