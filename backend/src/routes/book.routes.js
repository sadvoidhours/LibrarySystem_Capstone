const express = require('express');
const { param } = require('express-validator');
const { protect, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const {
  createBookValidation,
  updateBookValidation,
  listBooks,
  lookupBookByIsbn,
  createBook,
  updateBook,
  deleteBook
} = require('../controllers/book.controller');

const router = express.Router();
const bookIdParamValidation = [param('id').isMongoId().withMessage('Invalid book id')];

router.get('/', protect, listBooks);
router.get('/lookup', protect, authorize('admin', 'superadmin'), lookupBookByIsbn);
router.post('/', protect, authorize('admin', 'superadmin'), createBookValidation, validate, createBook);
router.put('/:id', protect, authorize('admin', 'superadmin'), bookIdParamValidation, updateBookValidation, validate, updateBook);
router.delete('/:id', protect, authorize('admin', 'superadmin'), bookIdParamValidation, validate, deleteBook);

module.exports = router;
