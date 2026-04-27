const request = require('supertest');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

jest.setTimeout(30000);

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-access-secret';
process.env.REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'test-refresh-secret';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
process.env.REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost';

const app = require('../src/app');
const User = require('../src/models/User');
const Book = require('../src/models/Book');
const Borrowing = require('../src/models/Borrowing');
const Payment = require('../src/models/Payment');
const Notification = require('../src/models/Notification');
const { runBorrowingReminderJobs } = require('../src/services/borrowing-reminder.service');

describe('Library system integrations', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(mongoServer.getUri(), {
      dbName: 'library-test'
    });
  });

  afterEach(async () => {
    await Promise.all([
      Notification.deleteMany({}),
      Payment.deleteMany({}),
      Borrowing.deleteMany({}),
      Book.deleteMany({}),
      User.deleteMany({})
    ]);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  const createUser = async ({ email, password, role, barcodeString, isVerified = true, verificationStatus = 'verified' }) => {
    const passwordHash = await bcrypt.hash(password, 10);
    return User.create({
      name: email.split('@')[0],
      email,
      passwordHash,
      role,
      barcodeString,
      isVerified,
      verificationStatus
    });
  };

  test('authenticates and accesses protected routes with valid token', async () => {
    const user = await createUser({
      email: 'studentone@paterostechnologicalcollege.edu.ph',
      password: 'Password123!',
      role: 'student',
      barcodeString: 'PTC-USER-9001'
    });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'Password123!' });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.token).toBeTruthy();
    expect(loginResponse.body.user).toBeTruthy();
    expect(loginResponse.body.user.email).toBe(user.email);

    const protectedResponse = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${loginResponse.body.token}`);

    expect(protectedResponse.status).toBe(200);
    expect(protectedResponse.body.user).toBeTruthy();

    const unauthorizedResponse = await request(app)
      .get('/api/users/me')
      .set('Authorization', 'Bearer invalid-token');

    expect(unauthorizedResponse.status).toBe(401);
  });

  test('handles scan borrow, scan return, and payment settlement', async () => {
    const admin = await createUser({
      email: 'adminone@paterostechnologicalcollege.edu.ph',
      password: 'Password123!',
      role: 'admin',
      barcodeString: 'PTC-USER-9002'
    });

    const student = await createUser({
      email: 'studenttwo@paterostechnologicalcollege.edu.ph',
      password: 'Password123!',
      role: 'student',
      barcodeString: 'PTC-USER-9003'
    });

    const book = await Book.create({
      title: 'Test Book',
      author: 'Library QA',
      category: 'Testing',
      total_copies: 2,
      available_copies: 2,
      barcodeString: 'PTC-FIL-9001'
    });

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: admin.email, password: 'Password123!' });

    expect(adminLogin.status).toBe(200);

    const borrowResponse = await request(app)
      .post('/api/borrowings/scan/borrow')
      .set('Authorization', `Bearer ${adminLogin.body.token}`)
      .send({
        userBarcode: student.barcodeString,
        bookBarcode: book.barcodeString,
        dueDays: 7
      });

    expect(borrowResponse.status).toBe(201);

    const borrowed = await Borrowing.findById(borrowResponse.body._id || borrowResponse.body.id);
    expect(borrowed).toBeTruthy();

    const duplicateBorrowResponse = await request(app)
      .post('/api/borrowings/scan/borrow')
      .set('Authorization', `Bearer ${adminLogin.body.token}`)
      .send({
        userBarcode: student.barcodeString,
        bookBarcode: book.barcodeString,
        dueDays: 7
      });

    expect(duplicateBorrowResponse.status).toBe(200);
    expect(duplicateBorrowResponse.body.message).toMatch(/already borrowed/i);

    borrowed.due_date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    borrowed.status = 'Active';
    await borrowed.save();

    const returnResponse = await request(app)
      .post('/api/borrowings/scan/return')
      .set('Authorization', `Bearer ${adminLogin.body.token}`)
      .send({
        userBarcode: student.barcodeString,
        bookBarcode: book.barcodeString
      });

    expect(returnResponse.status).toBe(200);
    expect(returnResponse.body.penaltyAmount).toBeGreaterThanOrEqual(0);

    const duplicateReturnResponse = await request(app)
      .post('/api/borrowings/scan/return')
      .set('Authorization', `Bearer ${adminLogin.body.token}`)
      .send({
        userBarcode: student.barcodeString,
        bookBarcode: book.barcodeString
      });

    expect(duplicateReturnResponse.status).toBe(200);
    expect(duplicateReturnResponse.body.message).toMatch(/already been returned/i);

    const paymentResponse = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${adminLogin.body.token}`)
      .send({
        borrowingId: borrowed._id.toString(),
        amount: Math.max(1, Number(returnResponse.body.penaltyAmount || 0)),
        payment_method: 'Cash'
      });

    expect(paymentResponse.status).toBe(201);
    expect(paymentResponse.body.borrowingId).toBeTruthy();
  });

  test('rejects approving a pending borrowing when an active one already exists', async () => {
    const admin = await createUser({
      email: 'adminduplicate@paterostechnologicalcollege.edu.ph',
      password: 'Password123!',
      role: 'admin',
      barcodeString: 'PTC-USER-9010'
    });

    const student = await createUser({
      email: 'studentduplicate@paterostechnologicalcollege.edu.ph',
      password: 'Password123!',
      role: 'student',
      barcodeString: 'PTC-USER-9011'
    });

    const book = await Book.create({
      title: 'Approval Conflict Book',
      author: 'Library QA',
      category: 'Testing',
      total_copies: 1,
      available_copies: 0,
      barcodeString: 'PTC-FIL-9010'
    });

    await Borrowing.create({
      userId: student._id,
      bookId: book._id,
      status: 'Active',
      borrow_date: new Date(),
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    const pendingBorrowing = await Borrowing.create({
      userId: student._id,
      bookId: book._id,
      status: 'Pending'
    });

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: admin.email, password: 'Password123!' });

    expect(adminLogin.status).toBe(200);

    const approveResponse = await request(app)
      .patch(`/api/borrowings/${pendingBorrowing._id}/approve`)
      .set('Authorization', `Bearer ${adminLogin.body.token}`)
      .send({ dueDays: 7 });

    expect(approveResponse.status).toBe(409);
    expect(approveResponse.body.message).toMatch(/already borrowed/i);
  });

  test('creates due reminders and overdue notifications once', async () => {
    const user = await createUser({
      email: 'studentthree@paterostechnologicalcollege.edu.ph',
      password: 'Password123!',
      role: 'student',
      barcodeString: 'PTC-USER-9004'
    });

    const dueSoonBook = await Book.create({
      title: 'Reminder Book',
      author: 'Library QA',
      category: 'Testing',
      total_copies: 1,
      available_copies: 0,
      barcodeString: 'PTC-FIL-9002'
    });

    const overdueBook = await Book.create({
      title: 'Overdue Reminder Book',
      author: 'Library QA',
      category: 'Testing',
      total_copies: 1,
      available_copies: 0,
      barcodeString: 'PTC-FIL-9003'
    });

    await Borrowing.create({
      userId: user._id,
      bookId: dueSoonBook._id,
      status: 'Active',
      borrow_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      due_date: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    const overdue = await Borrowing.create({
      userId: user._id,
      bookId: overdueBook._id,
      status: 'Active',
      borrow_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      due_date: new Date(Date.now() - 24 * 60 * 60 * 1000)
    });

    const result = await runBorrowingReminderJobs();

    expect(result.dueReminders).toBeGreaterThanOrEqual(1);
    expect(result.overdueNotices).toBeGreaterThanOrEqual(1);

    const overdueRecord = await Borrowing.findById(overdue._id);
    expect(overdueRecord.status).toBe('Overdue');

    const notificationCount = await Notification.countDocuments({ userId: user._id });
    expect(notificationCount).toBeGreaterThanOrEqual(2);

    await runBorrowingReminderJobs();

    const secondNotificationCount = await Notification.countDocuments({ userId: user._id });
    expect(secondNotificationCount).toBe(notificationCount);
  });

  test('returns validation error for invalid route ObjectId params', async () => {
    const admin = await createUser({
      email: 'adminvalidation@paterostechnologicalcollege.edu.ph',
      password: 'Password123!',
      role: 'admin',
      barcodeString: 'PTC-USER-9101'
    });

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: admin.email, password: 'Password123!' });

    expect(adminLogin.status).toBe(200);

    const invalidApprove = await request(app)
      .patch('/api/borrowings/not-a-valid-id/approve')
      .set('Authorization', `Bearer ${adminLogin.body.token}`)
      .send({ dueDays: 7 });

    expect(invalidApprove.status).toBe(400);
    expect(invalidApprove.body.message).toMatch(/validation failed/i);
  });

  test('supports paginated responses for reports and payments', async () => {
    const admin = await createUser({
      email: 'adminpaging@paterostechnologicalcollege.edu.ph',
      password: 'Password123!',
      role: 'admin',
      barcodeString: 'PTC-USER-9102'
    });

    const student = await createUser({
      email: 'studentpaging@paterostechnologicalcollege.edu.ph',
      password: 'Password123!',
      role: 'student',
      barcodeString: 'PTC-USER-9103'
    });

    const book = await Book.create({
      title: 'Paging Book',
      author: 'Library QA',
      category: 'Testing',
      total_copies: 1,
      available_copies: 0,
      barcodeString: 'PTC-FIL-9102'
    });

    const borrowing = await Borrowing.create({
      userId: student._id,
      bookId: book._id,
      status: 'Returned',
      penaltyAmount: 20,
      borrow_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      due_date: new Date(Date.now() - 24 * 60 * 60 * 1000),
      return_date: new Date()
    });

    await Payment.create({
      borrowingId: borrowing._id,
      amount: 20,
      payment_method: 'Cash',
      recordedBy: admin._id
    });

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: admin.email, password: 'Password123!' });

    expect(adminLogin.status).toBe(200);

    const paymentsResponse = await request(app)
      .get('/api/payments?page=1&limit=1')
      .set('Authorization', `Bearer ${adminLogin.body.token}`);

    expect(paymentsResponse.status).toBe(200);
    expect(Array.isArray(paymentsResponse.body.items)).toBe(true);
    expect(paymentsResponse.body.total).toBeGreaterThanOrEqual(1);

    const borrowingsReport = await request(app)
      .get('/api/reports/borrowings?page=1&limit=1')
      .set('Authorization', `Bearer ${adminLogin.body.token}`);

    expect(borrowingsReport.status).toBe(200);
    expect(Array.isArray(borrowingsReport.body.items)).toBe(true);
    expect(borrowingsReport.body.total).toBeGreaterThanOrEqual(1);
  });
});