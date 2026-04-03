const router = require('express').Router();
const { body } = require('express-validator');
const expenseController = require('../controllers/expenseController');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');

router.use(auth);

router.post(
  '/',
  [
    body('group_id').notEmpty().withMessage('Group ID is required.'),
    body('title').trim().notEmpty().withMessage('Title is required.'),
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0.'),
    body('paid_by').notEmpty().withMessage('Paid by is required.'),
    body('split_between')
      .isArray({ min: 1 })
      .withMessage('Must split between at least 1 person.'),
  ],
  validate,
  expenseController.addExpense
);

// Dashboard must come before :groupId to avoid "dashboard" being captured as param
router.get('/dashboard/me', expenseController.getDashboard);
router.get('/:groupId', expenseController.getExpensesByGroup);
router.get('/:groupId/balances', expenseController.getBalances);

module.exports = router;
