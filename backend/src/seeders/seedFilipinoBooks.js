require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Book = require('../models/Book');

const isProduction = process.env.NODE_ENV === 'production';
const allowDbReset = process.env.ALLOW_DB_RESET === 'true';
const logResetAttempt = (status, detail) => {
  console.warn(`[DB_RESET][${new Date().toISOString()}] ${status} - ${detail}`);
};

const libraryBooks = [
  {
    title: 'INFORMATION MANAGEMENT',
    author: 'RAMESH SINGH',
    edition: 'FIRST EDITION',
    publisher: 'HORIZON PRESS',
    publication_year: '2022',
    place_of_publication: 'JAIPUR, RAJASTHAN, INDIA',
    isbn: '978-93-879857-3-5',
    format: 'BOOK',
    physical_description: 'VII, 250 PAGES ; 24 CM',
    language: 'ENGLISH'
  },
  {
    title: 'BASICS OF NANO COMPUTER',
    author: 'ROHAN SHARMA',
    edition: 'FIRST EDITION',
    publisher: 'VENUS BOOKS',
    publication_year: '2023',
    place_of_publication: 'DARYA GANJ, NEW DELHI, INDIA',
    isbn: '978-93-86559-27-2',
    format: 'BOOK',
    physical_description: 'APPROXIMATELY 300 PAGES ; ROYAL SIZE',
    language: 'ENGLISH'
  },
  {
    title: 'OBJECT ORIENTED SOFTWARE ENGINEERING',
    author: 'GAH COOPER',
    edition: 'FIRST EDITION',
    publisher: 'VINTAGE PRESS LTD',
    publication_year: '2024',
    place_of_publication: 'GREATER LONDON, UNITED KINGDOM',
    isbn: '978-19-167843-5-2',
    format: 'BOOK',
    physical_description: 'APPROXIMATELY 300 PAGES ; ROYAL SIZE',
    language: 'ENGLISH'
  },
  {
    title: 'SOFTWARE ENGINEERING',
    author: 'PRAKASH SHRIVASTAVA',
    edition: 'FIRST EDITION',
    publisher: 'HARI BOOKS',
    publication_year: '2023',
    place_of_publication: 'I.P. EXTENSION, DELHI, INDIA',
    isbn: '978-93-95680-12-7',
    format: 'BOOK',
    physical_description: 'APPROXIMATELY 300 PAGES; ROYAL SIZE',
    language: 'ENGLISH'
  },
  {
    title: 'EMBEDDED SYSTEMS WORLD CLASS DESIGNS',
    author: 'MANOJ VERMA',
    edition: 'FIRST EDITION',
    publisher: 'RANDOM PUBLICATIONS LLP',
    publication_year: '2024',
    place_of_publication: 'DARYAGANJ, NEW DELHI, INDIA',
    isbn: '978-93-575110-9-4',
    format: 'BOOK',
    physical_description: 'APPROXIMATELY 300 PAGES ; ROYAL SIZE',
    language: 'ENGLISH'
  },
  {
    title: 'AWARENESS OF E-LEARNING',
    author: 'DR. S.K. PANNEER SELVAM',
    edition: 'FIRST EDITION',
    publisher: 'RANDOM PUBLICATIONS LLP',
    publication_year: '2022',
    place_of_publication: 'DARYAGANJ, NEW DELHI, INDIA',
    isbn: '978-93-86391-65-0',
    format: 'BOOK',
    physical_description: 'APPROXIMATELY 300 PAGES ; ROYAL SIZE',
    language: 'ENGLISH'
  },
  {
    title: 'ROBOTICS VISION AND CONTROL FUNDAMENTAL ALGORITHMS IN MATLAB',
    author: 'GELAR CLARKE',
    edition: 'FIRST EDITION',
    publisher: 'VENUS BOOKS',
    publication_year: '2024',
    place_of_publication: 'DARYA GANJ, NEW DELHI, INDIA',
    isbn: '978-93-954318-8-0',
    format: 'BOOK',
    physical_description: 'APPROXIMATELY 300 PAGES ; ROYAL SIZE',
    language: 'ENGLISH'
  },
  {
    title: 'COMPUTER BASICS WITH OFFICE AUTOMATION',
    author: 'SANJAY SINGH',
    edition: 'FIRST EDITION',
    publisher: 'RANDOM PUBLICATIONS LLP',
    publication_year: '2024',
    place_of_publication: 'DARYAGANJ, NEW DELHI, INDIA',
    isbn: '978-93-575110-8-7',
    format: 'BOOK',
    physical_description: 'APPROXIMATELY 300 PAGES ; ROYAL SIZE',
    language: 'ENGLISH'
  },
  {
    title: 'DATA ANALYSIS AND DECISION TOOLS',
    author: 'HARVINDER SINGH, NEERU GUPTA',
    edition: 'FIRST EDITION',
    publisher: 'PRATAP BOOK SERVICES',
    publication_year: '2023',
    place_of_publication: 'IP EXT. DELHI, INDIA',
    isbn: '978-93-95668-06-4',
    format: 'BOOK',
    physical_description: 'APPROXIMATELY 300 PAGES ; ROYAL SIZE',
    language: 'ENGLISH'
  },
  {
    title: 'COMPILERS PRINCIPLES, TECHNIQUES AND TOOLS',
    author: 'ADAM MENDONHA',
    edition: 'FIRST EDITION',
    publisher: 'RANDOM PUBLICATIONS LLP',
    publication_year: '2024',
    place_of_publication: 'DARYAGANJ, NEW DELHI, INDIA',
    isbn: '978-93-575160-3-7',
    format: 'BOOK',
    physical_description: 'APPROXIMATELY 300 PAGES ; ROYAL SIZE',
    language: 'ENGLISH'
  },
  {
    title: 'INFORMATION TECHNOLOGY FOR FUTURE',
    author: 'ADAM MENDONHA',
    edition: 'FIRST EDITION',
    publisher: 'VENUS BOOKS',
    publication_year: '2024',
    place_of_publication: 'DARYA GANJ, NEW DELHI, INDIA',
    isbn: '978-81-19920-48-8',
    format: 'BOOK',
    physical_description: 'APPROXIMATELY 300 PAGES ; ROYAL SIZE',
    language: 'ENGLISH'
  },
  {
    title: 'INFORMATION TECHNOLOGY AND ECONOMIC DEVELOPMENT',
    author: 'MANOJ VERMA',
    edition: 'FIRST EDITION',
    publisher: 'RANDOM PUBLICATIONS LLP',
    publication_year: '2024',
    place_of_publication: 'DARYAGANJ, NEW DELHI, INDIA',
    isbn: '978-93-575145-2-1',
    format: 'BOOK',
    physical_description: 'APPROXIMATELY 300 PAGES ; ROYAL SIZE',
    language: 'ENGLISH'
  },
  {
    title: 'THE ESSENCE OF ARTIFICIAL INTELLIGENCE',
    author: 'LUKA GRAY',
    edition: 'FIRST EDITION',
    publisher: 'RANDOM PUBLICATIONS LLP',
    publication_year: '2024',
    place_of_publication: 'DARYAGANJ, NEW DELHI, INDIA',
    isbn: '978-93-575110-3-2',
    format: 'BOOK',
    physical_description: 'APPROXIMATELY 300 PAGES ; ROYAL SIZE',
    language: 'ENGLISH'
  },
  {
    title: 'MACHINE LEARNING THE NEW AI',
    author: 'DARWIN BAILEY',
    edition: 'FIRST EDITION',
    publisher: 'VENUS BOOKS',
    publication_year: '2024',
    place_of_publication: 'DARYAGANJ, NEW DELHI, INDIA',
    isbn: '978-93-95431-78-1',
    format: 'BOOK',
    physical_description: 'APPROXIMATELY 300 PAGES ; ROYAL SIZE',
    language: 'ENGLISH'
  },
  {
    title: 'INFORMATION SOURCES AND SERVICES',
    author: 'DR. DHARAMVEER SINGH',
    edition: 'FIRST EDITION',
    publisher: 'ABD PUBLISHERS',
    publication_year: '2024',
    place_of_publication: 'JAIPUR, RAJASTHAN, INDIA',
    isbn: '978-81-83769-24-2',
    format: 'BOOK',
    physical_description: 'APPROXIMATELY 300 PAGES ; ROYAL SIZE',
    language: 'ENGLISH'
  },
  {
    title: 'BASIC COMPUTER CODING: HTML',
    author: '3G E-LEARNING',
    edition: '2ND EDITION',
    publisher: '3G ELearning LLC',
    publication_year: 'NOT SPECIFIED',
    place_of_publication: 'NOT SPECIFIED',
    isbn: '978-1-98465-894-4',
    format: 'BOOK',
    physical_description: 'APPROXIMATELY 300 PAGES ; ROYAL SIZE',
    language: 'ENGLISH'
  },
  {
    title: 'SIMPLE OBJECT-ORIENTED DESIGN',
    author: 'MAURÍCIO ANICHE',
    edition: 'FIRST EDITION',
    publisher: 'MANNING PUBLICATIONS CO.',
    publication_year: 'NOT SPECIFIED',
    place_of_publication: 'SHELTER ISLAND, NEW YORK',
    isbn: '978-1-63343-799-9',
    format: 'BOOK',
    physical_description: 'APPROXIMATELY 300 PAGES ; ROYAL SIZE',
    language: 'ENGLISH'
  },
  {
    title: 'AUTOCAD 3D MODELING FUNDAMENTALS (WITH HANDS-ON TYPE EXERCISES',
    author: 'PRITAM SINGH GILL',
    edition: 'FIRST EDITION',
    publisher: 'S. K. KATARIA & SONS',
    publication_year: '2024',
    place_of_publication: 'DARYAGANJ, NEW DELHI, INDIA',
    isbn: '978-93-5014-648-4',
    format: 'BOOK',
    physical_description: 'APPROXIMATELY 300 PAGES ; ROYAL SIZE',
    language: 'ENGLISH'
  },
  {
    title: 'EFFICIENT DYNAMIC SIMULATION OF ROBOTICS MECHANISM',
    author: 'ROHAN SHARMA',
    edition: 'FIRST EDITION',
    publisher: 'VENUS BOOKS',
    publication_year: '2023',
    place_of_publication: 'DARYAGANJ, NEW DELHI, INDIA',
    isbn: '978-93-95431-51-4',
    format: 'BOOK',
    physical_description: 'APPROXIMATELY 300 PAGES ; ROYAL SIZE',
    language: 'ENGLISH'
  },
  {
    title: 'COMPUTERS AS COMPONENTS EMBEDDED SYSTEM DESIGN',
    author: 'ZOE AMOS',
    edition: 'FIRST EDITION',
    publisher: 'RANDOM PUBLICATIONS LLP',
    publication_year: '2024',
    place_of_publication: 'DARYAGANJ, NEW DELHI, INDIA',
    isbn: '978-93-575192-2-9',
    format: 'BOOK',
    physical_description: 'APPROXIMATELY 300 PAGES ; ROYAL SIZE',
    language: 'ENGLISH'
  }
];

const buildCoverUrl = (title, side) => {
  const palette = side === 'front' ? 'f3e6d0/1f3a2d' : 'd8e8f3/1f3557';
  return `https://placehold.co/600x900/${palette}?text=${encodeURIComponent(`${title}\n${side === 'front' ? 'Front Cover' : 'Back Cover'}`)}`;
};

const parseYear = (value) => {
  const parsed = Number(String(value || '').match(/\d{4}/)?.[0] || NaN);
  return Number.isFinite(parsed) ? parsed : null;
};

const buildBookPayload = (book, index) => ({
  title: book.title,
  author: book.author,
  edition: book.edition || '',
  publisher: book.publisher || '',
  place_of_publication: book.place_of_publication || '',
  isbn: book.isbn || '',
  format: book.format || 'BOOK',
  physical_description: book.physical_description || '',
  subject_headings: [],
  language: book.language || '',
  shelf_location: '',
  notes: '',
  date_added: new Date(),
  available_copies: 1,
  total_copies: 1,
  publication_year: parseYear(book.publication_year),
  coverImageUrl: buildCoverUrl(book.title, 'front'),
  backCoverImageUrl: buildCoverUrl(book.title, 'back'),
  barcodeString: `PTC-LIB-${String(index + 1).padStart(4, '0')}`
});

const seed = async () => {
  try {
    await connectDB();
    const shouldReset = process.argv.includes('--reset');

    if (shouldReset) {
      if (isProduction && !allowDbReset) {
        logResetAttempt('BLOCKED', 'seedFilipinoBooks --reset blocked in production (set ALLOW_DB_RESET=true to override).');
        process.exitCode = 1;
        return;
      }

      logResetAttempt('ALLOWED', `seedFilipinoBooks --reset proceeding (NODE_ENV=${process.env.NODE_ENV || 'unset'}).`);
      const deleteResult = await Book.deleteMany({});
      console.log(`Reset complete. Removed ${deleteResult.deletedCount} books.`);
    }

    const operations = libraryBooks.map((book, index) => ({
      updateOne: {
        filter: { barcodeString: `PTC-LIB-${String(index + 1).padStart(4, '0')}` },
        update: { $set: buildBookPayload(book, index) },
        upsert: true
      }
    }));

    const result = await Book.bulkWrite(operations);

    const created = result.upsertedCount || 0;
    const updated = result.modifiedCount || 0;

    console.log(`Filipino books seeding complete. Created: ${created}, Updated: ${updated}`);
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed Filipino books:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
};

seed();
