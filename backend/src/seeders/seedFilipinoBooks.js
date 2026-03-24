require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Book = require('../models/Book');

const filipinoBooks = [
  { title: 'Noli Me Tangere', author: 'Jose Rizal', category: 'Philippine Classics', isbn: '9789711005459' },
  { title: 'El Filibusterismo', author: 'Jose Rizal', category: 'Philippine Classics', isbn: '9789711005466' },
  { title: 'Florante at Laura', author: 'Francisco Balagtas', category: 'Philippine Classics', isbn: '9789715501964' },
  { title: 'Ibong Adarna', author: 'Anonymous', category: 'Philippine Epics', isbn: '9789712721235' },
  { title: 'Mga Ibong Mandaragit', author: 'Amado V. Hernandez', category: 'Filipino Literature', isbn: '9789712715180' },
  { title: 'Luha ng Buwaya', author: 'Amado V. Hernandez', category: 'Filipino Literature', isbn: '9789712715227' },
  { title: 'Dekada 70', author: 'Lualhati Bautista', category: 'Filipino Literature', isbn: '9789712729378' },
  { title: 'Bata, Bata... Pa\'no Ka Ginawa?', author: 'Lualhati Bautista', category: 'Filipino Literature', isbn: '9789712729385' },
  { title: 'Gapo', author: 'Lualhati Bautista', category: 'Filipino Literature', isbn: '9789712729392' },
  { title: 'Banaag at Sikat', author: 'Lope K. Santos', category: 'Filipino Literature', isbn: '9789712715555' },
  { title: 'Po-on', author: 'F. Sionil Jose', category: 'Filipino Literature', isbn: '9789712715562' },
  { title: 'Tree', author: 'F. Sionil Jose', category: 'Filipino Literature', isbn: '9789712715579' },
  { title: 'My Brother, My Executioner', author: 'F. Sionil Jose', category: 'Filipino Literature', isbn: '9789712715586' },
  { title: 'Mass', author: 'F. Sionil Jose', category: 'Filipino Literature', isbn: '9789712715593' },
  { title: 'Viajero', author: 'F. Sionil Jose', category: 'Filipino Literature', isbn: '9789712715609' },
  { title: 'Smaller and Smaller Circles', author: 'F.H. Batacan', category: 'Contemporary Filipino Fiction', isbn: '9789715083439' },
  { title: 'America Is in the Heart', author: 'Carlos Bulosan', category: 'Filipino Literature', isbn: '9780295952894' },
  { title: 'The Woman Who Had Two Navels', author: 'Nick Joaquin', category: 'Filipino Literature', isbn: '9789712721693' },
  { title: 'Cave and Shadows', author: 'Nick Joaquin', category: 'Filipino Literature', isbn: '9789712721686' },
  { title: 'The Rosales Saga', author: 'F. Sionil Jose', category: 'Filipino Literature', isbn: '9789712715616' },
  { title: 'Without Seeing the Dawn', author: 'Stevan Javellana', category: 'Filipino Literature', isbn: '9789712722362' },
  { title: 'Ermita', author: 'F. Sionil Jose', category: 'Filipino Literature', isbn: '9789712715623' },
  { title: 'State of War', author: 'Ninotchka Rosca', category: 'Contemporary Filipino Fiction', isbn: '9789712725028' },
  { title: 'Ilustrado', author: 'Miguel Syjuco', category: 'Contemporary Filipino Fiction', isbn: '9780374172953' },
  { title: 'The Farm', author: 'Joanne Ramos', category: 'Contemporary Filipino Fiction', isbn: '9780525558629' },
  { title: 'Insurrecto', author: 'Gina Apostol', category: 'Contemporary Filipino Fiction', isbn: '9781566895209' },
  { title: 'ABNKKBSNPLAko?!', author: 'Bob Ong', category: 'Contemporary Filipino Nonfiction', isbn: '9789719137428' },
  { title: 'Macarthur', author: 'Bob Ong', category: 'Contemporary Filipino Fiction', isbn: '9789719137442' },
  { title: 'Ang Mga Kaibigan ni Mama Susan', author: 'Bob Ong', category: 'Contemporary Filipino Fiction', isbn: '9789719137466' },
  { title: 'Kapitan Sino', author: 'Bob Ong', category: 'Contemporary Filipino Fiction', isbn: '9789719137473' },
  { title: 'Mga Kuwento ni Lola Basyang', author: 'Severino Reyes', category: 'Filipino Literature', isbn: '9789712720016' },
  { title: 'Ang Tundo Man May Langit Din', author: 'Andres Cristobal Cruz', category: 'Filipino Literature', isbn: '9789712720108' },
  { title: 'Canal de la Reina', author: 'Liwayway A. Arceo', category: 'Filipino Literature', isbn: '9789712720115' },
  { title: 'Amapola sa 65 na Kabanata', author: 'Ricky Lee', category: 'Contemporary Filipino Fiction', isbn: '9789715087017' },
  { title: 'Para Kay B', author: 'Ricky Lee', category: 'Contemporary Filipino Fiction', isbn: '9789715087024' }
];

const buildBookPayload = (book, index) => ({
  ...book,
  available_copies: 5,
  coverImageUrl: '',
  barcodeString: `PTC-FIL-${String(index + 1).padStart(4, '0')}`
});

const seed = async () => {
  try {
    await connectDB();
    const shouldReset = process.argv.includes('--reset');

    if (shouldReset) {
      const deleteResult = await Book.deleteMany({ barcodeString: { $regex: '^PTC-FIL-' } });
      console.log(`Reset complete. Removed ${deleteResult.deletedCount} previously seeded Filipino books.`);
    }

    const operations = filipinoBooks.map((book, index) => ({
      updateOne: {
        filter: { barcodeString: `PTC-FIL-${String(index + 1).padStart(4, '0')}` },
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
