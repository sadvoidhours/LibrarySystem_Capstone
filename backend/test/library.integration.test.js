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

  test('creates due reminders and overdue notifications once', async () => {
    const user = await createUser({
      email: 'studentthree@paterostechnologicalcollege.edu.ph',
      password: 'Password123!',
      role: 'student',
      barcodeString: 'PTC-USER-9004'
    });

    const book = await Book.create({
      title: 'Reminder Book',
      author: 'Library QA',
      category: 'Testing',
      total_copies: 1,
      available_copies: 0,
      barcodeString: 'PTC-FIL-9002'
    });

    await Borrowing.create({
      userId: user._id,
      bookId: book._id,
      status: 'Active',
      borrow_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      due_date: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    const overdue = await Borrowing.create({
      userId: user._id,
      bookId: book._id,
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
});