require('dotenv').config();

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Book = require('../models/Book');
const Borrowing = require('../models/Borrowing');
const Payment = require('../models/Payment');
const { calculatePenalty } = require('../services/penalty.service');

const DEMO_PREFIX = 'SEEDED-DEMO';

const demoUsers = [
  { name: 'Mark Avengoza', full_name: 'Mark Avengoza', username: 'mavengoza', email: 'mavengoza@paterostechnologicalcollege.edu.ph', phone: '', role: 'superadmin', barcodeString: 'PTC-USER-0001', isVerified: true, verificationStatus: 'verified' },
  { name: 'User 1', full_name: 'User 1', username: 'user1', email: 'user1@example.com', phone: '', role: 'admin', barcodeString: 'PTC-USER-0002', isVerified: true, verificationStatus: 'verified' },
  { name: 'User 2', full_name: 'User 2', username: 'user2', email: 'user2@example.com', phone: '', role: 'admin', barcodeString: 'PTC-USER-0003', isVerified: true, verificationStatus: 'verified' },
  { name: 'User 3', full_name: 'User 3', username: 'user3', email: 'user3@example.com', phone: '', role: 'faculty', barcodeString: 'PTC-USER-0004', isVerified: true, verificationStatus: 'verified', studentIdNumber: 'FAC-1003' },
  { name: 'User 4', full_name: 'User 4', username: 'user4', email: 'user4@example.com', phone: '', role: 'student', barcodeString: 'PTC-USER-1000', isVerified: true, verificationStatus: 'verified', studentIdNumber: '2024-0000' }
];

const legacyDemoEmails = [];

const dayMs = 24 * 60 * 60 * 1000;
const daysAgo = (days) => new Date(Date.now() - days * dayMs);
const daysFromNow = (days) => new Date(Date.now() + days * dayMs);

const borrowingTemplates = [
  {
    userEmail: 'user4@example.com',
    bookBarcode: 'PTC-FIL-0001',
    status: 'Returned',
    borrow_date: daysAgo(20),
    due_date: daysAgo(13),
    return_date: daysAgo(14),
    remarks: `${DEMO_PREFIX}: Returned on time`
  },
  {
    userEmail: 'user4@example.com',
    bookBarcode: 'PTC-FIL-0002',
    status: 'Returned',
    borrow_date: daysAgo(30),
    due_date: daysAgo(20),
    return_date: daysAgo(15),
    remarks: `${DEMO_PREFIX}: Returned late with payment`,
    payment_method: 'Cash'
  },
  {
    userEmail: 'user4@example.com',
    bookBarcode: 'PTC-FIL-0007',
    status: 'Active',
    borrow_date: daysAgo(3),
    due_date: daysFromNow(4),
    return_date: null,
    remarks: `${DEMO_PREFIX}: Currently borrowed`
  },
  {
    userEmail: 'user3@example.com',
    bookBarcode: 'PTC-FIL-0008',
    status: 'Overdue',
    borrow_date: daysAgo(18),
    due_date: daysAgo(5),
    return_date: null,
    remarks: `${DEMO_PREFIX}: Overdue and unpaid`
  },
  {
    userEmail: 'user3@example.com',
    bookBarcode: 'PTC-FIL-0010',
    status: 'Pending',
    borrow_date: daysAgo(1),
    due_date: null,
    return_date: null,
    remarks: `${DEMO_PREFIX}: Pending request`
  },
  {
    userEmail: 'user4@example.com',
    bookBarcode: 'PTC-FIL-0012',
    status: 'Rejected',
    borrow_date: daysAgo(2),
    due_date: null,
    return_date: null,
    remarks: `${DEMO_PREFIX}: Rejected request`
  }
];

const resetAllCollections = async () => {
  const [auditLogs, notifications, payments, borrowings, books, users] = await Promise.all([
    mongoose.connection.collection('auditlogs').deleteMany({}),
    mongoose.connection.collection('notifications').deleteMany({}),
    mongoose.connection.collection('payments').deleteMany({}),
    mongoose.connection.collection('borrowings').deleteMany({}),
    mongoose.connection.collection('books').deleteMany({}),
    mongoose.connection.collection('users').deleteMany({})
  ]);

  return {
    auditLogs: auditLogs.deletedCount,
    notifications: notifications.deletedCount,
    payments: payments.deletedCount,
    borrowings: borrowings.deletedCount,
    books: books.deletedCount,
    users: users.deletedCount
  };
};

const seedUsers = async () => {
  const password = process.env.SEED_DEFAULT_PASSWORD || 'admin12345';
  const passwordHash = await bcrypt.hash(password, 10);

  const ops = demoUsers.map((user) => {
    const update = {
      $set: {
        name: user.name,
        full_name: user.full_name || user.name,
        username: user.username || '',
        email: user.email,
        passwordHash,
        phone: user.phone || '',
        role: user.role,
        barcodeString: user.barcodeString,
        isVerified: user.isVerified,
        verificationStatus: user.verificationStatus,
        profileImageUrl: ''
      }
    };

    if (user.studentIdNumber) {
      update.$set.studentIdNumber = user.studentIdNumber;
    } else {
      update.$unset = { studentIdNumber: '' };
    }

    return {
      updateOne: {
        filter: { email: user.email },
        update,
        upsert: true
      }
    };
  });

  return User.bulkWrite(ops);
};

const removeLegacySeededUsers = async () => User.deleteMany({ email: { $in: legacyDemoEmails } });

const buildBorrowingDocs = async () => {
  const users = await User.find({ email: { $in: borrowingTemplates.map((item) => item.userEmail) } });
  const books = await Book.find({ barcodeString: { $in: borrowingTemplates.map((item) => item.bookBarcode) } });

  const usersByEmail = new Map(users.map((user) => [user.email, user]));
  const booksByBarcode = new Map(books.map((book) => [book.barcodeString, book]));

  const docs = borrowingTemplates
    .map((template) => {
      const user = usersByEmail.get(template.userEmail);
      const book = booksByBarcode.get(template.bookBarcode);

      if (!user || !book) {
        console.warn(`Skipping template: user or book not found (${template.userEmail}, ${template.bookBarcode})`);
        return null;
      }

      let penaltyAmount = 0;

      if (template.status === 'Returned' && template.due_date && template.return_date) {
        penaltyAmount = calculatePenalty(template.due_date, template.return_date);
      }

      if (template.status === 'Overdue' && template.due_date) {
        penaltyAmount = calculatePenalty(template.due_date, new Date());
      }

      return {
        userId: user._id,
        bookId: book._id,
        borrow_date: template.borrow_date,
        due_date: template.due_date,
        return_date: template.return_date,
        status: template.status,
        penaltyAmount,
        remarks: template.remarks,
        payment_method: template.payment_method || null
      };
    })
    .filter(Boolean);

  return docs;
};

const seedBorrowingsAndPayments = async () => {
  const docs = await buildBorrowingDocs();

  if (docs.length === 0) {
    console.log('No borrowing documents prepared.');
    return { borrowings: 0, payments: 0 };
  }

  const createdBorrowings = await Borrowing.insertMany(
    docs.map((doc) => ({
      userId: doc.userId,
      bookId: doc.bookId,
      borrow_date: doc.borrow_date,
      due_date: doc.due_date,
      return_date: doc.return_date,
      status: doc.status,
      penaltyAmount: doc.penaltyAmount,
      remarks: doc.remarks
    }))
  );

  const admin = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });
  let payments = 0;

  if (admin) {
    const paymentsToCreate = createdBorrowings
      .map((borrowing) => {
        const source = docs.find((doc) => String(doc.userId) === String(borrowing.userId) && String(doc.bookId) === String(borrowing.bookId) && doc.remarks === borrowing.remarks);

        if (!source || !source.payment_method || borrowing.penaltyAmount <= 0) {
          return null;
        }

        return {
          borrowingId: borrowing._id,
          amount: borrowing.penaltyAmount,
          payment_date: new Date(),
          payment_method: source.payment_method,
          recordedBy: admin._id
        };
      })
      .filter(Boolean);

    if (paymentsToCreate.length > 0) {
      await Payment.insertMany(paymentsToCreate);
      payments = paymentsToCreate.length;
    }
  }

  return { borrowings: createdBorrowings.length, payments };
};

const run = async () => {
  try {
    await connectDB();

    const shouldReset = process.argv.includes('--reset');

    if (shouldReset) {
      const removed = await resetAllCollections();
      console.log(
        `Reset complete. Removed ${removed.users} users, ${removed.books} books, ${removed.borrowings} borrowings, ${removed.payments} payments, ${removed.notifications} notifications, and ${removed.auditLogs} audit logs.`
      );
    } else {
      const seededBorrowings = await Borrowing.find({ remarks: { $regex: `^${DEMO_PREFIX}` } }).select('_id');
      const borrowingIds = seededBorrowings.map((item) => item._id);

      if (borrowingIds.length > 0) {
        await Payment.deleteMany({ borrowingId: { $in: borrowingIds } });
        await Borrowing.deleteMany({ _id: { $in: borrowingIds } });
      }
    }

    const removedUsers = await removeLegacySeededUsers();
    if (removedUsers.deletedCount > 0) {
      console.log(`Removed ${removedUsers.deletedCount} legacy seeded user account(s).`);
    }

    const userResult = await seedUsers();
    const stats = await seedBorrowingsAndPayments();

    console.log(
      `Users seeded. Created: ${userResult.upsertedCount || 0}, Updated: ${userResult.modifiedCount || 0}.`
    );
    console.log(`Borrowings seeded: ${stats.borrowings}, Payments seeded: ${stats.payments}.`);
    console.log(`Default demo password for all seeded users: ${process.env.SEED_DEFAULT_PASSWORD || 'admin12345'}`);
    process.exitCode = 0;
  } catch (error) {
    console.error('Failed to seed demo users and transactions:', error.message);
    process.exitCode = 1;
  } finally {
    try {
      await mongoose.connection.close();
    } catch (closeErr) {
      console.error('Error closing mongoose connection:', closeErr);
    }

    process.exit(process.exitCode || 0);
  }
};

run();
